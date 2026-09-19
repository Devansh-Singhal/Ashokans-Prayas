import base64
import json
import os

import httpx

PROVIDER_URL = os.environ.get(
    "DEEPSEEK_URL", "https://api.commandcode.ai/provider/v1/chat/completions"
)
PROVIDER_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek/deepseek-v4.1-flash")

SYSTEM_PROMPT = """You are the CivicFeed Vision & Safety Intelligence Engine.
Analyze the provided urban infrastructure photograph and return ONLY a valid JSON object matching this schema:
{
  "category": "POTHOLE" | "GARBAGE_ACCUMULATION" | "STREETLIGHT" | "OPEN_DRAIN" | "FOOTPATH_DAMAGE" | "UNKNOWN",
  "confidence": float (0.0 to 1.0),
  "severity": int (1 to 5),
  "is_submerged_or_wet": boolean,
  "is_near_active_commercial_vendor": boolean,
  "requires_privacy_blur": boolean,
  "bounding_boxes_to_blur": [{"label": "face"|"license_plate"|"shop_board", "box_2d": [ymin, xmin, ymax, xmax]}],
  "reasoning_summary": string
}"""

CATEGORIES = {
    "POTHOLE",
    "GARBAGE_ACCUMULATION",
    "STREETLIGHT",
    "OPEN_DRAIN",
    "FOOTPATH_DAMAGE",
    "UNKNOWN",
}


def heuristic_classify(filename: str, content: bytes) -> dict:
    name = (filename or "").lower()
    wet = "wet" in name or "rain" in name or "flood" in name or "submerged" in name
    vendor = "vendor" in name or "shop" in name
    if "pothole" in name or "pothol" in name:
        return {
            "category": "POTHOLE",
            "confidence": 0.9,
            "severity": 4,
            "is_submerged_or_wet": wet,
            "is_near_active_commercial_vendor": vendor,
            "requires_privacy_blur": vendor,
            "bounding_boxes_to_blur": (
                [{"label": "shop_board", "box_2d": [10, 10, 50, 50]}] if vendor else []
            ),
            "reasoning_summary": "Heuristic stub: filename indicates pothole.",
        }
    if "garbage" in name or "waste" in name:
        return {
            "category": "GARBAGE_ACCUMULATION",
            "confidence": 0.85,
            "severity": 3,
            "is_submerged_or_wet": wet,
            "is_near_active_commercial_vendor": vendor,
            "requires_privacy_blur": vendor,
            "bounding_boxes_to_blur": (
                [{"label": "shop_board", "box_2d": [10, 10, 50, 50]}] if vendor else []
            ),
            "reasoning_summary": "Heuristic stub: filename indicates garbage.",
        }
    if "vendor" in name or "shop" in name:
        return {
            "category": "GARBAGE_ACCUMULATION",
            "confidence": 0.8,
            "severity": 2,
            "is_submerged_or_wet": False,
            "is_near_active_commercial_vendor": True,
            "requires_privacy_blur": True,
            "bounding_boxes_to_blur": [{"label": "shop_board", "box_2d": [10, 10, 50, 50]}],
            "reasoning_summary": "Heuristic stub: vendor-adjacent waste.",
        }
    if "wet" in name or "rain" in name or "flood" in name:
        return {
            "category": "POTHOLE",
            "confidence": 0.75,
            "severity": 3,
            "is_submerged_or_wet": True,
            "is_near_active_commercial_vendor": False,
            "requires_privacy_blur": False,
            "bounding_boxes_to_blur": [],
            "reasoning_summary": "Heuristic stub: wet surface.",
        }
    return {
        "category": "UNKNOWN",
        "confidence": 0.5,
        "severity": 2,
        "is_submerged_or_wet": False,
        "is_near_active_commercial_vendor": False,
        "requires_privacy_blur": False,
        "bounding_boxes_to_blur": [],
        "reasoning_summary": "Heuristic stub: unknown.",
    }


def sanitize(result: dict) -> dict:
    cat = result.get("category")
    if cat not in CATEGORIES:
        result["category"] = "UNKNOWN"
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
        "is_near_active_commercial_vendor",
        "requires_privacy_blur",
    ):
        result[key] = bool(result.get(key, False))
    if not isinstance(result.get("bounding_boxes_to_blur"), list):
        result["bounding_boxes_to_blur"] = []
    result["reasoning_summary"] = str(result.get("reasoning_summary", ""))
    return result


async def classify_image(filename: str, content: bytes, content_type: str = "image/jpeg") -> dict:
    api_key = os.environ.get("COMMANDCODE_API_KEY")
    if not api_key:
        return sanitize(heuristic_classify(filename, content))
    try:
        from io import BytesIO

        from PIL import Image

        with Image.open(BytesIO(content)) as im:
            im = im.convert("RGB")
            im.thumbnail((1024, 1024))
            buf = BytesIO()
            im.save(buf, "JPEG", quality=70)
            content = buf.getvalue()
            content_type = "image/jpeg"
    except Exception:
        return sanitize(heuristic_classify(filename, content))
    b64 = base64.b64encode(content).decode()
    try:
        async with httpx.AsyncClient(timeout=90) as client:
            r = await client.post(
                PROVIDER_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": PROVIDER_MODEL,
                    "temperature": 0.1,
                    "max_tokens": 2000,
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
                                    "text": "Classify this civic issue photo. Return ONLY the JSON object.",
                                },
                            ],
                        },
                    ],
                },
            )
            r.raise_for_status()
            msg = r.json()["choices"][0]["message"]
            text = msg.get("content") or ""
            if not text.strip():
                text = msg.get("reasoning", "") or msg.get("reasoning_content", "") or ""
            start, end = text.find("{"), text.rfind("}")
            if start < 0 or end <= start:
                return sanitize(heuristic_classify(filename, content))
            return sanitize(json.loads(text[start : end + 1]))
    except Exception:
        return sanitize(heuristic_classify(filename, content))
