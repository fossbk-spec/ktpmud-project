"""Quy tắc nghiệp vụ thuần Python (không phụ thuộc FastAPI/SQLAlchemy).

Mọi hằng số và hàm "luật chơi" của hệ thống nằm ở đây để dễ đọc, dễ chỉnh và dễ kiểm thử.
Các điều khoản trong báo cáo (FR-xx, NFR-xx, UC-xx) được ghi chú ngay cạnh phần cài đặt.
"""
import hashlib
import hmac
import re
import secrets
import unicodedata
from datetime import date, datetime, time, timedelta, timezone
from typing import Iterable, Optional, Tuple

# ---------------------------------------------------------------------------
# Thời gian: dùng giờ Việt Nam (UTC+7) cho mọi so sánh, không phụ thuộc đồng hồ máy chủ
# ---------------------------------------------------------------------------
VN_TZ = timezone(timedelta(hours=7))


def now_vn() -> datetime:
    """Giờ hiện tại theo múi giờ Việt Nam (bỏ tzinfo để so sánh với dữ liệu trong DB)."""
    return datetime.now(VN_TZ).replace(tzinfo=None)


def combine(d: date, t: time) -> datetime:
    return datetime.combine(d, t)


def parse_date(value: str) -> date:
    """'2026-10-25' -> date. Ném ValueError nếu sai định dạng."""
    return datetime.strptime(value.strip(), "%Y-%m-%d").date()


def parse_time(value: str) -> time:
    """'19:00' hoặc '19:00:00' -> time. Ném ValueError nếu sai định dạng."""
    v = value.strip()
    return datetime.strptime(v, "%H:%M:%S" if v.count(":") == 2 else "%H:%M").time()


# ---------------------------------------------------------------------------
# Chính sách (có thể chỉnh tại đây)
# ---------------------------------------------------------------------------
EDIT_LOCK_HOURS = 2            # FR-06: chỉ được sửa kèo trước giờ chơi tối thiểu 2 tiếng
FREE_CANCEL_HOURS = 2          # hủy sớm hơn mốc này thì được hoàn cọc, hủy sát giờ thì mất cọc
REMINDER_BEFORE_MINUTES = 120  # FR-09: nhắc nhở trước giờ thi đấu
OTP_TTL_MINUTES = 5            # FR-01: OTP hết hạn sau 5 phút
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_SECONDS = 30
MAX_SLOT_PER_BOOKING = 4       # một yêu cầu được xin tối đa 4 chỗ (đi cùng bạn bè)
MAX_TONG_SLOT = 50

# ---------------------------------------------------------------------------
# Trình độ (FR-02): Newbie, Trung bình - Yếu, Trung bình, Khá, Giỏi
# ---------------------------------------------------------------------------
TRINH_DO = {1: "Newbie", 2: "Trung bình - Yếu", 3: "Trung bình", 4: "Khá", 5: "Giỏi"}


def strip_accents(text: str) -> str:
    """'Đống Đa' -> 'dong da' (dùng cho tìm kiếm không phân biệt dấu)."""
    text = unicodedata.normalize("NFD", text or "")
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return text.replace("đ", "d").replace("Đ", "D").lower().strip()


def level_name(level: Optional[int]) -> str:
    return TRINH_DO.get(level or 0, "Chưa rõ")


def level_range_label(lo: int, hi: int) -> str:
    if lo <= 1 and hi >= 5:
        return "Mọi trình độ"
    if lo == hi:
        return level_name(lo)
    return f"Từ {level_name(lo)} đến {level_name(hi)}"


def parse_level(value) -> Optional[int]:
    """Nhận 1..5 hoặc tên trình độ (không phân biệt hoa/thường, dấu) -> số 1..5, không hiểu thì None."""
    if value is None or value == "":
        return None
    s = str(value).strip()
    if s.isdigit():
        n = int(s)
        return n if 1 <= n <= 5 else None
    key = strip_accents(s)
    for n, name in TRINH_DO.items():
        if strip_accents(name) == key:
            return n
    return None


# ---------------------------------------------------------------------------
# Danh mục dùng chung với giao diện (GET /api/meta)
# ---------------------------------------------------------------------------
QUAN_HUYEN = [
    "Ba Đình", "Hoàn Kiếm", "Hai Bà Trưng", "Đống Đa", "Tây Hồ", "Cầu Giấy",
    "Thanh Xuân", "Hoàng Mai", "Long Biên", "Nam Từ Liêm", "Bắc Từ Liêm", "Hà Đông",
    "Gia Lâm", "Đông Anh", "Thanh Trì", "Hoài Đức", "Thanh Oai", "Sóc Sơn", "Sơn Tây", "Khác",
]

# Cổng thanh toán cọc đang ở chế độ GIẢ LẬP (sandbox). Thay bằng API thật khi triển khai.
PHUONG_THUC_TT = {"momo": "Ví MoMo", "vnpay": "VNPay QR", "bank": "Chuyển khoản"}
PAYMENT_STATUS_TEXT = {"paid": "Đã cọc", "refunded": "Đã hoàn cọc", "forfeited": "Mất cọc (hủy sát giờ)"}

LY_DO_BAO_CAO = {
    "bung_keo": "Bùng kèo / không đến sát giờ",
    "lua_dao": "Có dấu hiệu lừa đảo",
    "thai_do": "Thái độ không phù hợp",
    "sai_thong_tin": "Sai thông tin (trình độ, giá, địa điểm)",
    "khac": "Lý do khác",
}

# FR-10: tiêu chí đánh giá chéo
TIEU_CHI_HOST_TO_PLAYER = [
    ("thai_do", "Thái độ & tinh thần chơi"),
    ("trinh_do_thuc_te", "Trình độ thực tế đúng như hồ sơ"),
]
TIEU_CHI_PLAYER_TO_HOST = [
    ("chat_luong_san", "Chất lượng sân"),
    ("nhiet_tinh", "Sự nhiệt tình của chủ nhóm"),
    ("minh_bach_chi_phi", "Minh bạch về chi phí"),
]

COURT_STATUS_TEXT = {
    "open": "Đang mở", "full": "Đã đủ người", "ongoing": "Đang diễn ra",
    "finished": "Đã kết thúc", "cancelled": "Đã hủy",
}
BOOKING_STATUS_TEXT = {
    "pending": "Chờ duyệt", "approved": "Đã duyệt", "rejected": "Bị từ chối", "cancelled": "Đã hủy",
}
ACTIVE_BOOKING = ("pending", "approved")   # các trạng thái đang "giữ chỗ"


# ---------------------------------------------------------------------------
# Kiểm tra dữ liệu đầu vào (FR-01)
# ---------------------------------------------------------------------------
USERNAME_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_.]{2,29}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def normalize_phone(raw: Optional[str]) -> Optional[str]:
    """'+84 912.345.678' -> '0912345678'."""
    if not raw:
        return None
    p = re.sub(r"[\s.\-()]", "", raw)
    if p.startswith("+84"):
        p = "0" + p[3:]
    elif p.startswith("84") and len(p) == 11:
        p = "0" + p[2:]
    return p


def is_valid_phone(p: Optional[str]) -> bool:
    return bool(p and re.fullmatch(r"0\d{9}", p))


def is_valid_email(e: Optional[str]) -> bool:
    return bool(e and EMAIL_RE.match(e))


def mask_identifier(kenh: str, value: str) -> str:
    """Che bớt email/số điện thoại khi hiển thị: 0912345678 -> 091****678."""
    if kenh == "phone" and len(value) >= 7:
        return value[:3] + "****" + value[-3:]
    if "@" in value:
        name, _, domain = value.partition("@")
        return name[:1] + "***@" + domain
    return value


# ---------------------------------------------------------------------------
# OTP (FR-01) - chỉ lưu bản băm, không lưu mã gốc
# ---------------------------------------------------------------------------
def generate_otp() -> str:
    return f"{secrets.randbelow(10 ** 6):06d}"


def hash_otp(secret: str, identifier: str, code: str) -> str:
    return hmac.new(secret.encode(), f"{identifier}:{code}".encode(), hashlib.sha256).hexdigest()


def check_otp(secret: str, identifier: str, code: str, stored_hash: str) -> bool:
    return hmac.compare_digest(hash_otp(secret, identifier, code.strip()), stored_hash)


# ---------------------------------------------------------------------------
# Điểm uy tín (FR-11)
# ---------------------------------------------------------------------------
TRUST_MIN_REVIEWS = 3
TRUST_MIN_AVG = 4.0
LOW_AVG = 3.0
NOSHOW_WARN_MIN = 2
NOSHOW_WARN_RATIO = 0.25


def review_score(values: Iterable[Optional[int]], bung_keo: bool = False) -> float:
    """Điểm của một lượt đánh giá = trung bình các tiêu chí; bùng kèo thì bị chấm 1.0."""
    if bung_keo:
        return 1.0
    nums = [v for v in values if v is not None]
    return round(sum(nums) / len(nums), 2) if nums else 0.0


def reputation_label(avg: float, count: int, no_show: int) -> Tuple[str, str]:
    """Trả về (mã nhãn, chữ hiển thị) dựa trên trung bình cộng các lượt đánh giá."""
    if no_show >= NOSHOW_WARN_MIN and count > 0 and no_show / count >= NOSHOW_WARN_RATIO:
        return "warning", "Tài khoản thường xuyên bùng kèo"
    if count >= TRUST_MIN_REVIEWS and avg >= TRUST_MIN_AVG:
        return "trusted", "Uy tín"
    if count >= TRUST_MIN_REVIEWS and avg < LOW_AVG:
        return "low", "Điểm uy tín thấp"
    if count == 0:
        return "new", "Thành viên mới"
    return "normal", "Đang xây dựng uy tín"


# ---------------------------------------------------------------------------
# Trạng thái kèo & các quy tắc theo thời gian
# ---------------------------------------------------------------------------
def court_display_status(trang_thai: str, slot_trong: int, start: datetime, end: datetime, now: datetime) -> str:
    """Trạng thái hiển thị: cancelled > finished > ongoing > full > open.

    'closed' (chủ nhóm chủ động đóng kèo, FR-06) và hết slot đều hiển thị là 'Đã đủ người'.
    """
    if trang_thai == "cancelled":
        return "cancelled"
    if end <= now:
        return "finished"
    if start <= now:
        return "ongoing"
    if trang_thai == "closed" or slot_trong <= 0:
        return "full"
    return "open"


def can_edit(start: datetime, now: datetime) -> bool:
    """FR-06: chỉ chỉnh sửa kèo khi còn ít nhất EDIT_LOCK_HOURS trước giờ chơi."""
    return start - now >= timedelta(hours=EDIT_LOCK_HOURS)


def refund_on_player_cancel(booking_status: str, start: datetime, now: datetime) -> bool:
    """Hủy khi còn chờ duyệt -> hoàn cọc. Đã duyệt: hoàn nếu hủy trước giờ chơi >= FREE_CANCEL_HOURS."""
    if booking_status == "pending":
        return True
    return start - now >= timedelta(hours=FREE_CANCEL_HOURS)
