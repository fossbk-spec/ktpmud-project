"""Chống dò mật khẩu: giới hạn số lần đăng nhập thất bại trong một khung thời gian.

Dữ liệu lưu trong bộ nhớ của tiến trình (đủ cho 1 máy chủ; nếu chạy nhiều worker hãy chuyển sang Redis).
Ngưỡng chỉnh bằng biến môi trường LOGIN_MAX_FAILURES / LOGIN_WINDOW_SECONDS / IP_MAX_FAILURES.
"""
import math
import os
import threading
import time
from collections import defaultdict, deque
from typing import Callable, Deque, Dict


class FailureLimiter:
    """Cửa sổ trượt: quá max_failures lần thất bại trong window_seconds thì bị chặn
    cho tới khi lần thất bại cũ nhất hết hạn. Đăng nhập thành công thì xóa bộ đếm."""

    def __init__(self, max_failures: int, window_seconds: int, clock: Callable[[], float] = time.monotonic):
        self.max_failures = max_failures
        self.window = window_seconds
        self._clock = clock
        self._fails: Dict[str, Deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def _prune(self, key: str, now: float):
        q = self._fails.get(key)
        if q is None:
            return None
        while q and now - q[0] >= self.window:
            q.popleft()
        if not q:
            self._fails.pop(key, None)
            return None
        return q

    def retry_after(self, key: str) -> int:
        """Số giây còn phải chờ (0 = được phép thử)."""
        with self._lock:
            now = self._clock()
            q = self._prune(key, now)
            if q is None or len(q) < self.max_failures:
                return 0
            return max(1, math.ceil(self.window - (now - q[0])))

    def fail(self, key: str) -> None:
        with self._lock:
            now = self._clock()
            self._prune(key, now)
            self._fails[key].append(now)

    def reset(self, key: str) -> None:
        with self._lock:
            self._fails.pop(key, None)


LOGIN_MAX_FAILURES = int(os.getenv("LOGIN_MAX_FAILURES", "5"))
LOGIN_WINDOW_SECONDS = int(os.getenv("LOGIN_WINDOW_SECONDS", "600"))
IP_MAX_FAILURES = int(os.getenv("IP_MAX_FAILURES", "30"))

login_limiter = FailureLimiter(LOGIN_MAX_FAILURES, LOGIN_WINDOW_SECONDS)   # theo (địa chỉ IP + tên đăng nhập)
ip_limiter = FailureLimiter(IP_MAX_FAILURES, LOGIN_WINDOW_SECONDS)         # theo địa chỉ IP (chặn thử nhiều tài khoản)
