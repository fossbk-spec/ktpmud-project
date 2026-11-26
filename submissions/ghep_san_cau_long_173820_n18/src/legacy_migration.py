"""Chuyển dữ liệu từ file badminton.db phiên bản cũ (users / courts / bookings 3 bảng đơn giản)
sang cấu trúc mới theo báo cáo. File cũ KHÔNG bị xóa: nó được đổi tên thành
badminton.db.legacy-<thời gian>.bak để bạn luôn có bản sao lưu.

Phần đọc/chuyển đổi chỉ dùng sqlite3 + Python thuần nên kiểm thử được độc lập.
"""
import os
import shutil
import sqlite3
from datetime import date, datetime, time, timedelta
from typing import Dict, List, Optional

from rules import now_vn

# trinh_do kiểu chuỗi của bản cũ -> khoảng trình độ (min, max) của bản mới
LEGACY_LEVELS = {
    "mọi trình độ": (1, 5),
    "mới chơi": (1, 2),
    "trung bình": (2, 3),
    "khá/giỏi": (4, 5),
    "khá": (4, 5),
    "giỏi": (4, 5),
}
LEGACY_ROLE_MAP = {"user": "player", "player": "player", "admin": "admin",
                   "owner": "host", "host": "host", "chu_san": "host"}


def is_legacy_db(path: str) -> bool:
    """File DB cũ = có bảng courts nhưng chưa có cột host_id."""
    if not path or not os.path.exists(path) or os.path.getsize(path) == 0:
        return False
    con = sqlite3.connect(path)
    try:
        cols = [r[1] for r in con.execute("PRAGMA table_info(courts)")]
    finally:
        con.close()
    return bool(cols) and "host_id" not in cols


def backup_legacy_db(path: str) -> Optional[str]:
    """Nếu là DB cũ: đổi tên thành file sao lưu và trả về đường dẫn sao lưu."""
    if not is_legacy_db(path):
        return None
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = f"{path}.legacy-{stamp}.bak"
    shutil.move(path, backup)
    return backup


def read_legacy(backup_path: str) -> Dict[str, List[dict]]:
    con = sqlite3.connect(backup_path)
    con.row_factory = sqlite3.Row
    try:
        users = [dict(r) for r in con.execute("SELECT id, username, password, role FROM users ORDER BY id")]
        courts = [dict(r) for r in con.execute(
            "SELECT id, ten_san, khu_vuc, gia_thue, slot_trong, vi_do, kinh_do, trinh_do FROM courts ORDER BY id")]
        bookings = [dict(r) for r in con.execute(
            "SELECT id, user_id, court_id, so_luong FROM bookings ORDER BY id")]
    finally:
        con.close()
    return {"users": users, "courts": courts, "bookings": bookings}


def convert(legacy: Dict[str, List[dict]], today: Optional[date] = None) -> Dict[str, List[dict]]:
    """Ánh xạ dữ liệu cũ sang các trường của mô hình mới (hàm thuần, không đụng DB)."""
    today = today or now_vn().date()
    users = []
    for u in legacy["users"]:
        role = LEGACY_ROLE_MAP.get((u.get("role") or "user").lower(), "player")
        users.append({
            "id": u["id"], "username": u["username"], "password": u["password"], "role": role,
            "ho_ten": u["username"], "is_verified": True, "host_verified": role == "host",
        })

    courts, bookings = [], []
    if legacy["courts"] and users:
        # Bản cũ chưa có khái niệm chủ sân: gán các kèo cũ cho tài khoản đầu tiên
        # (và nâng tài khoản đó thành Chủ nhóm đã xác thực để vẫn quản lý được kèo của mình).
        owner = next((u for u in users if u["role"] == "host"), users[0])
        if owner["role"] == "player":
            owner["role"] = "host"
        owner["host_verified"] = True

        taken_by_court: Dict[int, int] = {}
        freed_by_court: Dict[int, int] = {}
        user_ids = {u["id"] for u in users}
        court_ids = {c["id"] for c in legacy["courts"]}
        for b in legacy["bookings"]:
            if b["user_id"] in user_ids and b["court_id"] in court_ids:
                n = int(b["so_luong"] or 1)
                if b["user_id"] == owner["id"]:
                    # Chủ kèo không tự xin tham gia kèo của mình: bỏ booking này và trả lại slot
                    freed_by_court[b["court_id"]] = freed_by_court.get(b["court_id"], 0) + n
                    continue
                taken_by_court[b["court_id"]] = taken_by_court.get(b["court_id"], 0) + n
                bookings.append({"id": b["id"], "user_id": b["user_id"], "court_id": b["court_id"],
                                 "so_luong": n, "trang_thai": "approved"})

        for i, c in enumerate(legacy["courts"]):
            lo, hi = LEGACY_LEVELS.get((c.get("trinh_do") or "mọi trình độ").strip().lower(), (1, 5))
            slot_trong = int(c["slot_trong"] if c["slot_trong"] is not None else 4) + freed_by_court.get(c["id"], 0)
            area = c.get("khu_vuc") or "Khác"
            courts.append({
                "id": c["id"], "host_id": owner["id"], "ten_san": c["ten_san"] or "Sân cầu lông",
                "dia_chi": area, "khu_vuc": area,
                "vi_do": c.get("vi_do"), "kinh_do": c.get("kinh_do"),
                "ngay_choi": today + timedelta(days=1 + i % 7),   # bản cũ chưa có ngày giờ -> đặt tạm
                "gio_bat_dau": time(19, 0), "gio_ket_thuc": time(21, 0),
                "trinh_min": lo, "trinh_max": hi,
                "gia_thue": float(c["gia_thue"] or 0), "tien_coc": 0.0,
                "tong_slot": slot_trong + taken_by_court.get(c["id"], 0), "slot_trong": slot_trong,
                "ghi_chu": "Dữ liệu chuyển từ hệ thống cũ - chủ nhóm hãy cập nhật lại ngày giờ.",
                "trang_thai": "open",
            })
    return {"users": users, "courts": courts, "bookings": bookings}


def import_into_db(db, data: Dict[str, List[dict]]) -> None:
    """Ghi dữ liệu đã chuyển đổi vào DB mới (giữ nguyên id và mật khẩu đã băm)."""
    import models

    for u in data["users"]:
        db.add(models.User(**u))
    db.flush()
    for c in data["courts"]:
        db.add(models.Court(**c))
    db.flush()
    for b in data["bookings"]:
        db.add(models.Booking(**b))
    db.commit()
