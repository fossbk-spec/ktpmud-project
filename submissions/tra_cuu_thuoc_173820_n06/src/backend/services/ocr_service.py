"""OCR orchestration: PaddleOCR locally, Ollama for structuring, JSON cache."""
from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path

from starlette.concurrency import run_in_threadpool

from services.image_cache_service import get_or_create_cached_result
from services.local_ocr_service import extract_text_from_bytes
from services.prescription_parser import (
    parse_prescription_text,
    parse_medicine_package_text,
)


# Văn bản OCR của đơn thuốc chứa thông tin bệnh nhân (họ tên, tuổi, mã y lệnh, SĐT...).
# Mặc định không đưa vào kết quả API, cache và lịch sử. Đặt OCR_INCLUDE_RAW_TEXT=1 để bật
# (ví dụ khi gỡ lỗi trên dữ liệu đã ẩn danh).
_PRIVATE_KEYS = ("raw_ocr_text", "corrected_ocr_text", "debug_notes")


def _include_raw_text() -> bool:
    return os.getenv("OCR_INCLUDE_RAW_TEXT", "0").strip() == "1"


def _strip_private_text(result: dict) -> dict:
    if _include_raw_text():
        return result
    return {k: v for k, v in result.items() if k not in _PRIVATE_KEYS}


def _process_prescription_bytes(image_bytes: bytes) -> dict:
    def build():
        text = extract_text_from_bytes(image_bytes)
        parsed = parse_prescription_text(text)
        # Loại văn bản OCR thô khỏi kết quả trả về, cache và lịch sử (xem _PRIVATE_KEYS).
        return _strip_private_text(parsed)

    result, cache_hit = get_or_create_cached_result(
        image_bytes=image_bytes,
        task="prescription",
        builder=build,
    )
    result = dict(result)
    result["cache"] = {"hit": cache_hit}
    result["engine"] = "paddleocr+ollama"
    return result


def _identify_medicine_bytes(image_bytes: bytes) -> dict:
    def build():
        text = extract_text_from_bytes(image_bytes)
        return _strip_private_text(parse_medicine_package_text(text))

    result, cache_hit = get_or_create_cached_result(
        image_bytes=image_bytes,
        task="medicine_package",
        builder=build,
    )
    result = dict(result)
    result["cache"] = {"hit": cache_hit}
    result["engine"] = "paddleocr+ollama"
    return result


async def process_prescription_image(image_path: str) -> str:
    """Backward-compatible signature: image path in, JSON string out."""
    path = Path(image_path)
    if not path.is_file():
        raise FileNotFoundError(f"Không tìm thấy ảnh đơn thuốc: {image_path}")
    image_bytes = await run_in_threadpool(path.read_bytes)
    result = await run_in_threadpool(_process_prescription_bytes, image_bytes)
    return json.dumps(result, ensure_ascii=False)


async def identify_medicine_image_logic(image_bytes, content_type, db):
    """Backward-compatible signature; db remains unused by the OCR stage."""
    if not image_bytes:
        raise ValueError("Ảnh thuốc tải lên rỗng.")
    return await run_in_threadpool(_identify_medicine_bytes, image_bytes)
