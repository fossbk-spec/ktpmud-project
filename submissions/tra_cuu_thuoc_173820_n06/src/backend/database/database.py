import os
import re
import unicodedata
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Đường dẫn tuyệt đối theo vị trí file (không phụ thuộc thư mục chạy uvicorn).
# Có thể ghi đè bằng DATABASE_URL hoặc SQLITE_DB_PATH.
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.getenv("SQLITE_DB_PATH") or (BASE_DIR / "sql_app.db"))
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL") or f"sqlite:///{DB_PATH.as_posix()}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)


def vn_fold(value):
    """Bỏ dấu tiếng Việt và hạ chữ thường, dùng cho tìm kiếm không phân biệt dấu."""
    if value is None:
        return ""
    text = str(value).replace("đ", "d").replace("Đ", "D")
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return text.lower()


@event.listens_for(engine, "connect")
def _register_sqlite_functions(dbapi_connection, _connection_record):
    # SQLite LOWER() chỉ xử lý ASCII; hàm này cho phép tìm "dau dau" ra "đau đầu".
    dbapi_connection.create_function("vn_fold", 1, vn_fold, deterministic=True)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
