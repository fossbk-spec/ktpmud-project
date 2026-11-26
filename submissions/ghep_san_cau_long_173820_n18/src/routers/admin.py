"""Quản trị viên (Admin): quản lý dữ liệu, khóa tài khoản vi phạm, xác thực chủ sân, xử lý báo cáo & tranh chấp."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Booking, Court, Payment, Report, Review, User
from rules import LY_DO_BAO_CAO, now_vn, strip_accents
from schemas import LockIn, ResolveReportIn
from security import require_admin
from services import cancel_court, court_summary, courts_to_dicts, notify, user_public

router = APIRouter(prefix="/api/admin", tags=["Quản trị viên"], dependencies=[Depends(require_admin)])


def _admin_user(u: User) -> dict:
    d = user_public(u)
    d.update({"email": u.email, "phone": u.phone, "is_active": bool(u.is_active),
              "is_verified": bool(u.is_verified), "lock_reason": u.lock_reason,
              "created_at": u.created_at.isoformat()})
    return d


def _get_user(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng!")
    return user


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    def count(query) -> int:
        return query.scalar() or 0

    today = now_vn().date()
    deposit = db.query(func.coalesce(func.sum(Payment.so_tien), 0)).filter(Payment.trang_thai == "paid").scalar() or 0
    return {
        "nguoi_dung": {
            "tong": count(db.query(func.count(User.id))),
            "player": count(db.query(func.count(User.id)).filter(User.role == "player")),
            "host": count(db.query(func.count(User.id)).filter(User.role == "host")),
            "bi_khoa": count(db.query(func.count(User.id)).filter(User.is_active == False)),  # noqa: E712
            "host_cho_xac_thuc": count(db.query(func.count(User.id)).filter(
                User.role == "host", User.host_verified == False)),  # noqa: E712
        },
        "keo": {
            "tong": count(db.query(func.count(Court.id))),
            "dang_mo": count(db.query(func.count(Court.id)).filter(
                Court.trang_thai == "open", Court.ngay_choi >= today)),
            "da_huy": count(db.query(func.count(Court.id)).filter(Court.trang_thai == "cancelled")),
        },
        "booking": {s: count(db.query(func.count(Booking.id)).filter(Booking.trang_thai == s))
                    for s in ("pending", "approved", "rejected", "cancelled")},
        "bao_cao_dang_cho": count(db.query(func.count(Report.id)).filter(Report.trang_thai == "open")),
        "danh_gia": count(db.query(func.count(Review.id))),
        "luot_bung_keo": count(db.query(func.count(Review.id)).filter(Review.bung_keo == True)),  # noqa: E712
        "tien_coc_dang_giu": deposit,
    }


@router.get("/users")
def list_users(q: Optional[str] = None, role: Optional[str] = None, status: Optional[str] = None,
               db: Session = Depends(get_db)):
    query = db.query(User)
    if role in ("player", "host", "admin"):
        query = query.filter(User.role == role)
    if status == "locked":
        query = query.filter(User.is_active == False)  # noqa: E712
    elif status == "pending_host":
        query = query.filter(User.role == "host", User.host_verified == False)  # noqa: E712
    elif status == "no_show":
        query = query.filter(User.so_bung_keo > 0)
    users = query.order_by(User.id.desc()).limit(500).all()
    if q and q.strip():
        key = strip_accents(q)
        users = [u for u in users if key in strip_accents(
            " ".join(filter(None, [u.username, u.ho_ten, u.email, u.phone])))]
    return {"so_luong": len(users), "data": [_admin_user(u) for u in users]}


@router.post("/users/{user_id}/lock")
def lock_user(user_id: int, data: Optional[LockIn] = None, db: Session = Depends(get_db),
              admin: User = Depends(require_admin)):
    user = _get_user(db, user_id)
    if user.id == admin.id or user.role == "admin":
        raise HTTPException(status_code=400, detail="Không thể khóa tài khoản Quản trị viên!")
    user.is_active = False
    user.lock_reason = ((data.ly_do if data else "") or "").strip()[:200] or "Vi phạm quy định cộng đồng"
    db.commit()
    return {"thong_bao": f"Đã khóa tài khoản {user.username}.", "user": _admin_user(user)}


@router.post("/users/{user_id}/unlock")
def unlock_user(user_id: int, db: Session = Depends(get_db)):
    user = _get_user(db, user_id)
    user.is_active = True
    user.lock_reason = None
    db.commit()
    return {"thong_bao": f"Đã mở khóa tài khoản {user.username}.", "user": _admin_user(user)}


@router.post("/users/{user_id}/verify-host")
def verify_host(user_id: int, db: Session = Depends(get_db)):
    user = _get_user(db, user_id)
    if user.role != "host":
        raise HTTPException(status_code=400, detail="Người dùng này chưa đăng ký làm Chủ nhóm / Chủ sân!")
    user.host_verified = True
    notify(db, user.id, "host_verified", "Tài khoản chủ sân đã được xác thực",
           "Bạn có thể tạo kèo ghép sân ngay bây giờ.")
    db.commit()
    return {"thong_bao": f"Đã xác thực chủ sân {user.username}.", "user": _admin_user(user)}


@router.post("/users/{user_id}/revoke-host")
def revoke_host(user_id: int, db: Session = Depends(get_db)):
    user = _get_user(db, user_id)
    if user.role != "host":
        raise HTTPException(status_code=400, detail="Người dùng này không phải Chủ nhóm / Chủ sân!")
    user.host_verified = False
    notify(db, user.id, "host_revoked", "Tài khoản chủ sân bị thu hồi xác thực",
           "Bạn tạm thời không thể tạo kèo mới. Vui lòng liên hệ Quản trị viên.")
    db.commit()
    return {"thong_bao": f"Đã thu hồi xác thực của {user.username}.", "user": _admin_user(user)}


@router.get("/courts")
def list_courts(q: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db),
                admin: User = Depends(require_admin)):
    query = db.query(Court).options(joinedload(Court.host))
    if status == "cancelled":
        query = query.filter(Court.trang_thai == "cancelled")
    elif status == "upcoming":
        query = query.filter(Court.trang_thai != "cancelled", Court.ngay_choi >= now_vn().date())
    courts = query.order_by(Court.id.desc()).limit(300).all()
    if q and q.strip():
        key = strip_accents(q)
        courts = [c for c in courts if key in strip_accents(
            " ".join(filter(None, [c.ten_san, c.dia_chi, c.khu_vuc, c.host.ho_ten, c.host.username])))]
    return {"so_luong": len(courts), "data": courts_to_dicts(db, courts, admin, with_pending=True)}


def _report_dict(r: Report) -> dict:
    return {
        "id": r.id, "ly_do": r.ly_do, "ly_do_text": LY_DO_BAO_CAO.get(r.ly_do, r.ly_do), "mo_ta": r.mo_ta,
        "trang_thai": r.trang_thai, "ghi_chu_admin": r.ghi_chu_admin, "created_at": r.created_at.isoformat(),
        "handled_at": r.handled_at.isoformat() if r.handled_at else None,
        "reporter": user_public(r.reporter), "target_user": user_public(r.target_user),
        "court": court_summary(r.court) if r.court else None,
    }


@router.get("/reports")
def list_reports(status: str = "open", db: Session = Depends(get_db)):
    query = db.query(Report)
    if status in ("open", "resolved", "dismissed"):
        query = query.filter(Report.trang_thai == status)
    reports = query.order_by(Report.id.desc()).limit(200).all()
    return {"so_luong": len(reports), "data": [_report_dict(r) for r in reports]}


# Xử lý báo cáo / tranh chấp: bác bỏ hoặc xác nhận vi phạm (có thể kèm khóa tài khoản, hủy kèo)
@router.post("/reports/{report_id}/resolve")
def resolve_report(report_id: int, data: ResolveReportIn, db: Session = Depends(get_db),
                   admin: User = Depends(require_admin)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy báo cáo!")
    if report.trang_thai != "open":
        raise HTTPException(status_code=409, detail="Báo cáo này đã được xử lý!")
    if data.quyet_dinh not in ("resolved", "dismissed"):
        raise HTTPException(status_code=400, detail="Quyết định phải là 'resolved' hoặc 'dismissed'!")

    note = (data.ghi_chu_admin or "").strip()[:500] or None
    actions = []
    if data.quyet_dinh == "resolved":
        court = report.court
        if data.huy_keo and court is not None and court.trang_thai != "cancelled" and court.ket_thuc > now_vn():
            cancel_court(db, admin, court, "Kèo vi phạm quy định cộng đồng")
            actions.append("hủy kèo")
        target = report.target_user
        if data.khoa_nguoi_bi_bao_cao and target is not None and target.role != "admin":
            target.is_active = False
            target.lock_reason = note or LY_DO_BAO_CAO.get(report.ly_do, "Vi phạm quy định cộng đồng")
            actions.append("khóa tài khoản")
        if target is not None and target.is_active:
            notify(db, target.id, "warning", "Bạn nhận được cảnh báo vi phạm",
                   f"Quản trị viên đã xác nhận một báo cáo liên quan đến bạn ({LY_DO_BAO_CAO.get(report.ly_do, '')})."
                   + (f" Ghi chú: {note}" if note else ""))

    report.trang_thai = data.quyet_dinh
    report.ghi_chu_admin = note
    report.handled_by = admin.id
    report.handled_at = now_vn()
    verdict = "đã được xác nhận và xử lý" if data.quyet_dinh == "resolved" else "đã được xem xét nhưng chưa đủ căn cứ vi phạm"
    notify(db, report.reporter_id, "report_result", "Báo cáo của bạn đã được xử lý",
           f"Báo cáo của bạn {verdict}." + (f" Ghi chú: {note}" if note else ""))
    db.commit()
    return {"thong_bao": "Đã xử lý báo cáo.", "hanh_dong": actions, "report": _report_dict(report)}
