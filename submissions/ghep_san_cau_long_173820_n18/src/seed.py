"""Dữ liệu khởi tạo.

- ensure_admin(): luôn đảm bảo có 1 tài khoản Quản trị viên (mặc định admin / admin123, đổi bằng ADMIN_PASSWORD).
- seed_demo(): chỉ chạy khi CSDL chưa có kèo nào; tạo người dùng + kèo mẫu để xem ngay các tính năng.
  Tên sân/địa điểm trong dữ liệu mẫu chỉ mang tính minh họa.

Chạy tay:  python seed.py            (thêm dữ liệu mẫu nếu CSDL còn trống)
           python seed.py --reset    (XÓA SẠCH rồi tạo lại - cẩn thận!)
"""
import os
import sys
from datetime import time, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine, init_db
from models import Booking, Court, Payment, Review, User
from rules import ACTIVE_BOOKING, now_vn, review_score
from security import hash_password
from services import recalc_reputation

DEMO_PASSWORD = "123456"


def ensure_admin(db: Session) -> None:
    if db.query(User).filter(User.role == "admin").first() is not None:
        return
    password = os.getenv("ADMIN_PASSWORD", "admin123")
    db.add(User(username="admin", password=hash_password(password), role="admin", ho_ten="Quản trị viên",
                email="admin@badminton.local", is_verified=True, host_verified=True))
    db.commit()
    print(f"[seed] Đã tạo tài khoản quản trị: admin / {password}")


def _user(db: Session, username: str, ho_ten: str, role: str, phone: str, level: int, area: str) -> User:
    u = User(username=username, password=hash_password(DEMO_PASSWORD), role=role, ho_ten=ho_ten,
             phone=phone, email=f"{username}@example.com", trinh_do=level, khu_vuc_thuong_choi=area,
             is_verified=True, host_verified=(role == "host"))
    db.add(u)
    db.flush()
    return u


def _court(db: Session, host: User, day_offset: int, start: str, end: str, tong_slot: int = 4, **kw) -> Court:
    hs, ms = (int(x) for x in start.split(":"))
    he, me = (int(x) for x in end.split(":"))
    c = Court(host_id=host.id, ngay_choi=now_vn().date() + timedelta(days=day_offset),
              gio_bat_dau=time(hs, ms), gio_ket_thuc=time(he, me),
              tong_slot=tong_slot, slot_trong=tong_slot, trang_thai="open", **kw)
    db.add(c)
    db.flush()
    return c


def _booking(db: Session, user: User, court: Court, status: str, method: Optional[str] = None) -> Booking:
    """Tạo booking mẫu; booking đang giữ chỗ (pending/approved) sẽ trừ slot của kèo, giống luồng thật."""
    b = Booking(user_id=user.id, court_id=court.id, so_luong=1, trang_thai=status)
    db.add(b)
    db.flush()
    if status in ACTIVE_BOOKING:
        court.slot_trong -= 1
    if method and court.tien_coc:
        db.add(Payment(booking_id=b.id, so_tien=court.tien_coc, phuong_thuc=method,
                       trang_thai="paid", ma_giao_dich=f"TXNDEMO{court.id:03d}{b.id:03d}"))
    return b


def _review(db: Session, booking: Booking, court: Court, reviewer: User, reviewee: User, loai: str,
            bung_keo: bool = False, **criteria) -> None:
    values = {k: v for k, v in criteria.items() if v is not None}
    db.add(Review(booking_id=booking.id, court_id=court.id, reviewer_id=reviewer.id, reviewee_id=reviewee.id,
                  loai=loai, bung_keo=bung_keo, diem=review_score(values.values(), bung_keo), **values))


def seed_demo(db: Session) -> None:
    if db.query(Court).first() is not None:
        return

    hung = _user(db, "host_hung", "Nguyễn Văn Hùng", "host", "0912345601", 4, "Hai Bà Trưng")
    lan = _user(db, "host_lan", "Phạm Thị Lan", "host", "0912345602", 3, "Cầu Giấy")
    thao = _user(db, "thao", "Trần Thị Thu Thảo", "player", "0912345611", 3, "Đống Đa")
    nam = _user(db, "nam", "Trần Duy Nam", "player", "0912345612", 3, "Hai Bà Trưng")
    minh = _user(db, "minh", "Lê Quang Minh", "player", "0912345613", 4, "Thanh Xuân")
    linh = _user(db, "linh", "Đỗ Khánh Linh", "player", "0912345614", 2, "Cầu Giấy")
    quang = _user(db, "quang", "Vũ Hồng Quang", "player", "0912345615", 3, "Hoàng Mai")

    # ------------------------- Kèo sắp tới -------------------------
    k1 = _court(db, hung, 1, "19:00", "21:00", tong_slot=6, ten_san="Sân cầu lông Bách Khoa",
                khu_vuc="Hai Bà Trưng", dia_chi="Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
                vi_do=21.0057, kinh_do=105.8430, trinh_min=2, trinh_max=4, gia_thue=60000, tien_coc=20000,
                ghi_chu="Dùng cầu nhựa Hải Yến. Nhóm vui vẻ, đến đúng giờ giúp mình nhé!")
    k2 = _court(db, hung, 2, "18:00", "20:00", tong_slot=4, ten_san="Sân cầu lông Thanh Xuân",
                khu_vuc="Thanh Xuân", dia_chi="Khuất Duy Tiến, Thanh Xuân, Hà Nội",
                vi_do=21.0003, kinh_do=105.8010, trinh_min=3, trinh_max=5, gia_thue=80000, tien_coc=0,
                ghi_chu="Đánh đôi nam nữ, trình khá trở lên.")
    k3 = _court(db, lan, 1, "20:00", "22:00", tong_slot=8, ten_san="Sân cầu lông Cầu Giấy",
                khu_vuc="Cầu Giấy", dia_chi="Trần Thái Tông, Cầu Giấy, Hà Nội",
                vi_do=21.0322, kinh_do=105.7905, trinh_min=1, trinh_max=3, gia_thue=50000, tien_coc=0,
                ghi_chu="Kèo giao lưu cho người mới chơi, có người hướng dẫn kỹ thuật cơ bản.")
    _court(db, lan, 3, "17:30", "19:30", tong_slot=10, ten_san="Sân cầu lông Mỹ Đình",
           khu_vuc="Nam Từ Liêm", dia_chi="Đường Lê Đức Thọ, Nam Từ Liêm, Hà Nội",
           vi_do=21.0287, kinh_do=105.7644, trinh_min=1, trinh_max=5, gia_thue=70000, tien_coc=30000,
           ghi_chu="Thuê trọn sân 2 tiếng, chia đều chi phí. Mang vợt riêng.")
    _court(db, hung, 4, "06:00", "08:00", tong_slot=4, ten_san="Sân cầu lông Long Biên",
           khu_vuc="Long Biên", dia_chi="Ngọc Lâm, Long Biên, Hà Nội",
           vi_do=21.0489, kinh_do=105.8662, trinh_min=2, trinh_max=5, gia_thue=45000, tien_coc=0,
           ghi_chu="Kèo buổi sáng sớm trước giờ đi làm.")
    _court(db, lan, 2, "19:30", "21:30", tong_slot=6, ten_san="Sân cầu lông Hà Đông",
           khu_vuc="Hà Đông", dia_chi="Quang Trung, Hà Đông, Hà Nội",
           vi_do=20.9606, kinh_do=105.7705, trinh_min=3, trinh_max=4, gia_thue=65000, tien_coc=15000)

    # Yêu cầu mẫu: Thảo đang chờ Hùng duyệt (đã cọc MoMo); Nam đã được duyệt; k2 sắp đủ người
    _booking(db, thao, k1, "pending", "momo")
    _booking(db, nam, k1, "approved", "vnpay")
    _booking(db, minh, k2, "approved")
    _booking(db, linh, k2, "approved")
    _booking(db, quang, k2, "approved")
    _booking(db, linh, k3, "approved")

    # ---------- Kèo đã kết thúc: thử mở khóa đánh giá (FR-10) và điểm uy tín (FR-11) ----------
    p1 = _court(db, hung, -2, "19:00", "21:00", tong_slot=4, ten_san="Sân cầu lông Bách Khoa",
                khu_vuc="Hai Bà Trưng", dia_chi="Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
                vi_do=21.0057, kinh_do=105.8430, trinh_min=2, trinh_max=4, gia_thue=60000, tien_coc=20000,
                ghi_chu="Trận đã diễn ra (dữ liệu demo).")
    p2 = _court(db, hung, -5, "19:00", "21:00", tong_slot=4, ten_san="Sân cầu lông Thanh Xuân",
                khu_vuc="Thanh Xuân", dia_chi="Khuất Duy Tiến, Thanh Xuân, Hà Nội",
                vi_do=21.0003, kinh_do=105.8010, trinh_min=2, trinh_max=5, gia_thue=70000, tien_coc=0,
                ghi_chu="Trận đã diễn ra (dữ liệu demo).")
    p3 = _court(db, lan, -7, "20:00", "22:00", tong_slot=4, ten_san="Sân cầu lông Cầu Giấy",
                khu_vuc="Cầu Giấy", dia_chi="Trần Thái Tông, Cầu Giấy, Hà Nội",
                vi_do=21.0322, kinh_do=105.7905, trinh_min=1, trinh_max=4, gia_thue=50000, tien_coc=0,
                ghi_chu="Trận đã diễn ra (dữ liệu demo).")
    for past in (p1, p2, p3):
        past.da_nhac_danh_gia = True   # coi như đã nhắc đánh giá; người dùng vẫn thấy việc cần đánh giá trong app

    # p1: Hùng đã chấm Minh + Quang (bùng kèo); CHƯA chấm Nam và Linh -> Hùng có việc cần đánh giá.
    #     Nam chưa đánh giá Hùng -> Nam cũng có việc cần đánh giá.
    _booking(db, nam, p1, "approved")
    m1 = _booking(db, minh, p1, "approved")
    q1 = _booking(db, quang, p1, "approved")
    l1 = _booking(db, linh, p1, "approved")
    _review(db, m1, p1, hung, minh, "host_to_player", thai_do=5, trinh_do_thuc_te=5)
    _review(db, q1, p1, hung, quang, "host_to_player", bung_keo=True)
    _review(db, m1, p1, minh, hung, "player_to_host", chat_luong_san=5, nhiet_tinh=5, minh_bach_chi_phi=4)
    _review(db, l1, p1, linh, hung, "player_to_host", chat_luong_san=4, nhiet_tinh=5, minh_bach_chi_phi=5)

    # p2: Quang bùng kèo lần 2 -> nhãn cảnh báo "thường xuyên bùng kèo"
    q2 = _booking(db, quang, p2, "approved")
    l2 = _booking(db, linh, p2, "approved")
    _review(db, q2, p2, hung, quang, "host_to_player", bung_keo=True)
    _review(db, l2, p2, hung, linh, "host_to_player", thai_do=4, trinh_do_thuc_te=5)
    _review(db, l2, p2, linh, hung, "player_to_host", chat_luong_san=5, nhiet_tinh=5, minh_bach_chi_phi=5)

    # p3: các đánh giá tốt dành cho Lan -> nhãn "Uy tín"
    m3 = _booking(db, minh, p3, "approved")
    t3 = _booking(db, thao, p3, "approved")
    n3 = _booking(db, nam, p3, "approved")
    _review(db, m3, p3, minh, lan, "player_to_host", chat_luong_san=5, nhiet_tinh=5, minh_bach_chi_phi=5)
    _review(db, t3, p3, thao, lan, "player_to_host", chat_luong_san=4, nhiet_tinh=5, minh_bach_chi_phi=5)
    _review(db, n3, p3, nam, lan, "player_to_host", chat_luong_san=5, nhiet_tinh=4, minh_bach_chi_phi=5)
    _review(db, t3, p3, lan, thao, "host_to_player", thai_do=5, trinh_do_thuc_te=4)
    _review(db, m3, p3, lan, minh, "host_to_player", thai_do=5, trinh_do_thuc_te=5)

    db.flush()
    for u in (hung, lan, thao, nam, minh, linh, quang):
        recalc_reputation(db, u.id)
    db.commit()
    print(f"[seed] Đã tạo dữ liệu demo (mật khẩu các tài khoản demo: {DEMO_PASSWORD}).")


if __name__ == "__main__":
    if "--reset" in sys.argv:
        Base.metadata.drop_all(bind=engine)
        print("[seed] Đã xóa toàn bộ bảng.")
    init_db()
    with SessionLocal() as session:
        ensure_admin(session)
        seed_demo(session)
