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

# NOTE: production should restrict allow_origins to the real web/app domains.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
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
