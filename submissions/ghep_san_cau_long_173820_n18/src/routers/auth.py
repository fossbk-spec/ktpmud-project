"""FR-01: Đăng ký / Đăng nhập bằng Email hoặc Số điện thoại, có xác thực OTP."""
import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import OtpCode, User
from rules import (
    OTP_MAX_ATTEMPTS, USERNAME_RE, check_otp, is_valid_email, is_valid_phone, normalize_phone, now_vn,
)
from ratelimit import ip_limiter, login_limiter
from schemas import ForgotPasswordIn, ResendOtpIn, ResetPasswordIn, UserCreate, VerifyOtpIn
from security import SECRET_KEY, create_access_token, hash_password, verify_password
from services import issue_otp, user_me

router = APIRouter(prefix="/api", tags=["Tài khoản"])


def find_user_by_identifier(db: Session, ident: Optional[str]) -> Optional[User]:
    """Tìm tài khoản theo tên đăng nhập, email hoặc số điện thoại."""
    ident = (ident or "").strip()
    if not ident:
        return None
    if "@" in ident:
        return db.query(User).filter(User.email == ident.lower()).first()
    phone = normalize_phone(ident)
    if is_valid_phone(phone):
        user = db.query(User).filter(User.phone == phone).first()
        if user:
            return user
    return db.query(User).filter(func.lower(User.username) == ident.lower()).first()


# --- API ĐĂNG KÝ TÀI KHOẢN ---
@router.post("/register")
def register(data: UserCreate, db: Session = Depends(get_db)):
    username = data.username.strip()
    if not USERNAME_RE.match(username):
        raise HTTPException(status_code=400,
                            detail="Tên đăng nhập gồm 3-30 ký tự (chữ, số, dấu _ .) và phải bắt đầu bằng chữ cái!")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu phải có ít nhất 6 ký tự!")
    role = (data.role or "player").strip().lower()
    if role not in ("player", "host"):       # không cho tự đăng ký quyền admin
        raise HTTPException(status_code=400, detail="Vai trò chỉ có thể là Người chơi hoặc Chủ nhóm / Chủ sân!")

    email = data.email.strip().lower() if data.email and data.email.strip() else None
    phone = normalize_phone(data.phone) if data.phone and data.phone.strip() else None
    if not email and not phone:
        raise HTTPException(status_code=400, detail="Vui lòng nhập Email hoặc Số điện thoại để nhận mã OTP!")
    if email and not is_valid_email(email):
        raise HTTPException(status_code=400, detail="Email không hợp lệ!")
    if phone and not is_valid_phone(phone):
        raise HTTPException(status_code=400, detail="Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)!")

    if db.query(User).filter(func.lower(User.username) == username.lower()).first():
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại!")
    if email and db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email này đã được sử dụng!")
    if phone and db.query(User).filter(User.phone == phone).first():
        raise HTTPException(status_code=400, detail="Số điện thoại này đã được sử dụng!")

    user = User(
        username=username, password=hash_password(data.password), role=role,
        ho_ten=(data.ho_ten or "").strip()[:60] or username, email=email, phone=phone,
        is_verified=False, host_verified=False,
    )
    db.add(user)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Tên đăng nhập, Email hoặc Số điện thoại đã tồn tại!")
    info = issue_otp(db, user)
    db.commit()
    return {"thong_bao": "Đăng ký thành công! Vui lòng nhập mã OTP để kích hoạt tài khoản.",
            "username": user.username, **info}


def _consume_otp(db: Session, user: User, code: str) -> None:
    """Kiểm tra mã OTP mới nhất còn hiệu lực của người dùng. Đúng: đánh dấu đã dùng. Sai: tăng số lần sai (tối đa 5)."""
    otp = (db.query(OtpCode).filter(OtpCode.user_id == user.id, OtpCode.da_dung == False)  # noqa: E712
             .order_by(OtpCode.id.desc()).first())
    if otp is None or otp.het_han < now_vn():
        raise HTTPException(status_code=400, detail="Mã OTP đã hết hạn, vui lòng xin mã mới!")
    if not check_otp(SECRET_KEY, otp.dinh_danh, code or "", otp.ma_hash):
        otp.so_lan_sai += 1
        if otp.so_lan_sai >= OTP_MAX_ATTEMPTS:
            otp.da_dung = True
        left = OTP_MAX_ATTEMPTS - otp.so_lan_sai
        db.commit()
        raise HTTPException(
            status_code=400,
            detail=f"Mã OTP không đúng! Bạn còn {left} lần thử." if left > 0
            else "Bạn đã nhập sai quá nhiều lần, vui lòng xin mã mới!")
    otp.da_dung = True


@router.post("/auth/verify-otp")
def verify_otp(data: VerifyOtpIn, db: Session = Depends(get_db)):
    user = find_user_by_identifier(db, data.username)
    if user is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản!")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Tài khoản đã được xác thực, hãy đăng nhập!")
    _consume_otp(db, user, data.otp)
    user.is_verified = True
    db.commit()
    return {"thong_bao": "Xác thực thành công!", "access_token": create_access_token(user),
            "token_type": "bearer", "user": user_me(user)}


@router.post("/auth/resend-otp")
def resend_otp(data: ResendOtpIn, db: Session = Depends(get_db)):
    user = find_user_by_identifier(db, data.username)
    if user is None or user.is_verified:
        raise HTTPException(status_code=400, detail="Tài khoản không tồn tại hoặc đã được xác thực!")
    info = issue_otp(db, user)
    db.commit()
    return {"thong_bao": "Đã gửi lại mã OTP!", "username": user.username, **info}


# --- API ĐĂNG NHẬP (tên đăng nhập, email hoặc số điện thoại) ---
@router.post("/login")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    key = f"{ip}|{(form_data.username or '').strip().lower()}"
    wait = max(login_limiter.retry_after(key), ip_limiter.retry_after(ip))
    if wait:   # chống dò mật khẩu: quá 5 lần sai trong 10 phút thì tạm khóa
        raise HTTPException(status_code=429,
                            detail=f"Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau {math.ceil(wait / 60)} phút.")
    user = find_user_by_identifier(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password):
        login_limiter.fail(key)
        ip_limiter.fail(ip)
        raise HTTPException(status_code=400, detail="Sai tên đăng nhập hoặc mật khẩu!")
    login_limiter.reset(key)
    if not user.is_active:
        reason = f" Lý do: {user.lock_reason}." if user.lock_reason else ""
        raise HTTPException(status_code=403, detail="Tài khoản của bạn đã bị khóa." + reason)
    if not user.is_verified:
        raise HTTPException(status_code=403, detail={
            "code": "OTP_REQUIRED", "username": user.username,
            "message": "Tài khoản chưa xác thực OTP. Hãy nhập mã OTP đã gửi cho bạn."})
    return {"access_token": create_access_token(user), "token_type": "bearer", "user": user_me(user)}


# --- QUÊN MẬT KHẨU: nhận OTP rồi đặt lại ---
@router.post("/auth/forgot-password")
def forgot_password(data: ForgotPasswordIn, db: Session = Depends(get_db)):
    user = find_user_by_identifier(db, data.identifier)
    if user is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản với thông tin này!")
    if not user.is_verified:
        raise HTTPException(status_code=400,
                            detail="Tài khoản chưa kích hoạt. Hãy đăng nhập để nhập mã OTP kích hoạt trước.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa, vui lòng liên hệ Quản trị viên.")
    info = issue_otp(db, user)
    db.commit()
    return {"thong_bao": "Đã gửi mã OTP đặt lại mật khẩu!", "username": user.username, **info}


@router.post("/auth/reset-password")
def reset_password(data: ResetPasswordIn, db: Session = Depends(get_db)):
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 6 ký tự!")
    user = find_user_by_identifier(db, data.username)
    if user is None or not user.is_verified or not user.is_active:
        raise HTTPException(status_code=400, detail="Không thể đặt lại mật khẩu cho tài khoản này!")
    _consume_otp(db, user, data.otp)
    user.password = hash_password(data.new_password)
    db.commit()
    return {"thong_bao": "Đã đặt lại mật khẩu! Hãy đăng nhập bằng mật khẩu mới."}
