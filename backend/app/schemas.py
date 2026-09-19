import secrets
from datetime import datetime, timedelta, timezone

from pydantic import BaseModel, Field

CONSENT_TTL_HOURS = 48


def make_handle() -> str:
    return f"Auditor_{secrets.token_hex(2).upper()}"


def make_consent_token() -> str:
    return secrets.token_urlsafe(32)


def consent_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=CONSENT_TTL_HOURS)


class RegisterRequest(BaseModel):
    phone: str = Field(min_length=4, max_length=16, pattern=r"^\+?[0-9]{4,16}$")
    is_under_18: bool = False
    parent_phone: str | None = Field(default=None, max_length=16, pattern=r"^\+?[0-9]{4,16}$")


class EndorseRequest(BaseModel):
    user_id: str


class VerifyRequest(BaseModel):
    auditor_id: str
