"""Kiểm thử việc chuyển dữ liệu từ badminton.db phiên bản cũ (chỉ dùng sqlite3, không cần SQLAlchemy)."""
import os
import sqlite3
import sys
import tempfile
import unittest
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import legacy_migration as lm  # noqa: E402

OLD_SCHEMA = """
CREATE TABLE users (id INTEGER NOT NULL, username VARCHAR, password VARCHAR, role VARCHAR, PRIMARY KEY (id));
CREATE TABLE courts (id INTEGER NOT NULL, ten_san VARCHAR, khu_vuc VARCHAR, gia_thue FLOAT, slot_trong INTEGER,
                     vi_do FLOAT, kinh_do FLOAT, trinh_do VARCHAR, PRIMARY KEY (id));
CREATE TABLE bookings (id INTEGER NOT NULL, user_id INTEGER, court_id INTEGER, so_luong INTEGER, PRIMARY KEY (id));
"""


def make_legacy_db(path):
    con = sqlite3.connect(path)
    con.executescript(OLD_SCHEMA)
    con.execute("INSERT INTO users VALUES (1, 'namtran', '$2b$12$abcdefghijklmnopqrstuv', 'user')")
    con.execute("INSERT INTO users VALUES (2, 'lan', '$2b$12$zzzzzzzzzzzzzzzzzzzzzz', 'user')")
    con.execute("INSERT INTO courts VALUES (1, 'Sân Bách Khoa', 'Hai Bà Trưng', 40000, 3, NULL, NULL, 'Mọi trình độ')")
    con.execute("INSERT INTO courts VALUES (2, 'Sân B', 'Đống Đa', 55000, 2, 21.01, 105.82, 'Khá/Giỏi')")
    con.execute("INSERT INTO bookings VALUES (1, 2, 1, 1)")
    con.execute("INSERT INTO bookings VALUES (2, 2, 1, 2)")
    con.execute("INSERT INTO bookings VALUES (3, 99, 1, 1)")   # người dùng không tồn tại -> bị bỏ qua
    con.commit()
    con.close()


class LegacyMigrationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.path = os.path.join(self.tmp, "badminton.db")

    def test_detects_legacy_and_backs_up(self):
        make_legacy_db(self.path)
        self.assertTrue(lm.is_legacy_db(self.path))
        backup = lm.backup_legacy_db(self.path)
        self.assertIsNotNone(backup)
        self.assertTrue(os.path.exists(backup))
        self.assertFalse(os.path.exists(self.path))          # file cũ đã được đổi tên, không bị xóa
        self.assertIn(".legacy-", backup)

    def test_new_schema_or_missing_file_is_not_legacy(self):
        self.assertFalse(lm.is_legacy_db(self.path))          # chưa có file
        con = sqlite3.connect(self.path)
        con.execute("CREATE TABLE courts (id INTEGER, host_id INTEGER)")
        con.commit()
        con.close()
        self.assertFalse(lm.is_legacy_db(self.path))          # đã có host_id = cấu trúc mới
        self.assertIsNone(lm.backup_legacy_db(self.path))
        self.assertTrue(os.path.exists(self.path))

    def test_convert_maps_fields(self):
        make_legacy_db(self.path)
        data = lm.convert(lm.read_legacy(self.path), today=date(2026, 10, 22))
        users = {u["username"]: u for u in data["users"]}
        self.assertEqual(users["namtran"]["role"], "host")            # tài khoản đầu tiên thành chủ nhóm đã xác thực
        self.assertTrue(users["namtran"]["host_verified"])
        self.assertEqual(users["lan"]["role"], "player")
        self.assertTrue(all(u["is_verified"] for u in data["users"]))
        self.assertEqual(users["namtran"]["password"], "$2b$12$abcdefghijklmnopqrstuv")   # giữ nguyên mật khẩu đã băm

        c1, c2 = data["courts"]
        self.assertEqual((c1["trinh_min"], c1["trinh_max"]), (1, 5))
        self.assertEqual((c2["trinh_min"], c2["trinh_max"]), (4, 5))
        self.assertEqual(c1["host_id"], 1)
        self.assertEqual(c1["slot_trong"], 3)
        self.assertEqual(c1["tong_slot"], 3 + 1 + 2)                  # slot còn lại + các booking hợp lệ (1 + 2)
        self.assertEqual(c2["tong_slot"], 2)
        self.assertGreater(c1["ngay_choi"], date(2026, 10, 22))        # ngày giờ đặt tạm ở tương lai
        self.assertEqual(c2["vi_do"], 21.01)

        self.assertEqual(len(data["bookings"]), 2)                     # booking của user 99 bị loại
        self.assertTrue(all(b["trang_thai"] == "approved" for b in data["bookings"]))

    def test_owner_booking_on_own_court_is_dropped_and_slot_freed(self):
        con = sqlite3.connect(self.path)
        con.executescript(OLD_SCHEMA)
        con.execute("INSERT INTO users VALUES (1, 'namtran', 'hash', 'user')")
        con.execute("INSERT INTO courts VALUES (1, 'Sân Bách Khoa', 'Hai Bà Trưng', 40000, 3, NULL, NULL, 'Mọi trình độ')")
        con.execute("INSERT INTO bookings VALUES (1, 1, 1, 1)")   # chính chủ kèo tự đặt
        con.commit()
        con.close()
        data = lm.convert(lm.read_legacy(self.path), today=date(2026, 10, 22))
        self.assertEqual(data["bookings"], [])
        self.assertEqual(data["courts"][0]["slot_trong"], 4)      # slot được trả lại
        self.assertEqual(data["courts"][0]["tong_slot"], 4)

    def test_convert_empty(self):
        data = lm.convert({"users": [], "courts": [], "bookings": []})
        self.assertEqual(data, {"users": [], "courts": [], "bookings": []})


if __name__ == "__main__":
    unittest.main()
