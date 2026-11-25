"""Kiểm thử logic tương tác trên SQLite in-memory (dữ liệu thử nghiệm, KHÔNG phải dữ liệu y khoa)."""
import pytest

pytest.importorskip("sqlalchemy")
from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from services.drug_interaction_service import (  # noqa: E402
    analyze_drug_interactions,
    normalize_ingredient,
)


@pytest.fixture()
def db():
    engine = create_engine("sqlite://")
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE active_ingredients (id INTEGER PRIMARY KEY, name TEXT)"))
        conn.execute(text("CREATE TABLE medicines (id INTEGER PRIMARY KEY, name TEXT, active_ingredient_id INTEGER)"))
        conn.execute(text(
            "CREATE TABLE drug_interactions (id INTEGER PRIMARY KEY, ingredient_a TEXT, ingredient_b TEXT, "
            "severity TEXT, description TEXT, recommendation TEXT, source TEXT)"
        ))
        conn.execute(text("INSERT INTO active_ingredients VALUES (1,'Hoat chat X'),(2,'Hoạt chất Y'),(3,'Hoat chat Z')"))
        conn.execute(text(
            "INSERT INTO medicines VALUES (1,'Thuoc X1',1),(2,'Thuoc X2',1),(3,'Thuoc Y',2),(4,'Thuoc Z',3)"
        ))
        # Cặp thử nghiệm, lưu tên có dấu để kiểm tra chuẩn hóa không dấu
        conn.execute(text(
            "INSERT INTO drug_interactions (ingredient_a, ingredient_b, severity, description, recommendation, source) "
            "VALUES ('Hoạt chất X','hoat chat y','contraindicated','mo ta thu nghiem','khuyen nghi thu nghiem','test')"
        ))
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


def test_normalize_removes_diacritics():
    assert normalize_ingredient("Acid Mêfenamic") == normalize_ingredient("acid  mefenamic")


def test_interaction_found_despite_diacritics(db):
    result = analyze_drug_interactions(db, medicine_ids=[1, 3])
    assert len(result["interactions"]) == 1
    assert result["interactions"][0]["status"] == "interaction_found"


def test_pair_without_record_is_not_reported_safe(db):
    result = analyze_drug_interactions(db, medicine_ids=[1, 4])
    assert result["interactions"] == []
    assert result["status"] == "no_records_found"
    assert "không thể kết luận" in result["message"]


def test_duplicate_ingredient_detected(db):
    result = analyze_drug_interactions(db, medicine_ids=[1, 2, 4])
    names = [d["ingredient"] for d in result["duplicate_ingredients"]]
    assert names == ["Hoat chat X"]


def test_duplicate_respects_allowed_pairs(db):
    # Chỉ cho phép cặp (1,4): thuốc 1 và 2 không bị coi là trùng chéo đơn.
    result = analyze_drug_interactions(db, medicine_ids=[1, 2, 4], allowed_medicine_pairs={(1, 4)})
    assert result["duplicate_ingredients"] == []


def test_resolved_ingredient_without_product_still_gets_analyzed(db):
    # Thuốc trên đơn chưa chọn được sản phẩm (match_status != matched) nhưng đã biết hoạt chất.
    items = [
        {"match_status": "needs_review", "prescription_medicine": {"prescription_name": "A"},
         "ingredient_resolution": {"status": "resolved", "ingredients": [
             {"name": "Hoat chat X", "source": "name_is_ingredient", "confidence": "verified"}]}},
        {"match_status": "needs_review", "prescription_medicine": {"prescription_name": "B"},
         "ingredient_resolution": {"status": "resolved", "ingredients": [
             {"name": "Hoạt chất Y", "source": "product_near_name", "confidence": "near"}]}},
    ]
    result = analyze_drug_interactions(db, matched_medicines=items)
    assert len(result["interactions"]) == 1
    assert result["interactions"][0]["needs_confirmation"] is True   # vì hoạt chất Y chỉ ở mức "near"
    assert all(m["product_resolved"] is False for m in result["medicines"])


def test_unresolved_medicines_are_reported_as_not_analyzed(db):
    items = [
        {"match_status": "needs_review", "prescription_medicine": {"prescription_name": "A"},
         "ingredient_resolution": {"status": "resolved", "ingredients": [
             {"name": "Hoat chat X", "source": "name_is_ingredient", "confidence": "verified"}]}},
        {"match_status": "needs_review", "prescription_medicine": {"prescription_name": "Khong ro"},
         "ingredient_resolution": {"status": "unresolved", "ingredients": [], "notes": []}},
    ]
    result = analyze_drug_interactions(db, matched_medicines=items)
    assert [m["medicine_name"] for m in result["not_analyzed_medicines"]] == ["Khong ro"]
    assert "Khong ro" in result["message"]
