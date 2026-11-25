import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt

# Cấu hình bảo mật JWT Token
SECRET_KEY = "cadiocare_secret_key_secure_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def get_password_hash(password: str) -> str:
    """Mã hóa mật khẩu an toàn trực tiếp bằng thư viện bcrypt chuẩn"""
    # Cắt gọn mật khẩu dưới 72 bytes để tránh lỗi giới hạn độ dài của bcrypt
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Kiểm tra khớp mật khẩu"""
    try:
        if len(plain_password.encode('utf-8')) > 72:
            plain_password = plain_password[:72]
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        # Trường hợp dự phòng nếu trong DB lưu mật khẩu dạng chuỗi thường
        return plain_password == hashed_password

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt