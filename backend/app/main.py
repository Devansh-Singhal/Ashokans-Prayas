import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

from app.db import init_db
from app.routers import auth, certificates, feed, tickets


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="CivicFeed Backend", version="0.1.0", lifespan=lifespan)

# CORS is locked down by default. Set CIVICFEED_CORS_ORIGINS to a comma-separated
# allowlist (e.g. "https://jawabdari.example,https://admin.example") for deployments;
# Expo Go dev clients should use an explicit tunnel/host origin, never "*".
_CORS_ORIGINS = [
    o.strip()
    for o in os.environ.get("CIVICFEED_CORS_ORIGINS", "").split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(feed.router)
app.include_router(certificates.router)

_UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "uploads")
os.makedirs(_UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_UPLOAD_DIR), name="uploads")


@app.get("/health")
async def health():
    return {"status": "ok"}
