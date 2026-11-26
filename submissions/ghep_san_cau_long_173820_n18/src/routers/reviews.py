"""FR-10: Đánh giá chéo sau trận (Host chấm Player, Player chấm Host). FR-11: cập nhật điểm uy tín."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import Booking, Court, Review, User
from rules import TIEU_CHI_HOST_TO_PLAYER, TIEU_CHI_PLAYER_TO_HOST, now_vn, review_score
from schemas import ReviewIn
from security import get_current_user
from services import court_summary, notify, recalc_reputation, user_public

router = APIRouter(prefix="/api", tags=["Đánh giá"])


def _task(booking: Booking, loai: str, target: User) -> dict:
    criteria = TIEU_CHI_HOST_TO_PLAYER if loai == "host_to_player" else TIEU_CHI_PLAYER_TO_HOST
    return {
        "booking_id": booking.id, "loai": loai, "court": court_summary(booking.court_info),
        "doi_tuong": user_public(target),
        "tieu_chi": [{"ma": key, "ten": label} for key, label in criteria],
        "cho_phep_bung_keo": loai == "host_to_player",
    }


# Danh sách các lượt đánh giá đã được mở khóa (trận đã kết thúc) mà tôi chưa thực hiện
@router.get("/reviews/pending")
def get_pending_reviews(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now = now_vn()
    done = {bid for (bid,) in db.query(Review.booking_id).filter(Review.reviewer_id == current_user.id).all()}
    tasks = []

    mine = db.query(Booking).filter(Booking.user_id == current_user.id, Booking.trang_thai == "approved").all()
    for b in mine:
        c = b.court_info
        if c.trang_thai != "cancelled" and c.ket_thuc <= now and b.id not in done:
            tasks.append(_task(b, "player_to_host", c.host))

    hosted = (db.query(Booking).join(Court, Booking.court_id == Court.id)
                .filter(Court.host_id == current_user.id, Booking.trang_thai == "approved").all())
    for b in hosted:
        c = b.court_info
        if c.trang_thai != "cancelled" and c.ket_thuc <= now and b.id not in done:
            tasks.append(_task(b, "host_to_player", b.user))

    tasks.sort(key=lambda t: (t["court"]["ngay_choi"], t["court"]["gio_ket_thuc"]), reverse=True)
    return {"so_luong": len(tasks), "data": tasks}


@router.post("/reviews")
def create_review(data: ReviewIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    b = db.query(Booking).filter(Booking.id == data.booking_id).first()
    if b is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy lượt tham gia này!")
    court = b.court_info
    if b.trang_thai != "approved":
        raise HTTPException(status_code=400, detail="Chỉ đánh giá được những lượt đã được duyệt tham gia!")
    if court.trang_thai == "cancelled" or court.ket_thuc > now_vn():
        raise HTTPException(status_code=400, detail="Chỉ được đánh giá sau khi trận đấu kết thúc!")

    if current_user.id == b.user_id:
        loai, reviewee_id, criteria = "player_to_host", court.host_id, TIEU_CHI_PLAYER_TO_HOST
    elif current_user.id == court.host_id:
        loai, reviewee_id, criteria = "host_to_player", b.user_id, TIEU_CHI_HOST_TO_PLAYER
    else:
        raise HTTPException(status_code=403, detail="Bạn không tham gia trận đấu này nên không thể đánh giá!")

    if db.query(Review).filter(Review.booking_id == b.id, Review.reviewer_id == current_user.id).first():
        raise HTTPException(status_code=409, detail="Bạn đã đánh giá lượt này rồi!")

    bung_keo = bool(data.bung_keo) and loai == "host_to_player"
    values = {}
    if not bung_keo:   # báo "bùng kèo" thì không cần chấm các tiêu chí còn lại
        for key, label in criteria:
            v = getattr(data, key)
            if v is None:
                raise HTTPException(status_code=400, detail=f"Vui lòng chấm điểm cho tiêu chí: {label}!")
            if not 1 <= v <= 5:
                raise HTTPException(status_code=400, detail="Điểm đánh giá phải từ 1 đến 5 sao!")
            values[key] = v

    review = Review(
        booking_id=b.id, court_id=court.id, reviewer_id=current_user.id, reviewee_id=reviewee_id,
        loai=loai, bung_keo=bung_keo, diem=review_score(values.values(), bung_keo),
        binh_luan=((data.binh_luan or "").strip()[:500] or None), **values,
    )
    db.add(review)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Bạn đã đánh giá lượt này rồi!")

    recalc_reputation(db, reviewee_id)   # FR-11: cập nhật điểm uy tín + nhãn
    notify(db, reviewee_id, "review_received", "Bạn nhận được một đánh giá mới",
           f"{current_user.ho_ten or current_user.username} vừa đánh giá bạn sau trận tại {court.ten_san}.",
           court.id, b.id)
    db.commit()
    return {"thong_bao": "Cảm ơn bạn đã đánh giá!", "diem": review.diem}
