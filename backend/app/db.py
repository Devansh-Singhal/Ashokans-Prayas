import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models import Base

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./civicfeed.db")

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    # Per-connection busy timeout (seconds) so concurrent SQLite writers wait instead of failing fast.
    # NOTE: WAL mode for SQLite via aiosqlite needs an explicit PRAGMA journal_mode=WAL event listener;
    # kept simple here with just a timeout to avoid changing runtime behavior.
    connect_args={"timeout": 30},
)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with SessionLocal() as session:
        yield session
