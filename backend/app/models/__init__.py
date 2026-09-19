import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Double,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class ConsentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PENDING_PARENT_CONSENT = "PENDING_PARENT_CONSENT"


class TicketStatus(str, enum.Enum):
    REPORTED = "REPORTED"
    PROVISIONAL_FIX = "PROVISIONAL_FIX"
    RESOLVED = "RESOLVED"
    WEATHER_OCCLUDED = "WEATHER_OCCLUDED"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    public_handle: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    phone_number: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    is_under_18: Mapped[bool] = mapped_column(Boolean, default=False)
    parent_phone_number: Mapped[str | None] = mapped_column(String(16), nullable=True)
    consent_status: Mapped[str] = mapped_column(String(24), default=ConsentStatus.ACTIVE.value)
    points_balance: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class ParentConsent(Base):
    __tablename__ = "parent_consents"

    token: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reporter_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    ward_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    severity: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default=TicketStatus.REPORTED.value)
    latitude: Mapped[float] = mapped_column(Double, nullable=False)
    longitude: Mapped[float] = mapped_column(Double, nullable=False)
    upvotes_count: Mapped[int] = mapped_column(Integer, default=1)
    report_photo_url: Mapped[str] = mapped_column(Text, nullable=False)
    resolution_photo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_commercial_adjacent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Verification(Base):
    __tablename__ = "verifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id: Mapped[str] = mapped_column(String(36), ForeignKey("tickets.id"), nullable=False)
    auditor_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    audit_photo_url: Mapped[str] = mapped_column(Text, nullable=False)
    base_points: Mapped[int] = mapped_column(Integer, default=150)
    credited_points: Mapped[int] = mapped_column(Integer, nullable=False)
    decay_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class VerificationPair(Base):
    __tablename__ = "verification_pairs"

    # NOTE: unordered convention — server always uses tuple(sorted([auditor_id, reporter_id]))
    # for lookups/inserts so (A,B) and (B,A) share one row, even though the schema
    # columns remain nominally directed as auditor_id/reporter_id.
    auditor_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    reporter_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    pairing_count: Mapped[int] = mapped_column(Integer, default=1)
    last_verified_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Endorsement(Base):
    __tablename__ = "endorsements"

    ticket_id: Mapped[str] = mapped_column(String(36), ForeignKey("tickets.id"), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
