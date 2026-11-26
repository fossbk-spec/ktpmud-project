"""Báo cáo vi phạm: người dùng gửi, Quản trị viên xử lý (xem routers/admin.py)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Court, Report, User
from rules import LY_DO_BAO_CAO
from schemas import ReportIn
from security import get_current_user
from services import notify_admins

router = APIRouter(prefix="/api", tags=["Báo cáo vi phạm"])


@router.post("/reports")
def create_report(data: ReportIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.ly_do not in LY_DO_BAO_CAO:
        raise HTTPException(status_code=400, detail="Vui lòng chọn lý do báo cáo hợp lệ!")
    target_id = data.target_user_id
    court = None
    if data.court_id is not None:
        court = db.query(Court).filter(Court.id == data.court_id).first()
        if court is None:
            raise HTTPException(status_code=404, detail="Không tìm thấy kèo cần báo cáo!")
        if target_id is None:
            target_id = court.host_id
    if target_id is None:
        raise HTTPException(status_code=400, detail="Hãy chọn người dùng hoặc kèo cần báo cáo!")
    if target_id == current_user.id:
        raise HTTPException(status_code=400, detail="Bạn không thể tự báo cáo chính mình!")
    target = db.query(User).filter(User.id == target_id).first()
    if target is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng cần báo cáo!")

    duplicate = db.query(Report).filter(
        Report.reporter_id == current_user.id, Report.target_user_id == target_id,
        Report.court_id == data.court_id, Report.trang_thai == "open").first()
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="Bạn đã gửi báo cáo này rồi, Quản trị viên đang xem xét!")

    report = Report(reporter_id=current_user.id, target_user_id=target_id, court_id=data.court_id,
                    ly_do=data.ly_do, mo_ta=(data.mo_ta or "").strip()[:1000] or None)
    db.add(report)
    db.flush()
    notify_admins(db, "Có báo cáo vi phạm mới",
                  f"{current_user.ho_ten or current_user.username} báo cáo {target.ho_ten or target.username}: "
                  f"{LY_DO_BAO_CAO[data.ly_do]}.", loai="report")
    db.commit()
    return {"thong_bao": "Đã gửi báo cáo cho Quản trị viên. Cảm ơn bạn đã giúp cộng đồng an toàn hơn!",
            "id": report.id}
