"""Đăng ký ghép sân (UC-01, FR-08), quản lý lịch chơi (FR-09), duyệt/từ chối yêu cầu (FR-05)."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Booking, Court, Review, User
from rules import now_vn
from schemas import BookingCreate, RejectIn
from security import get_current_user
from services import (
    approve_booking, cancel_booking, create_booking, payment_dict, reject_booking, serialize_my_booking,
    serialize_request,
)

router = APIRouter(prefix="/api", tags=["Ghép sân"])


# API 3 / UC-01: Gửi yêu cầu tham gia (slot được giữ chỗ ngay, chủ sân sẽ duyệt hoặc từ chối)
@router.post("/bookings")
def create_booking_api(booking: BookingCreate, db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    b = create_booking(db, current_user, booking.court_id, booking.so_luong_slot, booking.loi_nhan,
                       booking.phuong_thuc)
    court = b.court_info
    return {
        "thong_bao": f"Đã gửi yêu cầu tham gia {court.ten_san}! Chủ sân sẽ xem xét và phản hồi cho bạn.",
        "booking_id": b.id,
        "trang_thai": b.trang_thai,
        "slot_con_lai": court.slot_trong,
        "thanh_toan": payment_dict(b.payment),
        "lech_trinh_do": not (court.trinh_min <= (current_user.trinh_do or 1) <= court.trinh_max),
    }


# API 4 / FR-09: Lịch chơi của tôi (đang chờ duyệt / đã duyệt / bị từ chối / đã hủy)
@router.get("/my-bookings")
def get_my_bookings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bookings = (db.query(Booking)
                  .options(joinedload(Booking.court_info).joinedload(Court.host))
                  .filter(Booking.user_id == current_user.id)
                  .order_by(Booking.id.desc()).all())
    reviewed = {bid for (bid,) in db.query(Review.booking_id).filter(Review.reviewer_id == current_user.id).all()}
    now = now_vn()
    items = [serialize_my_booking(b, reviewed, now) for b in bookings]
    return {"nguoi_choi": current_user.username, "tong_so_luot_dat": len(items), "danh_sach": items}


# API 5: Hủy đặt sân (hoàn slot, hoàn cọc nếu hủy sớm)
@router.delete("/bookings/{booking_id}")
def cancel_booking_api(booking_id: int, db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    result = cancel_booking(db, current_user, booking_id)
    note = "Tiền cọc (nếu có) đã được hoàn lại." if result["hoan_coc"] \
        else "Do hủy sát giờ nên tiền cọc (nếu có) không được hoàn lại."
    return {"thong_bao": f"Đã hủy thành công đơn hàng số {booking_id}. Đã hoàn lại {result['so_slot_hoan_lai']} "
                         f"slot cho {result['ten_san']}. {note}"}


# FR-05: Host duyệt / từ chối yêu cầu
@router.post("/bookings/{booking_id}/approve")
def approve_booking_api(booking_id: int, db: Session = Depends(get_db),
                        current_user: User = Depends(get_current_user)):
    b = approve_booking(db, current_user, booking_id)
    return {"thong_bao": "Đã duyệt yêu cầu. Hai bên giờ có thể xem thông tin liên hệ của nhau.",
            "request": serialize_request(b, now_vn())}


@router.post("/bookings/{booking_id}/reject")
def reject_booking_api(booking_id: int, data: Optional[RejectIn] = None, db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    b = reject_booking(db, current_user, booking_id, data.ly_do if data else None)
    return {"thong_bao": "Đã từ chối yêu cầu và hoàn lại slot (cùng tiền cọc nếu có).",
            "request": serialize_request(b, now_vn())}


# FR-05: tất cả yêu cầu gửi tới các kèo của tôi (mặc định chỉ hiện yêu cầu đang chờ duyệt)
@router.get("/host/requests")
def get_host_requests(status: str = "pending", db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Chỉ tài khoản Chủ nhóm / Chủ sân mới có mục này!")
    query = (db.query(Booking).join(Court, Booking.court_id == Court.id)
               .filter(Court.host_id == current_user.id))
    if status == "all":
        query = query.filter(Booking.trang_thai.in_(("pending", "approved", "rejected")))
    else:
        query = query.filter(Booking.trang_thai == status)
    rows = query.order_by(Booking.created_at.asc()).all()
    now = now_vn()
    return {"so_luong": len(rows), "data": [serialize_request(b, now) for b in rows]}
