#!/usr/bin/env node
/**
 * Starts a Cloudflare tunnel and points Expo at it, in one command.
 *
 * The campus network MITMs ngrok, so `expo start --tunnel` can never connect.
 * Cloudflare's tunnel endpoints are not intercepted, so we run our own and
 * override the URL Metro advertises in its manifest via EXPO_PACKAGER_PROXY_URL.
 *
 * Two modes:
 *   npm run tunnel        -- quick tunnel, random *.trycloudflare.com URL, no account
 *   npm run tunnel:named  -- named tunnel, stable hostname (needs cloudflared login)
 *
 * Any other args are forwarded to `expo start` (e.g. `npm run tunnel -- --clear`).
 */
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = process.env.EXPO_PORT || '8081';
const CLOUDFLARED = process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared';
const EXPO_CLI = path.join(__dirname, '..', 'node_modules', 'expo', 'bin', 'cli');
const QUICK_URL_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;
const CONNECTED_RE = /Registered tunnel connection/i;

// Pull --hostname <value> out of argv; everything left over goes to expo.
const argv = process.argv.slice(2);
const hostFlag = argv.indexOf('--hostname');
const hostname = hostFlag === -1 ? null : argv[hostFlag + 1];
const expoArgs = hostFlag === -1 ? argv : argv.filter((_, i) => i !== hostFlag && i !== hostFlag + 1);

let cloudflared;
let expo;
let shuttingDown = false;

function kill(child) {
  if (!child || child.killed || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  kill(expo);
  kill(cloudflared);
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

function startTunnel() {
  return new Promise((resolve, reject) => {
    const args = hostname
      ? ['tunnel', 'run']
      : ['tunnel', '--url', `http://localhost:${PORT}`, '--no-autoupdate'];

    console.log(
      hostname
        ? `Starting named Cloudflare tunnel for ${hostname} ...`
        : `Opening Cloudflare quick tunnel to localhost:${PORT} ...`
    );

    cloudflared = spawn(CLOUDFLARED, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    cloudflared.on('error', (err) => {
      reject(
        err.code === 'ENOENT'
          ? new Error(
              'cloudflared not found on PATH.\n' +
                'Install from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/'
            )
          : err
      );
    });

    const timer = setTimeout(
      () => reject(new Error('Tunnel did not come up within 60s.')),
      60000
    );

    let settled = false;
    const ready = hostname ? CONNECTED_RE : QUICK_URL_RE;
    const scan = (buf) => {
      const text = buf.toString();
      const match = text.match(ready);
      if (!match || settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(hostname ? `https://${hostname}` : match[0]);
    };

    cloudflared.stdout.on('data', scan);
    cloudflared.stderr.on('data', scan);

    cloudflared.on('exit', (code) => {
      clearTimeout(timer);
      if (!settled) reject(new Error(`cloudflared exited with code ${code}`));
      else if (!shuttingDown) shutdown(code ?? 1);
    });
  });
}

function startExpo(url) {
  console.log(`\nTunnel ready: ${url}`);
  console.log('Open Expo Go -> "Enter URL manually" -> paste the line above.\n');

  expo = spawn(
    process.execPath,
    [EXPO_CLI, 'start', '--host', 'localhost', '--port', PORT, ...expoArgs],
    { stdio: 'inherit', env: { ...process.env, EXPO_PACKAGER_PROXY_URL: url } }
  );

  expo.on('exit', (code) => shutdown(code ?? 0));
}

startTunnel().then(startExpo, (err) => {
  console.error(`\n${err.message}\n`);
  shutdown(1);
});
