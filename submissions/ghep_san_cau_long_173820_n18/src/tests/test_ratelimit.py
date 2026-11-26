"""Kiểm thử bộ giới hạn đăng nhập thất bại (không cần FastAPI/SQLAlchemy)."""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ratelimit import FailureLimiter  # noqa: E402


class FakeClock:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


class FailureLimiterTests(unittest.TestCase):
    def setUp(self):
        self.clock = FakeClock()
        self.lim = FailureLimiter(3, 60, clock=self.clock)

    def test_blocks_only_after_threshold(self):
        for _ in range(2):
            self.lim.fail("a")
            self.assertEqual(self.lim.retry_after("a"), 0)
        self.lim.fail("a")
        self.assertEqual(self.lim.retry_after("a"), 60)

    def test_countdown_and_unblock(self):
        for _ in range(3):
            self.lim.fail("a")
        self.clock.t += 20
        self.assertEqual(self.lim.retry_after("a"), 40)
        self.clock.t += 40
        self.assertEqual(self.lim.retry_after("a"), 0)

    def test_keys_are_independent(self):
        for _ in range(3):
            self.lim.fail("a")
        self.assertGreater(self.lim.retry_after("a"), 0)
        self.assertEqual(self.lim.retry_after("b"), 0)

    def test_success_resets(self):
        for _ in range(3):
            self.lim.fail("a")
        self.lim.reset("a")
        self.assertEqual(self.lim.retry_after("a"), 0)

    def test_sliding_window_forgets_old_failures(self):
        self.lim.fail("a")
        self.lim.fail("a")
        self.clock.t += 61
        self.lim.fail("a")                       # 2 lần cũ đã hết hạn, chỉ còn 1 lần
        self.assertEqual(self.lim.retry_after("a"), 0)

    def test_blocked_attempts_do_not_extend_lock(self):
        for _ in range(3):
            self.lim.fail("a")
        self.clock.t += 30
        for _ in range(10):                      # nếu bên gọi không gọi fail() khi đang bị chặn thì thời gian chờ không tăng
            self.assertEqual(self.lim.retry_after("a"), 30)


if __name__ == "__main__":
    unittest.main()
