# CivicFeed — Ashokan's Prayas

A mindful civic accountability app: report a pothole, have a stranger verify the fix within 50m, and make collusion mathematically unprofitable.

Built for the Prayas Plaksha Hackathon. Expo / React Native client, FastAPI + SQLite backend, DeepSeek vision classification.

## What it does

1. **Report** — citizen photographs a civic issue (pothole, garbage, streetlight, open drain). On-device GPS + AI vision classifies the defect, maps it to the responsible Indian municipal department, rates severity 1–5, and flags spoofs (photo-of-screen), submerged roads, and privacy regions (faces, plates, shop boards).
2. **Fix** — anyone uploads a provisional after-photo for the ticket.
3. **Verify** — a *different* person physically within 50m (Haversine geofence) confirms the fix with a photo. Verification credit decays with repeat pairings, so collusion cartels don't pay.
4. **Scorecard** — per-ward cleanliness score, resolution stats, and verifiable civic-hour certificates for volunteers.

## Key ideas

- **Reciprocity-decay anti-cheat:** `credited = round(150 x 1/(1 + pairings) x weight)` → 150 → 75 → 38 → 15 points. Repeated same-pair verifications earn progressively less.
- **50m stranger-verification geofence:** Haversine distance check between auditor GPS and ticket coordinates.
- **AI department routing:** vision model maps defects to MCL, Punjab PWD, NHAI, PWSSB, PSPCL, etc., with reasoning, severity justification, and actionable remedy.
- **Offline-capable demo mode:** without an API key, a deterministic filename-based heuristic runs so the full flow is testable offline (labeled `source: heuristic`, `verified_by_photo: false`).
- **Under-18 safety:** parent-consent flow blocks minors until a parent verifies via token link.

## Tech stack

| Layer | Tech |
| --- | --- |
| Mobile | Expo SDK 57, React Native 0.86, React 19, Expo Router, TypeScript |
| Maps | MapTiler raster tiles + native OSM WebView (`NativeOsmMap`, `InteractiveMap`) |
| Sensors | `expo-location`, `expo-image-picker`, `expo-sensors` (pothole gyro demo) |
| Backend | FastAPI, SQLAlchemy 2 + aiosqlite (SQLite default, Postgres-ready), Pydantic 2 |
| Vision | DeepSeek `deepseek-v4.1-flash` via Command Code provider API, Pillow preprocessing |
| Dev infra | `scripts/dev-tunnel.js` (backend + Cloudflare tunnels + Metro in one command), `tsx` standalone mobile tests, `pytest` backend tests |

## Project layout

```
backend/                  FastAPI + SQLite REST API
  app/main.py             App entry, CORS, /uploads mount
  app/routers/            auth, tickets, feed, certificates
  app/models/             User, Ticket, pairing/consent tables
  app/anti_cheat.py       Reciprocity-decay engine (credited_points)
  app/services/           Vision + storage helpers
  seed_demo_data.py       3 demo personas + Ward 14 + Dugri/Gill case-study tickets
  requirements.txt        Pinned Python deps
  .env.example            COMMANDCODE_API_KEY template
src/
  app/                    Expo Router entry (index, report, map, scorecard, profile, pothole-demo)
  screens/                Feed, Map, Report, Scorecard, Profile, Tasks, PotholeDemo
  components/             CivicPostCard, SeverityMeter, BeforeAfterView, PersonaBar,
                          GeofencePill, CurvedBottomNav, ParentConsentModal,
                          AntiCheatModal, OfficialCertificateModal, AppSplash, ...
  services/               api.ts (typed client), location.ts (Haversine geofence)
  types/                  Ticket, User, VerificationResult, WardScorecard, CertificateData
  __tests__/              Standalone tsx suites (location, antiCheat, postCard, api, e2e)
scripts/
  dev-tunnel.js           Backend + tunnels + Expo in one command
deepseek.py               Standalone vision-classification reference script
docs/                     UI plans
```

## Screens

- **Feed** — ward ticket timeline with `CivicPostCard`, severity meter, before/after view, upvotes.
- **Report** — camera/gallery pick → AI analyze → GPS attach → submit (duplicate + low-confidence clarification handling).
- **Map** — ward geospatial radar (Ward 14 Ludhiana default, Dugri–Gill case-study corridor).
- **Scorecard** — ward cleanliness score, resolved/active counts, median resolution days.
- **Profile / Tasks** — points balance, civic tasks by domain, verifiable certificate generation.
- **Pothole demo** — gyro-based detection demo.

## Prerequisites

- Node 20+, Python 3.11+
- [Expo Go](https://expo.dev/go) on your phone
- `cloudflared` on PATH (only for `npm run tunnel`):

| OS | Install |
| --- | --- |
| Windows | `winget install --id Cloudflare.cloudflared` |
| macOS | `brew install cloudflared` |
| Linux | [cloudflared releases](https://github.com/cloudflare/cloudflared/releases/latest) |

Verify with `cloudflared --version`.

## Quickstart

```bash
npm install

cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt   # macOS/Linux: .venv/bin/python
.venv\Scripts\python seed_demo_data.py
cd ..
```

Optional — real AI vision (otherwise heuristic mode runs offline):

```bash
cp backend/.env.example backend/.env
# edit backend/.env and set COMMANDCODE_API_KEY=<your key>
```

Then run everything:

```bash
npm run tunnel
```

It prints a Metro URL and an API URL. In Expo Go tap **Enter URL manually** and paste the Metro line. Your phone can be on any network, including cellular. Both URLs change every restart, so paste the Metro one again each session.

## Why a tunnel, and why two of them

Campus Wi-Fi runs a FortiGate firewall that intercepts ngrok, so Expo's built-in `--tunnel` can never connect. Cloudflare's tunnel endpoints are not intercepted, so we run our own.

The backend needs a tunnel too. The JS bundle executes **on the phone**, so the default `http://localhost:8000` would resolve to the phone itself, not your laptop. `dev-tunnel.js` tunnels port 8000 as well and injects the public URL as `EXPO_PUBLIC_API_URL`, which `src/services/api.ts` reads.

### On a normal network

If phone and laptop share Wi-Fi and you don't need the backend from the phone, plain `npm start` + QR scan still works.

### Stable URLs (maintainer only)

```bash
npm run tunnel:named
```

Serves Metro on `https://dev.deserver.in` and the API on `https://api.deserver.in`. Needs Cloudflare credentials in `~/.cloudflared/` (deliberately not in this repo).

### Useful flags

```bash
npm run tunnel -- --clear                         # clear the Metro cache
EXPO_PORT=8082 API_PORT=8001 npm run tunnel       # custom ports
```

## Backend reference

Run standalone:

```bash
cd backend
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

SQLite is the default (`./civicfeed.db`). Set `DATABASE_URL` for Postgres, e.g. `postgresql+asyncpg://user:pass@localhost/civicfeed`.

Health check: `GET /health` → `{"status": "ok"}`.

### Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | JSON: `phone`, `is_under_18`, `parent_phone` |
| GET | `/api/v1/auth/verify-parent-consent?token=XYZ` | Parent consent link |
| POST | `/api/v1/tickets/report` | Multipart: `photo`, `latitude`, `longitude`, `ward_id`, `reporter_id` (+ optional `target_department`, `custom_title`, `custom_description`) |
| POST | `/api/v1/tickets/analyze` | Photo-only AI pre-check |
| POST | `/api/v1/tickets/{id}/provisional-fix` | Multipart: `photo`, `uploader_id`, `latitude`, `longitude` |
| POST | `/api/v1/tickets/{id}/verify` | Multipart: `photo`, `auditor_id`, `latitude`, `longitude` (50m enforced) |
| GET | `/api/v1/feed/ward/{ward_id}?page=1&size=20` | Ward timeline |
| GET | `/api/v1/tickets/ward/{ward_id}/scorecard` | Ward stats |
| GET/POST | `/api/v1/certificates/...` | `user-tasks?user_id=`, `generate` |

Uploads are served from `/uploads`.

## Demo script (2 minutes, for judges)

`PersonaBar` at the top switches users mid-demo:

| Persona | Role | Demo beat |
| --- | --- | --- |
| Rahul | Citizen reporter | Files pothole/garbage (+50 escrow pts) |
| Anjali | Stranger auditor | Verifies within 50m, earns full +150 pts (0% decay) |
| Rohan | Colluding roommate, under 18 | Repeat Rahul pairing decays to +75 (−50%); triggers parent consent |

1. As **Rahul**: Report tab → photo → AI fills title/department/severity → submit.
2. As **Anjali**: open the ticket → upload fix → Verify within 50m → show +150, 0% decay.
3. As **Rohan**: verify Rahul's ticket again → show +75 with decay warning + parent-consent modal.
4. Scorecard tab → cleanliness score moves; Profile → generate certificate.

Seed data: 9 Ward 14 (Ludhiana, Dugri Road corridor ~30.8893, 75.8490) tickets + 5 Dugri/Gill case-study tickets (unrestored pipeline cuts, blame chain MCL ↔ Water Board ↔ contractor).

Reset the demo anytime:

```bash
cd backend
rm civicfeed.db              # Windows: del civicfeed.db
.venv\Scripts\python seed_demo_data.py
```

## Tests

Backend (pytest):

```bash
cd backend && .venv\Scripts\python -m pytest -v
```

Mobile — first three run standalone; `api` and `e2e_walkthrough` need the backend on port 8000:

```bash
npx tsx src/__tests__/location.test.ts
npx tsx src/__tests__/antiCheat.test.ts
npx tsx src/__tests__/postCard.test.ts
npx tsx src/__tests__/api.test.ts
npx tsx src/__tests__/e2e_walkthrough.test.ts
```

Or via npm scripts: `test:api`, `test:location`, `test:anticheat`, `test:postcard`, `test:contributions`. Also available: `npm run lint`, `npm run typecheck`.

Note: `e2e_walkthrough` writes tickets to the demo DB — reseed afterwards (see above) for a clean 14-ticket stage.

## Configuration

| Var | Where | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | `src/services/api.ts` | Backend base URL (auto-injected by `dev-tunnel.js`) |
| `EXPO_PUBLIC_MAPTILER_KEY` | `src/services/api.ts` | Map tile key (free-tier demo default committed; override per env, rotate after demo) |
| `COMMANDCODE_API_KEY` | `backend/.env` | Vision provider key (server-only, gitignored) |
| `DEEPSEEK_URL` / `DEEPSEEK_MODEL` | `backend/.env` | Provider endpoint/model overrides |
| `DATABASE_URL` / `UPLOAD_DIR` | backend env | Postgres URL / upload directory |
| `EXPO_PORT` / `API_PORT` | tunnel env | Metro/backend ports (defaults 8081/8000) |

## Troubleshooting

- `cloudflared not found` → install it and ensure it is on PATH.
- `Port 8081/8000 already in use` → kill the old process or use `EXPO_PORT=8082 API_PORT=8001 npm run tunnel`.
- Phone can't reach backend → you must use `npm run tunnel` (not `npm start`) so `EXPO_PUBLIC_API_URL` points at the public tunnel.
- `Unsupported FormDataPart implementation` → fixed in `appendPhotoToFormData`: never pass `{ uri, name, type }`; native files go via `expo-file-system` `File`, remote ones via fetched Blob.
- Backend returns heuristic results → set `COMMANDCODE_API_KEY` in `backend/.env` for live model classification.
- Metro shows stale bundle → `npm run tunnel -- --clear`.

## License

MIT — see `LICENSE`. Map tiles by MapTiler; seed photos by Unsplash source URLs.
