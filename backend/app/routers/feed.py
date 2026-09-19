from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Ticket

router = APIRouter(prefix="/api/v1/feed", tags=["feed"])


@router.get("/ward/{ward_id}")
async def ward_feed(
    ward_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    total = (
        await db.execute(
            select(func.count()).select_from(Ticket).where(Ticket.ward_id == ward_id)
        )
    ).scalar() or 0
    rows = (
        await db.execute(
            select(Ticket)
            .where(Ticket.ward_id == ward_id)
            .order_by(desc(Ticket.upvotes_count), desc(Ticket.created_at))
            .offset((page - 1) * size)
            .limit(size)
        )
    ).scalars().all()
    return {
        "ward_id": ward_id,
        "page": page,
        "size": size,
        "total": total,
        "tickets": [
            {
                "id": t.id,
                "category": t.category,
                "severity": t.severity,
                "status": t.status,
                "upvotes": t.upvotes_count,
                "latitude": t.latitude,
                "longitude": t.longitude,
                "report_photo_url": t.report_photo_url,
                "resolution_photo_url": t.resolution_photo_url,
                "ward_id": t.ward_id,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in rows
        ],
    }
