import pytest

from services import ocr_service

pytest.importorskip("sqlalchemy")
from database.database import vn_fold  # noqa: E402


def test_raw_text_removed_by_default(monkeypatch):
    monkeypatch.delenv("OCR_INCLUDE_RAW_TEXT", raising=False)
    result = {"medicines": [], "raw_ocr_text": "Họ tên: A", "corrected_ocr_text": "x", "debug_notes": ["y"]}
    cleaned = ocr_service._strip_private_text(result)
    assert set(cleaned) == {"medicines"}


def test_raw_text_kept_when_enabled(monkeypatch):
    monkeypatch.setenv("OCR_INCLUDE_RAW_TEXT", "1")
    result = {"raw_ocr_text": "x"}
    assert ocr_service._strip_private_text(result) == result


def test_vn_fold():
    assert vn_fold("Đau đầu") == "dau dau"
    assert vn_fold("Acid MÊFENAMIC") == "acid mefenamic"
    assert vn_fold(None) == ""
