from contextlib import asynccontextmanager

from fastapi import FastAPI

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

from app.db import init_db
from app.routers import auth, feed, tickets


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="CivicFeed Backend", version="0.1.0", lifespan=lifespan)

app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(feed.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
