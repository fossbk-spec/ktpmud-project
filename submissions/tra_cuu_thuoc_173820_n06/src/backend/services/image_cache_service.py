"""Small, atomic filesystem cache for OCR/parser output."""
from __future__ import annotations

import hashlib
import json
import os
import tempfile
from pathlib import Path
from typing import Any, Callable

from dotenv import load_dotenv

load_dotenv()

CACHE_VERSION = "prescription-ocr-v2"  # tăng mỗi khi sửa parser/prompt/hậu xử lý
DEFAULT_CACHE_DIR = Path(os.getenv("OCR_CACHE_DIR", "uploads/ocr_cache"))


def make_cache_key(image_bytes: bytes, task: str) -> str:
    digest = hashlib.sha256(image_bytes).hexdigest()
    # Changing the OCR language or Ollama model must not reuse old parsed data.
    settings = "|".join((
        os.getenv("OCR_LANG", "vi"),
        os.getenv("OCR_MODEL_VERSION", "paddleocr-default"),
        os.getenv("OLLAMA_MODEL", "qwen2.5:3b"),
        os.getenv("OCR_INCLUDE_RAW_TEXT", "0"),
        os.getenv("OCR_UPSCALE", "1"),
        os.getenv("OCR_LAYOUT_ROWS", "1"),
        os.getenv("OCR_MIN_LONG_SIDE", "1600"),
        os.getenv("DRUG_DB_PATH", ""),
    ))
    cache_identity = f"{CACHE_VERSION}:{task}:{settings}:{digest}"
    return hashlib.sha256(cache_identity.encode("utf-8")).hexdigest()


def get_or_create_cached_result(
    image_bytes: bytes,
    task: str,
    builder: Callable[[], dict[str, Any]],
) -> tuple[dict[str, Any], bool]:
    """Return (result, cache_hit). Only successful JSON results are cached."""
    cache_dir = DEFAULT_CACHE_DIR
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_file = cache_dir / f"{make_cache_key(image_bytes, task)}.json"

    if cache_file.is_file():
        try:
            data = json.loads(cache_file.read_text(encoding="utf-8"))
            if isinstance(data, dict) and data.get("cache_version") == CACHE_VERSION:
                result = data.get("result")
                if isinstance(result, dict):
                    return result, True
        except (OSError, json.JSONDecodeError, TypeError):
            try:
                cache_file.unlink(missing_ok=True)
            except OSError:
                pass

    result = builder()
    if not isinstance(result, dict):
        raise TypeError("Kết quả OCR cache phải là dictionary.")

    payload = {
        "cache_version": CACHE_VERSION,
        "task": task,
        "result": result,
    }

    # Write-then-replace prevents partially written cache files.
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            suffix=".tmp",
            prefix="ocr_",
            dir=cache_dir,
            delete=False,
        ) as temp_file:
            json.dump(payload, temp_file, ensure_ascii=False)
            temp_path = temp_file.name
        os.replace(temp_path, cache_file)
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass

    return result, False
