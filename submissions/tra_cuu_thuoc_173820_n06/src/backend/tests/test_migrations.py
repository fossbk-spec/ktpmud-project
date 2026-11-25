import sqlite3

from database.migrations import pending_migrations, run_migrations


def _old_db(path):
    conn = sqlite3.connect(path)
    conn.execute("CREATE TABLE image_processing_histories (id INTEGER PRIMARY KEY, operation_type TEXT, result_text TEXT)")
    conn.execute("INSERT INTO image_processing_histories (operation_type, result_text) VALUES ('prescription_ocr', 'giữ nguyên')")
    conn.commit()
    conn.close()


def test_migration_adds_columns_keeps_data_and_backs_up(tmp_path):
    db = tmp_path / "app.db"
    _old_db(db)

    result = run_migrations(db)

    assert set(result["applied"]) == {
        "image_processing_histories.profile_id",
        "image_processing_histories.prescription_date",
        "image_processing_histories.image_sha256",
    }
    assert result["backup"] and (tmp_path / result["backup"].split("/")[-1].split("\\")[-1]).exists()

    conn = sqlite3.connect(db)
    assert conn.execute("SELECT result_text FROM image_processing_histories").fetchone()[0] == "giữ nguyên"
    backup = sqlite3.connect(result["backup"])
    assert "profile_id" not in {r[1] for r in backup.execute("PRAGMA table_info(image_processing_histories)")}


def test_migration_is_idempotent(tmp_path):
    db = tmp_path / "app.db"
    _old_db(db)
    run_migrations(db)

    assert pending_migrations(db) == []
    assert run_migrations(db) == {"applied": [], "backup": None}
