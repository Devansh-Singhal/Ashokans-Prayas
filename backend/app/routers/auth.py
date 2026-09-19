from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import ConsentStatus, ParentConsent, User
from app.schemas import RegisterRequest, consent_expiry, make_consent_token, make_handle

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register")
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = (
        await db.execute(select(User).where(User.phone_number == body.phone))
    ).scalar_one_or_none()
    if existing:
        return {"user_id": existing.id, "consent_status": existing.consent_status}

    if body.is_under_18 and not body.parent_phone:
        raise HTTPException(status_code=422, detail="parent_phone required for under-18 users")

    user = User(
        public_handle=make_handle(),
        phone_number=body.phone,
        is_under_18=body.is_under_18,
        parent_phone_number=body.parent_phone if body.is_under_18 else None,
        consent_status=(
            ConsentStatus.PENDING_PARENT_CONSENT.value
            if body.is_under_18
            else ConsentStatus.ACTIVE.value
        ),
    )
    db.add(user)
    await db.flush()

    consent_link = None
    if body.is_under_18:
        token = make_consent_token()
        db.add(
            ParentConsent(user_id=user.id, token=token, expires_at=consent_expiry())
        )
        consent_link = f"https://api.civicfeed.org/auth/parent-consent?token={token}"

    await db.commit()
    return {
        "user_id": user.id,
        "public_handle": user.public_handle,
        "consent_status": user.consent_status,
        "parent_consent_link": consent_link,
    }


@router.get("/verify-parent-consent")
async def verify_parent_consent(token: str, db: AsyncSession = Depends(get_db)):
    from datetime import datetime, timezone

    consent = (
        await db.execute(select(ParentConsent).where(ParentConsent.token == token))
    ).scalar_one_or_none()
    if not consent or consent.is_used:
        raise HTTPException(status_code=400, detail="Invalid or used token")
    if consent.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")

    user = await db.get(User, consent.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    consent.is_used = True
    user.consent_status = ConsentStatus.ACTIVE.value
    await db.commit()
    return {"user_id": user.id, "consent_status": user.consent_status}
