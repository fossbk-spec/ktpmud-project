"""Đơn kiểu Bạch Mai (tên thuốc "Hoạt chất (Biệt dược hàm lượng)", cách dùng dạng câu).
Văn bản và tọa độ là dữ liệu mô phỏng, không chứa thông tin bệnh nhân."""
import random

from services.layout_service import rows_from_items
from services.medicine_postprocess import parse_usage
from services.table_parser import extract_prescription_date, parse_name_text, parse_table_prescription

OCR = """II.THÔNG TIN ĐƠN THUỐC
1. Etoricoxib(Roticox 90mg film-coated tablets)\t30\tViên
Ngày uống 1 viên buổi sáng, sau ăn
2. Glucosamin (dưới dạng Crystalline Glucosamine sulfate sodium chloride 1884\t30\tGói
mg)(Viartril- S 1500mg)
Ngày uống 1 gói buői tői, sau ăn
3. Mecobalamin (methylcobalamin)(Methylcobalamin Capsules 1500mcg)\t60\tViên
Ngày uống 2 viên chia 2 lần, sáng 1 viên, trưa 1 viên, sau ăn
4. Pregabalin(Lyrica 75mg)\t30\tViên
Ngày uống 1 viên bui ti, có th chóng mǎt khi mói dung
5. Lansoprazole 30mg(Scolanzo 30mg)\t30\tViên
Ngày uống 1 viên buổi sáng, trước ăn
Lời dặn của bác sĩ: đeo đai thắt lưng
Ngày 21 tháng 06 năm 2025
BỆNH NHÂN\tNGƯỜI GIAO\tKHOA DƯỢC\tBÁC SĨ KHÁM BỆNH
Ghi chú:
- Dùng thuốc theo đơn và đúng hướng dẫn."""


def _meds(text=OCR):
    result = parse_table_prescription(text)
    assert result.confident and len(result.medicines) == 5
    return result.medicines


def test_names_strengths_quantities_and_footer_cutoff():
    etoricoxib, glucosamin, mecobalamin, pregabalin, lansoprazole = _meds()
    assert (etoricoxib["prescription_name"], etoricoxib["brand_name"], etoricoxib["strength"]) == ("Etoricoxib", "Roticox", "90mg")
    assert (glucosamin["brand_name"], glucosamin["strength"], glucosamin["quantity_unit"]) == ("Viartril-S", "1500mg", "gói")
    assert glucosamin["active_ingredient"] == "Glucosamin"       # "dưới dạng ... 1884 mg" không phải hàm lượng sản phẩm
    assert mecobalamin["name_alternatives"] == ["methylcobalamin"] and mecobalamin["brand_name"] is None
    assert (mecobalamin["strength"], mecobalamin["quantity"]) == ("1500mcg", "60")
    assert (lansoprazole["strength"], lansoprazole["brand_name"]) == ("30mg", "Scolanzo")
    assert "Lời dặn" not in (lansoprazole["usage"] or "")


def test_survives_missing_numbering():
    text = OCR.replace("2. Glucosamin", "Glucosamin").replace("4. Pregabalin", "Pregabalin")
    assert [m["quantity"] for m in _meds(text)] == ["30", "30", "60", "30", "30"]


def test_quantity_displaced_onto_the_previous_usage_line_is_recovered():
    text = OCR.replace(
        "3. Mecobalamin (methylcobalamin)(Methylcobalamin Capsules 1500mcg)\t60\tViên",
        "3. Mecobalamin (methylcobalamin)(Methylcobalamin Capsules 1500mcg)",
    ).replace("Ngày uống 1 gói buői tői, sau ăn", "Ngày uống 1 gói buői tői, sau ăn\t60\tViên")
    mecobalamin = _meds(text)[2]
    assert mecobalamin["quantity"] == "60" and mecobalamin["quantity_inferred"] is True


def test_prescription_date():
    assert extract_prescription_date(OCR) == "2025-06-21"
    assert extract_prescription_date("Toa cấp ngày 02 tháng 02 năm 201") is None


def test_usage_keeps_meal_split_and_survives_lost_diacritics():
    assert parse_usage("Ngày uống 1 gói buői tői, sau ăn").text == "1 gói buổi tối, sau ăn"
    assert parse_usage("Ngày uống 2 viên chia 2 lần, sáng 1 viên, trưa 1 viên, sau ăn").text.endswith("sau ăn")
    partial = parse_usage("Ngày uống 1 viên buổi tối, có thể chóng mặt khi mới dùng")
    assert partial.text == "1 viên buổi tối" and "mới dùng" in partial.data["leftover"]   # không đổi "mới" thành "mỗi"


def test_name_text_with_unbalanced_parentheses_does_not_crash():
    parsed = parse_name_text("Glucosamin (dưới dạng Glucosamine sulfate 1884 mg)(Viartril- S 1500mg")
    assert parsed["brand_name"] == "Viartril-S" and parsed["strength"] == "1500mg"


def _items(seed, jitter):
    rnd, h = random.Random(seed), 16
    box = lambda x, y, w: [x, y - h / 2, x + w, y + h / 2]  # noqa: E731
    rows = [("1. Etoricoxib(Roticox 90mg)", 314, "30", "Viên"), ("Ngày uống 1 viên buổi sáng", 338, None, None),
            ("2. Glucosamin (Viartril-S 1500mg)", 355, "30", "Gói"), ("Ngày uống 1 gói buổi tối", 392, None, None),
            ("3. Mecobalamin (Methylcobalamin 1500mcg)", 407, "60", "Viên"), ("Ngày uống 2 viên chia 2 lần", 430, None, None),
            ("4. Pregabalin(Lyrica 75mg)", 456, "30", "Viên"), ("Ngày uống 1 viên buổi tối", 479, None, None)]
    items = [("II.THÔNG TIN ĐƠN THUỐC", 0.9, box(80, 290, 250))]
    for text, y, qty, unit in rows:
        items.append((text, 0.9, box(88, y, 420)))
        if qty:
            dy = rnd.uniform(-jitter, jitter)  # cột phải lệch so với cột trái (ảnh chụp nghiêng/cong)
            items += [(qty, 0.9, box(540, y + dy, 24)), (unit, 0.9, box(600, y + dy + rnd.uniform(-2, 2), 40))]
    rnd.shuffle(items)
    return items


def test_quantity_column_is_snapped_to_the_right_drug_even_when_skewed():
    expected = [("1. Etoricoxib", "30\tViên"), ("2. Glucosamin", "30\tGói"), ("3. Mecobalamin", "60\tViên"), ("4. Pregabalin", "30\tViên")]
    good = 0
    for seed in range(60):
        rows = rows_from_items(_items(seed, 12))
        good += all(any(r.startswith(p) and s in r for r in rows) for p, s in expected)
    assert good >= 57   # mô phỏng lệch ±12px: sai tối đa vài trường hợp biên
