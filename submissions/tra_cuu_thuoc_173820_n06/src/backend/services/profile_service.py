"""Chọn các đơn thuốc của một hồ sơ để kiểm tra tương tác liên đơn (logic thuần, dễ kiểm thử)."""
from __future__ import annotations

import json
import os
from datetime import date, datetime


def default_window_days() -> int:
    try:
        return int(os.getenv("CROSS_CHECK_DAYS", "90"))
    except ValueError:
        return 90


def effective_date(record) -> date | None:
    """Ngày kê đơn nếu đọc được; không thì ngày quét."""
    prescribed = getattr(record, "prescription_date", None)
    if prescribed:
        try:
            return date.fromisoformat(str(prescribed)[:10])
        except ValueError:
            pass

    created = getattr(record, "created_at", None)
    if isinstance(created, datetime):
        return created.date()
    if isinstance(created, date):
        return created
    if isinstance(created, str):
        try:
            return date.fromisoformat(created[:10])
        except ValueError:
            return None
    return None


def is_structured_result(record) -> bool:
    try:
        data = json.loads(record.result_text or "")
    except (TypeError, ValueError):
        return False
    return isinstance(data, dict) and isinstance(data.get("ocr"), dict)


def select_for_cross_check(records, days: int | None = None, today: date | None = None):
    """(đơn được chọn theo thứ tự thời gian, danh sách đơn bị loại kèm lý do).

    Loại: không phải OCR đơn thuốc, xử lý lỗi, bản ghi cũ không có cấu trúc, quét trùng cùng một ảnh
    (giữ lần quét mới nhất), và đơn ngoài cửa sổ `days` ngày (days <= 0 nghĩa là không giới hạn).
    """
    days = default_window_days() if days is None else days
    today = today or date.today()
    excluded: list[dict] = []
    candidates = []

    for record in records:
        if record.operation_type != "prescription_ocr":
            reason = "not_prescription_ocr"
        elif record.status != "success":
            reason = "failed_scan"
        elif not is_structured_result(record):
            reason = "legacy_format"
        else:
            candidates.append(record)
            continue
        excluded.append({"history_id": record.id, "reason": reason})

    latest_by_hash: dict[str, object] = {}
    for record in candidates:
        digest = getattr(record, "image_sha256", None)
        if digest and (digest not in latest_by_hash or record.id > latest_by_hash[digest].id):
            latest_by_hash[digest] = record

    selected = []
    for record in candidates:
        digest = getattr(record, "image_sha256", None)
        if digest and latest_by_hash[digest].id != record.id:
            excluded.append({"history_id": record.id, "reason": "duplicate_image"})
            continue

        when = effective_date(record)
        if days > 0 and when is not None and (today - when).days > days:
            excluded.append({"history_id": record.id, "reason": "outside_window"})
            continue

        selected.append(record)

    selected.sort(key=lambda r: (effective_date(r) or date.min, r.id))
    return selected, excluded
