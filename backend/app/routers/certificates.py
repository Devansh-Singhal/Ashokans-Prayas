from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Ticket, User, Verification
from app.services.certificate import (
    generate_certificate_data,
    group_tasks_by_domain,
)

router = APIRouter(prefix="/api/v1/certificates", tags=["certificates"])


class GenerateCertRequest(BaseModel):
    user_id: str


DEMO_SIMULATED_TASKS = [
    {
        "task_id": "sim-imu-sweep-1",
        "task_type": "SENSOR_SWEEP",
        "category": "POTHOLE",
        "title": "Passive Gyroscope Pothole Detection Sweep (14.2 km corridor)",
        "description": "Continuous 3-axis accelerometer and gyroscope vibration telemetry captured along Dugri-Gill Road corridor.",
        "ward_id": "WARD_LUDHIANA_14",
        "status": "COMPLETED",
        "is_simulated": True,
        "timestamp": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
    },
    {
        "task_id": "sim-audit-drain-2",
        "task_type": "CIVIC_AUDIT",
        "category": "OPEN_DRAIN",
        "title": "Monsoon Sewer Aperture Pre-Flood Audit",
        "description": "Field visual audit of 4 stormwater drain culvert grates ahead of seasonal monsoon alerts.",
        "ward_id": "WARD_LUDHIANA_14",
        "status": "COMPLETED",
        "is_simulated": True,
        "timestamp": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
    },
    {
        "task_id": "sim-sanitation-drive-3",
        "task_type": "CIVIC_AUDIT",
        "category": "GARBAGE_ACCUMULATION",
        "title": "Community Dhalao Vat Clearance Verification",
        "description": "Post-clearance verification of municipal solid waste removal with geo-anchored photo evidence.",
        "ward_id": "WARD_LUDHIANA_14",
        "status": "COMPLETED",
        "is_simulated": True,
        "timestamp": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
    },
    {
        "task_id": "sim-footpath-audit-4",
        "task_type": "CIVIC_AUDIT",
        "category": "FOOTPATH_DAMAGE",
        "title": "Pedestrian Walkway Paver Dislodgement Audit",
        "description": "Pedestrian safety sweep identifying displaced curb blocks obstructing elderly transit near bus stand.",
        "ward_id": "WARD_LUDHIANA_14",
        "status": "COMPLETED",
        "is_simulated": True,
        "timestamp": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(),
    },
]


@router.get("/user-tasks")
async def get_user_tasks(
    user_id: str = Query("user-rahul-id"),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    user = await db.get(User, user_id)
    if not user:
        # If user not found, try fallback or create mock reference
        res = await db.execute(select(User).limit(1))
        user = res.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = user.id

    # 1. Fetch user's reported tickets
    t_res = await db.execute(select(Ticket).where(Ticket.reporter_id == user_id))
    reported_tickets = t_res.scalars().all()

    # 2. Fetch user's verifications
    v_res = await db.execute(select(Verification).where(Verification.auditor_id == user_id))
    verifications = v_res.scalars().all()

    tasks: list[dict[str, Any]] = []

    for t in reported_tickets:
        tasks.append({
            "task_id": f"ticket-{t.id}",
            "task_type": "DEFECT_REPORT",
            "category": t.category,
            "title": f"Civic Hazard Report: {t.category.replace('_', ' ').title()}",
            "description": f"Geo-tagged civic report filed in {t.ward_id} with severity {t.severity}/5.",
            "ward_id": t.ward_id,
            "status": t.status,
            "timestamp": t.created_at.isoformat() if t.created_at else "",
        })

    for v in verifications:
        tasks.append({
            "task_id": f"verif-{v.id}",
            "task_type": "DUAL_VERIFICATION",
            "category": "POTHOLE",
            "title": "Two-Sided Contractor Resolution Verification",
            "description": f"On-site photo verification of municipal contractor work. Earned {v.credited_points} pts.",
            "ward_id": "WARD_LUDHIANA_14",
            "status": "VERIFIED",
            "timestamp": v.created_at.isoformat() if v.created_at else "",
        })

    # Always ensure representative tasks exist for a complete civic credential
    if len(tasks) < 6:
        tasks.extend(DEMO_SIMULATED_TASKS)

    # Sort newest first
    tasks.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

    # AI Grouping into domains
    grouped = group_tasks_by_domain(tasks)
    total_verified = sum(1 for t in tasks if t.get("status") in ["COMPLETED", "VERIFIED", "RESOLVED"])

    return {
        "user_id": user_id,
        "public_handle": user.public_handle,
        "total_unique_tasks": len(tasks),
        "total_verified_tasks": total_verified,
        "citizens_safeguarded": len(tasks) * 850,
        "tasks": tasks,
        "grouped_domains": grouped,
    }


@router.post("/generate")
async def generate_certificate(
    payload: GenerateCertRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    user = await db.get(User, payload.user_id)
    if not user:
        res = await db.execute(select(User).limit(1))
        user = res.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

    tasks_data = await get_user_tasks(user_id=user.id, db=db)
    tasks = tasks_data["tasks"]
    grouped = tasks_data["grouped_domains"]

    certificate = generate_certificate_data(user, tasks, grouped)
    return certificate
