import os
from sqlalchemy import create_engine, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Lấy chuỗi kết nối từ Render (DATABASE_URL), nếu chạy ở máy local thì fallback về localhost của bạn
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:Lamvlog06@localhost:5432/cadiocare_db"
)

# Fix lỗi compatibility nếu Render cung cấp URL dạng postgres:// thay vì postgresql://
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Kiểm tra log kết nối khi khởi động app
try:
    inspector = inspect(engine)
    print("=== ĐANG KẾT NỐI DATABASE:", engine.url)
    print("=== CÁC BẢNG TRONG DB NÀY:", inspector.get_table_names())
except Exception as e:
    print("=== LỖI KẾT NỐI:", e)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency dùng để gọi session database trong các FastAPI Endpoint
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()