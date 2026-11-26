from sqlalchemy import (
    Boolean, Column, Date, DateTime, Float, ForeignKey, Index, Integer, String, Text, Time,
    UniqueConstraint, text,
)
from sqlalchemy.orm import relationship

from database import Base
from rules import combine, now_vn


class User(Base):
    """Kho dữ liệu "Users" (DFD): hồ sơ định danh người dùng."""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)                      # băm bcrypt
    role = Column(String, default="player", nullable=False)        # player | host | admin

    # FR-01, FR-02: hồ sơ
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    ho_ten = Column(String, nullable=True)
    khu_vuc_thuong_choi = Column(String, nullable=True)
    trinh_do = Column(Integer, default=1, nullable=False)          # 1..5 (Newbie..Giỏi)

    # Trạng thái tài khoản
    is_active = Column(Boolean, default=True, nullable=False)      # False = bị admin khóa
    is_verified = Column(Boolean, default=False, nullable=False)   # đã xác thực OTP
    host_verified = Column(Boolean, default=False, nullable=False)  # admin đã xác thực chủ sân (UC-02)
    lock_reason = Column(String, nullable=True)

    # FR-11: điểm uy tín (hệ thống tự cập nhật sau mỗi lượt đánh giá)
    diem_uy_tin = Column(Float, default=0.0, nullable=False)
    so_danh_gia = Column(Integer, default=0, nullable=False)
    so_bung_keo = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=now_vn, nullable=False)


class Court(Base):
    """Kho dữ liệu "Data Sân" (DFD): một kèo / ca đánh do chủ nhóm đăng (FR-04)."""
    __tablename__ = "courts"
    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)

    ten_san = Column(String, index=True, nullable=False)
    dia_chi = Column(String, nullable=True)                        # địa chỉ cụ thể
    khu_vuc = Column(String, index=True, nullable=True)            # Quận/Huyện
    vi_do = Column(Float, nullable=True)                           # Latitude  (bản đồ)
    kinh_do = Column(Float, nullable=True)                         # Longitude (bản đồ)

    ngay_choi = Column(Date, index=True, nullable=False)
    gio_bat_dau = Column(Time, nullable=False)
    gio_ket_thuc = Column(Time, nullable=False)

    trinh_min = Column(Integer, default=1, nullable=False)         # trình độ yêu cầu (Min - Max)
    trinh_max = Column(Integer, default=5, nullable=False)

    gia_thue = Column(Float, default=0, nullable=False)            # chi phí dự kiến / người (VNĐ)
    tien_coc = Column(Float, default=0, nullable=False)            # tiền cọc / slot (0 = không cần cọc)
    tong_slot = Column(Integer, default=4, nullable=False)         # tổng số người cần tuyển
    slot_trong = Column(Integer, default=4, nullable=False)        # số chỗ còn trống (NFR-03: chỉ đổi bằng UPDATE có điều kiện)
    ghi_chu = Column(Text, nullable=True)                          # loại cầu, quy định riêng của nhóm

    trang_thai = Column(String, default="open", nullable=False)    # open | closed | cancelled
    da_nhac_host = Column(Boolean, default=False, nullable=False)  # đã gửi nhắc nhở cho chủ nhóm
    da_nhac_danh_gia = Column(Boolean, default=False, nullable=False)  # đã mở khóa/nhắc đánh giá
    created_at = Column(DateTime, default=now_vn, nullable=False)
    updated_at = Column(DateTime, default=now_vn, onupdate=now_vn, nullable=False)

    host = relationship("User", foreign_keys=[host_id])

    @property
    def bat_dau(self):
        return combine(self.ngay_choi, self.gio_bat_dau)

    @property
    def ket_thuc(self):
        return combine(self.ngay_choi, self.gio_ket_thuc)


class Booking(Base):
    """Kho dữ liệu "Bookings" (DFD): yêu cầu tham gia + trạng thái ghép nhóm (FR-08, FR-09)."""
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    court_id = Column(Integer, ForeignKey("courts.id"), index=True, nullable=False)
    so_luong = Column(Integer, default=1, nullable=False)
    trang_thai = Column(String, default="pending", nullable=False)  # pending | approved | rejected | cancelled
    loi_nhan = Column(String, nullable=True)
    da_nhac_nho = Column(Boolean, default=False, nullable=False)    # đã gửi Reminder (FR-09)
    created_at = Column(DateTime, default=now_vn, nullable=False)
    updated_at = Column(DateTime, default=now_vn, onupdate=now_vn, nullable=False)

    court_info = relationship("Court")
    user = relationship("User")
    payment = relationship("Payment", uselist=False, back_populates="booking")

    __table_args__ = (
        # Mỗi người chỉ có 1 yêu cầu "đang giữ chỗ" cho 1 kèo (chặn bấm đúp / gửi song song)
        Index(
            "uq_booking_active", "user_id", "court_id", unique=True,
            sqlite_where=text("trang_thai IN ('pending','approved')"),
            postgresql_where=text("trang_thai IN ('pending','approved')"),
        ),
    )


class Payment(Base):
    """Thanh toán tiền cọc (DFD tiến trình 3). Hiện là cổng giả lập."""
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    so_tien = Column(Float, nullable=False)
    phuong_thuc = Column(String, nullable=False)                   # momo | vnpay | bank
    trang_thai = Column(String, default="paid", nullable=False)    # paid | refunded | forfeited
    ma_giao_dich = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=now_vn, nullable=False)
    updated_at = Column(DateTime, default=now_vn, onupdate=now_vn, nullable=False)

    booking = relationship("Booking", back_populates="payment")


class Review(Base):
    """FR-10: đánh giá chéo sau trận."""
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    court_id = Column(Integer, ForeignKey("courts.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewee_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    loai = Column(String, nullable=False)                          # host_to_player | player_to_host

    # Host -> Player
    thai_do = Column(Integer, nullable=True)
    trinh_do_thuc_te = Column(Integer, nullable=True)
    bung_keo = Column(Boolean, default=False, nullable=False)
    # Player -> Host
    chat_luong_san = Column(Integer, nullable=True)
    nhiet_tinh = Column(Integer, nullable=True)
    minh_bach_chi_phi = Column(Integer, nullable=True)

    diem = Column(Float, nullable=False)                           # điểm tổng của lượt đánh giá
    binh_luan = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_vn, nullable=False)

    reviewer = relationship("User", foreign_keys=[reviewer_id])
    reviewee = relationship("User", foreign_keys=[reviewee_id])

    __table_args__ = (UniqueConstraint("booking_id", "reviewer_id", name="uq_review_once"),)


class Notification(Base):
    """Thông báo trong ứng dụng (FR-08: báo cho Host, FR-09: Reminder...)."""
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    loai = Column(String, nullable=False)
    tieu_de = Column(String, nullable=False)
    noi_dung = Column(Text, nullable=True)
    court_id = Column(Integer, nullable=True)
    booking_id = Column(Integer, nullable=True)
    da_doc = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=now_vn, nullable=False)


class Report(Base):
    """Báo cáo vi phạm gửi cho Quản trị viên."""
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    court_id = Column(Integer, ForeignKey("courts.id"), nullable=True)
    ly_do = Column(String, nullable=False)
    mo_ta = Column(Text, nullable=True)
    trang_thai = Column(String, default="open", nullable=False)   # open | resolved | dismissed
    ghi_chu_admin = Column(Text, nullable=True)
    handled_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=now_vn, nullable=False)
    handled_at = Column(DateTime, nullable=True)

    reporter = relationship("User", foreign_keys=[reporter_id])
    target_user = relationship("User", foreign_keys=[target_user_id])
    court = relationship("Court", foreign_keys=[court_id])


class OtpCode(Base):
    """FR-01: mã OTP xác thực tài khoản (chỉ lưu bản băm)."""
    __tablename__ = "otp_codes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    kenh = Column(String, nullable=False)                          # phone | email
    dinh_danh = Column(String, nullable=False)
    ma_hash = Column(String, nullable=False)
    het_han = Column(DateTime, nullable=False)
    so_lan_sai = Column(Integer, default=0, nullable=False)
    da_dung = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=now_vn, nullable=False)
