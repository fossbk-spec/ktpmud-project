"""FR-02: Quản lý hồ sơ; hồ sơ công khai kèm điểm uy tín (FR-11, US-03)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Review, User
from rules import TRINH_DO, is_valid_email, is_valid_phone, normalize_phone
from schemas import ChangePasswordIn, ProfileUpdate
from security import get_current_user, hash_password, verify_password
from services import notify_admins, user_me, user_public

router = APIRouter(prefix="/api", tags=["Người dùng"])


# API Lấy thông tin tài khoản cá nhân
@router.get("/users/me")
def get_user_profile(current_user: User = Depends(get_current_user)):
    return user_me(current_user)


# FR-02: cập nhật Họ tên, Số điện thoại, Khu vực thường chơi, Tự đánh giá trình độ
@router.put("/users/me")
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    if data.ho_ten is not None:
        name = data.ho_ten.strip()
        if not name or len(name) > 60:
            raise HTTPException(status_code=400, detail="Họ tên không được để trống (tối đa 60 ký tự)!")
        current_user.ho_ten = name
    if data.khu_vuc_thuong_choi is not None:
        current_user.khu_vuc_thuong_choi = data.khu_vuc_thuong_choi.strip()[:60] or None
    if data.trinh_do is not None:
        if data.trinh_do not in TRINH_DO:
            raise HTTPException(status_code=400, detail="Trình độ không hợp lệ!")
        current_user.trinh_do = data.trinh_do

    new_phone = current_user.phone
    new_email = current_user.email
    if data.phone is not None:
        new_phone = normalize_phone(data.phone) if data.phone.strip() else None
        if new_phone and not is_valid_phone(new_phone):
            raise HTTPException(status_code=400, detail="Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)!")
        if new_phone and db.query(User).filter(User.phone == new_phone, User.id != current_user.id).first():
            raise HTTPException(status_code=400, detail="Số điện thoại này đã được sử dụng!")
    if data.email is not None:
        new_email = data.email.strip().lower() or None
        if new_email and not is_valid_email(new_email):
            raise HTTPException(status_code=400, detail="Email không hợp lệ!")
        if new_email and db.query(User).filter(User.email == new_email, User.id != current_user.id).first():
            raise HTTPException(status_code=400, detail="Email này đã được sử dụng!")
    if not new_phone and not new_email:
        raise HTTPException(status_code=400, detail="Cần giữ ít nhất một cách liên hệ (Email hoặc Số điện thoại)!")
    current_user.phone = new_phone
    current_user.email = new_email

    db.commit()
    db.refresh(current_user)
    return user_me(current_user)


# Đổi mật khẩu khi đang đăng nhập (cần nhập đúng mật khẩu hiện tại)
@router.post("/users/me/change-password")
def change_password(data: ChangePasswordIn, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    if not verify_password(data.old_password, current_user.password):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng!")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 6 ký tự!")
    if data.new_password == data.old_password:
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải khác mật khẩu hiện tại!")
    current_user.password = hash_password(data.new_password)
    db.commit()
    return {"thong_bao": "Đã đổi mật khẩu thành công!"}


# Người chơi muốn tạo kèo -> gửi yêu cầu để Quản trị viên xác thực (UC-02: tránh lừa đảo)
@router.post("/users/me/request-host")
def request_host(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        raise HTTPException(status_code=400, detail="Quản trị viên không cần đăng ký làm chủ sân!")
    if current_user.role == "host":
        msg = "Tài khoản chủ sân của bạn đã được xác thực." if current_user.host_verified \
            else "Yêu cầu của bạn đang chờ Quản trị viên xác thực."
        return {"thong_bao": msg, "user": user_me(current_user)}
    current_user.role = "host"
    current_user.host_verified = False
    notify_admins(db, "Yêu cầu xác thực chủ sân",
                  f"{current_user.ho_ten or current_user.username} đăng ký làm Chủ nhóm / Chủ sân và đang chờ xác thực.")
    db.commit()
    db.refresh(current_user)
    return {"thong_bao": "Đã gửi yêu cầu! Bạn sẽ tạo được kèo ngay khi Quản trị viên xác thực.",
            "user": user_me(current_user)}


# Hồ sơ công khai (không có email/số điện thoại - NFR-04) + các đánh giá gần đây
@router.get("/users/{user_id}")
def get_public_profile(user_id: int, db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng!")
    reviews = (db.query(Review).filter(Review.reviewee_id == user.id)
                 .order_by(Review.id.desc()).limit(10).all())
    data = user_public(user)
    data["danh_gia_gan_day"] = [{
        "id": r.id, "diem": r.diem, "loai": r.loai, "bung_keo": bool(r.bung_keo),
        "binh_luan": r.binh_luan, "created_at": r.created_at.isoformat(),
        "nguoi_danh_gia": r.reviewer.ho_ten or r.reviewer.username,
    } for r in reviews]
    return data
