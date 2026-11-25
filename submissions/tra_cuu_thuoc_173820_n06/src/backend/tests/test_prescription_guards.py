"""Kiểm thử các lớp bảo vệ quanh Qwen. Ollama được thay bằng stub, không cần chạy Ollama."""
import json

from services import prescription_parser as pp

OCR_TEXT = """Đơn thuốc
1. Paracetamol 500mg
Viên 20
Ngày uống 2 viên chia 2 lần
2. Ibuprofen 400mg
Viên 10
Ngày uống 1 viên
3. Amoxicillin 500mg
Viên 15
Ngày uống 3 viên
"""

ONE_MEDICINE = {
    "medicines": [
        {
            "prescription_name": "Paracetamol",
            "brand_name": None,
            "active_ingredient": "Paracetamol",
            "strength": "500mg",
            "dosage_form": "Viên",
            "quantity": "20",
            "usage": "2 viên chia 2 lần",
        }
    ],
    "warnings": [],
}


def _stub(monkeypatch, extraction_replies):
    """Lô hiệu chỉnh trả {} (không sửa gì); lời gọi trích xuất lần lượt trả extraction_replies."""
    replies = list(extraction_replies)

    def fake_chat(prompt, timeout=180):
        if '"medicines"' in prompt or "medicines" in prompt and "<ocr_text>" in prompt:
            return replies.pop(0) if len(replies) > 1 else replies[0]
        return "{}"

    monkeypatch.setattr(pp, "_ollama_chat", fake_chat)


def test_invalid_json_after_retry_does_not_crash(monkeypatch):
    _stub(monkeypatch, ["không phải json", "vẫn không phải json"])
    result = pp.parse_prescription_text(OCR_TEXT)
    assert result["extraction_failed"] is True
    assert result["needs_review"] is True
    assert result["medicines"] == []
    assert any("chưa trích xuất" in w for w in result["warnings"])


def test_invalid_json_then_valid_is_retried(monkeypatch):
    _stub(monkeypatch, ["rác", json.dumps(ONE_MEDICINE)])
    result = pp.parse_prescription_text(OCR_TEXT)
    assert result["extraction_failed"] is False
    assert len(result["medicines"]) == 1


def test_missing_medicines_are_flagged(monkeypatch):
    _stub(monkeypatch, [json.dumps(ONE_MEDICINE)])
    result = pp.parse_prescription_text(OCR_TEXT)
    assert len(result["medicines"]) == 1
    assert result["needs_review"] is True
    assert any("mục đánh số" in w for w in result["warnings"])


def test_count_helper_handles_split_numbers():
    assert pp._count_numbered_items("1.\nParacetamol\n2)\nIbuprofen\n3. Amoxicillin") == 3
    assert pp._count_numbered_items("Ngày uống 2 viên") == 0


def test_unit_rewrite_is_reported():
    fixed, notes = pp._apply_rule_fixes("Colchicin 500 meg")
    assert "mcg" in fixed
    assert any("meg" in n["original"] and "mcg" in n["reason"] for n in notes)
