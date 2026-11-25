
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional

from database.database import get_db
from services.drug_service import get_medicine_by_id

router = APIRouter(prefix="/medicines", tags=["Medicines"])


# =========================================================
# 1. LỊCH SỬ TÌM KIẾM
# GET /medicines/history/list
# =========================================================
@router.get("/history/list")
def get_search_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = text("""
        SELECT id, keyword, created_at
        FROM search_histories
        ORDER BY created_at DESC, id DESC
        LIMIT :limit OFFSET :skip
    """)

    try:
        rows = db.execute(
            query,
            {"limit": limit, "skip": skip},
        ).mappings().all()

        return [dict(row) for row in rows]

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Không thể lấy lịch sử tìm kiếm",
        )


# =========================================================
# 2. TÌM KIẾM VÀ LẤY DANH SÁCH THUỐC
# GET /medicines?name=Myonal
# GET /medicines?skip=0&limit=100
# Tìm theo tên thuốc hoặc hoạt chất
# =========================================================
@router.get("")
def get_medicines(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    name: Optional[str] = Query(
        None,
        description="Tìm theo tên thuốc hoặc hoạt chất",
    ),
    db: Session = Depends(get_db),
):
    search_name = name.strip() if name and name.strip() else None
    pattern = f"%{search_name}%" if search_name else None

    query = text("""
        SELECT
            m.id,
            m.name,
            m.sdk_code,
            m.strength,
            m.dosage_form,
            m.manufacturer,
            m.indication,
            m.contraindication,
            m.side_effect,
            m.warning,
            m.active_ingredient_id,
            a.name AS active_ingredient
        FROM medicines AS m
        LEFT JOIN active_ingredients AS a
            ON m.active_ingredient_id = a.id
        WHERE
            :search_name IS NULL
            OR LOWER(COALESCE(m.name, ''))
                LIKE LOWER(:pattern)
            OR LOWER(COALESCE(a.name, ''))
                LIKE LOWER(:pattern)
        ORDER BY m.name
        LIMIT :limit OFFSET :skip
    """)

    try:
        rows = db.execute(
            query,
            {
                "search_name": search_name,
                "pattern": pattern,
                "limit": limit,
                "skip": skip,
            },
        ).mappings().all()

        medicines = [dict(row) for row in rows]

        # Chỉ lưu lịch sử khi người dùng có nhập từ khóa.
        if search_name:
            db.execute(
                text("""
                    INSERT INTO search_histories (keyword, created_at)
                    VALUES (:keyword, CURRENT_TIMESTAMP)
                """),
                {"keyword": search_name},
            )
            db.commit()

        return medicines

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Lỗi truy vấn thuốc hoặc lưu lịch sử tìm kiếm",
        )


# =========================================================
# 3. CHI TIẾT THUỐC VÀ CÁC THUỐC CÙNG HOẠT CHẤT
# GET /medicines/1/detail-with-alternatives
# =========================================================
@router.get("/{medicine_id}/detail-with-alternatives")
def get_medicine_detail_with_alternatives(
    medicine_id: int,
    db: Session = Depends(get_db),
):
    query = text("""
        SELECT
            m.id,
            m.name,
            m.sdk_code,
            m.strength,
            m.dosage_form,
            m.manufacturer,
            m.indication,
            m.contraindication,
            m.side_effect,
            m.warning,
            m.active_ingredient_id,
            a.name AS active_ingredient
        FROM medicines AS m
        LEFT JOIN active_ingredients AS a
            ON m.active_ingredient_id = a.id
        WHERE m.id = :medicine_id
    """)

    try:
        row = db.execute(
            query,
            {"medicine_id": medicine_id},
        ).mappings().first()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy thuốc",
            )

        medicine = dict(row)
        ingredient_id = medicine["active_ingredient_id"]

        alternatives = []

        if ingredient_id is not None:
            alternative_query = text("""
                SELECT
                    m.id,
                    m.name,
                    m.sdk_code,
                    m.strength,
                    m.dosage_form,
                    m.manufacturer,
                    m.active_ingredient_id,
                    a.name AS active_ingredient
                FROM medicines AS m
                LEFT JOIN active_ingredients AS a
                    ON m.active_ingredient_id = a.id
                WHERE m.active_ingredient_id = :ingredient_id
                  AND m.id != :medicine_id
                ORDER BY m.name
                LIMIT 20
            """)

            rows = db.execute(
                alternative_query,
                {
                    "ingredient_id": ingredient_id,
                    "medicine_id": medicine_id,
                },
            ).mappings().all()

            alternatives = [dict(item) for item in rows]

        return {
            "medicine": medicine,
            "alternatives": alternatives,
        }

    except HTTPException:
        raise
    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Không thể lấy thông tin thuốc",
        )


# =========================================================
# 4. CHI TIẾT THUỐC THEO ID
# GET /medicines/1
# =========================================================
@router.get("/{medicine_id}")
def get_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
):
    medicine = get_medicine_by_id(db, medicine_id)

    if not medicine:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy thuốc",
        )

    return medicine
