# CivicFeed (Gemini Implementation)

A production-grade, mindful civic accountability system built on **FastAPI (Python)** and **React Native / Expo Go (TypeScript)**, featuring real-time AI vision classification via **DeepSeek 4.1 Vision**, 50m spatial geofencing, Reciprocity-Decayed anti-collusion gamification, and rich social interactions.

---

## Architecture Overview

```
gemini implementation/
├── civicfeed-backend/           # FastAPI REST Backend
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point & CORS
│   │   ├── models/              # SQLAlchemy SQLite models (Ticket, User, Verification)
│   │   ├── routers/             # API routes: auth, tickets, feed, scorecard
│   │   ├── services/            # DeepSeek 4.1 Vision multi-modal client
│   │   └── anti_cheat.py        # Mathematical Reciprocity Decay engine
│   ├── seed_demo_data.py        # Seeder for 6 Ward 14 civic tickets & 3 demo personas
│   ├── tests/test_api.py        # Pytest test suite (10/10 passing)
│   └── requirements.txt
│
└── civicfeed-mobile/            # React Native Expo Go Mobile Client
    ├── App.tsx                  # Master navigation shell, Provider tree, Bottom tabs
    ├── src/
    │   ├── components/
    │   │   ├── CivicPostCard.tsx       # Concrete social media post card
    │   │   ├── SeverityMeter.tsx       # Visual 1-5 ascending severity indicator
    │   │   ├── StatusBadge.tsx         # Colored status pill (Reported/Provisional/Resolved)
    │   │   ├── BeforeAfterView.tsx     # Dual comparison slider for municipal fixes
    │   │   ├── GeofencePill.tsx        # 50m proximity lock/unlock indicator
    │   │   ├── AntiCheatModal.tsx      # Live collusion decay warning modal
    │   │   ├── PersonaBar.tsx          # 1-tap stage demo switcher
    │   │   └── ParentConsentModal.tsx  # Minor 1-click parent consent approval
    │   ├── screens/
    │   │   ├── FeedScreen.tsx          # Ward social feed with category filter chips
    │   │   ├── MapScreen.tsx           # Interactive geospatial radar map
    │   │   ├── ReportScreen.tsx        # Camera capture with DeepSeek vision feedback
    │   │   ├── ScorecardScreen.tsx     # Ward Cleanliness score & fix latency
    │   │   └── ProfileScreen.tsx       # Anonymous handle & audit hours ledger
    │   ├── services/
    │   │   ├── api.ts                  # Typed API client with universal multipart upload
    │   │   └── location.ts             # Haversine distance calculation
    │   └── __tests__/                  # Comprehensive test suites
    │       ├── location.test.ts        # 4/4 passed
    │       ├── antiCheat.test.ts       # 4/4 passed
    │       ├── postCard.test.ts        # 4/4 passed
    │       ├── api.test.ts             # 5/5 passed
    │       └── e2e_walkthrough.test.ts # 7-step stage demo walkthrough (PASSED 100%)
```

---

## Key Features

1. **Concrete Social Post Card (`CivicPostCard.tsx`):**
   - High-contrast visual hierarchy with avatar, anonymous handle, Ward badge, and relative timestamps.
   - Dynamic 1–5 visual severity meter.
   - Dual Before/After photo comparison for provisional municipal fixes.
   - Real-time GPS distance pill (green $\le 50$m / red $> 50$m).
   - Optimistic **"I Hit This Too!"** endorsement button (+25 escrow points).
   - Geofence-locked **"Verify & Audit Fix"** action button (+150 points).

2. **Stage Demo Persona Switcher (`PersonaBar.tsx`):**
   - **Persona A (Citizen Rahul):** Reports potholes/garbage (+50 escrow pts).
   - **Persona B (Stranger Anjali):** Independent passerby within 50m geofence; audits fix for full +150 pts (0% decay).
   - **Persona C (Colluder Rohan - Under 18):** Repeated verification of Rahul triggers mathematical Reciprocity Decay (+75 pts, -50% decay) and demonstrates 1-click minor parent consent approval.

3. **DeepSeek 4.1 Vision Intelligence:**
   - Multi-modal defect classification: category detection, 1–5 severity scoring, monsoon submerged puddle occlusion detection (`WEATHER_OCCLUDED`), and vendor/face privacy bounding box detection.

4. **Reciprocity-Decayed Anti-Cheat Engine:**
   $$\text{credited} = \text{round}\left(150 \times \frac{1}{1 + N_{ur}} \times \text{weight}\right)$$
   Pairing 1: 150 pts (0% decay) $\rightarrow$ Pairing 2: 75 pts (50% decay) $\rightarrow$ Pairing 4: 38 pts (75% decay) $\rightarrow$ Pairing 10: 15 pts (90% decay), rendering collusion cartels mathematically unprofitable.

---

## How to Run

### Backend Setup (FastAPI)
```bash
cd "gemini implementation/civicfeed-backend"
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python seed_demo_data.py
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Mobile Setup (Expo Go)
```bash
cd "gemini implementation/civicfeed-mobile"
npm install
npx expo start
```
Scan the QR code with the **Expo Go** app on iOS/Android or press `w` to run on web.

### Running Automated Test Suites
```bash
# Backend pytest suite (10 tests)
cd "gemini implementation/civicfeed-backend"
pytest

# Mobile unit & E2E walkthrough suites (all passing)
cd "gemini implementation/civicfeed-mobile"
npx tsx src/__tests__/location.test.ts
npx tsx src/__tests__/antiCheat.test.ts
npx tsx src/__tests__/postCard.test.ts
npx tsx src/__tests__/api.test.ts
npx tsx src/__tests__/e2e_walkthrough.test.ts
```
