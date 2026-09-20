import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from app.db import SessionLocal, init_db
from app.models import User, Ticket, TicketStatus, ConsentStatus

async def seed():
    # Tables may not exist yet on a fresh checkout; create_all is a no-op if they do.
    await init_db()

    async with SessionLocal() as session:
        # 1. Ensure 3 demo personas exist
        personas = [
            ("user-rahul-id", "Auditor_42B9", "+919811122233", False, None, 350),
            ("user-anjali-id", "Auditor_84F1", "+919822233344", False, None, 600),
            ("user-rohan-id", "Auditor_77C3", "+919833344455", True, "+919899988877", 120),
        ]
        
        for uid, handle, phone, is_u18, parent_p, pts in personas:
            existing = await session.get(User, uid)
            if not existing:
                u = User(
                    id=uid,
                    public_handle=handle,
                    phone_number=phone,
                    is_under_18=is_u18,
                    parent_phone_number=parent_p,
                    consent_status=(
                        ConsentStatus.PENDING_PARENT_CONSENT.value
                        if is_u18
                        else ConsentStatus.ACTIVE.value
                    ),
                    points_balance=pts
                )
                session.add(u)
            else:
                existing.public_handle = handle
        
        await session.flush()

        # 2. Seed 9 Ward 14 (Ludhiana) tickets + 5 Ludhiana Dugri/Gill corridor
        # case-study tickets. Corridor coords sit on/near Dugri Road per
        # OpenStreetMap (Nominatim): ~(30.8686, 75.8435) -> (30.8893, 75.8490).
        now = datetime.now(timezone.utc)

        tickets_data = [
            {
                "id": "ticket-pothole-1",
                "reporter_id": "user-rahul-id",
                "ward_id": "WARD_LUDHIANA_14",
                "category": "POTHOLE",
                "severity": 4,
                "status": TicketStatus.REPORTED.value,
                "latitude": 30.8893,
                "longitude": 75.8490,
                "upvotes_count": 34,
                # Cracked asphalt carriageway on high-traffic urban corridor
                "report_photo_url": "https://images.unsplash.com/photo-1741996950842-c3a280a438a4?w=1200&q=80",
                "created_at": now - timedelta(hours=2, minutes=15)
            },
            {
                "id": "ticket-garbage-fix",
                "reporter_id": "user-rahul-id",
                "ward_id": "WARD_LUDHIANA_14",
                "category": "GARBAGE_ACCUMULATION",
                "severity": 3,
                "status": TicketStatus.PROVISIONAL_FIX.value,
                "latitude": 30.8894,
                "longitude": 75.8491,
                "upvotes_count": 18,
                # Plastic bottle pile before, and swept curb after clearance
                "report_photo_url": "https://images.unsplash.com/photo-1721622248657-55b1c5ec1dbe?w=1200&q=80",
                "resolution_photo_url": "https://images.unsplash.com/photo-1789330324657-49ce20b3b71d?w=1200&q=80",
                "created_at": now - timedelta(hours=5)
            },
            {
                "id": "ticket-garbage-lane",
                "reporter_id": "user-anjali-id",
                "ward_id": "WARD_LUDHIANA_14",
                "category": "GARBAGE_ACCUMULATION",
                "severity": 3,
                "status": TicketStatus.REPORTED.value,
                "latitude": 30.8889,
                "longitude": 75.8480,
                "upvotes_count": 9,
                # Street-side waste heap awaiting compactor dispatch
                "report_photo_url": "https://images.unsplash.com/photo-1721622248569-eb53b21445bf?w=1200&q=80",
                "created_at": now - timedelta(hours=9)
            },
            {
                "id": "ticket-streetlight-3",
                "reporter_id": "user-anjali-id",
                "ward_id": "WARD_LUDHIANA_14",
                "category": "STREETLIGHT",
                "severity": 2,
                "status": TicketStatus.REPORTED.value,
                "latitude": 30.8879,
                "longitude": 75.8475,
                "upvotes_count": 12,
                # Night lamp post on residential lane
                "report_photo_url": "https://images.unsplash.com/photo-1698972312860-dc65be01aade?w=1200&q=80",
                "created_at": now - timedelta(hours=14)
            },
            {
                "id": "ticket-streetlight-gill",
                "reporter_id": "user-rahul-id",
                "ward_id": "WARD_LUDHIANA_14",
                "category": "STREETLIGHT",
                "severity": 3,
                "status": TicketStatus.REPORTED.value,
                "latitude": 30.8901,
                "longitude": 75.8498,
                "upvotes_count": 7,
                # Unlit city streetlight fixture after sundown
                "report_photo_url": "https://images.unsplash.com/photo-1676264133344-30bb43e2b688?w=1200&q=80",
                "created_at": now - timedelta(hours=20)
            },
            {
                "id": "ticket-streetlight-dugri",
                "reporter_id": "user-anjali-id",
                "ward_id": "WARD_LUDHIANA_14",
                "category": "STREETLIGHT",
                "severity": 2,
                "status": TicketStatus.PROVISIONAL_FIX.value,
                "latitude": 30.8875,
                "longitude": 75.8468,
                "upvotes_count": 5,
                # Defunct sodium fixture before, crew relamp after
                "report_photo_url": "https://images.unsplash.com/photo-1558387489-19f943d3c0d7?w=1200&q=80",
                "resolution_photo_url": "https://images.unsplash.com/photo-1698972312860-dc65be01aade?w=1200&q=80",
                "created_at": now - timedelta(days=2)
            },
            {
                "id": "ticket-drain-flooded",
                "reporter_id": "user-rohan-id",
                "ward_id": "WARD_LUDHIANA_14",
                "category": "POTHOLE",
                "severity": 4,
                "status": TicketStatus.WEATHER_OCCLUDED.value,
                "latitude": 30.8914,
                "longitude": 75.8510,
                "upvotes_count": 27,
                # Waterlogged asphalt road completely submerged during monsoon
                "report_photo_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80",
                "created_at": now - timedelta(days=1, hours=3)
            },
            {
                "id": "ticket-manhole-hazard",
                "reporter_id": "user-anjali-id",
                "ward_id": "WARD_LUDHIANA_14",
                "category": "OPEN_DRAIN",
                "severity": 5,
                "status": TicketStatus.REPORTED.value,
                "latitude": 30.8872,
                "longitude": 75.8465,
                "upvotes_count": 48,
                # Uncovered roadside concrete drainage slab ditch
                "report_photo_url": "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=1200&q=80",
                "created_at": now - timedelta(days=2)
            },
            {
                "id": "ticket-resolved-road",
                "reporter_id": "user-rahul-id",
                "ward_id": "WARD_LUDHIANA_14",
                "category": "POTHOLE",
                "severity": 3,
                "status": TicketStatus.RESOLVED.value,
                "latitude": 30.8884,
                "longitude": 75.8485,
                "upvotes_count": 56,
                # Cracked asphalt before, and rolled patch after
                "report_photo_url": "https://images.unsplash.com/photo-1741996950842-c3a280a438a4?w=1200&q=80",
                "resolution_photo_url": "https://images.unsplash.com/photo-1789330324657-49ce20b3b71d?w=1200&q=80",
                "created_at": now - timedelta(days=4),
                "resolved_at": now - timedelta(days=1)
            },
            # --- Ludhiana Dugri/Gill corridor case study (WARD_LUDHIANA_DUGRI) ---
            # Excavated carriageway left unrestored after water-pipeline work;
            # blame chain: Municipal Corporation <-> Water Board <-> contractor.
            {
                "id": "ticket-ludhiana-dugri-cut-1",
                "reporter_id": "user-rahul-id",
                "ward_id": "WARD_LUDHIANA_DUGRI",
                "category": "POTHOLE",
                "severity": 5,
                "status": TicketStatus.REPORTED.value,
                "latitude": 30.8729,
                "longitude": 75.8439,
                "upvotes_count": 61,
                "report_photo_url": "https://images.unsplash.com/photo-1741996950842-c3a280a438a4?w=1200&q=80",
                "created_at": now - timedelta(days=187)
            },
            {
                "id": "ticket-ludhiana-dugri-cut-2",
                "reporter_id": "user-anjali-id",
                "ward_id": "WARD_LUDHIANA_DUGRI",
                "category": "OPEN_DRAIN",
                "severity": 4,
                "status": TicketStatus.PROVISIONAL_FIX.value,
                "latitude": 30.8762,
                "longitude": 75.8448,
                "upvotes_count": 44,
                "report_photo_url": "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=1200&q=80",
                "resolution_photo_url": "https://images.unsplash.com/photo-1789330324657-49ce20b3b71d?w=1200&q=80",
                "created_at": now - timedelta(days=192)
            },
            {
                "id": "ticket-ludhiana-gill-cavein",
                "reporter_id": "user-rahul-id",
                "ward_id": "WARD_LUDHIANA_DUGRI",
                "category": "POTHOLE",
                "severity": 5,
                "status": TicketStatus.REPORTED.value,
                "latitude": 30.8811,
                "longitude": 75.8588,
                "upvotes_count": 52,
                "report_photo_url": "https://images.unsplash.com/photo-1741996950842-c3a280a438a4?w=1200&q=80",
                "created_at": now - timedelta(days=201)
            },
            {
                "id": "ticket-ludhiana-gill-sewer",
                "reporter_id": "user-anjali-id",
                "ward_id": "WARD_LUDHIANA_DUGRI",
                "category": "GARBAGE_ACCUMULATION",
                "severity": 3,
                "status": TicketStatus.REPORTED.value,
                "latitude": 30.8849,
                "longitude": 75.8483,
                "upvotes_count": 29,
                "report_photo_url": "https://images.unsplash.com/photo-1721622248569-eb53b21445bf?w=1200&q=80",
                "created_at": now - timedelta(days=176)
            },
            {
                "id": "ticket-ludhiana-dugri-restored",
                "reporter_id": "user-rahul-id",
                "ward_id": "WARD_LUDHIANA_DUGRI",
                "category": "POTHOLE",
                "severity": 2,
                "status": TicketStatus.RESOLVED.value,
                "latitude": 30.8798,
                "longitude": 75.8461,
                "upvotes_count": 73,
                "report_photo_url": "https://images.unsplash.com/photo-1741996950842-c3a280a438a4?w=1200&q=80",
                "resolution_photo_url": "https://images.unsplash.com/photo-1789330324657-49ce20b3b71d?w=1200&q=80",
                "created_at": now - timedelta(days=210),
                "resolved_at": now - timedelta(days=190)
            }
        ]
        
        for td in tickets_data:
            existing = await session.get(Ticket, td["id"])
            if not existing:
                t = Ticket(**td)
                session.add(t)
            else:
                for k, v in td.items():
                    setattr(existing, k, v)
                
        await session.commit()
        print("Demo personas, 9 Ward 14 (Ludhiana) tickets, and 5 Ludhiana Dugri/Gill case-study tickets seeded!")

if __name__ == "__main__":
    asyncio.run(seed())
