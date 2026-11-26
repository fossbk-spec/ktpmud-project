"""Kèo / ca đánh: FR-04 (tạo), FR-06 (cập nhật trạng thái), FR-07 (tìm kiếm & lọc), UC-02 (tạo ca vãng lai)."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Booking, Court, User
from rules import (
    EDIT_LOCK_HOURS, FREE_CANCEL_HOURS, LY_DO_BAO_CAO, MAX_SLOT_PER_BOOKING, MAX_TONG_SLOT, PHUONG_THUC_TT,
    QUAN_HUYEN, TRINH_DO, ACTIVE_BOOKING, can_edit, combine, now_vn, parse_date, parse_level, parse_time,
    strip_accents,
)
from schemas import CancelCourtIn, CourtCreate
from security import get_current_user, get_optional_user, require_verified_host
from services import (
    OTP_DEV_MODE, cancel_court as service_cancel_court, courts_to_dicts, ensure_owner_or_admin, fmt_range,
    notify, push, push_court_update, serialize_request,
)

router = APIRouter(prefix="/api", tags=["Kèo / Sân"])


def _get_court(db: Session, court_id: int) -> Court:
    court = db.query(Court).options(joinedload(Court.host)).filter(Court.id == court_id).first()
    if court is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy sân!")
    return court


# Danh mục dùng chung cho giao diện (trình độ, quận/huyện, phương thức thanh toán, chính sách...)
@router.get("/meta")
def get_meta():
    return {
        "trinh_do": [{"ma": k, "ten": v} for k, v in TRINH_DO.items()],
        "quan_huyen": QUAN_HUYEN,
        "phuong_thuc_tt": [{"ma": k, "ten": v} for k, v in PHUONG_THUC_TT.items()],
        "ly_do_bao_cao": [{"ma": k, "ten": v} for k, v in LY_DO_BAO_CAO.items()],
        "chinh_sach": {"sua_truoc_gio": EDIT_LOCK_HOURS, "huy_mien_phi_truoc_gio": FREE_CANCEL_HOURS,
                       "toi_da_slot_moi_yeu_cau": MAX_SLOT_PER_BOOKING},
        "otp_demo": OTP_DEV_MODE,
    }


# FR-07 / US-01 / US-02: tìm kiếm + lọc theo Quận/Huyện, Ngày, Khung giờ, Trình độ, Giá; luôn trả về số chỗ trống chính xác
@router.get("/courts")
def get_all_courts(
    q: Optional[str] = None,
    district: Optional[str] = None,
    ngay: Optional[str] = Query(None, alias="date"),
    from_time: Optional[str] = None,
    to_time: Optional[str] = None,
    skill: Optional[str] = None,
    max_price: Optional[float] = None,
    only_available: bool = False,
    include_past: bool = False,
    sort: str = "soonest",
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    now = now_vn()
    today, now_t = now.date(), now.time()
    query = db.query(Court).options(joinedload(Court.host)).filter(Court.trang_thai != "cancelled")

    if not include_past:   # mặc định chỉ hiện kèo chưa kết thúc
        query = query.filter(or_(Court.ngay_choi > today,
                                 and_(Court.ngay_choi == today, Court.gio_ket_thuc > now_t)))
    if only_available:     # còn chỗ, đang mở và chưa bắt đầu
        query = query.filter(Court.trang_thai == "open", Court.slot_trong > 0).filter(
            or_(Court.ngay_choi > today, and_(Court.ngay_choi == today, Court.gio_bat_dau > now_t)))
    if district:
        query = query.filter(Court.khu_vuc == district)
    try:
        if ngay:
            query = query.filter(Court.ngay_choi == parse_date(ngay))
        if from_time:   # Khung giờ mong muốn: kèo phải bắt đầu từ from_time ...
            query = query.filter(Court.gio_bat_dau >= parse_time(from_time))
        if to_time:     # ... và kết thúc không muộn hơn to_time
            query = query.filter(Court.gio_ket_thuc <= parse_time(to_time))
    except ValueError:
        raise HTTPException(status_code=400, detail="Ngày hoặc giờ lọc không đúng định dạng!")
    level = parse_level(skill)
    if level is not None:   # trình độ của người chơi nằm trong khoảng Min - Max của kèo
        query = query.filter(Court.trinh_min <= level, Court.trinh_max >= level)
    if max_price is not None:
        query = query.filter(Court.gia_thue <= max_price)

    if sort == "price_asc":
        query = query.order_by(Court.gia_thue.asc(), Court.ngay_choi.asc(), Court.gio_bat_dau.asc())
    elif sort == "price_desc":
        query = query.order_by(Court.gia_thue.desc(), Court.ngay_choi.asc(), Court.gio_bat_dau.asc())
    elif sort == "newest":
        query = query.order_by(Court.created_at.desc())
    elif sort == "slots":
        query = query.order_by(Court.slot_trong.desc(), Court.ngay_choi.asc(), Court.gio_bat_dau.asc())
    else:
        query = query.order_by(Court.ngay_choi.asc(), Court.gio_bat_dau.asc())

    courts = query.all()
    if q and q.strip():   # tìm theo từ khóa, không phân biệt dấu: "dong da" khớp "Đống Đa"
        key = strip_accents(q)
        courts = [c for c in courts if key in strip_accents(" ".join(filter(None, [
            c.ten_san, c.dia_chi, c.khu_vuc, c.ghi_chu, c.host.ho_ten if c.host else None])))]
    total = len(courts)
    page = courts[max(offset, 0): max(offset, 0) + max(min(limit, 200), 1)]
    return {"so_luong": len(page), "tong": total, "data": courts_to_dicts(db, page, current_user)}


# Chi tiết một kèo. NFR-04: số điện thoại chủ nhóm chỉ hiện khi bạn là chủ kèo hoặc đã được duyệt
@router.get("/courts/{court_id}")
def get_court(court_id: int, db: Session = Depends(get_db),
              current_user: Optional[User] = Depends(get_optional_user)):
    court = _get_court(db, court_id)
    is_owner = bool(current_user and current_user.id == court.host_id)
    data = courts_to_dicts(db, [court], current_user, with_pending=is_owner)[0]
    phone = None
    if current_user is not None:
        approved = bool(data["my_booking"] and data["my_booking"]["trang_thai"] == "approved")
        if is_owner or current_user.role == "admin" or approved:
            phone = court.host.phone
    data["host_phone"] = phone
    return data


def _clean_court_payload(data: CourtCreate, now) -> dict:
    """Kiểm tra dữ liệu form tạo/sửa kèo (FR-04, UC-02) và trả về các trường đã làm sạch."""
    ten_san = (data.ten_san or "").strip()
    if not ten_san or len(ten_san) > 120:
        raise HTTPException(status_code=400, detail="Tên sân không được để trống (tối đa 120 ký tự)!")
    khu_vuc = (data.khu_vuc or "").strip()
    if not khu_vuc:
        raise HTTPException(status_code=400, detail="Vui lòng chọn Quận/Huyện!")
    try:
        ngay = parse_date(data.ngay_choi)
        gio_bd = parse_time(data.gio_bat_dau)
        gio_kt = parse_time(data.gio_ket_thuc)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Ngày hoặc giờ không đúng định dạng!")
    if gio_kt <= gio_bd:
        raise HTTPException(status_code=400, detail="Giờ kết thúc phải sau giờ bắt đầu!")
    if combine(ngay, gio_bd) <= now:   # ngoại lệ UC-02
        raise HTTPException(status_code=400, detail="Ngày giờ nằm trong quá khứ, vui lòng nhập lại!")
    if data.trinh_min not in TRINH_DO or data.trinh_max not in TRINH_DO or data.trinh_min > data.trinh_max:
        raise HTTPException(status_code=400, detail="Khoảng trình độ yêu cầu không hợp lệ (Min phải ≤ Max)!")
    tong_slot = data.tong_slot if data.tong_slot is not None else data.slot_trong
    if tong_slot is None:
        tong_slot = 4
    if not 1 <= tong_slot <= MAX_TONG_SLOT:
        raise HTTPException(status_code=400, detail=f"Số người cần tuyển phải từ 1 đến {MAX_TONG_SLOT}!")
    if not 0 <= data.gia_thue <= 5_000_000:
        raise HTTPException(status_code=400, detail="Chi phí dự kiến mỗi người không hợp lệ!")
    if not 0 <= data.tien_coc <= data.gia_thue:
        raise HTTPException(status_code=400, detail="Tiền cọc phải từ 0 đến mức chi phí dự kiến mỗi người!")
    if (data.vi_do is None) != (data.kinh_do is None):
        raise HTTPException(status_code=400, detail="Cần nhập đủ cả vĩ độ và kinh độ (hoặc để trống cả hai)!")
    if data.vi_do is not None and not (-90 <= data.vi_do <= 90 and -180 <= data.kinh_do <= 180):
        raise HTTPException(status_code=400, detail="Tọa độ bản đồ không hợp lệ!")
    return {
        "ten_san": ten_san, "dia_chi": (data.dia_chi or "").strip()[:200] or None, "khu_vuc": khu_vuc,
        "ngay_choi": ngay, "gio_bat_dau": gio_bd, "gio_ket_thuc": gio_kt,
        "trinh_min": data.trinh_min, "trinh_max": data.trinh_max, "tong_slot": tong_slot,
        "gia_thue": float(data.gia_thue), "tien_coc": float(data.tien_coc),
        "ghi_chu": (data.ghi_chu or "").strip()[:500] or None, "vi_do": data.vi_do, "kinh_do": data.kinh_do,
    }


# FR-04 / UC-02: Host tạo kèo ghép sân (tài khoản chủ sân phải được xác thực)
@router.post("/courts")
def create_court(court: CourtCreate, db: Session = Depends(get_db),
                 current_user: User = Depends(require_verified_host)):
    fields = _clean_court_payload(court, now_vn())
    new_court = Court(host_id=current_user.id, slot_trong=fields["tong_slot"], trang_thai="open", **fields)
    db.add(new_court)
    db.flush()
    push(db, {"type": "court_new", "court_id": new_court.id})
    db.commit()
    db.refresh(new_court)
    return courts_to_dicts(db, [new_court], current_user, with_pending=True)[0]


# FR-06: chỉnh sửa kèo, chỉ khi còn ít nhất 2 tiếng trước giờ chơi
@router.put("/courts/{court_id}")
def update_court(court_id: int, data: CourtCreate, db: Session = Depends(get_db),
                 current_user: User = Depends(require_verified_host)):
    court = _get_court(db, court_id)
    ensure_owner_or_admin(current_user, court, allow_admin=False)
    now = now_vn()
    if court.trang_thai == "cancelled":
        raise HTTPException(status_code=400, detail="Kèo đã bị hủy, không thể chỉnh sửa!")
    if not can_edit(court.bat_dau, now):
        raise HTTPException(status_code=400,
                            detail=f"Chỉ được chỉnh sửa kèo trước giờ chơi tối thiểu {EDIT_LOCK_HOURS} tiếng!")
    fields = _clean_court_payload(data, now)
    taken = court.tong_slot - court.slot_trong
    if fields["tong_slot"] < taken:
        raise HTTPException(status_code=400,
                            detail=f"Đã có {taken} chỗ được đăng ký, tổng số slot không thể nhỏ hơn {taken}!")

    keys = ("ten_san", "dia_chi", "khu_vuc", "ngay_choi", "gio_bat_dau", "gio_ket_thuc",
            "gia_thue", "tien_coc", "trinh_min", "trinh_max")
    before = tuple(getattr(court, k) for k in keys)
    new_total = fields.pop("tong_slot")
    delta = new_total - court.tong_slot
    for key, value in fields.items():
        setattr(court, key, value)
    db.flush()
    if delta != 0:   # đổi tổng slot: cộng/trừ chênh lệch bằng UPDATE nguyên tử để không đè lên người vừa đăng ký
        rows = (db.query(Court).filter(Court.id == court.id, Court.slot_trong + delta >= 0)
                  .update({Court.tong_slot: new_total, Court.slot_trong: Court.slot_trong + delta},
                          synchronize_session=False))
        if rows != 1:
            db.rollback()
            raise HTTPException(status_code=409, detail="Vừa có thêm người đăng ký, hãy tải lại kèo rồi thử lại!")
    db.refresh(court)

    after = tuple(getattr(court, k) for k in keys)
    if before != after:   # báo cho những người đang giữ chỗ
        for b in db.query(Booking).filter(Booking.court_id == court.id, Booking.trang_thai.in_(ACTIVE_BOOKING)).all():
            notify(db, b.user_id, "court_updated", "Kèo đã được cập nhật",
                   f"Chủ nhóm vừa chỉnh sửa {court.ten_san}: {fmt_range(court)}. Hãy kiểm tra lại thông tin.",
                   court.id, b.id)
    push_court_update(db, court)
    db.commit()
    db.refresh(court)
    return courts_to_dicts(db, [court], current_user, with_pending=True)[0]


# FR-06: chủ động đóng kèo (hiển thị "Đã đủ người") hoặc mở lại
@router.post("/courts/{court_id}/close")
def close_court(court_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    court = _get_court(db, court_id)
    ensure_owner_or_admin(current_user, court)
    if court.trang_thai == "cancelled" or court.ket_thuc <= now_vn():
        raise HTTPException(status_code=400, detail="Kèo đã hủy hoặc đã kết thúc!")
    court.trang_thai = "closed"
    push_court_update(db, court)
    db.commit()
    db.refresh(court)
    return courts_to_dicts(db, [court], current_user, with_pending=True)[0]


@router.post("/courts/{court_id}/reopen")
def reopen_court(court_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    court = _get_court(db, court_id)
    ensure_owner_or_admin(current_user, court)
    if court.trang_thai != "closed" or court.ket_thuc <= now_vn():
        raise HTTPException(status_code=400, detail="Chỉ mở lại được kèo đang đóng và chưa kết thúc!")
    court.trang_thai = "open"
    push_court_update(db, court)
    db.commit()
    db.refresh(court)
    return courts_to_dicts(db, [court], current_user, with_pending=True)[0]


# Hủy cả kèo: người chơi được báo và hoàn cọc
@router.post("/courts/{court_id}/cancel")
def cancel_court_api(court_id: int, data: Optional[CancelCourtIn] = None, db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    court = _get_court(db, court_id)
    service_cancel_court(db, current_user, court, data.ly_do if data else None)
    return {"thong_bao": f"Đã hủy kèo {court.ten_san}. Người chơi đã được thông báo và hoàn cọc."}


# Các kèo do tôi đăng (kèm số yêu cầu đang chờ duyệt)
@router.get("/host/courts")
def get_my_courts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "host":
        raise HTTPException(status_code=403, detail="Chỉ tài khoản Chủ nhóm / Chủ sân mới có mục này!")
    courts = (db.query(Court).options(joinedload(Court.host)).filter(Court.host_id == current_user.id)
                .order_by(Court.ngay_choi.desc(), Court.gio_bat_dau.desc()).all())
    return {"so_luong": len(courts), "data": courts_to_dicts(db, courts, current_user, with_pending=True)}


# FR-05: danh sách người xin tham gia một kèo, kèm hồ sơ và điểm uy tín để Host quyết định (US-03)
@router.get("/courts/{court_id}/requests")
def get_court_requests(court_id: int, db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    court = _get_court(db, court_id)
    ensure_owner_or_admin(current_user, court)
    rows = db.query(Booking).filter(
        Booking.court_id == court.id, Booking.trang_thai.in_(("pending", "approved", "rejected"))).all()
    order = {"pending": 0, "approved": 1, "rejected": 2}
    rows.sort(key=lambda b: (order[b.trang_thai], b.created_at))
    now = now_vn()
    return {"so_luong": len(rows), "data": [serialize_request(b, now) for b in rows]}
