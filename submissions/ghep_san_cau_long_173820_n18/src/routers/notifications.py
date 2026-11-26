"""Thông báo trong ứng dụng: yêu cầu mới, duyệt/từ chối, nhắc nhở trước giờ chơi, mở khóa đánh giá..."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Notification, User
from security import get_current_user
from services import notification_dict

router = APIRouter(prefix="/api", tags=["Thông báo"])


@router.get("/notifications")
def list_notifications(unread_only: bool = False, limit: int = 50, db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    unread = db.query(func.count(Notification.id)).filter(
        Notification.user_id == current_user.id, Notification.da_doc == False).scalar() or 0  # noqa: E712
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.da_doc == False)  # noqa: E712
    items = query.order_by(Notification.id.desc()).limit(max(1, min(limit, 200))).all()
    return {"unread": unread, "data": [notification_dict(n) for n in items]}


@router.post("/notifications/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.da_doc == False).update(  # noqa: E712
        {Notification.da_doc: True}, synchronize_session=False)
    db.commit()
    return {"thong_bao": "Đã đánh dấu tất cả là đã đọc."}


@router.post("/notifications/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    n = db.query(Notification).filter(Notification.id == notification_id,
                                      Notification.user_id == current_user.id).first()
    if n is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo!")
    n.da_doc = True
    db.commit()
    return {"thong_bao": "OK"}
