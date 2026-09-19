import os
import sys

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

TEST_DB = "/tmp/civicfeed_test.db"
if os.path.exists(TEST_DB):
    os.remove(TEST_DB)

os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{TEST_DB}"
os.environ["UPLOAD_DIR"] = "/tmp/civicfeed_uploads"
os.makedirs(os.environ["UPLOAD_DIR"], exist_ok=True)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.db import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Base  # noqa: E402

engine = create_async_engine(os.environ["DATABASE_URL"], future=True)
TestSession = async_sessionmaker(engine, expire_on_commit=False)


@pytest_asyncio.fixture
async def client():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async def override():
        async with TestSession() as s:
            yield s

    app.dependency_overrides[get_db] = override
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


def photo(name="pothole.jpg", content=b"fake-image-bytes"):
    return {"photo": (name, content, "image/jpeg")}


@pytest.mark.asyncio
async def test_register_adult_immediate_active(client):
    r = await client.post(
        "/api/v1/auth/register", json={"phone": "+911111111111", "is_under_18": False}
    )
    assert r.status_code == 200
    assert r.json()["consent_status"] == "ACTIVE"


@pytest.mark.asyncio
async def test_register_minor_requires_consent(client):
    r = await client.post(
        "/api/v1/auth/register",
        json={
            "phone": "+912222222222",
            "is_under_18": True,
            "parent_phone": "+913333333333",
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["consent_status"] == "PENDING_PARENT_CONSENT"
    assert body["parent_consent_link"] and "token=" in body["parent_consent_link"]

    minor_id = body["user_id"]
    rep = await client.post(
        "/api/v1/tickets/report",
        files=photo(),
        data={
            "latitude": "30.8893",
            "longitude": "75.8490",
            "ward_id": "WARD_LUDHIANA_14",
            "reporter_id": minor_id,
        },
    )
    assert rep.status_code == 403

    token = body["parent_consent_link"].split("token=")[1]
    v = await client.get(f"/api/v1/auth/verify-parent-consent?token={token}")
    assert v.status_code == 200
    assert v.json()["consent_status"] == "ACTIVE"


@pytest.mark.asyncio
async def test_ticket_creation_deepseek_mock(client):
    reg = await client.post(
        "/api/v1/auth/register", json={"phone": "+914444444444", "is_under_18": False}
    )
    uid = reg.json()["user_id"]
    r = await client.post(
        "/api/v1/tickets/report",
        files=photo("pothole.jpg"),
        data={
            "latitude": "30.8894",
            "longitude": "75.8491",
            "ward_id": "WARD_LUDHIANA_14",
            "reporter_id": uid,
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["category"] == "POTHOLE"
    assert body["escrow_points"] == 50


@pytest.mark.asyncio
async def test_reciprocity_decay_strangers(client):
    a = (
        await client.post(
            "/api/v1/auth/register", json={"phone": "+916666666666", "is_under_18": False}
        )
    ).json()
    b = (
        await client.post(
            "/api/v1/auth/register", json={"phone": "+917777777777", "is_under_18": False}
        )
    ).json()
    rep = await client.post(
        "/api/v1/tickets/report",
        files=photo("pothole.jpg"),
        data={
            "latitude": "28.7",
            "longitude": "77.3",
            "ward_id": "WARD_X",
            "reporter_id": a["user_id"],
        },
    )
    tid = rep.json()["ticket_id"]

    from app.db import SessionLocal
    from app.models import Ticket

    async with SessionLocal() as s:
        t = await s.get(Ticket, tid)
        from datetime import datetime, timedelta, timezone

        t.created_at = datetime.now(timezone.utc) - timedelta(hours=5)
        await s.commit()

    v = await client.post(
        f"/api/v1/tickets/{tid}/verify",
        files=photo("fix.jpg"),
        data={"auditor_id": b["user_id"], "latitude": "28.7", "longitude": "77.3"},
    )
    assert v.status_code == 200
    assert v.json()["credited_points"] == 150
    assert v.json()["decay_percentage"] == 0.0


@pytest.mark.asyncio
async def test_reciprocity_decay_collusion_loop(client):
    from datetime import datetime, timedelta, timezone

    from app.db import SessionLocal
    from app.models import Ticket

    a = (
        await client.post(
            "/api/v1/auth/register", json={"phone": "+918888888888", "is_under_18": False}
        )
    ).json()
    b = (
        await client.post(
            "/api/v1/auth/register", json={"phone": "+919999999999", "is_under_18": False}
        )
    ).json()
    last = None
    for i in range(5):
        rep = await client.post(
            "/api/v1/tickets/report",
            files=photo("pothole.jpg"),
            data={
                "latitude": f"28.8{i}",
                "longitude": "77.4",
                "ward_id": "WARD_Y",
                "reporter_id": a["user_id"],
            },
        )
        assert rep.status_code == 200
        tid = rep.json()["ticket_id"]
        async with SessionLocal() as s:
            t = await s.get(Ticket, tid)
            t.created_at = datetime.now(timezone.utc) - timedelta(hours=5)
            await s.commit()
        v = await client.post(
            f"/api/v1/tickets/{tid}/verify",
            files=photo("fix.jpg"),
            data={"auditor_id": b["user_id"], "latitude": f"28.8{i}", "longitude": "77.4"},
        )
        assert v.status_code == 200
        last = v.json()
    assert last["pair_count_after"] == 5
    assert last["credited_points"] <= 30
    assert last["decay_percentage"] >= 80.0


@pytest.mark.asyncio
async def test_monsoon_occlusion_blocks_closure(client):
    reg = await client.post(
        "/api/v1/auth/register", json={"phone": "+910101010101", "is_under_18": False}
    )
    uid = reg.json()["user_id"]
    other = (
        await client.post(
            "/api/v1/auth/register", json={"phone": "+910202020202", "is_under_18": False}
        )
    ).json()
    rep = await client.post(
        "/api/v1/tickets/report",
        files=photo("wet-pothole.jpg"),
        data={
            "latitude": "28.9",
            "longitude": "77.5",
            "ward_id": "WARD_Z",
            "reporter_id": uid,
        },
    )
    assert rep.status_code == 200
    assert rep.json()["status"] == "WEATHER_OCCLUDED"
    tid = rep.json()["ticket_id"]

    fix = await client.post(
        f"/api/v1/tickets/{tid}/provisional-fix",
        files=photo("fix.jpg"),
        data={"uploader_id": uid, "latitude": "28.9", "longitude": "77.5"},
    )
    assert fix.status_code == 400
    ver = await client.post(
        f"/api/v1/tickets/{tid}/verify",
        files=photo("fix.jpg"),
        data={"auditor_id": other["user_id"], "latitude": "28.9", "longitude": "77.5"},
    )
    assert ver.status_code == 400


@pytest.mark.asyncio
async def test_transient_item_zero_points(client):
    a = (
        await client.post(
            "/api/v1/auth/register", json={"phone": "+911212121212", "is_under_18": False}
        )
    ).json()
    b = (
        await client.post(
            "/api/v1/auth/register", json={"phone": "+913434343434", "is_under_18": False}
        )
    ).json()
    rep = await client.post(
        "/api/v1/tickets/report",
        files=photo("pothole.jpg"),
        data={
            "latitude": "29.0",
            "longitude": "77.6",
            "ward_id": "WARD_T",
            "reporter_id": a["user_id"],
        },
    )
    tid = rep.json()["ticket_id"]
    v = await client.post(
        f"/api/v1/tickets/{tid}/verify",
        files=photo("fix.jpg"),
        data={"auditor_id": b["user_id"], "latitude": "29.0", "longitude": "77.6"},
    )
    assert v.status_code == 429


@pytest.mark.asyncio
async def test_vendor_signboard_privacy_routing(client):
    reg = await client.post(
        "/api/v1/auth/register", json={"phone": "+915656565656", "is_under_18": False}
    )
    uid = reg.json()["user_id"]
    r = await client.post(
        "/api/v1/tickets/report",
        files=photo("vendor-waste.jpg"),
        data={
            "latitude": "29.1",
            "longitude": "77.7",
            "ward_id": "WARD_V",
            "reporter_id": uid,
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["commercial_adjacent"] is True
    assert len(body["privacy_blur"]) > 0


@pytest.mark.asyncio
async def test_feed_and_scorecard(client):
    reg = await client.post(
        "/api/v1/auth/register", json={"phone": "+917878787878", "is_under_18": False}
    )
    uid = reg.json()["user_id"]
    await client.post(
        "/api/v1/tickets/report",
        files=photo("pothole.jpg"),
        data={
            "latitude": "29.2",
            "longitude": "77.8",
            "ward_id": "WARD_S",
            "reporter_id": uid,
        },
    )
    feed = await client.get("/api/v1/feed/ward/WARD_S")
    assert feed.status_code == 200
    assert feed.json()["total"] >= 1
    sc = await client.get("/api/v1/tickets/ward/WARD_S/scorecard")
    assert sc.status_code == 200
    assert sc.json()["total_tickets"] >= 1


@pytest.mark.asyncio
async def test_self_verify_rejected(client):
    from datetime import datetime, timedelta, timezone

    from app.db import SessionLocal
    from app.models import Ticket

    reg = await client.post(
        "/api/v1/auth/register", json={"phone": "+911313131313", "is_under_18": False}
    )
    uid = reg.json()["user_id"]
    rep = await client.post(
        "/api/v1/tickets/report",
        files=photo("pothole.jpg"),
        data={
            "latitude": "28.65",
            "longitude": "77.25",
            "ward_id": "WARD_SELF",
            "reporter_id": uid,
        },
    )
    assert rep.status_code == 200
    tid = rep.json()["ticket_id"]
    async with SessionLocal() as s:
        t = await s.get(Ticket, tid)
        t.created_at = datetime.now(timezone.utc) - timedelta(hours=5)
        await s.commit()
    fix = await client.post(
        f"/api/v1/tickets/{tid}/provisional-fix",
        files=photo("fix.jpg"),
        data={"uploader_id": uid, "latitude": "28.65", "longitude": "77.25"},
    )
    assert fix.status_code == 200
    v = await client.post(
        f"/api/v1/tickets/{tid}/verify",
        files=photo("fix.jpg"),
        data={"auditor_id": uid, "latitude": "28.65", "longitude": "77.25"},
    )
    assert v.status_code == 403


@pytest.mark.asyncio
async def test_verify_out_of_range(client):
    from datetime import datetime, timedelta, timezone

    from app.db import SessionLocal
    from app.models import Ticket

    a = (
        await client.post(
            "/api/v1/auth/register", json={"phone": "+911515151515", "is_under_18": False}
        )
    ).json()
    b = (
        await client.post(
            "/api/v1/auth/register", json={"phone": "+911616161616", "is_under_18": False}
        )
    ).json()
    rep = await client.post(
        "/api/v1/tickets/report",
        files=photo("pothole.jpg"),
        data={
            "latitude": "28.6",
            "longitude": "77.2",
            "ward_id": "WARD_RANGE",
            "reporter_id": a["user_id"],
        },
    )
    assert rep.status_code == 200
    tid = rep.json()["ticket_id"]
    async with SessionLocal() as s:
        t = await s.get(Ticket, tid)
        t.created_at = datetime.now(timezone.utc) - timedelta(hours=5)
        await s.commit()
    fix = await client.post(
        f"/api/v1/tickets/{tid}/provisional-fix",
        files=photo("fix.jpg"),
        data={"uploader_id": b["user_id"], "latitude": "28.6", "longitude": "77.2"},
    )
    assert fix.status_code == 200
    v = await client.post(
        f"/api/v1/tickets/{tid}/verify",
        files=photo("fix.jpg"),
        data={"auditor_id": b["user_id"], "latitude": "29.0", "longitude": "78.0"},
    )
    assert v.status_code == 403


@pytest.mark.asyncio
async def test_reverify_resolved_rejected(client):
    from datetime import datetime, timedelta, timezone

    from app.db import SessionLocal
    from app.models import Ticket

    a = (
        await client.post(
            "/api/v1/auth/register", json={"phone": "+911717171717", "is_under_18": False}
        )
    ).json()
    b = (
        await client.post(
            "/api/v1/auth/register", json={"phone": "+911818181818", "is_under_18": False}
        )
    ).json()
    c = (
        await client.post(
            "/api/v1/auth/register", json={"phone": "+911919191919", "is_under_18": False}
        )
    ).json()
    rep = await client.post(
        "/api/v1/tickets/report",
        files=photo("pothole.jpg"),
        data={
            "latitude": "28.67",
            "longitude": "77.27",
            "ward_id": "WARD_REVERIFY",
            "reporter_id": a["user_id"],
        },
    )
    assert rep.status_code == 200
    tid = rep.json()["ticket_id"]
    async with SessionLocal() as s:
        t = await s.get(Ticket, tid)
        t.created_at = datetime.now(timezone.utc) - timedelta(hours=5)
        await s.commit()
    first = await client.post(
        f"/api/v1/tickets/{tid}/verify",
        files=photo("fix.jpg"),
        data={"auditor_id": b["user_id"], "latitude": "28.67", "longitude": "77.27"},
    )
    assert first.status_code == 200
    second = await client.post(
        f"/api/v1/tickets/{tid}/verify",
        files=photo("fix.jpg"),
        data={"auditor_id": c["user_id"], "latitude": "28.67", "longitude": "77.27"},
    )
    assert second.status_code == 409


@pytest.mark.asyncio
async def test_analyze_photo_endpoint(client):
    res = await client.post(
        "/api/v1/tickets/analyze",
        files=photo("pothole_crater.jpg"),
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    ai = body["ai"]
    assert ai["category"] in ["POTHOLE", "GARBAGE_ACCUMULATION", "STREETLIGHT", "OPEN_DRAIN", "FOOTPATH_DAMAGE", "UNKNOWN"]
    assert "target_department" in ai
    assert "department_reasoning" in ai
    assert "severity" in ai
    assert "suggested_title" in ai
    assert "suggested_description" in ai
