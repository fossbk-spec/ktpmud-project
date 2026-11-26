"""Cấu hình chung cho pytest: dùng CSDL tạm, tắt dữ liệu demo và tác vụ định kỳ."""
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

_tmp = tempfile.mkdtemp(prefix="badminton-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["SEED_DEMO"] = "0"
os.environ["DISABLE_SCHEDULER"] = "1"
os.environ["OTP_DEV_MODE"] = "1"
os.environ["ADMIN_PASSWORD"] = "admin123"
os.environ["LOGIN_MAX_FAILURES"] = "5"
os.environ["IP_MAX_FAILURES"] = "1000"   # không để giới hạn theo IP làm nhiễu các bài test khác
