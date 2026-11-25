import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from database.database import engine, Base, DB_PATH, SQLALCHEMY_DATABASE_URL
from api import drug, ocr, profiles
from api.interactions import router as interaction_router

# Đặt REQUIRE_EXISTING_DB=1 để không âm thầm tạo CSDL rỗng khi quên đặt file DB (mặc định tắt).
if (
    os.getenv("REQUIRE_EXISTING_DB", "0").strip() == "1"
    and SQLALCHEMY_DATABASE_URL.startswith("sqlite")
    and not DB_PATH.exists()
):
    raise RuntimeError(
        f"Không tìm thấy CSDL tại {DB_PATH}. Đặt file sql_app.db đúng vị trí "
        "(hoặc trỏ SQLITE_DB_PATH tới nó) rồi khởi động lại."
    )

Base.metadata.create_all(bind=engine)

# Thêm cột mới cho CSDL cũ (chỉ thêm, có sao lưu trước khi đổi). Xem database/migrations.py.
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    from database.migrations import run_migrations

    _migration = run_migrations(DB_PATH)

    if _migration["applied"]:
        print(
            f"[DB] Đã thêm cột: {', '.join(_migration['applied'])}. "
            f"Bản sao lưu trước khi đổi: {_migration['backup']}",
            flush=True,
        )

DESCRIPTION = """
Backend tra cứu thuốc, quét đơn thuốc (PaddleOCR + Ollama/Qwen chạy local) và kiểm tra tương tác thuốc.

**Lưu ý quan trọng**
- Chỉ mang tính tham khảo, **không thay thế bác sĩ hoặc dược sĩ**.
- Kết quả OCR có thể sai: mọi mục `needs_review` / `warnings` phải được đối chiếu với đơn gốc.
- Danh mục tương tác hiện chỉ gồm các cặp **chống chỉ định** theo QĐ 5948/QĐ-BYT (xem `data_scope`).
  "Không thấy cặp nào" **không có nghĩa là an toàn**; thuốc nằm trong `not_analyzed_medicines` chưa được kiểm tra.
"""

app = FastAPI(
    title="Drug Prescription & AI Recognition API",
    version="2.1.0",
    description=DESCRIPTION,
)

_cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(drug.router)
app.include_router(ocr.router)
app.include_router(profiles.router)
app.include_router(interaction_router)

@app.get("/", include_in_schema=False)
def root():
    return {
        "message": "Drug Prescription backend",
        "docs": "/docs",
        "health": "/health",
    }


def _check_ollama():
    """Kiểm tra Ollama và model Qwen đã sẵn sàng chưa (không tải model, timeout ngắn)."""
    import requests

    base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
    info = {"base_url": base_url, "model": model, "reachable": False, "model_available": False}

    try:
        response = requests.get(f"{base_url}/api/tags", timeout=2)
        response.raise_for_status()
        names = [m.get("name", "") for m in response.json().get("models", [])]
        info["reachable"] = True
        info["model_available"] = any(n == model or n.startswith(model + ":") for n in names)
    except Exception as exc:  # noqa: BLE001
        info["error"] = type(exc).__name__

    return info


@app.get("/health", tags=["System"])
def health():
    """Trạng thái hệ thống để kiểm tra trước khi demo. 503 nếu CSDL chưa sẵn sàng."""
    database = {"ok": False}

    try:
        with engine.connect() as connection:
            def count(sql):
                return connection.execute(text(sql)).scalar() or 0

            database.update({
                "ok": True,
                "medicines": count("SELECT COUNT(*) FROM medicines"),
                "medicines_with_ingredient": count(
                    "SELECT COUNT(*) FROM medicines WHERE active_ingredient_id IS NOT NULL"
                ),
                "ingredient_links_verified": count(
                    "SELECT COUNT(*) FROM medicine_ingredients WHERE review_status = 'verified'"
                ),
                "ingredient_links_pending": count(
                    "SELECT COUNT(*) FROM medicine_ingredients WHERE review_status = 'pending_review'"
                ),
                "interaction_records": count("SELECT COUNT(*) FROM drug_interactions"),
            })
    except Exception as exc:  # noqa: BLE001
        database["error"] = f"{type(exc).__name__}: {exc}"

    import importlib.util

    ocr_ready = importlib.util.find_spec("paddleocr") is not None
    ollama = _check_ollama()

    warnings = []

    if database["ok"] and database.get("medicines", 0) == 0:
        warnings.append("Bảng medicines rỗng: chưa nạp dữ liệu thuốc.")
    if database["ok"] and database.get("interaction_records", 0) == 0:
        warnings.append("Bảng drug_interactions rỗng: kiểm tra tương tác sẽ không có dữ liệu.")
    if not ocr_ready:
        warnings.append("Chưa cài paddleocr: chức năng quét ảnh không chạy được.")
    if not ollama["reachable"]:
        warnings.append("Không kết nối được Ollama: đơn không theo bố cục bảng sẽ không xử lý được.")
    elif not ollama["model_available"]:
        warnings.append(f"Ollama chưa có model {ollama['model']} (chạy: ollama pull {ollama['model']}).")

    ready = bool(database["ok"] and database.get("medicines", 0) > 0)

    return JSONResponse(
        status_code=200 if ready else 503,
        content={
            "ready": ready,
            "version": app.version,
            "database": database,
            "ocr": {"paddleocr_installed": ocr_ready},
            "ollama": ollama,
            "warnings": warnings,
        },
    )