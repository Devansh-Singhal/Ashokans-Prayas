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
                    consent_status=ConsentStatus.ACTIVE.value,
                    points_balance=pts
                )
                session.add(u)
        
        await session.flush()
        
        # 2. Seed 6 realistic Ward 14 tickets
        now = datetime.now(timezone.utc)
        
        tickets_data = [
            {
                "id": "ticket-pothole-1",
                "reporter_id": "user-rahul-id",
                "ward_id": "WARD_DELHI_14",
                "category": "POTHOLE",
                "severity": 4,
                "status": TicketStatus.REPORTED.value,
                "latitude": 28.6289,
                "longitude": 77.2065,
                "upvotes_count": 34,
                "report_photo_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80",
                "created_at": now - timedelta(hours=2, minutes=15)
            },
            {
                "id": "ticket-garbage-fix",
                "reporter_id": "user-rahul-id",
                "ward_id": "WARD_DELHI_14",
                "category": "GARBAGE_ACCUMULATION",
                "severity": 3,
                "status": TicketStatus.PROVISIONAL_FIX.value,
                "latitude": 28.6295,
                "longitude": 77.2072,
                "upvotes_count": 18,
                "report_photo_url": "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&q=80",
                "resolution_photo_url": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80",
                "created_at": now - timedelta(hours=5)
            },
            {
                "id": "ticket-streetlight-3",
                "reporter_id": "user-anjali-id",
                "ward_id": "WARD_DELHI_14",
                "category": "STREETLIGHT",
                "severity": 2,
                "status": TicketStatus.REPORTED.value,
                "latitude": 28.6275,
                "longitude": 77.2050,
                "upvotes_count": 12,
                "report_photo_url": "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&q=80",
                "created_at": now - timedelta(hours=14)
            },
            {
                "id": "ticket-drain-flooded",
                "reporter_id": "user-rohan-id",
                "ward_id": "WARD_DELHI_14",
                "category": "POTHOLE",
                "severity": 4,
                "status": TicketStatus.WEATHER_OCCLUDED.value,
                "latitude": 28.6310,
                "longitude": 77.2085,
                "upvotes_count": 27,
                "report_photo_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
                "created_at": now - timedelta(days=1, hours=3)
            },
            {
                "id": "ticket-manhole-hazard",
                "reporter_id": "user-anjali-id",
                "ward_id": "WARD_DELHI_14",
                "category": "OPEN_DRAIN",
                "severity": 5,
                "status": TicketStatus.REPORTED.value,
                "latitude": 28.6268,
                "longitude": 77.2040,
                "upvotes_count": 48,
                "report_photo_url": "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&q=80",
                "created_at": now - timedelta(days=2)
            },
            {
                "id": "ticket-resolved-road",
                "reporter_id": "user-rahul-id",
                "ward_id": "WARD_DELHI_14",
                "category": "POTHOLE",
                "severity": 3,
                "status": TicketStatus.RESOLVED.value,
                "latitude": 28.6280,
                "longitude": 77.2060,
                "upvotes_count": 56,
                "report_photo_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80",
                "resolution_photo_url": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80",
                "created_at": now - timedelta(days=4),
                "resolved_at": now - timedelta(days=1)
            }
        ]
        
        for td in tickets_data:
            existing = await session.get(Ticket, td["id"])
            if not existing:
                t = Ticket(**td)
                session.add(t)
                
        await session.commit()
        print("✅ Demo personas and 6 Ward 14 civic tickets successfully seeded!")

if __name__ == "__main__":
    asyncio.run(seed())
