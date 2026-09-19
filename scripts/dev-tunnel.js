#!/usr/bin/env node
/**
 * Starts a Cloudflare tunnel and points Expo at it, in one command.
 *
 * The campus network MITMs ngrok, so `expo start --tunnel` can never connect.
 * Cloudflare's tunnel endpoints are not intercepted, so we run our own and
 * override the URL Metro advertises in its manifest via EXPO_PACKAGER_PROXY_URL.
 *
 * Any extra args are forwarded to `expo start` (e.g. `npm run tunnel -- --clear`).
 */
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = process.env.EXPO_PORT || '8081';
const CLOUDFLARED = process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared';
const EXPO_CLI = path.join(__dirname, '..', 'node_modules', 'expo', 'bin', 'cli');
const URL_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;

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
    console.log(`Opening Cloudflare tunnel to localhost:${PORT} ...`);

    cloudflared = spawn(
      CLOUDFLARED,
      ['tunnel', '--url', `http://localhost:${PORT}`, '--no-autoupdate'],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );

    cloudflared.on('error', (err) => {
      reject(
        err.code === 'ENOENT'
          ? new Error(
              'cloudflared not found on PATH.\n' +
                'Install it from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/'
            )
          : err
      );
    });

    const timer = setTimeout(
      () => reject(new Error('Tunnel did not produce a URL within 60s.')),
      60000
    );

    let settled = false;
    const scan = (buf) => {
      const match = buf.toString().match(URL_RE);
      if (match && !settled) {
        settled = true;
        clearTimeout(timer);
        resolve(match[0]);
      }
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
    [EXPO_CLI, 'start', '--host', 'localhost', '--port', PORT, ...process.argv.slice(2)],
    { stdio: 'inherit', env: { ...process.env, EXPO_PACKAGER_PROXY_URL: url } }
  );

  expo.on('exit', (code) => shutdown(code ?? 0));
}

startTunnel().then(startExpo, (err) => {
  console.error(`\n${err.message}\n`);
  shutdown(1);
});
