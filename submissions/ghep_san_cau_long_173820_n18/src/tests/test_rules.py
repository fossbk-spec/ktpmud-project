"""Kiểm thử các quy tắc nghiệp vụ trong rules.py (không cần FastAPI/SQLAlchemy).

Chạy:  python -m unittest tests.test_rules -v      hoặc      pytest -q
"""
import os
import sys
import unittest
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import rules  # noqa: E402


class TimeAndLevelTests(unittest.TestCase):
    def test_parse_date_time(self):
        self.assertEqual(rules.parse_date("2026-10-25").isoformat(), "2026-10-25")
        self.assertEqual(rules.parse_time("19:00").strftime("%H:%M"), "19:00")
        self.assertEqual(rules.parse_time("07:05:30").strftime("%H:%M:%S"), "07:05:30")
        for bad in ("25/10/2026", "2026-13-01", ""):
            with self.assertRaises(ValueError):
                rules.parse_date(bad)
        with self.assertRaises(ValueError):
            rules.parse_time("25:99")

    def test_strip_accents_for_search(self):
        self.assertEqual(rules.strip_accents("Đống Đa"), "dong da")
        self.assertIn("dong da", rules.strip_accents("Sân cầu lông Đống Đa"))

    def test_parse_level(self):
        self.assertEqual(rules.parse_level("3"), 3)
        self.assertEqual(rules.parse_level(5), 5)
        self.assertEqual(rules.parse_level("newbie"), 1)
        self.assertEqual(rules.parse_level("Trung bình - Yếu"), 2)
        self.assertEqual(rules.parse_level("trung binh"), 3)
        self.assertEqual(rules.parse_level("Giỏi"), 5)
        for bad in (None, "", "0", "6", "siêu sao"):
            self.assertIsNone(rules.parse_level(bad))

    def test_level_range_label(self):
        self.assertEqual(rules.level_range_label(1, 5), "Mọi trình độ")
        self.assertEqual(rules.level_range_label(3, 3), "Trung bình")
        self.assertEqual(rules.level_range_label(2, 4), "Từ Trung bình - Yếu đến Khá")


class AccountRulesTests(unittest.TestCase):
    def test_phone(self):
        self.assertEqual(rules.normalize_phone("+84 912.345.678"), "0912345678")
        self.assertEqual(rules.normalize_phone("84912345678"), "0912345678")
        self.assertTrue(rules.is_valid_phone("0912345678"))
        self.assertFalse(rules.is_valid_phone("912345678"))
        self.assertFalse(rules.is_valid_phone("09123456"))
        self.assertIsNone(rules.normalize_phone(""))

    def test_email_and_username(self):
        self.assertTrue(rules.is_valid_email("a@b.vn"))
        self.assertFalse(rules.is_valid_email("a@b"))
        self.assertTrue(rules.USERNAME_RE.match("namtran"))
        self.assertTrue(rules.USERNAME_RE.match("host_hung.01"))
        self.assertFalse(rules.USERNAME_RE.match("1abc"))
        self.assertFalse(rules.USERNAME_RE.match("ab"))
        self.assertFalse(rules.USERNAME_RE.match("có dấu"))

    def test_mask(self):
        self.assertEqual(rules.mask_identifier("phone", "0912345678"), "091****678")
        self.assertEqual(rules.mask_identifier("email", "nam@gmail.com"), "n***@gmail.com")

    def test_otp(self):
        code = rules.generate_otp()
        self.assertRegex(code, r"^\d{6}$")
        stored = rules.hash_otp("secret", "0912345678", code)
        self.assertNotIn(code, stored)                       # không lưu mã gốc
        self.assertTrue(rules.check_otp("secret", "0912345678", code, stored))
        self.assertTrue(rules.check_otp("secret", "0912345678", f" {code} ", stored))   # chịu được khoảng trắng
        wrong = "000000" if code != "000000" else "111111"
        self.assertFalse(rules.check_otp("secret", "0912345678", wrong, stored))
        self.assertFalse(rules.check_otp("khac", "0912345678", code, stored))
        self.assertFalse(rules.check_otp("secret", "0999999999", code, stored))


class ReputationTests(unittest.TestCase):
    def test_review_score(self):
        self.assertEqual(rules.review_score([5, 4, 4]), 4.33)
        self.assertEqual(rules.review_score([5, None, 3]), 4.0)
        self.assertEqual(rules.review_score([], False), 0.0)
        self.assertEqual(rules.review_score([5, 5], bung_keo=True), 1.0)   # bùng kèo luôn bị chấm 1 sao

    def test_labels(self):
        self.assertEqual(rules.reputation_label(0, 0, 0)[0], "new")
        self.assertEqual(rules.reputation_label(4.5, 2, 0)[0], "normal")        # chưa đủ 3 lượt
        self.assertEqual(rules.reputation_label(4.5, 3, 0), ("trusted", "Uy tín"))
        self.assertEqual(rules.reputation_label(3.5, 5, 0)[0], "normal")
        self.assertEqual(rules.reputation_label(2.5, 4, 0)[0], "low")
        code, text = rules.reputation_label(1.0, 2, 2)
        self.assertEqual(code, "warning")
        self.assertIn("bùng kèo", text)
        self.assertEqual(rules.reputation_label(4.8, 20, 1)[0], "trusted")        # 1/20 lần bùng: chưa bị cảnh báo
        self.assertEqual(rules.reputation_label(4.8, 4, 1)[0], "trusted")          # chưa đủ ngưỡng 2 lần
        self.assertEqual(rules.reputation_label(4.0, 8, 2)[0], "warning")          # 2/8 = 25%


class CourtRulesTests(unittest.TestCase):
    def setUp(self):
        self.start = datetime(2026, 10, 25, 19, 0)
        self.end = datetime(2026, 10, 25, 21, 0)

    def status(self, trang_thai="open", slots=3, now=None):
        return rules.court_display_status(trang_thai, slots, self.start, self.end, now or self.start - timedelta(days=1))

    def test_display_status(self):
        self.assertEqual(self.status(), "open")
        self.assertEqual(self.status(slots=0), "full")
        self.assertEqual(self.status("closed"), "full")                           # host chủ động đóng (FR-06)
        self.assertEqual(self.status("cancelled"), "cancelled")
        self.assertEqual(self.status(now=self.start + timedelta(minutes=10)), "ongoing")
        self.assertEqual(self.status(now=self.end + timedelta(minutes=1)), "finished")
        self.assertEqual(self.status("cancelled", now=self.end + timedelta(hours=1)), "cancelled")

    def test_edit_window_fr06(self):
        self.assertTrue(rules.can_edit(self.start, self.start - timedelta(hours=2)))              # đúng 2 tiếng: còn được sửa
        self.assertTrue(rules.can_edit(self.start, self.start - timedelta(days=1)))
        self.assertFalse(rules.can_edit(self.start, self.start - timedelta(hours=1, minutes=59)))
        self.assertFalse(rules.can_edit(self.start, self.start + timedelta(minutes=1)))

    def test_refund_policy(self):
        self.assertTrue(rules.refund_on_player_cancel("pending", self.start, self.start - timedelta(minutes=5)))
        self.assertTrue(rules.refund_on_player_cancel("approved", self.start, self.start - timedelta(hours=3)))
        self.assertFalse(rules.refund_on_player_cancel("approved", self.start, self.start - timedelta(minutes=30)))

    def test_now_vn_is_naive_and_utc7(self):
        now = rules.now_vn()
        self.assertIsNone(now.tzinfo)
        utc_now = datetime.utcnow()
        self.assertLess(abs((now - utc_now) - timedelta(hours=7)), timedelta(seconds=5))

    def test_catalogs(self):
        self.assertEqual(list(rules.TRINH_DO.values()), ["Newbie", "Trung bình - Yếu", "Trung bình", "Khá", "Giỏi"])
        self.assertIn("Đống Đa", rules.QUAN_HUYEN)
        self.assertEqual(rules.ACTIVE_BOOKING, ("pending", "approved"))


if __name__ == "__main__":
    unittest.main()
