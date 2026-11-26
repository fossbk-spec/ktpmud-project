"""Đẩy dữ liệu thời gian thực (NFR-01) qua WebSocket.

Các endpoint đồng bộ của FastAPI chạy trong thread pool nên không thể `await` trực tiếp;
`publish()` an toàn khi gọi từ bất kỳ thread nào (nó nhờ event loop chính gửi giúp).
"""
import asyncio
from typing import Dict, Optional

from fastapi import WebSocket


class RealtimeHub:
    def __init__(self):
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self.clients: Dict[WebSocket, Optional[int]] = {}   # websocket -> user_id (None = khách)

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self.loop = loop

    async def connect(self, ws: WebSocket, user_id: Optional[int]) -> None:
        await ws.accept()
        self.clients[ws] = user_id

    def disconnect(self, ws: WebSocket) -> None:
        self.clients.pop(ws, None)

    async def _send(self, message: dict, user_id: Optional[int]) -> None:
        for ws, uid in list(self.clients.items()):
            if user_id is not None and uid != user_id:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                self.clients.pop(ws, None)

    def publish(self, message: dict, user_id: Optional[int] = None) -> None:
        """Gửi cho tất cả (user_id=None) hoặc riêng một người dùng. Không làm gì nếu server chưa khởi động."""
        loop = self.loop
        if loop is None or loop.is_closed():
            return
        try:
            asyncio.run_coroutine_threadsafe(self._send(message, user_id), loop)
        except RuntimeError:
            pass


hub = RealtimeHub()
