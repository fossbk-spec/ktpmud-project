"""Cấu trúc dữ liệu đầu vào (Pydantic). Việc kiểm tra chi tiết nằm ở routers/services để báo lỗi tiếng Việt rõ ràng."""
from typing import Optional

from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "player"            # player | host (admin không tự đăng ký được)
    ho_ten: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class VerifyOtpIn(BaseModel):
    username: str
    otp: str


class ResendOtpIn(BaseModel):
    username: str


class ForgotPasswordIn(BaseModel):
    identifier: str                 # tên đăng nhập, email hoặc số điện thoại


class ResetPasswordIn(BaseModel):
    username: str
    otp: str
    new_password: str


class ChangePasswordIn(BaseModel):
    old_password: str
    new_password: str


class ProfileUpdate(BaseModel):
    ho_ten: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    khu_vuc_thuong_choi: Optional[str] = None
    trinh_do: Optional[int] = None


class CourtCreate(BaseModel):
    ten_san: str
    dia_chi: Optional[str] = None
    khu_vuc: str
    ngay_choi: str                  # YYYY-MM-DD
    gio_bat_dau: str               # HH:MM
    gio_ket_thuc: str              # HH:MM
    trinh_min: int = 1
    trinh_max: int = 5
    tong_slot: Optional[int] = None
    slot_trong: Optional[int] = None   # giữ để tương thích với bản cũ
    gia_thue: float = 0
    tien_coc: float = 0
    ghi_chu: Optional[str] = None
    vi_do: Optional[float] = None
    kinh_do: Optional[float] = None


class BookingCreate(BaseModel):
    court_id: int
    so_luong_slot: int = 1
    loi_nhan: Optional[str] = None
    phuong_thuc: Optional[str] = None   # bắt buộc nếu kèo yêu cầu đặt cọc


class RejectIn(BaseModel):
    ly_do: Optional[str] = None


class CancelCourtIn(BaseModel):
    ly_do: Optional[str] = None


class ReviewIn(BaseModel):
    booking_id: int
    thai_do: Optional[int] = None
    trinh_do_thuc_te: Optional[int] = None
    bung_keo: bool = False
    chat_luong_san: Optional[int] = None
    nhiet_tinh: Optional[int] = None
    minh_bach_chi_phi: Optional[int] = None
    binh_luan: Optional[str] = None


class ReportIn(BaseModel):
    target_user_id: Optional[int] = None
    court_id: Optional[int] = None
    ly_do: str
    mo_ta: Optional[str] = None


class ResolveReportIn(BaseModel):
    quyet_dinh: str                 # resolved | dismissed
    ghi_chu_admin: Optional[str] = None
    khoa_nguoi_bi_bao_cao: bool = False
    huy_keo: bool = False


class LockIn(BaseModel):
    ly_do: Optional[str] = None
