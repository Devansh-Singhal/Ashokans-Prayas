import math
import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.anti_cheat import BASE_POINTS, credited_points
from app.db import get_db
from app.models import ConsentStatus, Ticket, TicketStatus, User, Verification, VerificationPair
from app.schemas import EndorseRequest, VerifyRequest
from app.services.deepseek import classify_image

router = APIRouter(prefix="/api/v1/tickets", tags=["tickets"])

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

REPORT_ESCROW_POINTS = 50
ENDORSE_POINTS = 25
TRANSIENT_HOURS = 4
DEDUP_METERS = 50


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


async def save_upload(photo: UploadFile) -> str:
    content = await photo.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty photo")
    ext = os.path.splitext(photo.filename or "")[1] or ".jpg"
    name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, name)
    with open(path, "wb") as f:
        f.write(content)
    return path, content


async def require_active_reporter(db: AsyncSession, reporter_id: str) -> User:
    user = await db.get(User, reporter_id)
    if not user:
        raise HTTPException(status_code=404, detail="Reporter not found")
    if user.consent_status != ConsentStatus.ACTIVE.value:
        raise HTTPException(status_code=403, detail="Account pending parent consent")
    return user


@router.post("/report")
async def report_ticket(
    photo: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    ward_id: str = Form(...),
    reporter_id: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    reporter = await require_active_reporter(db, reporter_id)
    path, content = await save_upload(photo)

    ai = await classify_image(photo.filename or "photo.jpg", content, photo.content_type or "image/jpeg")
    if ai.get("confidence", 0) < 0.60:
        return {
            "needs_clarification": True,
            "message": "Low confidence. Please add community clarification.",
            "ai": ai,
        }

    existing = (
        await db.execute(
            select(Ticket).where(
                Ticket.ward_id == ward_id,
                Ticket.category == ai["category"],
                Ticket.status != TicketStatus.RESOLVED.value,
            )
        )
    ).scalars().all()
    for t in existing:
        if haversine_m(latitude, longitude, t.latitude, t.longitude) <= DEDUP_METERS:
            return {
                "duplicate_of": t.id,
                "message": "Duplicate of nearby ticket",
                "ticket_id": t.id,
            }

    status = TicketStatus.REPORTED.value
    if ai["category"] == "POTHOLE" and ai.get("is_submerged_or_wet"):
        status = TicketStatus.WEATHER_OCCLUDED.value

    ticket = Ticket(
        reporter_id=reporter.id,
        ward_id=ward_id,
        category=ai["category"],
        severity=ai["severity"],
        status=status,
        latitude=latitude,
        longitude=longitude,
        report_photo_url=path,
        is_commercial_adjacent=bool(ai.get("is_near_active_commercial_vendor")),
    )
    db.add(ticket)
    reporter.points_balance += REPORT_ESCROW_POINTS
    await db.commit()
    await db.refresh(ticket)
    return {
        "ticket_id": ticket.id,
        "category": ticket.category,
        "severity": ticket.severity,
        "status": ticket.status,
        "escrow_points": REPORT_ESCROW_POINTS,
        "privacy_blur": ai.get("bounding_boxes_to_blur", []),
        "commercial_adjacent": ticket.is_commercial_adjacent,
    }


@router.post("/{ticket_id}/endorse")
async def endorse(ticket_id: str, body: EndorseRequest, db: AsyncSession = Depends(get_db)):
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    user = await db.get(User, body.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    ticket.upvotes_count += 1
    user.points_balance += ENDORSE_POINTS
    await db.commit()
    return {"ticket_id": ticket.id, "upvotes": ticket.upvotes_count, "awarded": ENDORSE_POINTS}


@router.post("/{ticket_id}/provisional-fix")
async def provisional_fix(
    ticket_id: str,
    photo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status == TicketStatus.WEATHER_OCCLUDED.value:
        raise HTTPException(
            status_code=400,
            detail="Ticket is WEATHER_OCCLUDED; closure disabled until surface dries",
        )
    path, _ = await save_upload(photo)
    ticket.resolution_photo_url = path
    ticket.status = TicketStatus.PROVISIONAL_FIX.value
    await db.commit()
    return {"ticket_id": ticket.id, "status": ticket.status}


@router.post("/{ticket_id}/verify")
async def verify_ticket(
    ticket_id: str,
    photo: UploadFile = File(...),
    auditor_id: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    _ = VerifyRequest(auditor_id=auditor_id)
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status == TicketStatus.WEATHER_OCCLUDED.value:
        raise HTTPException(
            status_code=400,
            detail="Ticket is WEATHER_OCCLUDED; closure disabled until surface dries",
        )
    auditor = await db.get(User, auditor_id)
    if not auditor:
        raise HTTPException(status_code=404, detail="Auditor not found")
    if auditor.consent_status != ConsentStatus.ACTIVE.value:
        raise HTTPException(status_code=403, detail="Auditor pending parent consent")

    path, _ = await save_upload(photo)

    pair = await db.get(VerificationPair, (auditor_id, ticket.reporter_id))
    n_ur = pair.pairing_count if pair else 0

    from datetime import datetime, timezone

    created = ticket.created_at
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    age_hours = (datetime.now(timezone.utc) - created).total_seconds() / 3600
    outcome_weight = 0.0 if (age_hours < TRANSIENT_HOURS and not ticket.resolution_photo_url) else 1.0

    credited, decay_pct = credited_points(n_ur, outcome_weight)

    verification = Verification(
        ticket_id=ticket.id,
        auditor_id=auditor_id,
        audit_photo_url=path,
        base_points=BASE_POINTS,
        credited_points=credited,
        decay_percentage=decay_pct,
    )
    db.add(verification)
    if pair:
        pair.pairing_count += 1
        from app.models import utcnow

        pair.last_verified_at = utcnow()
    else:
        db.add(VerificationPair(auditor_id=auditor_id, reporter_id=ticket.reporter_id, pairing_count=1))

    auditor.points_balance += credited
    ticket.status = TicketStatus.RESOLVED.value
    from app.models import utcnow

    ticket.resolved_at = utcnow()
    await db.commit()
    return {
        "ticket_id": ticket.id,
        "status": ticket.status,
        "credited_points": credited,
        "decay_percentage": decay_pct,
        "pair_count_after": n_ur + 1,
    }


@router.get("/ward/{ward_id}/scorecard")
async def ward_scorecard(ward_id: str, db: AsyncSession = Depends(get_db)):
    total = (
        await db.execute(
            select(func.count()).select_from(Ticket).where(Ticket.ward_id == ward_id)
        )
    ).scalar() or 0
    resolved = (
        await db.execute(
            select(func.count()).select_from(Ticket).where(
                Ticket.ward_id == ward_id, Ticket.status == TicketStatus.RESOLVED.value
            )
        )
    ).scalar() or 0
    rows = (
        await db.execute(
            select(Ticket.created_at, Ticket.resolved_at).where(
                Ticket.ward_id == ward_id,
                Ticket.status == TicketStatus.RESOLVED.value,
                Ticket.resolved_at.is_not(None),
            )
        )
    ).all()
    days = []
    for created, resolved_at in rows:
        try:
            days.append((resolved_at - created).total_seconds() / 86400)
        except Exception:
            continue
    median_days = sorted(days)[len(days) // 2] if days else 0.0
    score = round((resolved / total * 100) if total else 0.0, 1)
    return {
        "ward_id": ward_id,
        "total_tickets": total,
        "resolved_count": resolved,
        "median_resolution_days": round(median_days, 2),
        "ward_cleanliness_score": score,
    }
