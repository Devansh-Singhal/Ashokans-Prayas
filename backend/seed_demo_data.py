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
            else:
                existing.public_handle = handle
                existing.points_balance = pts
        
        await session.flush()
        
        # 2. Seed 6 authentic Ward 14 tickets with real urban infrastructure photos
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
                # Deep asphalt road fracture on high-traffic urban corridor
                "report_photo_url": "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=1200&q=80",
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
                # Municipal street waste heap before, and freshly swept curb after
                "report_photo_url": "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=1200&q=80",
                "resolution_photo_url": "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1200&q=80",
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
                # Defunct municipal street light fixture
                "report_photo_url": "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=1200&q=80",
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
                # Waterlogged asphalt road completely submerged during monsoon
                "report_photo_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80",
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
                # Uncovered roadside concrete drainage slab ditch
                "report_photo_url": "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=1200&q=80",
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
                # Pothole before, and rolled asphalt patch after
                "report_photo_url": "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=1200&q=80",
                "resolution_photo_url": "https://images.unsplash.com/photo-1584463699042-452304918e77?w=1200&q=80",
                "created_at": now - timedelta(days=4),
                "resolved_at": now - timedelta(days=1)
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
        print("Demo personas and 6 Ward 14 civic tickets successfully seeded with authentic infrastructure photos!")

if __name__ == "__main__":
    asyncio.run(seed())
