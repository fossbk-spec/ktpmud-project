"""Hồ sơ người dùng thuốc, quản lý đơn thuốc đã lưu và so sánh tương tác giữa các đơn.

Luồng dùng: tạo hồ sơ -> quét từng đơn kèm profile_id (POST /api/v1/ocr/scan) -> mỗi lần quét tự đối chiếu
với các đơn trước trong hồ sơ; hoặc gọi GET /api/v1/profiles/{id}/interaction-check bất cứ lúc nào.
Nếu OCR đọc sai, sửa danh sách thuốc bằng PUT /api/v1/history/{id}/medicines (chọn đúng sản phẩm nếu cần).
"""
import json
import os

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import desc
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from api.ocr import profile_cross_check
from database.database import get_db
from database.models import ImageProcessingHistory, Profile
from services.ai_service import explain_drug_interactions
from services.drug_interaction_service import analyze_drug_interactions
from services.medicine_matching_service import load_catalog, match_prescription_medicines
from services.profile_service import default_window_days, is_structured_result

router = APIRouter(prefix="/api/v1", tags=["Profiles & Prescription History"])


class ProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120, description="Tên gọi hồ sơ (có thể là biệt danh)")
    note: str | None = Field(None, max_length=1000)


class ProfileAssign(BaseModel):
    profile_id: int | None = Field(None, description="null để bỏ đơn khỏi hồ sơ")


class MedicineEdit(BaseModel):
    prescription_name: str = Field(..., min_length=1, max_length=200)
    brand_name: str | None = None
    active_ingredient: str | None = None
    name_alternatives: list[str] = []
    strength: str | None = None
    strength_raw: str | None = None
    dosage_form: str | None = None
    quantity: str | None = None
    quantity_unit: str | None = None
    usage: str | None = None
    note: str | None = None
    confirmed_medicine_id: int | None = Field(
        None, description="id sản phẩm trong CSDL nếu người dùng đã xác nhận đúng sản phẩm"
    )


class MedicinesUpdate(BaseModel):
    medicines: list[MedicineEdit] = Field(..., min_length=1, max_length=60)


def _profile_dict(profile, count=None):
    data = {
        "id": profile.id,
        "name": profile.name,
        "note": profile.note,
        "created_at": profile.created_at,
    }
    if count is not None:
        data["prescription_count"] = count
    return data


def _get_profile(db, profile_id):
    profile = db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ.")
    return profile


def _medicine_names(record):
    try:
        data = json.loads(record.result_text or "")
        return [m.get("prescription_name") for m in (data.get("ocr") or {}).get("medicines", [])]
    except (TypeError, ValueError, AttributeError):
        return []


# ---------------------------------------------------------------- hồ sơ
@router.post("/profiles", status_code=201)
def create_profile(body: ProfileCreate, db: Session = Depends(get_db)):
    profile = Profile(name=body.name.strip(), note=body.note)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return _profile_dict(profile, 0)


@router.get("/profiles")
def list_profiles(db: Session = Depends(get_db)):
    profiles = db.query(Profile).order_by(Profile.id).all()
    counts = {}
    for (pid,) in db.query(ImageProcessingHistory.profile_id).filter(
        ImageProcessingHistory.profile_id.isnot(None),
        ImageProcessingHistory.operation_type == "prescription_ocr",
    ):
        counts[pid] = counts.get(pid, 0) + 1
    return [_profile_dict(p, counts.get(p.id, 0)) for p in profiles]


@router.get("/profiles/{profile_id}")
def get_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = _get_profile(db, profile_id)
    records = (
        db.query(ImageProcessingHistory)
        .filter(ImageProcessingHistory.profile_id == profile_id)
        .order_by(desc(ImageProcessingHistory.id))
        .all()
    )
    return {
        **_profile_dict(profile, len(records)),
        "prescriptions": [
            {
                "history_id": r.id,
                "filename": r.original_filename,
                "status": r.status,
                "created_at": r.created_at,
                "prescription_date": r.prescription_date,
                "medicines": _medicine_names(r),
                "has_image": bool(r.image_path and os.path.isfile(r.image_path)),
            }
            for r in records
        ],
    }


@router.delete("/profiles/{profile_id}")
def delete_profile(
    profile_id: int,
    delete_histories: bool = Query(
        False, description="true: xóa luôn các đơn (và ảnh) của hồ sơ; false: chỉ gỡ đơn khỏi hồ sơ"
    ),
    db: Session = Depends(get_db),
):
    profile = _get_profile(db, profile_id)
    records = (
        db.query(ImageProcessingHistory)
        .filter(ImageProcessingHistory.profile_id == profile_id)
        .all()
    )
    for record in records:
        if delete_histories:
            if record.image_path and os.path.isfile(record.image_path):
                try:
                    os.remove(record.image_path)
                except OSError:
                    pass
            db.delete(record)
        else:
            record.profile_id = None
    db.delete(profile)
    db.commit()
    return {"success": True, "deleted_histories": len(records) if delete_histories else 0}


@router.patch("/history/{history_id}/profile")
def assign_history_to_profile(history_id: int, body: ProfileAssign, db: Session = Depends(get_db)):
    record = db.get(ImageProcessingHistory, history_id)
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch sử.")
    if record.operation_type != "prescription_ocr":
        raise HTTPException(status_code=400, detail="Chỉ gán được lịch sử quét đơn thuốc vào hồ sơ.")
    if body.profile_id is not None:
        _get_profile(db, body.profile_id)
    record.profile_id = body.profile_id
    db.commit()
    return {"success": True, "history_id": history_id, "profile_id": record.profile_id}


@router.get("/profiles/{profile_id}/interaction-check")
async def check_profile_interactions(
    profile_id: int,
    days: int | None = Query(
        None, ge=0, le=3650,
        description="Chỉ so sánh đơn trong N ngày gần nhất (theo ngày kê đơn nếu đọc được, không thì ngày quét). "
                    "0 = tất cả. Mặc định theo CROSS_CHECK_DAYS (90).",
    ),
    explain: bool = Query(True, description="Tạo phần giải thích bằng Qwen (chậm hơn)"),
    db: Session = Depends(get_db),
):
    _get_profile(db, profile_id)
    return await run_in_threadpool(profile_cross_check, db, profile_id, days, explain)


# ---------------------------------------------------------------- sửa kết quả quét
@router.put("/history/{history_id}/medicines")
async def update_history_medicines(
    history_id: int,
    body: MedicinesUpdate = Body(...),
    explain: bool = Query(False),
    db: Session = Depends(get_db),
):
    """Người dùng sửa danh sách thuốc (tên, hàm lượng, số lượng, sản phẩm đúng...) sau khi quét.

    Hệ thống khớp lại với CSDL, tính lại tương tác của đơn này và lưu đè kết quả của lịch sử đó
    (đánh dấu user_verified). Các so sánh liên đơn về sau sẽ dùng danh sách đã sửa.
    """
    record = db.get(ImageProcessingHistory, history_id)
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch sử.")
    if record.operation_type != "prescription_ocr" or record.status != "success" or not is_structured_result(record):
        raise HTTPException(status_code=400, detail="Chỉ sửa được kết quả quét đơn thuốc đã xử lý thành công.")

    data = json.loads(record.result_text)
    medicines = []
    for item in body.medicines:
        medicine = item.model_dump()
        medicine.update(user_verified=True, needs_review=False, extraction_method="user")
        medicines.append(medicine)

    def recompute():
        catalog = load_catalog(db)
        matching = match_prescription_medicines(db, medicines, catalog=catalog)
        return matching, analyze_drug_interactions(db, matching)

    matching, interaction = await run_in_threadpool(recompute)

    explanation = {"status": "skipped", "explanation": None, "source_based": False}
    if explain:
        try:
            explanation = await run_in_threadpool(explain_drug_interactions, interaction)
        except Exception:
            explanation = {"status": "unavailable", "explanation": None, "source_based": False}

    data["ocr"]["medicines"] = medicines
    data["ocr"]["needs_review"] = False
    data["ocr"]["user_verified"] = True
    data["medicine_matching"] = matching
    data["interaction_analysis"] = interaction
    data["interaction_explanation"] = explanation

    record.result_text = json.dumps(data, ensure_ascii=False, default=str)
    record.result_summary = (
        f"Đã chỉnh sửa bởi người dùng; {len(medicines)} thuốc; trạng thái tương tác: {interaction['status']}"
    )
    db.commit()

    data["history_id"] = history_id
    return data
