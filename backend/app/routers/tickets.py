import math
import os
import statistics
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.anti_cheat import BASE_POINTS, credited_points
from app.db import get_db
from app.models import ConsentStatus, Ticket, TicketStatus, User, Verification, VerificationPair
from app.schemas import VerifyRequest
from app.services.deepseek import classify_image

router = APIRouter(prefix="/api/v1/tickets", tags=["tickets"])

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

REPORT_ESCROW_POINTS = 50
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


@router.post("/analyze")
async def analyze_ticket_photo(
    photo: UploadFile = File(...),
):
    """
    Pre-report explainable AI analysis endpoint.
    Analyzes the photograph with DeepSeek 4.1 Vision to determine the defect category,
    exact government department, transparent reasoning, severity rating, and suggested content
    so the user can review, confirm, or edit before officially publishing to the feed.
    """
    content = await photo.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty photo")
    try:
        ai = await classify_image(photo.filename or "photo.jpg", content, photo.content_type or "image/jpeg")
        return {"success": True, "ai": ai}
    except ValueError as e:
        if "INVALID_IMAGE" in str(e):
            raise HTTPException(status_code=400, detail="Uploaded file is not a valid image")
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail="Vision service unavailable, try again later")


@router.post("/report")
async def report_ticket(
    photo: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    ward_id: str = Form(...),
    reporter_id: str = Form(...),
    target_department: str = Form(None),
    custom_title: str = Form(None),
    custom_description: str = Form(None),
    db: AsyncSession = Depends(get_db),
):
    reporter = await require_active_reporter(db, reporter_id)
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        raise HTTPException(status_code=422, detail="Invalid latitude/longitude")
    if not ward_id or len(ward_id) > 32:
        raise HTTPException(status_code=422, detail="Invalid ward_id")
    path, content = await save_upload(photo)

    try:
        ai = await classify_image(photo.filename or "photo.jpg", content, photo.content_type or "image/jpeg")
    except ValueError as e:
        try:
            os.remove(path)
        except Exception:
            pass
        if "INVALID_IMAGE" in str(e):
            raise HTTPException(status_code=400, detail="Uploaded file is not a valid image")
        raise
    except RuntimeError as e:
        try:
            os.remove(path)
        except Exception:
            pass
        raise HTTPException(status_code=503, detail="Vision service unavailable, try again later")
    if ai.get("confidence", 0) < 0.60:
        try:
            os.remove(path)
        except Exception:
            pass
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
            try:
                os.remove(path)
            except Exception:
                pass
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
        report_photo_url=f"/uploads/{os.path.basename(path)}",
        is_commercial_adjacent=bool(ai.get("is_near_active_commercial_vendor")),
    )
    db.add(ticket)
    reporter.points_balance += REPORT_ESCROW_POINTS
    await db.commit()
    await db.refresh(ticket)
    return {
        "ticket_id": ticket.id,
        "category": ticket.category,
        "target_department": target_department or ai.get("target_department"),
        "department_reasoning": ai.get("department_reasoning"),
        "severity": ticket.severity,
        "severity_justification": ai.get("severity_justification"),
        "status": ticket.status,
        "escrow_points": REPORT_ESCROW_POINTS,
        "privacy_blur": ai.get("bounding_boxes_to_blur", []),
        "commercial_adjacent": ticket.is_commercial_adjacent,
        "suggested_title": custom_title or ai.get("suggested_title"),
        "suggested_description": custom_description or ai.get("suggested_description"),
        "actionable_remedy": ai.get("actionable_remedy"),
    }


@router.post("/{ticket_id}/provisional-fix")
async def provisional_fix(
    ticket_id: str,
    photo: UploadFile = File(...),
    uploader_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    db: AsyncSession = Depends(get_db),
):
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    uploader = await db.get(User, uploader_id)
    if not uploader:
        raise HTTPException(status_code=404, detail="User not found")
    if uploader.consent_status != ConsentStatus.ACTIVE.value:
        raise HTTPException(status_code=403, detail="Account pending parent consent")
    if haversine_m(latitude, longitude, ticket.latitude, ticket.longitude) > 200:
        raise HTTPException(status_code=403, detail="Uploader must be within 200m of the issue")
    if ticket.status == TicketStatus.WEATHER_OCCLUDED.value:
        raise HTTPException(
            status_code=400,
            detail="Ticket is WEATHER_OCCLUDED; closure disabled until surface dries",
        )
    path, _ = await save_upload(photo)
    ticket.resolution_photo_url = f"/uploads/{os.path.basename(path)}"
    ticket.status = TicketStatus.PROVISIONAL_FIX.value
    await db.commit()
    return {"ticket_id": ticket.id, "status": ticket.status}


@router.post("/{ticket_id}/verify")
async def verify_ticket(
    ticket_id: str,
    photo: UploadFile = File(...),
    auditor_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    db: AsyncSession = Depends(get_db),
):
    _ = VerifyRequest(auditor_id=auditor_id)
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status == TicketStatus.RESOLVED.value:
        raise HTTPException(status_code=409, detail="Ticket already resolved")
    if ticket.status == TicketStatus.WEATHER_OCCLUDED.value:
        raise HTTPException(
            status_code=400,
            detail="Ticket is WEATHER_OCCLUDED; closure disabled until surface dries",
        )
    if auditor_id == ticket.reporter_id:
        raise HTTPException(status_code=403, detail="Cannot verify your own report")
    if haversine_m(latitude, longitude, ticket.latitude, ticket.longitude) > 50:
        raise HTTPException(status_code=403, detail="Auditor must be within 50m of the issue")
    auditor = await db.get(User, auditor_id)
    if not auditor:
        raise HTTPException(status_code=404, detail="Auditor not found")
    if auditor.consent_status != ConsentStatus.ACTIVE.value:
        raise HTTPException(status_code=403, detail="Auditor pending parent consent")

    key = tuple(sorted([auditor_id, ticket.reporter_id]))
    pair = await db.get(VerificationPair, key)
    n_ur = pair.pairing_count if pair else 0

    from datetime import datetime, timezone

    created = ticket.created_at
    if created is not None and created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    age_hours = (datetime.now(timezone.utc) - created).total_seconds() / 3600
    outcome_weight = 0.0 if (age_hours < TRANSIENT_HOURS and not ticket.resolution_photo_url) else 1.0
    if outcome_weight == 0.0:
        raise HTTPException(
            status_code=429,
            detail="Too early: fix evidence required. Upload a provisional fix or retry later.",
        )

    path, _ = await save_upload(photo)

    credited, decay_pct = credited_points(n_ur, outcome_weight)

    verification = Verification(
        ticket_id=ticket.id,
        auditor_id=auditor_id,
        audit_photo_url=f"/uploads/{os.path.basename(path)}",
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
        db.add(VerificationPair(auditor_id=key[0], reporter_id=key[1], pairing_count=1))

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
            d = (resolved_at - created).total_seconds() / 86400
            days.append(max(d, 0))
        except Exception:
            continue
    median_days = statistics.median(days) if days else 0.0
    score = round((resolved / total * 100) if total else 0.0, 1)
    return {
        "ward_id": ward_id,
        "total_tickets": total,
        "resolved_count": resolved,
        "median_resolution_days": round(median_days, 2),
        "ward_cleanliness_score": score,
    }
