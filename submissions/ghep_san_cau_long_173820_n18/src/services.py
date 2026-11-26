"""Tầng nghiệp vụ của hệ thống: ghép sân, khóa luồng chống overbooking, thanh toán cọc (giả lập),
thông báo, điểm uy tín và các tác vụ định kỳ (Reminder, mở khóa đánh giá).
"""
import logging
import os
import secrets
from datetime import timedelta
from typing import Dict, List, Optional

from fastapi import HTTPException
from sqlalchemy import event, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Booking, Court, Notification, OtpCode, Payment, Review, User
from realtime import hub
from rules import (
    ACTIVE_BOOKING, BOOKING_STATUS_TEXT, COURT_STATUS_TEXT, MAX_SLOT_PER_BOOKING, OTP_RESEND_SECONDS,
    OTP_TTL_MINUTES, PAYMENT_STATUS_TEXT, PHUONG_THUC_TT, REMINDER_BEFORE_MINUTES, court_display_status,
    generate_otp, hash_otp, level_name, level_range_label, mask_identifier, now_vn, refund_on_player_cancel,
    reputation_label,
)
from security import SECRET_KEY

log = logging.getLogger("badminton")

# OTP giả lập: mã được in ra console và (nếu OTP_DEV_MODE=1) trả về trong API để demo không cần SMS/Email.
OTP_DEV_MODE = os.getenv("OTP_DEV_MODE", "1") == "1"


# ===========================================================================
# Đẩy dữ liệu thời gian thực: gom vào hàng đợi và chỉ gửi SAU KHI commit thành công
# ===========================================================================
def push(db: Session, message: dict, user_id: Optional[int] = None) -> None:
    db.info.setdefault("push_queue", []).append((message, user_id))


@event.listens_for(SessionLocal, "after_commit")
def _flush_push_queue(session):
    for message, user_id in session.info.pop("push_queue", []):
        hub.publish(message, user_id)


@event.listens_for(SessionLocal, "after_rollback")
def _drop_push_queue(session):
    session.info.pop("push_queue", None)


# ===========================================================================
# Thông báo
# ===========================================================================
def notification_dict(n: Notification) -> dict:
    return {
        "id": n.id, "loai": n.loai, "tieu_de": n.tieu_de, "noi_dung": n.noi_dung,
        "court_id": n.court_id, "booking_id": n.booking_id, "da_doc": bool(n.da_doc),
        "created_at": n.created_at.isoformat(),
    }


def notify(db: Session, user_id: int, loai: str, tieu_de: str, noi_dung: Optional[str] = None,
           court_id: Optional[int] = None, booking_id: Optional[int] = None) -> Notification:
    n = Notification(user_id=user_id, loai=loai, tieu_de=tieu_de, noi_dung=noi_dung,
                     court_id=court_id, booking_id=booking_id, created_at=now_vn())
    db.add(n)
    db.flush()
    push(db, {"type": "notification", "notification": notification_dict(n)}, user_id)
    return n


def notify_admins(db: Session, tieu_de: str, noi_dung: str, loai: str = "admin") -> None:
    for (uid,) in db.query(User.id).filter(User.role == "admin", User.is_active == True).all():  # noqa: E712
        notify(db, uid, loai, tieu_de, noi_dung)


# ===========================================================================
# Serializer: chuyển đối tượng DB thành JSON. KHÔNG bao giờ để lộ email / số điện thoại ở đây (NFR-04)
# ===========================================================================
def fmt_range(c: Court) -> str:
    return f"{c.gio_bat_dau.strftime('%H:%M')} - {c.gio_ket_thuc.strftime('%H:%M')} ngày {c.ngay_choi.strftime('%d/%m')}"


def user_public(u: Optional[User]) -> Optional[dict]:
    if u is None:
        return None
    code, text = reputation_label(u.diem_uy_tin or 0, u.so_danh_gia or 0, u.so_bung_keo or 0)
    return {
        "id": u.id, "username": u.username, "ho_ten": u.ho_ten or u.username, "role": u.role,
        "trinh_do": u.trinh_do, "trinh_do_label": level_name(u.trinh_do),
        "khu_vuc_thuong_choi": u.khu_vuc_thuong_choi, "host_verified": bool(u.host_verified),
        "diem_uy_tin": round(u.diem_uy_tin or 0, 2), "so_danh_gia": u.so_danh_gia or 0,
        "so_bung_keo": u.so_bung_keo or 0, "nhan_uy_tin": code, "nhan_uy_tin_text": text,
    }


def user_me(u: User) -> dict:
    d = user_public(u)
    d.update({"email": u.email, "phone": u.phone, "is_verified": bool(u.is_verified),
              "is_active": bool(u.is_active), "created_at": u.created_at.isoformat()})
    return d


def court_status(c: Court, now=None) -> str:
    return court_display_status(c.trang_thai, c.slot_trong, c.bat_dau, c.ket_thuc, now or now_vn())


def court_summary(c: Court, now=None) -> dict:
    status = court_status(c, now)
    return {
        "id": c.id, "ten_san": c.ten_san, "dia_chi": c.dia_chi, "khu_vuc": c.khu_vuc,
        "ngay_choi": c.ngay_choi.isoformat(), "gio_bat_dau": c.gio_bat_dau.strftime("%H:%M"),
        "gio_ket_thuc": c.gio_ket_thuc.strftime("%H:%M"), "trinh_min": c.trinh_min, "trinh_max": c.trinh_max,
        "trinh_do": level_range_label(c.trinh_min, c.trinh_max),
        "trang_thai_hien_thi": status, "nhan_trang_thai": COURT_STATUS_TEXT[status],
    }


def serialize_court(c: Court, viewer: Optional[User] = None, my_booking: Optional[Booking] = None,
                    so_cho_duyet: Optional[int] = None, now=None) -> dict:
    d = court_summary(c, now)
    d.update({
        "gia_thue": c.gia_thue, "tien_coc": c.tien_coc, "tong_slot": c.tong_slot, "slot_trong": c.slot_trong,
        "ghi_chu": c.ghi_chu, "vi_do": c.vi_do, "kinh_do": c.kinh_do, "trang_thai": c.trang_thai,
        "host": user_public(c.host),
        "is_owner": bool(viewer and viewer.id == c.host_id),
        "my_booking": None if my_booking is None else {
            "id": my_booking.id, "trang_thai": my_booking.trang_thai,
            "nhan": BOOKING_STATUS_TEXT[my_booking.trang_thai]},
    })
    if so_cho_duyet is not None:
        d["so_cho_duyet"] = so_cho_duyet
    return d


def courts_to_dicts(db: Session, courts: List[Court], viewer: Optional[User] = None,
                    with_pending: bool = False) -> List[dict]:
    """Chuyển danh sách kèo thành JSON, kèm trạng thái yêu cầu của người đang xem (my_booking)."""
    ids = [c.id for c in courts]
    mine: Dict[int, Booking] = {}
    pending: Dict[int, int] = {}
    if viewer is not None and ids:
        rows = db.query(Booking).filter(
            Booking.user_id == viewer.id, Booking.court_id.in_(ids),
            Booking.trang_thai.in_(("pending", "approved", "rejected"))).all()
        for b in rows:
            cur = mine.get(b.court_id)
            if cur is None or (cur.trang_thai == "rejected" and b.trang_thai != "rejected"):
                mine[b.court_id] = b
    if with_pending and ids:
        rows = (db.query(Booking.court_id, func.count(Booking.id))
                  .filter(Booking.court_id.in_(ids), Booking.trang_thai == "pending")
                  .group_by(Booking.court_id).all())
        pending = {cid: n for cid, n in rows}
    now = now_vn()
    return [serialize_court(c, viewer, mine.get(c.id), pending.get(c.id, 0) if with_pending else None, now)
            for c in courts]


def payment_dict(p: Optional[Payment]) -> Optional[dict]:
    if p is None:
        return None
    return {
        "so_tien": p.so_tien, "phuong_thuc": p.phuong_thuc,
        "phuong_thuc_text": PHUONG_THUC_TT.get(p.phuong_thuc, p.phuong_thuc),
        "trang_thai": p.trang_thai, "trang_thai_text": PAYMENT_STATUS_TEXT.get(p.trang_thai, p.trang_thai),
        "ma_giao_dich": p.ma_giao_dich,
    }


def serialize_my_booking(b: Booking, reviewed_ids: set, now) -> dict:
    """Một dòng trong 'Lịch chơi' của người chơi (FR-09). Số điện thoại chủ nhóm chỉ hiện khi đã được duyệt (NFR-04)."""
    c = b.court_info
    approved = b.trang_thai == "approved"
    status = court_status(c, now)
    can_cancel = b.trang_thai in ACTIVE_BOOKING and c.bat_dau > now
    return {
        "ma_don_hang": b.id, "court_id": c.id, "ten_san": c.ten_san, "khu_vuc": c.khu_vuc, "dia_chi": c.dia_chi,
        "ngay_choi": c.ngay_choi.isoformat(), "gio_bat_dau": c.gio_bat_dau.strftime("%H:%M"),
        "gio_ket_thuc": c.gio_ket_thuc.strftime("%H:%M"), "vi_do": c.vi_do, "kinh_do": c.kinh_do,
        "so_luong_slot_da_dat": b.so_luong, "tong_tien_tam_tinh": (c.gia_thue or 0) * b.so_luong,
        "trang_thai": b.trang_thai, "nhan_trang_thai": BOOKING_STATUS_TEXT[b.trang_thai],
        "trang_thai_keo": status, "nhan_trang_thai_keo": COURT_STATUS_TEXT[status],
        "loi_nhan": b.loi_nhan, "created_at": b.created_at.isoformat(),
        "host": user_public(c.host), "host_phone": c.host.phone if approved else None,
        "thanh_toan": payment_dict(b.payment),
        "co_the_huy": can_cancel,
        "se_duoc_hoan_coc": refund_on_player_cancel(b.trang_thai, c.bat_dau, now) if can_cancel else None,
        "co_the_danh_gia": approved and status == "finished" and b.id not in reviewed_ids,
        "da_danh_gia": b.id in reviewed_ids,
    }


def serialize_request(b: Booking, now) -> dict:
    """Một yêu cầu tham gia hiển thị cho chủ nhóm (FR-05). Số điện thoại người chơi chỉ hiện khi đã duyệt (NFR-04)."""
    c, p = b.court_info, b.user
    player = user_public(p)
    player["phone"] = p.phone if b.trang_thai == "approved" else None
    return {
        "id": b.id, "court_id": c.id, "trang_thai": b.trang_thai, "nhan_trang_thai": BOOKING_STATUS_TEXT[b.trang_thai],
        "so_luong": b.so_luong, "loi_nhan": b.loi_nhan, "created_at": b.created_at.isoformat(),
        "player": player, "lech_trinh_do": not (c.trinh_min <= (p.trinh_do or 1) <= c.trinh_max),
        "thanh_toan": payment_dict(b.payment), "court": court_summary(c, now),
    }


# ===========================================================================
# Điểm uy tín (FR-11): hệ thống tự cập nhật sau mỗi lượt đánh giá
# ===========================================================================
def recalc_reputation(db: Session, user_id: int) -> None:
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        return
    reviews = db.query(Review).filter(Review.reviewee_id == user_id).all()
    n = len(reviews)
    user.so_danh_gia = n
    user.diem_uy_tin = round(sum(r.diem for r in reviews) / n, 2) if n else 0.0
    user.so_bung_keo = sum(1 for r in reviews if r.bung_keo)


# ===========================================================================
# KHÓA LUỒNG (NFR-03): mọi thay đổi số slot đều là UPDATE có điều kiện, nguyên tử trong DB.
# Hai người bấm vào slot cuối cùng cùng lúc -> chỉ MỘT câu UPDATE khớp điều kiện (rowcount = 1).
# ===========================================================================
def reserve_slots(db: Session, court: Court, n: int) -> bool:
    rows = (db.query(Court)
              .filter(Court.id == court.id, Court.trang_thai == "open", Court.slot_trong >= n)
              .update({Court.slot_trong: Court.slot_trong - n}, synchronize_session=False))
    db.refresh(court)
    return rows == 1


def release_slots(db: Session, court: Court, n: int) -> None:
    db.query(Court).filter(Court.id == court.id).update(
        {Court.slot_trong: Court.slot_trong + n}, synchronize_session=False)
    db.refresh(court)


def transition(db: Session, booking: Booking, allowed_from: tuple, to_state: str) -> bool:
    """Đổi trạng thái booking bằng UPDATE có điều kiện: tránh hoàn slot 2 lần khi Host từ chối
    và Player hủy cùng lúc."""
    rows = (db.query(Booking)
              .filter(Booking.id == booking.id, Booking.trang_thai.in_(allowed_from))
              .update({Booking.trang_thai: to_state, Booking.updated_at: now_vn()}, synchronize_session=False))
    if rows == 1:
        db.refresh(booking)
    return rows == 1


def new_txn_code() -> str:
    return "TXN" + now_vn().strftime("%y%m%d%H%M%S") + secrets.token_hex(3).upper()


def settle_payment(db: Session, booking: Booking, refund: bool) -> None:
    """Hoàn cọc (refunded) hoặc giữ cọc (forfeited) cho một booking."""
    p = db.query(Payment).filter(Payment.booking_id == booking.id, Payment.trang_thai == "paid").first()
    if p is not None:
        p.trang_thai = "refunded" if refund else "forfeited"
        p.updated_at = now_vn()


def push_court_update(db: Session, court: Court) -> None:
    push(db, {"type": "court_update", "court": {
        "id": court.id, "slot_trong": court.slot_trong, "tong_slot": court.tong_slot,
        "trang_thai": court.trang_thai, "trang_thai_hien_thi": court_status(court)}})


def ensure_owner_or_admin(actor: User, court: Court, allow_admin: bool = True) -> None:
    if court.host_id == actor.id or (allow_admin and actor.role == "admin"):
        return
    raise HTTPException(status_code=403, detail="Bạn không phải chủ của kèo này!")


# ===========================================================================
# UC-01: Đăng ký ghép sân
# ===========================================================================
def create_booking(db: Session, user: User, court_id: int, so_luong: int,
                   loi_nhan: Optional[str], phuong_thuc: Optional[str]) -> Booking:
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Quản trị viên không thể tham gia ghép sân!")
    if so_luong < 1 or so_luong > MAX_SLOT_PER_BOOKING:
        raise HTTPException(status_code=400, detail=f"Số chỗ đăng ký phải từ 1 đến {MAX_SLOT_PER_BOOKING}!")
    now = now_vn()
    court = db.query(Court).filter(Court.id == court_id).first()
    if not court:
        raise HTTPException(status_code=404, detail="Không tìm thấy sân!")
    if court.host_id == user.id:
        raise HTTPException(status_code=400, detail="Bạn không thể xin tham gia kèo do chính mình tạo!")
    if court.trang_thai == "cancelled":
        raise HTTPException(status_code=400, detail="Kèo này đã bị chủ sân hủy!")
    if court.trang_thai == "closed":
        raise HTTPException(status_code=409, detail="Chủ sân đã đóng kèo (đã đủ người)!")
    if court.bat_dau <= now:
        raise HTTPException(status_code=400, detail="Kèo đã bắt đầu hoặc đã kết thúc, không thể đăng ký!")

    old = db.query(Booking).filter(
        Booking.user_id == user.id, Booking.court_id == court.id,
        Booking.trang_thai.in_(("pending", "approved", "rejected"))).first()
    if old is not None:
        msg = {"pending": "Bạn đã gửi yêu cầu cho kèo này, hãy chờ chủ sân duyệt!",
               "approved": "Bạn đã được duyệt vào kèo này rồi!",
               "rejected": "Chủ sân đã từ chối yêu cầu của bạn cho kèo này."}[old.trang_thai]
        raise HTTPException(status_code=409, detail=msg)

    amount = float(court.tien_coc or 0) * so_luong
    if amount > 0 and phuong_thuc not in PHUONG_THUC_TT:
        raise HTTPException(status_code=400, detail="Kèo này yêu cầu đặt cọc, vui lòng chọn phương thức thanh toán!")

    # 1) Khóa luồng: trừ slot bằng UPDATE có điều kiện. Nếu có người chốt slot cuối trước vài mili-giây
    #    thì rowcount = 0 -> từ chối, KHÔNG trừ slot, báo "Đã kín chỗ" (ngoại lệ của UC-01).
    if not reserve_slots(db, court, so_luong):
        db.rollback()
        db.refresh(court)
        if court.slot_trong > 0:
            raise HTTPException(status_code=409,
                                detail=f"Chỉ còn {court.slot_trong} chỗ, không đủ {so_luong} chỗ bạn chọn!")
        raise HTTPException(status_code=409, detail="Đã kín chỗ!")

    # 2) Tạo booking (trạng thái chờ duyệt). Chỉ mục duy nhất chặn bấm đúp / gửi song song.
    booking = Booking(user_id=user.id, court_id=court.id, so_luong=so_luong, trang_thai="pending",
                      loi_nhan=((loi_nhan or "").strip()[:300] or None))
    db.add(booking)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Bạn đã gửi yêu cầu cho kèo này rồi!")

    # 3) Thanh toán cọc (giả lập). Lỗi ở bước này sẽ rollback cả bước trừ slot.
    if amount > 0:
        db.add(Payment(booking_id=booking.id, so_tien=amount, phuong_thuc=phuong_thuc,
                       trang_thai="paid", ma_giao_dich=new_txn_code()))

    # 4) Thông báo cho chủ sân + đẩy số slot mới cho mọi người đang xem (real-time)
    notify(db, court.host_id, "request", "Có yêu cầu ghép sân mới",
           f"{user.ho_ten or user.username} xin tham gia {court.ten_san} ({fmt_range(court)}).",
           court.id, booking.id)
    push_court_update(db, court)
    db.commit()
    db.refresh(booking)
    return booking


def approve_booking(db: Session, host: User, booking_id: int) -> Booking:
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu này!")
    court = b.court_info
    ensure_owner_or_admin(host, court, allow_admin=False)
    if court.trang_thai == "cancelled" or court.ket_thuc <= now_vn():
        raise HTTPException(status_code=400, detail="Kèo đã bị hủy hoặc đã kết thúc!")
    if not transition(db, b, ("pending",), "approved"):
        raise HTTPException(status_code=409, detail="Yêu cầu này đã được xử lý trước đó!")
    notify(db, b.user_id, "approved", "Yêu cầu đã được duyệt",
           f"Chủ sân đã duyệt bạn tham gia {court.ten_san} ({fmt_range(court)}). Bạn có thể xem liên hệ của chủ nhóm trong Lịch chơi.",
           court.id, b.id)
    db.commit()
    db.refresh(b)
    return b


def reject_booking(db: Session, host: User, booking_id: int, ly_do: Optional[str]) -> Booking:
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu này!")
    court = b.court_info
    ensure_owner_or_admin(host, court, allow_admin=False)
    if not transition(db, b, ("pending",), "rejected"):
        raise HTTPException(status_code=409, detail="Yêu cầu này đã được xử lý trước đó!")
    release_slots(db, court, b.so_luong)      # trả lại slot
    settle_payment(db, b, refund=True)          # hoàn cọc
    extra = f" Lý do: {ly_do.strip()}" if ly_do and ly_do.strip() else ""
    notify(db, b.user_id, "rejected", "Yêu cầu bị từ chối",
           f"Rất tiếc, chủ sân chưa nhận bạn vào {court.ten_san} ({fmt_range(court)}). Tiền cọc (nếu có) đã được hoàn lại.{extra}",
           court.id, b.id)
    push_court_update(db, court)
    db.commit()
    db.refresh(b)
    return b


def cancel_booking(db: Session, user: User, booking_id: int) -> dict:
    b = db.query(Booking).filter(Booking.id == booking_id, Booking.user_id == user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch sử đặt sân này!")
    court = b.court_info
    now = now_vn()
    if b.trang_thai not in ACTIVE_BOOKING:
        raise HTTPException(status_code=400, detail="Đơn này không còn ở trạng thái có thể hủy!")
    if court.bat_dau <= now:
        raise HTTPException(status_code=400, detail="Đã đến giờ chơi, không thể hủy nữa!")
    refund = refund_on_player_cancel(b.trang_thai, court.bat_dau, now)
    if not transition(db, b, ACTIVE_BOOKING, "cancelled"):
        raise HTTPException(status_code=409, detail="Đơn này đã được xử lý trước đó!")
    release_slots(db, court, b.so_luong)
    settle_payment(db, b, refund=refund)
    notify(db, court.host_id, "cancelled", "Người chơi đã hủy tham gia",
           f"{user.ho_ten or user.username} đã hủy tham gia {court.ten_san} ({fmt_range(court)}).",
           court.id, b.id)
    push_court_update(db, court)
    db.commit()
    return {"so_slot_hoan_lai": b.so_luong, "ten_san": court.ten_san, "hoan_coc": refund}


def cancel_court(db: Session, actor: User, court: Court, ly_do: Optional[str]) -> None:
    """Hủy cả kèo: hủy mọi yêu cầu đang giữ chỗ, hoàn cọc và báo cho người chơi."""
    ensure_owner_or_admin(actor, court)
    if court.trang_thai == "cancelled":
        raise HTTPException(status_code=400, detail="Kèo này đã được hủy trước đó!")
    if court.ket_thuc <= now_vn():
        raise HTTPException(status_code=400, detail="Kèo đã kết thúc, không thể hủy!")
    court.trang_thai = "cancelled"
    extra = f" Lý do: {ly_do.strip()}" if ly_do and ly_do.strip() else ""
    active = db.query(Booking).filter(Booking.court_id == court.id, Booking.trang_thai.in_(ACTIVE_BOOKING)).all()
    for b in active:
        b.trang_thai = "cancelled"
        settle_payment(db, b, refund=True)
        notify(db, b.user_id, "court_cancelled", "Kèo đã bị hủy",
               f"{court.ten_san} ({fmt_range(court)}) đã bị hủy. Tiền cọc (nếu có) được hoàn lại đầy đủ.{extra}",
               court.id, b.id)
    court.slot_trong = court.tong_slot
    db.flush()
    push_court_update(db, court)
    db.commit()


# ===========================================================================
# FR-01: OTP (giả lập gửi SMS/Email)
# ===========================================================================
def issue_otp(db: Session, user: User) -> dict:
    now = now_vn()
    if user.phone:
        kenh, dinh_danh = "phone", user.phone
    else:
        kenh, dinh_danh = "email", user.email
    last = db.query(OtpCode).filter(OtpCode.user_id == user.id).order_by(OtpCode.id.desc()).first()
    if last is not None and not last.da_dung:
        elapsed = (now - last.created_at).total_seconds()
        if elapsed < OTP_RESEND_SECONDS:
            raise HTTPException(status_code=429,
                                detail=f"Vui lòng đợi {int(OTP_RESEND_SECONDS - elapsed) + 1} giây trước khi xin mã mới!")
    db.query(OtpCode).filter(OtpCode.user_id == user.id, OtpCode.da_dung == False).update(  # noqa: E712
        {OtpCode.da_dung: True}, synchronize_session=False)
    code = generate_otp()
    db.add(OtpCode(user_id=user.id, kenh=kenh, dinh_danh=dinh_danh,
                   ma_hash=hash_otp(SECRET_KEY, dinh_danh, code),
                   het_han=now + timedelta(minutes=OTP_TTL_MINUTES), created_at=now))
    log.warning("[OTP giả lập] Mã xác thực gửi tới %s (%s): %s", dinh_danh, kenh, code)
    return {"kenh": kenh, "dinh_danh_masked": mask_identifier(kenh, dinh_danh),
            "het_han_giay": OTP_TTL_MINUTES * 60, "otp_demo": code if OTP_DEV_MODE else None}


# ===========================================================================
# Tác vụ định kỳ: Reminder (FR-09), mở khóa đánh giá (FR-10), dọn yêu cầu bị bỏ quên
# ===========================================================================
def run_scheduled_jobs(db: Session) -> Dict[str, int]:
    now = now_vn()
    horizon = now + timedelta(minutes=REMINDER_BEFORE_MINUTES)
    reminded = prompted = expired = 0

    # 1) Nhắc nhở người chơi đã được duyệt trước giờ thi đấu
    rows = (db.query(Booking).join(Court, Booking.court_id == Court.id)
              .filter(Booking.trang_thai == "approved", Booking.da_nhac_nho == False,  # noqa: E712
                      Court.trang_thai != "cancelled",
                      Court.ngay_choi >= now.date(), Court.ngay_choi <= horizon.date()).all())
    for b in rows:
        c = b.court_info
        if now < c.bat_dau <= horizon:
            notify(db, b.user_id, "reminder", "Sắp đến giờ chơi",
                   f"{c.ten_san}: {fmt_range(c)}. Nhớ đến đúng giờ nhé!", c.id, b.id)
            b.da_nhac_nho = True
            reminded += 1

    # 1b) Nhắc chủ nhóm
    for c in db.query(Court).filter(Court.da_nhac_host == False, Court.trang_thai != "cancelled",  # noqa: E712
                                    Court.ngay_choi >= now.date(), Court.ngay_choi <= horizon.date()).all():
        if now < c.bat_dau <= horizon:
            n_ok = db.query(func.count(Booking.id)).filter(
                Booking.court_id == c.id, Booking.trang_thai == "approved").scalar() or 0
            notify(db, c.host_id, "reminder", "Kèo của bạn sắp diễn ra",
                   f"{c.ten_san}: {fmt_range(c)} - hiện có {n_ok} yêu cầu đã duyệt.", c.id)
            c.da_nhac_host = True
            reminded += 1

    # 2) Trận kết thúc -> mở khóa đánh giá chéo và nhắc cả hai phía
    for c in db.query(Court).filter(Court.da_nhac_danh_gia == False, Court.trang_thai != "cancelled",  # noqa: E712
                                    Court.ngay_choi <= now.date()).all():
        if c.ket_thuc > now:
            continue
        approved = db.query(Booking).filter(Booking.court_id == c.id, Booking.trang_thai == "approved").all()
        if approved:
            notify(db, c.host_id, "review", "Hãy đánh giá người chơi",
                   f"Trận tại {c.ten_san} đã kết thúc. Hãy đánh giá những người đã tham gia.", c.id)
            for b in approved:
                notify(db, b.user_id, "review", "Hãy đánh giá buổi chơi",
                       f"Buổi chơi tại {c.ten_san} đã kết thúc. Đánh giá chủ nhóm để giúp cộng đồng.", c.id, b.id)
            prompted += 1
        c.da_nhac_danh_gia = True

    # 3) Yêu cầu vẫn "chờ duyệt" khi trận đã bắt đầu -> tự hủy và hoàn cọc
    stale = (db.query(Booking).join(Court, Booking.court_id == Court.id)
               .filter(Booking.trang_thai == "pending", Court.ngay_choi <= now.date()).all())
    for b in stale:
        c = b.court_info
        if c.bat_dau <= now and transition(db, b, ("pending",), "cancelled"):
            settle_payment(db, b, refund=True)
            notify(db, b.user_id, "expired", "Yêu cầu hết hạn",
                   f"Chủ sân chưa phản hồi trước giờ chơi tại {c.ten_san}. Tiền cọc (nếu có) đã được hoàn lại.",
                   c.id, b.id)
            expired += 1

    db.commit()
    return {"reminded": reminded, "review_prompts": prompted, "expired": expired}
