
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from database.database import get_db, vn_fold
from services.drug_service import get_medicine_by_id


router = APIRouter(prefix="/medicines", tags=["Medicines"])


# =========================================================
# TRUY VẤN HOẠT CHẤT CỦA THUỐC
# Bao gồm:
# 1. Liên kết cũ: medicines.active_ingredient_id
# 2. Liên kết mới đã xác minh: medicine_ingredients
# Không sử dụng các liên kết pending_review hoặc rejected.
# =========================================================

INGREDIENT_MAP_SQL = """
    SELECT
        m.id AS medicine_id,
        a.id AS ingredient_id,
        a.name AS ingredient_name
    FROM medicines AS m
    JOIN active_ingredients AS a
        ON a.id = m.active_ingredient_id

    UNION

    SELECT
        mi.medicine_id,
        a.id AS ingredient_id,
        a.name AS ingredient_name
    FROM medicine_ingredients AS mi
    JOIN active_ingredients AS a
        ON a.id = mi.active_ingredient_id
    WHERE mi.review_status = 'verified'
"""


def attach_active_ingredients(db: Session, medicines: list[dict]):
    """Thêm danh sách hoạt chất vào dữ liệu thuốc."""

    if not medicines:
        return medicines

    medicine_ids = list({
        item["id"]
        for item in medicines
        if item.get("id") is not None
    })

    if not medicine_ids:
        return medicines

    params = {
        f"id_{index}": medicine_id
        for index, medicine_id in enumerate(medicine_ids)
    }

    placeholders = ", ".join(
        f":{key}" for key in params
    )

    query = text(f"""
        SELECT *
        FROM ({INGREDIENT_MAP_SQL}) AS ingredient_map
        WHERE medicine_id IN ({placeholders})
        ORDER BY ingredient_name
    """)

    rows = db.execute(query, params).mappings().all()

    ingredient_map = {}

    for row in rows:
        medicine_id = row["medicine_id"]

        ingredient_map.setdefault(medicine_id, []).append({
            "id": row["ingredient_id"],
            "name": row["ingredient_name"],
        })

    for medicine in medicines:
        ingredients = ingredient_map.get(
            medicine.get("id"), []
        )

        medicine["active_ingredients"] = ingredients

        # Giữ tương thích với frontend sử dụng trường cũ.
        if not medicine.get("active_ingredient") and ingredients:
            medicine["active_ingredient"] = ingredients[0]["name"]

    return medicines


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
    try:
        rows = db.execute(
            text("""
                SELECT id, keyword, search_type, result_summary, created_at
                FROM search_histories
                ORDER BY created_at DESC, id DESC
                LIMIT :limit OFFSET :skip
            """),
            {
                "limit": limit,
                "skip": skip,
            },
        ).mappings().all()

        return [dict(row) for row in rows]

    except SQLAlchemyError as error:
        print(f"Lỗi đọc lịch sử tìm kiếm: {error}", flush=True)

        raise HTTPException(
            status_code=500,
            detail="Không thể lấy lịch sử tìm kiếm",
        )


# =========================================================
# 1b. XÓA MỘT MỤC LỊCH SỬ TÌM KIẾM
# DELETE /medicines/history/{history_id}
# =========================================================

@router.delete("/history/{history_id}")
def delete_search_history(
    history_id: int,
    db: Session = Depends(get_db),
):
    try:
        result = db.execute(
            text("DELETE FROM search_histories WHERE id = :id"),
            {"id": history_id},
        )
        db.commit()
    except SQLAlchemyError as error:
        db.rollback()
        print(f"Lỗi xóa lịch sử tìm kiếm: {error}", flush=True)
        raise HTTPException(
            status_code=500,
            detail="Không thể xóa lịch sử tìm kiếm",
        )

    if result.rowcount == 0:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lịch sử tìm kiếm",
        )

    return {"success": True, "message": "Đã xóa lịch sử tìm kiếm."}


# =========================================================
# 2. TÌM KIẾM VÀ LẤY DANH SÁCH THUỐC
# GET /medicines?name=Myonal
# GET /medicines?skip=0&limit=100
# Tìm theo tên thuốc hoặc hoạt chất.
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
    # Tìm không phân biệt hoa/thường và dấu tiếng Việt (vn_fold đăng ký trong database.py).
    pattern = f"%{vn_fold(search_name)}%" if search_name else None

    query = text(f"""
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
            OR vn_fold(COALESCE(m.name, ''))
                LIKE :pattern
            OR vn_fold(COALESCE(a.name, ''))
                LIKE :pattern
            OR EXISTS (
                SELECT 1
                FROM ({INGREDIENT_MAP_SQL}) AS ingredient_map
                WHERE ingredient_map.medicine_id = m.id
                  AND vn_fold(ingredient_map.ingredient_name)
                      LIKE :pattern
            )
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

        medicines = attach_active_ingredients(
            db,
            [dict(row) for row in rows],
        )

    except SQLAlchemyError as error:
        db.rollback()
        print(f"Lỗi truy vấn thuốc: {error}", flush=True)

        raise HTTPException(
            status_code=500,
            detail="Lỗi truy vấn thuốc",
        )

    # Chỉ lưu lịch sử khi người dùng nhập từ khóa.
    # Lỗi ghi lịch sử không làm hỏng kết quả tìm kiếm thuốc.
    if search_name:
        try:
            db.execute(
                text("""
                    INSERT INTO search_histories (
                        keyword,
                        search_type,
                        result_summary,
                        created_at
                    )
                    VALUES (
                        :keyword,
                        :search_type,
                        :result_summary,
                        CURRENT_TIMESTAMP
                    )
                """),
                {
                    "keyword": search_name,
                    "search_type": "text_search",
                    "result_summary": f"Tìm thấy {len(medicines)} kết quả",
                },
            )

            db.commit()

        except SQLAlchemyError as error:
            db.rollback()
            print(f"Lỗi ghi lịch sử tìm kiếm: {error}", flush=True)

    return medicines


# =========================================================
# 3. CHI TIẾT THUỐC VÀ THUỐC CÙNG TOÀN BỘ HOẠT CHẤT
# GET /medicines/{medicine_id}/detail-with-alternatives
#
# Chỉ đối chiếu tập hoạt chất đã biết.
# Chưa khẳng định tương đương về hàm lượng, dạng bào chế
# hoặc khả năng thay thế lâm sàng.
# =========================================================

@router.get("/{medicine_id}/detail-with-alternatives")
def get_medicine_detail_with_alternatives(
    medicine_id: int,
    db: Session = Depends(get_db),
):
    try:
        row = db.execute(
            text("""
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
            """),
            {"medicine_id": medicine_id},
        ).mappings().first()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy thuốc",
            )

        medicine = attach_active_ingredients(
            db,
            [dict(row)],
        )[0]

        alternatives_query = text(f"""
            WITH ingredient_map AS (
                {INGREDIENT_MAP_SQL}
            ),
            target_ingredients AS (
                SELECT ingredient_id
                FROM ingredient_map
                WHERE medicine_id = :medicine_id
            ),
            eligible_alternatives AS (
                SELECT m.id
                FROM medicines AS m
                WHERE m.id != :medicine_id

                  AND EXISTS (
                      SELECT 1
                      FROM ingredient_map AS im
                      WHERE im.medicine_id = m.id
                  )

                  -- Không được thiếu hoạt chất của thuốc gốc.
                  AND NOT EXISTS (
                      SELECT ingredient_id
                      FROM target_ingredients
                      EXCEPT
                      SELECT ingredient_id
                      FROM ingredient_map AS im
                      WHERE im.medicine_id = m.id
                  )

                  -- Không được có thêm hoạt chất khác.
                  AND NOT EXISTS (
                      SELECT ingredient_id
                      FROM ingredient_map AS im
                      WHERE im.medicine_id = m.id
                      EXCEPT
                      SELECT ingredient_id
                      FROM target_ingredients
                  )
            )
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
            JOIN eligible_alternatives AS eligible
                ON eligible.id = m.id
            ORDER BY m.name
            LIMIT 20
        """)

        rows = db.execute(
            alternatives_query,
            {"medicine_id": medicine_id},
        ).mappings().all()

        alternatives = attach_active_ingredients(
            db,
            [dict(item) for item in rows],
        )

        return {
            "medicine": medicine,
            "alternatives": alternatives,
        }

    except HTTPException:
        raise

    except SQLAlchemyError as error:
        print(f"Lỗi lấy chi tiết thuốc: {error}", flush=True)

        raise HTTPException(
            status_code=500,
            detail="Không thể lấy thông tin thuốc",
        )


# =========================================================
# 4. CHI TIẾT THUỐC THEO ID
# GET /medicines/{medicine_id}
# =========================================================

@router.get("/{medicine_id}")
def get_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
):
    try:
        medicine = get_medicine_by_id(db, medicine_id)

        if not medicine:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy thuốc",
            )

        medicine_data = {
            column.name: getattr(medicine, column.name)
            for column in medicine.__table__.columns
        }

        return attach_active_ingredients(
            db,
            [medicine_data],
        )[0]

    except HTTPException:
        raise

    except SQLAlchemyError as error:
        print(f"Lỗi lấy thuốc theo ID: {error}", flush=True)

        raise HTTPException(
            status_code=500,
            detail="Không thể lấy thông tin thuốc",
        )
