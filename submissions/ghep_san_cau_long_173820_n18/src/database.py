import os
from typing import Optional

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

# File CSDL badminton.db nằm ngay trong thư mục dự án (đổi bằng biến môi trường DATABASE_URL nếu cần)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./badminton.db")
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
IS_SQLITE = SQLALCHEMY_DATABASE_URL.startswith("sqlite")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30} if IS_SQLITE else {},
)

if IS_SQLITE:
    @event.listens_for(engine, "connect")
    def _sqlite_pragmas(dbapi_connection, connection_record):
        cur = dbapi_connection.cursor()
        cur.execute("PRAGMA foreign_keys=ON")      # bật ràng buộc khóa ngoại
        cur.execute("PRAGMA journal_mode=WAL")     # đọc/ghi đồng thời tốt hơn (NFR-01, NFR-03)
        cur.execute("PRAGMA busy_timeout=30000")   # chờ tối đa 30s khi có tiến trình khác đang ghi
        cur.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Tạo kết nối DB cho mỗi lần gọi API."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def sqlite_file_path() -> Optional[str]:
    if not IS_SQLITE:
        return None
    path = SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "", 1)
    return None if path in ("", ":memory:") else path


def init_db() -> Optional[str]:
    """Tạo bảng nếu chưa có. Nếu gặp file badminton.db phiên bản cũ thì sao lưu rồi chuyển dữ liệu sang cấu trúc mới.

    Trả về đường dẫn file sao lưu (nếu có migrate), ngược lại trả về None.
    """
    import models  # noqa: F401  (đăng ký các bảng vào Base.metadata)
    import legacy_migration

    path = sqlite_file_path()
    backup = legacy_migration.backup_legacy_db(path) if path else None
    Base.metadata.create_all(bind=engine)
    if backup:
        data = legacy_migration.convert(legacy_migration.read_legacy(backup))
        with SessionLocal() as db:
            legacy_migration.import_into_db(db, data)
    return backup
