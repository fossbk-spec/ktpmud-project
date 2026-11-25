"""Khớp tên thuốc gần đúng (sai chính tả OCR). Dữ liệu thử nghiệm, không phải dữ liệu y khoa."""
import pytest

from services.medicine_postprocess import (
    DrugIndex,
    DrugRecord,
    correct_with_vocabulary,
    max_name_distance,
    ocr_distance,
)


def _index():
    return DrugIndex([
        DrugRecord(rid=0, brand="Mericine", actives=["Hoatchatx"], strengths={"500mg"}, form=None, reg_id=None),
        DrugRecord(rid=1, brand="Zentrovex", actives=["Hoatchaty"], strengths={"10mg"}, form=None, reg_id=None),
    ])


def test_distance_counts_ocr_confusions_as_half():
    assert ocr_distance("mericine", "mericine") == 0
    assert ocr_distance("mericin", "mericine") == 1.0          # thiếu một ký tự
    assert ocr_distance("mcricine", "mericine") == 0.5         # c/e nhầm kiểu OCR
    assert max_name_distance(4) == 0.0                         # tên quá ngắn: không khớp mờ


def test_lookup_suggests_close_name():
    lookup = _index().lookup("mericin")
    assert lookup.suggestions and lookup.suggestions[0][0] == "mericine"


def test_vocabulary_corrects_ocr_typo_and_reports_it():
    text, notes = correct_with_vocabulary("1. Mericin 500mg Viên 20", _index())
    assert "Mericine 500mg" in text
    assert notes and notes[0]["original"] == "Mericin"


def test_vocabulary_never_changes_digits_or_vietnamese_text():
    original = "1. Ngày uống 2 viên chia 2 lần sau ăn Mericine 500mg\nBệnh viện Bạch Mai"
    text, notes = correct_with_vocabulary(original, _index())
    assert text == original and notes == []


def test_vocabulary_ignores_lines_that_are_not_medicine_lines():
    text, notes = correct_with_vocabulary("Mericin la ten benh nhan", _index())
    assert notes == []


@pytest.fixture()
def db():
    pytest.importorskip("sqlalchemy")
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker

    engine = create_engine("sqlite://")
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE active_ingredients (id INTEGER PRIMARY KEY, name TEXT)"))
        conn.execute(text(
            "CREATE TABLE medicines (id INTEGER PRIMARY KEY, name TEXT, sdk_code TEXT, strength TEXT, "
            "dosage_form TEXT, manufacturer TEXT, indication TEXT, contraindication TEXT, side_effect TEXT, "
            "warning TEXT, active_ingredient_id INTEGER)"
        ))
        conn.execute(text(
            "CREATE TABLE medicine_ingredients (medicine_id INTEGER, active_ingredient_id INTEGER, review_status TEXT)"
        ))
        conn.execute(text("INSERT INTO active_ingredients VALUES (1,'Hoatchatx'),(2,'Hoatchaty')"))
        conn.execute(text(
            "INSERT INTO medicines (id,name,strength,active_ingredient_id) VALUES "
            "(1,'Mericine 500mg','500mg',1),(2,'Zentrovex 10mg','10mg',2)"
        ))
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


def test_misspelled_name_matches_when_ingredient_and_strength_agree(db):
    from services.medicine_matching_service import match_medicine

    result = match_medicine(db, {
        "prescription_name": "Mericin", "brand_name": None,
        "active_ingredient": "Hoatchatx", "strength": "500mg", "dosage_form": None,
    })
    assert result["match_status"] == "matched"
    assert result["matched_medicine"]["id"] == 1
    assert any("gần giống" in note for note in result["match_notes"])


def test_misspelled_name_without_strength_is_only_a_candidate(db):
    from services.medicine_matching_service import match_medicine

    result = match_medicine(db, {
        "prescription_name": "Mericin", "brand_name": None,
        "active_ingredient": None, "strength": None, "dosage_form": None,
    })
    assert result["match_status"] == "needs_review"
    assert result["candidates"] and result["candidates"][0]["medicine"]["id"] == 1


def test_conflicting_ingredient_blocks_fuzzy_match(db):
    from services.medicine_matching_service import match_medicine

    result = match_medicine(db, {
        "prescription_name": "Mericin", "brand_name": None,
        "active_ingredient": "Hoatchaty", "strength": "500mg", "dosage_form": None,
    })
    assert result["match_status"] != "matched"


def test_misspelled_ingredient_is_resolved(db):
    from services.medicine_matching_service import match_medicine

    result = match_medicine(db, {
        "prescription_name": "Mericine", "brand_name": None,
        "active_ingredient": "Hoatchatxx", "strength": "500mg", "dosage_form": None,
    })
    assert result["match_status"] == "matched"


def test_ingredient_resolved_without_choosing_a_product(db):
    from services.medicine_matching_service import match_medicine

    # Không có strength/hoạt chất trên đơn: không chọn được sản phẩm, nhưng hoạt chất vẫn xác định được.
    result = match_medicine(db, {
        "prescription_name": "Mericine", "brand_name": None,
        "active_ingredient": None, "strength": None, "dosage_form": None,
    })
    resolution = result["ingredient_resolution"]
    assert resolution["status"] == "resolved"
    assert [i["name"] for i in resolution["ingredients"]] == ["Hoatchatx"]
    assert resolution["ingredients"][0]["confidence"] == "verified"


def test_misspelled_name_resolves_with_near_confidence(db):
    from services.medicine_matching_service import match_medicine

    result = match_medicine(db, {
        "prescription_name": "Mericin", "brand_name": None,
        "active_ingredient": None, "strength": None, "dosage_form": None,
    })
    ingredient = result["ingredient_resolution"]["ingredients"][0]
    assert ingredient["confidence"] == "near" and ingredient["name"] == "Hoatchatx"


def test_unknown_name_is_unresolved_not_guessed(db):
    from services.medicine_matching_service import match_medicine

    result = match_medicine(db, {
        "prescription_name": "Qwertyuiop", "brand_name": None,
        "active_ingredient": None, "strength": "500mg", "dosage_form": "Viên",
    })
    assert result["ingredient_resolution"]["status"] == "unresolved"
    assert result["candidates"] == []        # cùng hàm lượng/dạng bào chế không đủ làm ứng viên


def test_printed_generic_name_beats_conflicting_product_links(db):
    from sqlalchemy import text  # noqa: F401  (chạy bằng SQLAlchemy thật; bản giả trả text nguyên văn)
    from services.medicine_matching_service import match_medicine

    # Hai sản phẩm cùng tên "Alphavex" nhưng liên kết hoạt chất khác nhau: dữ liệu mâu thuẫn, không được tin.
    db.execute(text("INSERT INTO medicines (id,name,strength,active_ingredient_id) VALUES (10,'Alphavex 100mg','100mg',1)"))
    db.execute(text("INSERT INTO medicines (id,name,strength,active_ingredient_id) VALUES (11,'Alphavex 250mg','250mg',2)"))

    only_brand = match_medicine(db, {
        "prescription_name": "Alphavex", "brand_name": None, "active_ingredient": None,
        "strength": None, "dosage_form": None,
    })
    assert only_brand["ingredient_resolution"]["status"] == "unresolved"       # không đoán khi dữ liệu xung đột

    with_generic = match_medicine(db, {
        "prescription_name": "Hoatchatx", "brand_name": "Alphavex", "active_ingredient": "Hoatchatx",
        "strength": "100mg", "dosage_form": None,
    })
    ingredient = with_generic["ingredient_resolution"]["ingredients"][0]
    assert ingredient["name"] == "Hoatchatx" and ingredient["confidence"] == "verified"   # tên in trên đơn được ưu tiên
