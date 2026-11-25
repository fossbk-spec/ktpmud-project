"""Hồi quy cho đơn thuốc dạng bảng (mô phỏng ảnh chụp nghiêng, KHÔNG chứa thông tin bệnh nhân)
và việc nhận diện hoạt chất không phụ thuộc chọn sản phẩm."""
import json
import random

from services import prescription_parser as pp
from services.layout_service import rows_from_items
from services.medicine_postprocess import parse_schedule, parse_usage
from services.table_parser import find_strength, parse_table_prescription

SLOPE = -0.021  # ảnh nghiêng ~1.2 độ: bên phải cao hơn bên trái


def _box(x, y, w, h=22):
    y = y + SLOPE * x
    return [x, y - h / 2, x + w, y + h / 2]


def _sample_items(quantities=("30 viên", "30", "30 viên", "40")):
    names = ["1 . Colchicin 1mg", "2 . Meloxicam 7.5 mg", "3 . Bostacet 325 +37.5", "4 . Gastroprazol 20 mg"]
    items, y = [("TOA THUỐC", 0.9, _box(300, 150, 200)), ("Họ và tên:", 0.9, _box(30, 224, 100))], 412
    for name, qty in zip(names, quantities):
        items += [
            (name, 0.9, _box(40, y, 250)), (qty, 0.9, _box(636, y, 80)),
            ("Sáng: 1", 0.9, _box(50, y + 26, 80)), ("Chiu: 1", 0.9, _box(338, y + 28, 95)),
            ("Tôi: 0", 0.9, _box(615, y + 26, 70)), ("Ghi chú:", 0.9, _box(50, y + 54, 100)),
        ]
        y += 82
    random.Random(3).shuffle(items)  # OCR thật hay đọc cột phải trước/sau tên thuốc
    return items


def test_layout_puts_quantity_on_the_same_row_as_the_drug_name():
    rows = rows_from_items(_sample_items())
    assert "1 . Colchicin 1mg\t30 viên" in rows
    assert "4 . Gastroprazol 20 mg\t40" in rows


def test_layout_returns_none_without_coordinates():
    assert rows_from_items([("a", 0.9, None), ("b", 0.9, None)]) is None


def test_table_parser_reads_each_row_verbatim():
    text = "\n".join(rows_from_items(_sample_items()))
    result = parse_table_prescription(text)
    assert result.confident and result.header_count == 4
    colchicin, meloxicam, bostacet, gastro = result.medicines
    assert (colchicin["prescription_name"], colchicin["strength"], colchicin["quantity"]) == ("Colchicin", "1mg", "30")
    assert meloxicam["dosage_form"] is None            # đơn không ghi "viên" -> không tự điền
    assert bostacet["strength"] is None and bostacet["strength_raw"] == "325 +37.5"  # không bịa "mg"
    assert gastro["quantity"] == "40"                   # số lượng theo ĐÚNG hàng của từng thuốc
    assert all(m["usage"] == "Sáng 1, Chiều 1" for m in result.medicines)


def test_other_layouts_fall_back_to_qwen():
    old = "1. Paracetamol 500mg\nViên 20\nNgày uống 2 viên chia 2 lần"
    assert parse_table_prescription(old).confident is False


def test_schedule_tolerates_ocr_diacritic_loss_and_order():
    assert parse_schedule("Tôi: 0\nChiu: 1\nSáng: 1") == {"Tối": "0", "Chiều": "1", "Sáng": "1"}
    assert parse_usage("Tối: 0\nChiu: 1\nSáng: 1").text == "Sáng 1, Chiều 1"


def test_strength_helpers():
    assert find_strength("Meloxicam 7.5 mg")[:2] == ("7.5mg", "7.5 mg")
    assert find_strength("Omega 3")[0] is None            # số thuần không phải hàm lượng
    assert find_strength("Vitamin B6")[2] is None


def test_full_parse_does_not_call_qwen_and_keeps_printed_name(monkeypatch):
    calls = []
    monkeypatch.setattr(pp, "_ollama_chat", lambda prompt, timeout=180: calls.append(1) or "{}")
    result = pp.parse_prescription_text("\n".join(rows_from_items(_sample_items())))
    assert calls == []                                    # đọc bằng luật, không cần Qwen
    assert result["medicines"][3]["prescription_name"] == "Gastroprazol"   # không bị ghi đè
    assert not any("TOA THUỐC" in w or "Họ và tên" in w for w in result["warnings"])
