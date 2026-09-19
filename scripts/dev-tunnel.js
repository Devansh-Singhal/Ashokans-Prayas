#!/usr/bin/env node
/**
 * Brings up the whole CivicFeed dev stack in one command: FastAPI backend,
 * Cloudflare tunnel(s), and Expo -- all wired together.
 *
 * The campus network MITMs ngrok, so `expo start --tunnel` can never connect.
 * Cloudflare's tunnel endpoints are not intercepted, so we run our own and
 * override the URL Metro advertises in its manifest via EXPO_PACKAGER_PROXY_URL.
 *
 * The backend needs a tunnel too. The bundle executes ON THE PHONE, so the
 * default API_BASE_URL of http://localhost:8000 would resolve to the phone
 * itself. We tunnel port 8000 as well and inject the public URL as
 * EXPO_PUBLIC_API_URL, which src/services/api.ts reads.
 *
 * Two modes:
 *   npm run tunnel        -- quick tunnels, random *.trycloudflare.com URLs, no account
 *   npm run tunnel:named  -- named tunnel, stable hostnames (needs cloudflared login)
 *
 * Any other args are forwarded to `expo start` (e.g. `npm run tunnel -- --clear`).
 */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.EXPO_PORT || '8081';
const API_PORT = process.env.API_PORT || '8000';
const CLOUDFLARED = process.env.CLOUDFLARED_PATH || (process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared');
const EXPO_CLI = path.join(ROOT, 'node_modules', 'expo', 'bin', 'cli');
const VENV_PYTHON = process.env.BACKEND_PYTHON || path.join(
  ROOT,
  'backend',
  '.venv',
  process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python'
);
const QUICK_URL_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;
const CONNECTED_RE = /Registered tunnel connection/i;

// Pull the --hostname / --api-hostname pairs out of argv; the rest goes to expo.
const argv = process.argv.slice(2);
const flagged = new Set();
function takeFlag(name) {
  const prefixed = name + '=';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith(prefixed)) {
      flagged.add(i);
      return argv[i].slice(prefixed.length);
    }
  }
  const i = argv.indexOf(name);
  if (i === -1) return null;
  flagged.add(i);
  flagged.add(i + 1);
  return argv[i + 1];
}
const hostname = takeFlag('--hostname');
const apiHostname = takeFlag('--api-hostname');
const expoArgs = argv.filter((_, i) => !flagged.has(i));

const children = [];
let shuttingDown = false;

function track(child) {
  children.push(child);
  return child;
}

function kill(child) {
  if (!child || child.killed || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    // child.kill() leaves the real process orphaned holding the port on Windows.
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  children.forEach(kill);
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// Metro's own EADDRINUSE arrives as an unreadable stack trace after the tunnel
// is already up, so check the ports before starting anything.
function assertPortFree(port, what) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: '127.0.0.1', port: Number(port) });
    const free = () => {
      socket.destroy();
      resolve();
    };
    socket.setTimeout(1500);
    socket.on('error', free);
    socket.on('timeout', free);
    socket.on('connect', () => {
      socket.destroy();
      reject(
        new Error(
          [
            `Port ${port} is already in use -- another ${what} is running.`,
            `Close it, or pick another port: EXPO_PORT=8082 API_PORT=8001 npm run tunnel`,
          ].join('\n')
        )
      );
    });
  });
}

function assertPortsFree() {
  return Promise.all([
    assertPortFree(PORT, 'Metro/Expo instance'),
    assertPortFree(API_PORT, 'backend'),
  ]);
}

function waitForBackend(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const retry = () => {
      if (Date.now() > deadline) reject(new Error('Backend did not answer /health within 30s.'));
      else setTimeout(poll, 500);
    };
    const poll = () => {
      if (shuttingDown) return;
      const req = http.get(
        { host: '127.0.0.1', port: Number(API_PORT), path: '/health', timeout: 1000 },
        (res) => {
          res.resume();
          if (res.statusCode === 200) resolve();
          else retry();
        }
      );
      req.on('error', retry);
      req.on('timeout', () => {
        req.destroy();
        retry();
      });
    };
    poll();
  });
}

function startBackend() {
  if (!fs.existsSync(VENV_PYTHON)) {
    const win = process.platform === 'win32';
    return Promise.reject(
      new Error(
        [
          'Backend virtualenv not found. Set it up once:',
          '',
          '  cd backend',
          win
            ? '  python -m venv .venv'
            : '  python3 -m venv .venv',
          win
            ? '  .venv\\Scripts\\python -m pip install -r requirements.txt'
            : '  .venv/bin/python -m pip install -r requirements.txt',
          win
            ? '  .venv\\Scripts\\python seed_demo_data.py'
            : '  .venv/bin/python seed_demo_data.py',
        ].join('\n')
      )
    );
  }

  console.log(`Starting FastAPI backend on localhost:${API_PORT} ...`);
  track(
    spawn(VENV_PYTHON, ['-m', 'uvicorn', 'app.main:app', '--port', API_PORT], {
      cwd: path.join(ROOT, 'backend'),
      stdio: ['ignore', 'ignore', 'inherit'],
    })
  ).on('exit', (code) => {
    if (!shuttingDown) shutdown(code ?? 1);
  });

  return waitForBackend();
}

// A named tunnel serves every hostname in ~/.cloudflared/config.yml from a
// single process; quick tunnels expose exactly one port each, so we need two.
function startTunnel({ port, host, label }) {
  return new Promise((resolve, reject) => {
    const args = host
      ? ['tunnel', 'run']
      : ['tunnel', '--url', `http://localhost:${port}`, '--no-autoupdate'];

    console.log(
      host
        ? `Starting named Cloudflare tunnel (${label}) ...`
        : `Opening Cloudflare quick tunnel for ${label} on localhost:${port} ...`
    );

    const proc = track(spawn(CLOUDFLARED, args, { stdio: ['ignore', 'pipe', 'pipe'] }));

    proc.on('error', (err) => {
      reject(
        err.code === 'ENOENT'
          ? new Error(
              'cloudflared not found on PATH.\n' +
                'Install from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/'
            )
          : err
      );
    });

    const timer = setTimeout(() => {
      try { proc.kill(); } catch (_) {}
      reject(new Error('Tunnel did not come up within 60s.'));
    }, 60000);

    let settled = false;
    const ready = host ? CONNECTED_RE : QUICK_URL_RE;
    const scan = (buf) => {
      const match = buf.toString().match(ready);
      if (!match || settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(host ? `https://${host}` : match[0]);
    };

    proc.stdout.on('data', scan);
    proc.stderr.on('data', scan);

    proc.on('exit', (code) => {
      clearTimeout(timer);
      if (!settled) reject(new Error(`cloudflared exited with code ${code}`));
      else if (!shuttingDown) shutdown(code ?? 1);
    });
  });
}

async function startTunnels() {
  if (hostname) {
    if (!apiHostname) {
      console.warn('WARNING: named mode without --api-hostname: API URL will be localhost-only, unusable on device');
    }
    // One `cloudflared tunnel run` already routes every hostname in config.yml.
    const metroUrl = await startTunnel({ port: PORT, host: hostname, label: hostname });
    return { metroUrl, apiUrl: apiHostname ? `https://${apiHostname}` : null };
  }
  const metroUrl = await startTunnel({ port: PORT, label: 'Metro' });
  const apiUrl = await startTunnel({ port: API_PORT, label: 'API' });
  return { metroUrl, apiUrl };
}

function startExpo({ metroUrl, apiUrl }) {
  console.log(`\nMetro:   ${metroUrl}`);
  console.log(`API:     ${apiUrl || `http://localhost:${API_PORT} (not tunnelled)`}`);
  console.log('\nOpen Expo Go -> "Enter URL manually" -> paste the Metro line above.\n');

  const env = { ...process.env, EXPO_PACKAGER_PROXY_URL: metroUrl };
  if (apiUrl) env.EXPO_PUBLIC_API_URL = `${apiUrl}/api/v1`;

  track(
    spawn(
      process.execPath,
      [EXPO_CLI, 'start', '--host', 'localhost', '--port', PORT, ...expoArgs],
      { stdio: 'inherit', env }
    )
  ).on('exit', (code) => shutdown(code ?? 0));
}

assertPortsFree()
  .then(startBackend)
  .then(startTunnels)
  .then(startExpo)
  .catch((err) => {
    console.error(`\n${err.message}\n`);
    shutdown(1);
  });
