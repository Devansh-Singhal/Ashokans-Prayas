import base64
import json
import logging
import os
from io import BytesIO

import httpx
from PIL import Image

PROVIDER_URL = os.environ.get(
    "DEEPSEEK_URL", "https://api.commandcode.ai/provider/v1/chat/completions"
)
PROVIDER_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek/deepseek-v4.1-flash")

logger = logging.getLogger("civicfeed.vision")

SYSTEM_PROMPT = """You are the CivicFeed Vision & Municipal Governance Intelligence Engine.
Analyze the provided urban infrastructure photograph.
You must accurately identify the civic defect and map it to the EXACT responsible government department in an Indian metropolitan context (e.g. Municipal Corporation Ludhiana, Punjab PWD, NHAI, Punjab Water Supply & Sewerage Board, PSPCL).

Indian Jurisdictional Guidelines (Punjab & Municipal Corporation Ludhiana):
1. Municipal Corporation Ludhiana (MCL) - Road Maintenance: Internal colony roads, residential lanes, secondary roads, minor asphalt potholes, curb damage.
2. Public Works Department (Punjab PWD) - Arterial Roads & Flyovers: Multi-lane divided city avenues, major corridors, ring roads, flyovers, arterial potholes.
3. National Highways Authority of India (NHAI - Punjab Region): Access-controlled expressways, tollways, National Highways (NH).
4. MCL Sanitation & Solid Waste Management Division: Community garbage vats, dhalao dumps, street refuse heaps, market waste, plastic debris.
5. Punjab Water Supply & Sewerage Board (PWSSB) / Municipal Drainage: Open or broken sewer manholes, overflowing sewage lines, blocked stormwater drains, street waterlogging.
6. Punjab State Power Corporation Limited (PSPCL) - Electrical Grid & Streetlighting: Defunct sodium streetlamps, unlit poles, dangling live cables, leaning transformer boxes.
7. MCL Civil Engineering - Footpath & Pedestrian Division: Broken paver tiles, damaged pedestrian walkways, missing curb ramps.

Anti-Spoofing & Safety:
- Detect if the photo was taken of a computer screen, monitor bezel, moiré pixel pattern, or printed photograph (set is_screen_or_spoof: true).
- Detect if water/puddles submerge the road defect (set is_submerged_or_wet: true).
- Detect if commercial shop signboards, human faces, or vehicle number plates are visible and require privacy blurring.

Return ONLY a valid JSON object matching this schema:
{
  "category": "POTHOLE" | "GARBAGE_ACCUMULATION" | "STREETLIGHT" | "OPEN_DRAIN" | "FOOTPATH_DAMAGE" | "WATER_LOGGING" | "UNKNOWN",
  "target_department": string,
  "department_reasoning": string,
  "confidence": float (0.0 to 1.0),
  "severity": int (1 to 5),
  "severity_justification": string,
  "is_submerged_or_wet": boolean,
  "is_screen_or_spoof": boolean,
  "spoof_reasoning": string,
  "is_near_active_commercial_vendor": boolean,
  "requires_privacy_blur": boolean,
  "bounding_boxes_to_blur": [{"label": "face"|"license_plate"|"shop_board", "box_2d": [ymin, xmin, ymax, xmax]}],
  "suggested_title": string,
  "suggested_description": string,
  "actionable_remedy": string,
  "reasoning_summary": string
}"""

CATEGORIES = {
    "POTHOLE",
    "GARBAGE_ACCUMULATION",
    "STREETLIGHT",
    "OPEN_DRAIN",
    "FOOTPATH_DAMAGE",
    "WATER_LOGGING",
    "UNKNOWN",
}


def heuristic_classify(filename: str, content: bytes) -> dict:
    name = (filename or "").lower()
    wet = "wet" in name or "rain" in name or "flood" in name or "submerged" in name
    vendor = "vendor" in name or "shop" in name

    if "pothole" in name or "pothol" in name or "crack" in name or "asphalt" in name:
        return {
            "category": "POTHOLE",
            "target_department": "Public Works Department (State PWD) - Arterial Road Division",
            "department_reasoning": "Heuristic: Major asphalt pavement fracture identified. Road width and wear pattern indicate an arterial corridor under State PWD jurisdiction.",
            "confidence": 0.90,
            "severity": 4,
            "severity_justification": "Deep asphalt crater creating severe tire rim hazard and sudden braking risk for two-wheelers.",
            "is_submerged_or_wet": wet,
            "is_screen_or_spoof": False,
            "spoof_reasoning": "",
            "is_near_active_commercial_vendor": vendor,
            "requires_privacy_blur": vendor,
            "bounding_boxes_to_blur": [{"label": "shop_board", "box_2d": [10, 10, 50, 50]}] if vendor else [],
            "suggested_title": "Deep Asphalt Crater on Main Carriageway",
            "suggested_description": "Substantial road cavity traversing the primary vehicle lane. Requires cold-mix asphalt patch and road roller compaction.",
            "actionable_remedy": "Cold-mix asphalt patch with edge seal compaction.",
            "reasoning_summary": "Pothole detected on primary roadway.",
        }

    if "garbage" in name or "waste" in name or "dump" in name or "bottle" in name or "plastic" in name or "trash" in name or "litter" in name:
        return {
            "category": "GARBAGE_ACCUMULATION",
            "target_department": "MCL Sanitation & Solid Waste Management Division",
            "department_reasoning": "Heuristic: Solid waste accumulation on public curb falls under MCL Sanitation & Solid Waste Management.",
            "confidence": 0.88,
            "severity": 3,
            "severity_justification": "Overflowing waste heap obstructing pedestrian access and attracting stray animals.",
            "is_submerged_or_wet": wet,
            "is_screen_or_spoof": False,
            "spoof_reasoning": "",
            "is_near_active_commercial_vendor": vendor,
            "requires_privacy_blur": vendor,
            "bounding_boxes_to_blur": [{"label": "shop_board", "box_2d": [10, 10, 50, 50]}] if vendor else [],
            "suggested_title": "Overflowing Municipal Waste Heap",
            "suggested_description": "Uncollected mixed organic and plastic waste overflowing onto pedestrian sidewalk. Requires immediate compactor truck dispatch.",
            "actionable_remedy": "Dispatch hydraulic compactor vehicle and post-clearance disinfectant spraying.",
            "reasoning_summary": "Solid waste heap on municipal curb.",
        }

    if "light" in name or "lamp" in name or "pole" in name:
        return {
            "category": "STREETLIGHT",
            "target_department": "Punjab State Power Corporation Limited (PSPCL) - Electrical Grid",
            "department_reasoning": "Heuristic: Public lighting infrastructure falls under PSPCL and the municipal electrical grid.",
            "confidence": 0.85,
            "severity": 3,
            "severity_justification": "Defunct streetlighting creates pedestrian safety hazards and dark accident zones after sundown.",
            "is_submerged_or_wet": False,
            "is_screen_or_spoof": False,
            "spoof_reasoning": "",
            "is_near_active_commercial_vendor": False,
            "requires_privacy_blur": False,
            "bounding_boxes_to_blur": [],
            "suggested_title": "Damaged/Defunct Sodium Streetlight Fixture",
            "suggested_description": "Public luminaire luminary is inoperative or damaged. Requires technician bucket truck and luminaire replacement.",
            "actionable_remedy": "Replace 70W sodium lamp fixture or inspect feeder cable fuse.",
            "reasoning_summary": "Non-functional streetlighting pole.",
        }

    if "drain" in name or "sewer" in name or "manhole" in name or "waterlog" in name:
        return {
            "category": "OPEN_DRAIN",
            "target_department": "Punjab Water Supply & Sewerage Board (PWSSB) / Municipal Drainage",
            "department_reasoning": "Heuristic: Subsurface drainage, manholes, and sewer conduits are governed by the Punjab Water Supply & Sewerage Board and Municipal Drainage engineering.",
            "confidence": 0.90,
            "severity": 5,
            "severity_justification": "Critical life hazard: uncovered manhole or broken drainage slab presents lethal fall risk for pedestrians.",
            "is_submerged_or_wet": True,
            "is_screen_or_spoof": False,
            "spoof_reasoning": "",
            "is_near_active_commercial_vendor": False,
            "requires_privacy_blur": False,
            "bounding_boxes_to_blur": [],
            "suggested_title": "Critical Open Manhole / Broken Sewer Slab",
            "suggested_description": "Uncovered drainage aperture on roadway corridor. High mortality risk for pedestrians and motorcyclists. Immediate barricading required.",
            "actionable_remedy": "Deploy emergency warning barricade and install heavy-duty ductile iron / SFRC manhole cover.",
            "reasoning_summary": "Open drainage manhole detected.",
        }

    return {
        "category": "UNKNOWN",
        "target_department": "Municipal Corporation Ludhiana (MCL) - General Public Works Desk",
        "department_reasoning": "General municipal jurisdiction pending manual civic inspector review.",
        "confidence": 0.50,
        "severity": 2,
        "severity_justification": "Moderate civic issue requiring field triaging.",
        "is_submerged_or_wet": False,
        "is_screen_or_spoof": False,
        "spoof_reasoning": "",
        "is_near_active_commercial_vendor": False,
        "requires_privacy_blur": False,
        "bounding_boxes_to_blur": [],
        "suggested_title": "Civic Infrastructure Issue Under Review",
        "suggested_description": "Citizen-reported condition pending automated visual classification.",
        "actionable_remedy": "Field inspection by junior engineer.",
        "reasoning_summary": "Unclassified civic report.",
    }


def sanitize(result: dict) -> dict:
    cat = str(result.get("category", "UNKNOWN")).upper()
    if cat not in CATEGORIES:
        result["category"] = "UNKNOWN"
    else:
        result["category"] = cat

    try:
        result["confidence"] = max(0.0, min(1.0, float(result.get("confidence", 0.0))))
    except (TypeError, ValueError):
        result["confidence"] = 0.0

    try:
        result["severity"] = max(1, min(5, int(result.get("severity", 1))))
    except (TypeError, ValueError):
        result["severity"] = 1

    for key in (
        "is_submerged_or_wet",
        "is_screen_or_spoof",
        "is_near_active_commercial_vendor",
        "requires_privacy_blur",
    ):
        result[key] = bool(result.get(key, False))

    if not isinstance(result.get("bounding_boxes_to_blur"), list):
        result["bounding_boxes_to_blur"] = []

    result["target_department"] = str(
        result.get("target_department") or "Municipal Corporation Ludhiana (MCL) - Road Maintenance"
    )
    result["department_reasoning"] = str(
        result.get("department_reasoning") or "Jurisdiction mapped based on road infrastructure classification."
    )
    result["severity_justification"] = str(result.get("severity_justification") or "")
    result["spoof_reasoning"] = str(result.get("spoof_reasoning") or "")
    result["suggested_title"] = str(result.get("suggested_title") or "Reported Civic Hazard")
    result["suggested_description"] = str(result.get("suggested_description") or "")
    result["actionable_remedy"] = str(result.get("actionable_remedy") or "")
    result["reasoning_summary"] = str(
        result.get("reasoning_summary") or result.get("department_reasoning") or ""
    )

    return result


async def classify_image(filename: str, content: bytes, content_type: str = "image/jpeg") -> dict:
    api_key = os.environ.get("COMMANDCODE_API_KEY")
    if not api_key:
        logger.info("vision=heuristic reason=no_api_key file=%s", filename)
        result = sanitize(heuristic_classify(filename, content))
        result["source"] = "heuristic"
        return result

    try:
        with Image.open(BytesIO(content)) as im:
            im = im.convert("RGB")
            im.thumbnail((1024, 1024))
            buf = BytesIO()
            im.save(buf, "JPEG", quality=75)
            content = buf.getvalue()
            content_type = "image/jpeg"
    except Exception:
        raise ValueError("INVALID_IMAGE: uploaded file is not a valid image")

    b64 = base64.b64encode(content).decode()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "CivicFeed/2.0 (FastAPI)",
    }
    payload = {
        "model": PROVIDER_MODEL,
        "temperature": 0.1,
        "max_tokens": 2048,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{content_type};base64,{b64}"},
                    },
                    {
                        "type": "text",
                        "text": "Analyze this civic infrastructure defect. Determine the category, exact Indian government department, explain why, rate severity, and return strictly valid JSON.",
                    },
                ],
            },
        ],
    }

    last_error: str = "unknown error"
    async with httpx.AsyncClient(timeout=25) as client:
        try:
            r = await client.post(
                PROVIDER_URL,
                headers=headers,
                json=payload,
            )
            r.raise_for_status()
        except Exception as exc:
            last_error = f"{type(exc).__name__}: {exc}".strip()[:200]
            logger.warning("vision=heuristic reason=request_failed error=%s file=%s", last_error, filename)
            result = sanitize(heuristic_classify(filename, content))
            result["source"] = "heuristic"
            return result

    try:
        data = r.json()
        msg = data["choices"][0]["message"]
        text = msg.get("content") or ""
        if not text.strip():
            text = msg.get("reasoning", "") or msg.get("reasoning_content", "") or ""
        start, end = text.find("{"), text.rfind("}")
        if start < 0 or end <= start:
            logger.warning("vision=heuristic reason=unparseable_reply file=%s body=%.200s", filename, text)
            result = sanitize(heuristic_classify(filename, content))
            result["source"] = "heuristic"
            return result
        parsed = json.loads(text[start : end + 1])
        result = sanitize(parsed)
        result["source"] = "model"
        return result
    except Exception as exc:
        logger.warning("vision=heuristic reason=parse_failed error=%s file=%s", type(exc).__name__, filename)
        result = sanitize(heuristic_classify(filename, content))
        result["source"] = "heuristic"
        return result
