"""Chọn đơn của hồ sơ để so sánh tương tác liên đơn (logic thuần, không cần DB)."""
import json
from datetime import date, datetime

from services.profile_service import effective_date, select_for_cross_check


class Rec:
    def __init__(self, id, prescription_date=None, created_at=None, sha=None,
                 structured=True, status="success", operation_type="prescription_ocr"):
        self.id, self.prescription_date, self.image_sha256 = id, prescription_date, sha
        self.created_at = created_at or datetime(2026, 11, 19, 9, 0)
        self.status, self.operation_type = status, operation_type
        self.result_text = json.dumps({"ocr": {"medicines": []}}) if structured else "văn bản tự do"


TODAY = date(2026, 11, 19)


def ids(records):
    return [r.id for r in records]


def test_prescription_date_beats_scan_date():
    assert effective_date(Rec(1, prescription_date="2026-06-21")) == date(2026, 6, 21)
    assert effective_date(Rec(2)) == date(2026, 11, 19)


def test_old_prescriptions_fall_outside_the_window():
    old, new = Rec(1, prescription_date="2026-06-01"), Rec(2, prescription_date="2026-11-01")
    selected, excluded = select_for_cross_check([old, new], days=90, today=TODAY)
    assert ids(selected) == [2] and excluded == [{"history_id": 1, "reason": "outside_window"}]


def test_days_zero_means_no_limit():
    selected, _ = select_for_cross_check([Rec(1, prescription_date="2020-01-01")], days=0, today=TODAY)
    assert ids(selected) == [1]


def test_rescanning_the_same_image_keeps_only_the_latest_scan():
    selected, excluded = select_for_cross_check([Rec(1, sha="x"), Rec(2, sha="x"), Rec(3, sha="y")], days=0, today=TODAY)
    assert ids(selected) == [2, 3] and {"history_id": 1, "reason": "duplicate_image"} in excluded


def test_invalid_records_are_excluded_with_a_reason():
    records = [Rec(1, structured=False), Rec(2, status="failed"), Rec(3, operation_type="medicine_image"), Rec(4)]
    selected, excluded = select_for_cross_check(records, days=0, today=TODAY)
    assert ids(selected) == [4]
    assert {e["history_id"]: e["reason"] for e in excluded} == {1: "legacy_format", 2: "failed_scan", 3: "not_prescription_ocr"}


def test_selected_prescriptions_are_ordered_by_date():
    a, b = Rec(1, prescription_date="2026-11-10"), Rec(2, prescription_date="2026-10-20")
    assert ids(select_for_cross_check([a, b], days=0, today=TODAY)[0]) == [2, 1]
