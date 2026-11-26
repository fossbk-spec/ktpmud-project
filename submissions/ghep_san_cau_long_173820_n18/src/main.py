"""Badminton Connect - Backend FastAPI.

Chạy:  uvicorn main:app --reload
Mở:    http://127.0.0.1:8000        (giao diện)   |   http://127.0.0.1:8000/docs   (tài liệu API)
"""
import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import SessionLocal, init_db
from models import User
from realtime import hub
from routers import admin, auth, bookings, courts, notifications, reports, reviews, users
from security import username_from_token
from seed import ensure_admin, seed_demo
from services import run_scheduled_jobs

log = logging.getLogger("badminton")
SCHEDULER_INTERVAL_SECONDS = int(os.getenv("SCHEDULER_INTERVAL_SECONDS", "60"))
FRONTEND_DIR = Path(__file__).resolve().parent / "frontend"


def _run_jobs_once():
    with SessionLocal() as db:
        return run_scheduled_jobs(db)


async def scheduler_loop():
    """Mỗi phút: gửi Reminder trước giờ chơi, mở khóa đánh giá sau trận, dọn yêu cầu bị bỏ quên."""
    while True:
        try:
            await asyncio.to_thread(_run_jobs_once)
        except Exception:
            log.exception("Tác vụ định kỳ gặp lỗi")
        await asyncio.sleep(SCHEDULER_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Tạo file badminton.db và các bảng nếu chưa có (tự chuyển dữ liệu từ bản cũ nếu gặp)
    backup = init_db()
    if backup:
        print(f"[migrate] Đã chuyển dữ liệu từ CSDL cũ sang cấu trúc mới. Bản sao lưu: {backup}")
    with SessionLocal() as db:
        ensure_admin(db)
        if os.getenv("SEED_DEMO", "1") == "1":
            seed_demo(db)
    hub.bind_loop(asyncio.get_running_loop())
    task = None
    if os.getenv("DISABLE_SCHEDULER") != "1":
        task = asyncio.create_task(scheduler_loop())
    yield
    if task is not None:
        task.cancel()


app = FastAPI(title="Badminton Connect API", version="2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cho phép mọi trang web gọi API (phù hợp khi phát triển)
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (auth, users, courts, bookings, reviews, notifications, reports, admin):
    app.include_router(module.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "message": "Server đã kết nối Database thành công!"}


def _user_id_by_username(username: str) -> Optional[int]:
    with SessionLocal() as db:
        user = db.query(User).filter(User.username == username, User.is_active == True).first()  # noqa: E712
        return user.id if user else None


# NFR-01: kênh thời gian thực. Khách vãng lai nhận cập nhật slot; người đã đăng nhập (?token=...) nhận thêm thông báo riêng.
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = None):
    user_id = None
    if token:
        try:
            user_id = await asyncio.to_thread(_user_id_by_username, username_from_token(token))
        except Exception:
            user_id = None
    await hub.connect(websocket, user_id)
    try:
        await websocket.send_json({"type": "hello", "authenticated": user_id is not None})
        while True:
            await websocket.receive_text()   # giữ kết nối (client gửi "ping" định kỳ)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        hub.disconnect(websocket)


# Phục vụ giao diện (thư mục frontend/) tại "/" - đặt SAU các route API
if FRONTEND_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)