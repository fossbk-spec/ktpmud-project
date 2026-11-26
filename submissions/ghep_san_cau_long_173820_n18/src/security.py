import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

import models
from database import get_db

# --- CẤU HÌNH BẢO MẬT (nên đặt SECRET_KEY bằng biến môi trường khi triển khai thật) ---
SECRET_KEY = os.getenv("SECRET_KEY", "khoa_bi_mat_cua_do_an")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")
oauth2_optional = OAuth2PasswordBearer(tokenUrl="/api/login", auto_error=False)


def hash_password(password: str) -> str:
    # bcrypt chỉ dùng 72 byte đầu của mật khẩu
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72], hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(user: models.User) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user.username, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def username_from_token(token: str) -> str:
    """Giải mã vé thông hành -> username. Ném HTTPException 401 nếu sai/hết hạn."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Vé thông hành đã hết hạn, vui lòng đăng nhập lại!")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Không thể xác thực!")
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Vé thông hành không hợp lệ!")
    return username


def _load_user(token: str, db: Session) -> models.User:
    username = username_from_token(token)
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Không tìm thấy tài khoản!")
    if not user.is_active:
        reason = f" Lý do: {user.lock_reason}." if user.lock_reason else ""
        raise HTTPException(status_code=403, detail="Tài khoản của bạn đã bị khóa." + reason)
    return user


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    """Kiểm tra vé thông hành và lấy ra thông tin người dùng hiện tại."""
    return _load_user(token, db)


def get_optional_user(token: Optional[str] = Depends(oauth2_optional),
                      db: Session = Depends(get_db)) -> Optional[models.User]:
    """Dành cho API công khai: có đăng nhập thì trả về user, khách vãng lai thì trả về None."""
    if not token:
        return None
    try:
        return _load_user(token, db)
    except HTTPException:
        return None


def require_admin(user: models.User = Depends(get_current_user)) -> models.User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ Quản trị viên mới được thực hiện thao tác này!")
    return user


def require_verified_host(user: models.User = Depends(get_current_user)) -> models.User:
    """UC-02: phải là Chủ nhóm/Chủ sân đã được xác thực để tránh lừa đảo."""
    if user.role != "host":
        raise HTTPException(status_code=403, detail="Chỉ tài khoản Chủ nhóm / Chủ sân mới được tạo kèo!")
    if not user.host_verified:
        raise HTTPException(
            status_code=403,
            detail="Tài khoản chủ sân của bạn đang chờ Quản trị viên xác thực. Bạn sẽ tạo được kèo ngay khi được duyệt.",
        )
    return user
