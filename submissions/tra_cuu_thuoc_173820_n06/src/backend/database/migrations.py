"""Di chuyển CSDL SQLite theo hướng CHỈ THÊM (ADD COLUMN / CREATE INDEX).

Không xóa, không đổi tên, không ghi đè dữ liệu có sẵn. Trước khi thay đổi lần đầu, tự sao lưu
toàn bộ CSDL bằng sqlite backup API (kèm kiểm tra toàn vẹn) cạnh file gốc.
"""
from __future__ import annotations

import sqlite3
from datetime import datetime
from pathlib import Path

# (bảng, cột, kiểu)
ADDED_COLUMNS = [
    ("image_processing_histories", "profile_id", "INTEGER"),
    ("image_processing_histories", "prescription_date", "VARCHAR(10)"),
    ("image_processing_histories", "image_sha256", "VARCHAR(64)"),
]
INDEXES = [
    ("ix_image_processing_histories_profile_id", "image_processing_histories", "profile_id"),
    ("ix_image_processing_histories_image_sha256", "image_processing_histories", "image_sha256"),
]


def _existing_columns(conn: sqlite3.Connection, table: str) -> set[str]:
    return {row[1] for row in conn.execute(f'PRAGMA table_info("{table}")')}


def pending_migrations(db_path: Path) -> list[tuple[str, str, str]]:
    conn = sqlite3.connect(db_path.as_posix())
    try:
        pending = []
        for table, column, ddl in ADDED_COLUMNS:
            columns = _existing_columns(conn, table)
            if columns and column not in columns:  # bảng chưa tồn tại sẽ do create_all tạo đủ cột
                pending.append((table, column, ddl))
        return pending
    finally:
        conn.close()


def backup_database(db_path: Path) -> Path:
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    target = db_path.with_name(f"{db_path.stem}_before_migration_{stamp}{db_path.suffix}")
    src = sqlite3.connect(f"file:{db_path.as_posix()}?mode=ro", uri=True)
    dst = sqlite3.connect(target.as_posix())
    try:
        src.backup(dst)
        status = dst.execute("PRAGMA integrity_check").fetchone()[0]
    finally:
        dst.close()
        src.close()
    if status != "ok":
        raise RuntimeError(f"Bản sao lưu không hợp lệ ({status}): {target}")
    return target


def run_migrations(db_path: Path) -> dict:
    """Áp dụng các thay đổi còn thiếu; trả về mô tả những gì đã làm (rỗng nếu không có gì)."""
    db_path = Path(db_path)
    if not db_path.is_file():
        return {"applied": [], "backup": None}

    pending = pending_migrations(db_path)
    if not pending:
        _ensure_indexes(db_path)
        return {"applied": [], "backup": None}

    backup = backup_database(db_path)
    conn = sqlite3.connect(db_path.as_posix())
    try:
        with conn:
            for table, column, ddl in pending:
                conn.execute(f'ALTER TABLE "{table}" ADD COLUMN "{column}" {ddl}')
    finally:
        conn.close()
    _ensure_indexes(db_path)
    return {"applied": [f"{t}.{c}" for t, c, _ in pending], "backup": str(backup)}


def _ensure_indexes(db_path: Path) -> None:
    conn = sqlite3.connect(db_path.as_posix())
    try:
        with conn:
            for name, table, column in INDEXES:
                if column in _existing_columns(conn, table):
                    conn.execute(f'CREATE INDEX IF NOT EXISTS "{name}" ON "{table}" ("{column}")')
    finally:
        conn.close()
