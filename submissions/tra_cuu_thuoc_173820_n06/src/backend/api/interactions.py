from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from database.database import get_db
from services.drug_interaction_service import analyze_drug_interactions

router = APIRouter(prefix="/api/v1/interactions", tags=["Drug Interactions"])


class InteractionCheckRequest(BaseModel):
    medicine_ids: List[int] = Field(
        ...,
        description="Danh sách 1-100 ID thuốc cần kiểm tra, có thể lấy từ nhiều đơn/lịch sử khác nhau.",
    )


@router.post("/check")
def check_drug_interactions(
    payload: InteractionCheckRequest,
    db: Session = Depends(get_db),
):
    # Remove duplicate IDs while preserving the user's selection order.
    medicine_ids = list(dict.fromkeys(payload.medicine_ids))
    if not medicine_ids:
        raise HTTPException(status_code=422, detail="medicine_ids không được để trống.")
    if len(medicine_ids) > 100:
        raise HTTPException(status_code=422, detail="Mỗi lần chỉ được kiểm tra tối đa 100 thuốc.")
    if any(medicine_id <= 0 for medicine_id in medicine_ids):
        raise HTTPException(status_code=422, detail="medicine_ids phải là số nguyên dương.")

    placeholders = ", ".join(f":id_{i}" for i in range(len(medicine_ids)))
    params = {f"id_{i}": medicine_id for i, medicine_id in enumerate(medicine_ids)}

    try:
        rows = db.execute(
            text(f"SELECT id, name FROM medicines WHERE id IN ({placeholders})"),
            params,
        ).mappings().all()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Không thể truy vấn danh sách thuốc: {exc}")

    found_ids = {int(row["id"]) for row in rows}
    missing_ids = [medicine_id for medicine_id in medicine_ids if medicine_id not in found_ids]
    if missing_ids:
        raise HTTPException(
            status_code=404,
            detail={
                "message": "Một hoặc nhiều medicine_id không tồn tại.",
                "missing_medicine_ids": missing_ids,
            },
        )

    result = analyze_drug_interactions(db, medicine_ids=medicine_ids)
    result["requested_medicine_ids"] = medicine_ids
    return result
