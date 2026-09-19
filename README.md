# CivicFeed

A mindful civic accountability app: report a pothole, have a stranger verify the
fix within 50m, and make collusion mathematically unprofitable.

Built for the Prayas Plaksha Hackathon. FastAPI backend, Expo / React Native
client, DeepSeek vision classification.

## Layout

```
backend/            FastAPI + SQLite REST API
  app/routers/      auth, tickets, feed
  app/anti_cheat.py Reciprocity-decay engine
  seed_demo_data.py 3 demo personas + 6 Ward 14 tickets
src/
  app/              Expo Router entry (index.tsx is the whole tab shell)
  screens/          Feed, Map, Report, Scorecard, Profile
  components/       CivicPostCard, SeverityMeter, BeforeAfterView, PersonaBar, ...
  services/         api.ts (typed client), location.ts (Haversine geofence)
  __tests__/        standalone tsx suites
scripts/
  dev-tunnel.js     brings up backend + tunnels + Expo in one command
```

## Setup

**Requirements:** Node 20+, Python 3.11+, and [Expo Go](https://expo.dev/go) on
your phone.

```bash
npm install
```

Then set up the backend once:

```bash
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt   # macOS/Linux: .venv/bin/python
.venv\Scripts\python seed_demo_data.py
cd ..
```

## Running it

One command starts the backend, the tunnels, and Metro:

```bash
npm run tunnel
```

It prints a Metro URL and an API URL. Open Expo Go, tap **Enter URL manually**,
and paste the Metro line. Your phone can be on any network, including cellular.

Both URLs change every restart, so paste the Metro one again each session.

### Why a tunnel, and why two of them

Campus Wi-Fi runs a FortiGate firewall that intercepts ngrok, so Expo's built-in
`--tunnel` can never connect. It may also stop your phone from reaching your
laptop directly, which breaks a plain `npm start`. Cloudflare's tunnel endpoints
are not intercepted, so we run our own.

The backend needs a tunnel too. The JS bundle executes **on the phone**, so the
default `http://localhost:8000` would resolve to the phone itself, not your
laptop. `dev-tunnel.js` tunnels port 8000 as well and injects the public URL as
`EXPO_PUBLIC_API_URL`, which `src/services/api.ts` reads.

**One-time setup:** install `cloudflared` and make sure it is on your PATH.

| OS | Command |
| --- | --- |
| Windows | `winget install --id Cloudflare.cloudflared` |
| macOS | `brew install cloudflared` |
| Linux | [download a release](https://github.com/cloudflare/cloudflared/releases/latest) |

Verify with `cloudflared --version`.

### On a normal network

If your phone and laptop are on the same Wi-Fi and you don't need the backend
from the phone, `npm start` and a QR scan still work.

### Stable URLs (maintainer only)

```bash
npm run tunnel:named
```

Serves Metro on `https://dev.deserver.in` and the API on
`https://api.deserver.in`, which never change. This needs Cloudflare credentials
in `~/.cloudflared/` that are deliberately not in this repo, so it only works on
a machine set up for it. Everyone else uses `npm run tunnel`.

### Useful flags

```bash
npm run tunnel -- --clear                        # clear the Metro cache
EXPO_PORT=8082 API_PORT=8001 npm run tunnel      # use different ports
```

## Tests

Backend (10 tests):

```bash
cd backend && .venv\Scripts\python -m pytest
```

Mobile. The first three run standalone; `api` and `e2e_walkthrough` need the
backend up on port 8000:

```bash
npx tsx src/__tests__/location.test.ts
npx tsx src/__tests__/antiCheat.test.ts
npx tsx src/__tests__/postCard.test.ts
npx tsx src/__tests__/api.test.ts
npx tsx src/__tests__/e2e_walkthrough.test.ts
```

`e2e_walkthrough` writes tickets to the demo database. To get back to the clean
6-ticket stage-demo state, delete `backend/civicfeed.db` and re-run
`seed_demo_data.py`.

## Demo personas

`PersonaBar` at the top of the app switches between three users mid-demo:

| Persona | Role | Point of the demo |
| --- | --- | --- |
| Rahul | Citizen reporter | Files potholes and garbage (+50 escrow pts) |
| Anjali | Stranger auditor | Verifies within 50m, earns full +150 pts (0% decay) |
| Rohan | Colluding roommate, under 18 | Repeat pairing with Rahul decays to +75 (-50%); also triggers parent consent |

Verification credit decays as the same pair verifies each other repeatedly:

```
credited = round(150 x 1/(1 + pairings) x weight)
```

150 → 75 → 38 → 15 points, which makes collusion cartels not worth running.
