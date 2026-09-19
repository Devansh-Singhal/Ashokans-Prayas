# CivicFeed Backend (FastAPI)

## Run locally
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

SQLite is the default (`./civicfeed.db`). Set `DATABASE_URL` for Postgres, e.g.
`postgresql+asyncpg://user:pass@localhost/civicfeed` (install `asyncpg` + PostGIS separately).

Vision runs live through the Command Code Provider API (`deepseek/deepseek-v4.1-flash`).
Put your key in `.env` (gitignored, server-only):
```
COMMANDCODE_API_KEY=<your key>
```
Without the key, a deterministic filename-based heuristic runs so the full flow is
testable offline. `.env` is loaded automatically at startup via `python-dotenv`.

## Endpoints
- `POST /api/v1/auth/register`
- `GET /api/v1/auth/verify-parent-consent?token=XYZ`
- `POST /api/v1/tickets/report` (multipart: photo, latitude, longitude, ward_id, reporter_id)
- `GET /api/v1/feed/ward/{ward_id}?page=1&size=20`
- `POST /api/v1/tickets/{id}/provisional-fix` (multipart: photo)
- `POST /api/v1/tickets/{id}/verify` (multipart: photo + auditor_id form field)
- `GET /api/v1/tickets/ward/{ward_id}/scorecard`

## Tests
```bash
pytest -v
```
