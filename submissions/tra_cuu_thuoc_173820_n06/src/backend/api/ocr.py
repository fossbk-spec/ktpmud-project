import os
import json
import hashlib
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Body
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from starlette.concurrency import run_in_threadpool

from services.ai_service import explain_drug_interactions
from database.database import get_db
from database.models import ImageProcessingHistory, Profile
from services.ocr_service import (
    process_prescription_image,
    identify_medicine_image_logic,
)
from services.medicine_matching_service import load_catalog, match_prescription_medicines
from services.drug_interaction_service import analyze_drug_interactions
from services.profile_service import default_window_days, select_for_cross_check


router = APIRouter(
    prefix="/api/v1",
    tags=["OCR & AI Recognition"],
)

UPLOAD_DIR = Path("uploads/image_history")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_IMAGE_BYTES = 15 * 1024 * 1024  # 15 MB


# =========================================================
# 1. LƯU ẢNH
# =========================================================

def save_uploaded_image(image_bytes, original_filename):
    suffix = Path(original_filename or "").suffix.lower()

    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        suffix = ".img"

    path = UPLOAD_DIR / f"{uuid.uuid4().hex}{suffix}"
    path.write_bytes(image_bytes)

    return str(path)


# =========================================================
# 2. LƯU LỊCH SỬ
# =========================================================

def save_history(
    db,
    operation_type,
    original_filename,
    content_type,
    image_path=None,
    detected_medicine_name=None,
    result_text=None,
    result_summary=None,
    status="success",
    error_message=None,
    profile_id=None,
    prescription_date=None,
    image_sha256=None,
):
    item = ImageProcessingHistory(
        operation_type=operation_type,
        original_filename=original_filename,
        content_type=content_type,
        image_path=image_path,
        detected_medicine_name=detected_medicine_name,
        result_text=result_text,
        result_summary=result_summary,
        status=status,
        error_message=error_message,
        profile_id=profile_id,
        prescription_date=prescription_date,
        image_sha256=image_sha256,
    )

    try:
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    except Exception:
        db.rollback()
        raise


# =========================================================
# 3. KIỂM TRA FILE ẢNH
# =========================================================

def read_image_upload(file):
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if (file.content_type or "").lower() not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.",
        )


def validate_image_bytes(image_bytes):
    if not image_bytes:
        raise HTTPException(status_code=400, detail="File ảnh rỗng.")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Ảnh vượt quá giới hạn 15 MB.",
        )


# =========================================================
# 4. CHUYỂN LỊCH SỬ THÀNH DICTIONARY
# =========================================================

def history_to_dict(item):
    return {
        "id": item.id,
        "operation_type": item.operation_type,
        "original_filename": item.original_filename,
        "content_type": item.content_type,
        "detected_medicine_name": item.detected_medicine_name,
        "result_text": item.result_text,
        "result_summary": item.result_summary,
        "status": item.status,
        "error_message": item.error_message,
        "created_at": item.created_at,
        "profile_id": item.profile_id,
        "prescription_date": item.prescription_date,
        "has_image": bool(
            item.image_path and os.path.isfile(item.image_path)
        ),
    }


# =========================================================
# 5. OCR ĐƠN THUỐC VÀ PHÂN TÍCH TƯƠNG TÁC
# =========================================================

@router.post("/ocr/scan")
async def scan_prescription(
    file: UploadFile = File(...),
    profile_id: int | None = Form(
        None,
        description="Hồ sơ người dùng thuốc: nếu có, đơn được lưu vào hồ sơ và so sánh tương tác với các đơn cũ.",
    ),
    db: Session = Depends(get_db),
):
    read_image_upload(file)

    if profile_id is not None and not db.get(Profile, profile_id):
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ.")

    filename = file.filename or "prescription.jpg"
    content_type = file.content_type or "image/jpeg"
    image_path = None

    try:
        # Đọc ảnh tải lên
        image_bytes = await file.read(MAX_IMAGE_BYTES + 1)

        validate_image_bytes(image_bytes)

        image_sha256 = hashlib.sha256(image_bytes).hexdigest()

        image_path = save_uploaded_image(
            image_bytes,
            filename,
        )

        # -------------------------------------------------
        # BƯỚC 1: OCR ĐƠN THUỐC
        # -------------------------------------------------

        raw_result = await process_prescription_image(image_path)
        ocr_data = json.loads(raw_result)

        medicines = ocr_data.get("medicines", [])

        # -------------------------------------------------
        # BƯỚC 2: ĐỐI CHIẾU THUỐC VỚI DATABASE
        # -------------------------------------------------

        matching_results = match_prescription_medicines(
            db,
            medicines,
        )

        # -------------------------------------------------
        # BƯỚC 3: PHÂN TÍCH TƯƠNG TÁC THUỐC
        # -------------------------------------------------

        interaction_result = analyze_drug_interactions(
            db,
            matching_results,
        )

        # -------------------------------------------------
        # BƯỚC 4: GIẢI THÍCH KẾT QUẢ BẰNG AI
        # -------------------------------------------------

        try:
            interaction_explanation = await run_in_threadpool(
                explain_drug_interactions,
                interaction_result,
            )

        except Exception:
            # Lỗi AI không được làm hỏng kết quả OCR
            # và kết quả phân tích tương tác từ database.

            interaction_explanation = {
                "status": "unavailable",
                "explanation": (
                    "Chưa tạo được phần giải thích bằng AI. "
                    "Hãy xem kết quả đối chiếu và nguồn dữ liệu bên dưới."
                ),
                "source_based": False,
            }

        # -------------------------------------------------
        # BƯỚC 5: TẠO RESPONSE
        # -------------------------------------------------

        response_data = {
            "success": True,
            "ocr": ocr_data,
            "medicine_matching": matching_results,
            "interaction_analysis": interaction_result,
            "interaction_explanation": interaction_explanation,
        }

        # -------------------------------------------------
        # BƯỚC 6: LƯU LỊCH SỬ
        # -------------------------------------------------

        history = save_history(
            db=db,
            operation_type="prescription_ocr",
            original_filename=filename,
            content_type=content_type,
            image_path=image_path,
            result_text=json.dumps(
                response_data,
                ensure_ascii=False,
                default=str,
            ),
            result_summary=(
                f"OCR hoàn tất; {len(medicines)} thuốc được trích xuất; "
                f"trạng thái tương tác: {interaction_result['status']}"
            ),
            status="success",
            profile_id=profile_id,
            prescription_date=ocr_data.get("prescription_date"),
            image_sha256=image_sha256,
        )

        response_data["history_id"] = history.id
        response_data["profile_id"] = profile_id

        # -------------------------------------------------
        # BƯỚC 7: SO SÁNH VỚI CÁC ĐƠN CŨ CỦA CÙNG HỒ SƠ (không để lỗi làm hỏng kết quả quét)
        # -------------------------------------------------

        if profile_id is not None:
            try:
                response_data["cross_prescription_analysis"] = await run_in_threadpool(
                    profile_cross_check, db, profile_id, None, False
                )
            except Exception as exc:
                response_data["cross_prescription_analysis"] = {
                    "success": False,
                    "status": "unavailable",
                    "message": f"Chưa so sánh được với các đơn cũ: {type(exc).__name__}",
                }

        return response_data

    except HTTPException:
        raise

    except Exception as e:
        # Nếu xử lý thất bại, lưu lịch sử lỗi.

        try:
            save_history(
                db=db,
                operation_type="prescription_ocr",
                original_filename=filename,
                content_type=content_type,
                image_path=image_path,
                status="failed",
                error_message=str(e),
            )

        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail=f"Lỗi xử lý OCR đơn thuốc: {str(e)}",
        )


# =========================================================
# 6. NHẬN DIỆN THUỐC TỪ ẢNH
# =========================================================

@router.post("/medicines/identify-by-image")
async def identify_medicine_by_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    read_image_upload(file)

    filename = file.filename or "medicine.jpg"
    content_type = file.content_type or "image/jpeg"
    image_path = None

    try:
        image_bytes = await file.read(MAX_IMAGE_BYTES + 1)

        validate_image_bytes(image_bytes)

        image_path = save_uploaded_image(
            image_bytes,
            filename,
        )

        # PaddleOCR đọc chữ local, Ollama chuẩn hóa thông tin trên bao bì.
        detected = await identify_medicine_image_logic(
            image_bytes,
            content_type,
            db,
        )

        # Đối chiếu thuốc với database.
        matching = match_prescription_medicines(
            db,
            [detected],
        )

        response_data = {
            "success": True,
            "detected_medicine": detected,
            "medicine_matching": matching,
        }

        detected_name = (
            detected.get("brand_name")
            or detected.get("prescription_name")
        )

        # Lưu lịch sử nhận diện ảnh thuốc.
        history = save_history(
            db=db,
            operation_type="medicine_image_identification",
            original_filename=filename,
            content_type=content_type,
            image_path=image_path,
            detected_medicine_name=detected_name,
            result_text=json.dumps(
                response_data,
                ensure_ascii=False,
                default=str,
            ),
            result_summary=(
                f"Đã xử lý ảnh thuốc: {detected_name or 'chưa xác định'}"
            ),
            status="success",
        )

        response_data["history_id"] = history.id

        return response_data

    except HTTPException:
        raise

    except Exception as e:
        try:
            save_history(
                db=db,
                operation_type="medicine_image_identification",
                original_filename=filename,
                content_type=content_type,
                image_path=image_path,
                status="failed",
                error_message=str(e),
            )

        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# =========================================================
# 7. LẤY DANH SÁCH LỊCH SỬ
# =========================================================

@router.get("/history")
def get_image_processing_history(
    skip: int = 0,
    limit: int = 20,
    operation_type: str = None,
    db: Session = Depends(get_db),
):
    query = db.query(ImageProcessingHistory)

    if operation_type:
        query = query.filter(
            ImageProcessingHistory.operation_type == operation_type
        )

    total = query.count()

    records = (
        query.order_by(desc(ImageProcessingHistory.created_at))
        .offset(max(0, skip))
        .limit(max(1, min(limit, 100)))
        .all()
    )

    return {
        "total": total,
        "items": [
            history_to_dict(item)
            for item in records
        ],
    }


# =========================================================
# 8. CHI TIẾT LỊCH SỬ
# =========================================================

@router.get("/history/{history_id}")
def get_image_processing_history_detail(
    history_id: int,
    db: Session = Depends(get_db),
):
    item = (
        db.query(ImageProcessingHistory)
        .filter(ImageProcessingHistory.id == history_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lịch sử.",
        )

    return history_to_dict(item)


# =========================================================
# 9. LẤY ẢNH TỪ LỊCH SỬ
# =========================================================

@router.get("/history/{history_id}/image")
def get_image_processing_history_image(
    history_id: int,
    db: Session = Depends(get_db),
):
    item = (
        db.query(ImageProcessingHistory)
        .filter(ImageProcessingHistory.id == history_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lịch sử.",
        )

    if not item.image_path or not os.path.isfile(item.image_path):
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy file ảnh.",
        )

    return FileResponse(
        path=item.image_path,
        media_type=item.content_type or "application/octet-stream",
        filename=item.original_filename or "image",
    )


# =========================================================
# 10. XÓA LỊCH SỬ
# =========================================================

@router.delete("/history/{history_id}")
def delete_image_processing_history(
    history_id: int,
    db: Session = Depends(get_db),
):
    item = (
        db.query(ImageProcessingHistory)
        .filter(ImageProcessingHistory.id == history_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lịch sử.",
        )

    image_path = item.image_path

    db.delete(item)
    db.commit()

    if image_path and os.path.isfile(image_path):
        try:
            os.remove(image_path)
        except OSError:
            pass

    return {
        "success": True,
        "message": "Đã xóa lịch sử.",
    }

# =========================================================
# 11. KIỂM TRA TƯƠNG TÁC GIỮA NHIỀU ĐƠN THUỐC
# =========================================================

@router.post("/interactions/check-multiple-prescriptions")
def check_multiple_prescriptions(
    history_ids: list[int] = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    return run_cross_prescription_check(db, history_ids)


def profile_cross_check(db, profile_id, days=None, explain=True):
    """So sánh tất cả đơn hợp lệ của một hồ sơ trong cửa sổ `days` ngày gần nhất."""
    window = default_window_days() if days is None else days
    records = (
        db.query(ImageProcessingHistory)
        .filter(ImageProcessingHistory.profile_id == profile_id)
        .all()
    )
    selected, excluded = select_for_cross_check(records, window)

    info = {
        "profile_id": profile_id,
        "window_days": window,
        "compared_history_ids": [r.id for r in selected],
        "excluded_prescriptions": excluded,
    }

    if len(selected) < 2:
        return {
            "success": True,
            "status": "not_enough_prescriptions",
            "message": (
                "Hồ sơ cần ít nhất hai đơn thuốc hợp lệ trong khoảng thời gian đã chọn "
                "để so sánh tương tác giữa các đơn."
            ),
            "prescription_count": len(selected),
            **info,
        }

    result = run_cross_prescription_check(db, [r.id for r in selected], explain=explain)
    result.update(info)
    return result


def run_cross_prescription_check(db, history_ids, explain=True):
    # -----------------------------------------------------
    # BƯỚC 1: KIỂM TRA DANH SÁCH ĐƠN
    # -----------------------------------------------------

    if not history_ids:
        raise HTTPException(
            status_code=400,
            detail="Vui lòng chọn ít nhất hai đơn thuốc.",
        )

    if len(history_ids) > 50:
        raise HTTPException(
            status_code=400,
            detail="Chỉ được kiểm tra tối đa 50 đơn mỗi lần.",
        )

    if any(history_id <= 0 for history_id in history_ids):
        raise HTTPException(
            status_code=400,
            detail="History ID phải là số nguyên dương.",
        )

    # Loại bỏ ID trùng.
    history_ids = list(dict.fromkeys(history_ids))

    if len(history_ids) < 2:
        raise HTTPException(
            status_code=400,
            detail="Cần chọn ít nhất hai đơn thuốc khác nhau.",
        )

    records = (
        db.query(ImageProcessingHistory)
        .filter(
            ImageProcessingHistory.id.in_(history_ids)
        )
        .all()
    )

    record_by_id = {
        item.id: item
        for item in records
    }

    missing_ids = [
        history_id
        for history_id in history_ids
        if history_id not in record_by_id
    ]

    if missing_ids:
        raise HTTPException(
            status_code=404,
            detail={
                "message": "Không tìm thấy một số lịch sử.",
                "missing_history_ids": missing_ids,
            },
        )

    ordered_records = [
        record_by_id[history_id]
        for history_id in history_ids
    ]

    # Chỉ cho phép lịch sử OCR đơn thuốc.
    invalid_records = [
        {
            "history_id": item.id,
            "operation_type": item.operation_type,
        }
        for item in ordered_records
        if item.operation_type != "prescription_ocr"
    ]

    if invalid_records:
        raise HTTPException(
            status_code=400,
            detail={
                "message": (
                    "Chỉ được chọn lịch sử OCR đơn thuốc. "
                    "Ảnh nhận diện bao bì thuốc không được chấp nhận."
                ),
                "invalid_records": invalid_records,
            },
        )

    # -----------------------------------------------------
    # BƯỚC 2: ĐỌC KẾT QUẢ OCR TỪ TỪNG ĐƠN
    # -----------------------------------------------------

    matching_by_id = {}
    medicine_sources = {}
    unmatched_medicines = []
    virtual_counter = {}
    catalog = None

    selected_prescriptions = []

    for record in ordered_records:

        if record.status != "success":
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Lịch sử {record.id} chưa xử lý thành công."
                ),
            )

        if not record.result_text:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Lịch sử {record.id} không có dữ liệu OCR."
                ),
            )

        try:
            result_data = json.loads(record.result_text)
        except (TypeError, json.JSONDecodeError):
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Lịch sử {record.id} là bản ghi từ phiên bản cũ (kết quả văn bản "
                    "tự do, không có cấu trúc) nên không dùng được để kiểm tra tương tác. "
                    "Hãy quét lại đơn thuốc này."
                ),
            )

        # Khớp lại thuốc từ danh sách đã lưu bằng dữ liệu CSDL MỚI NHẤT (ví dụ sau khi duyệt liên
        # kết hoạt chất hoặc người dùng sửa đơn), thay vì tin kết quả khớp đã chụp lại lúc quét.
        stored_medicines = (result_data.get("ocr") or {}).get("medicines")

        if isinstance(stored_medicines, list) and stored_medicines:
            if catalog is None:
                catalog = load_catalog(db)

            matching_results = match_prescription_medicines(
                db, stored_medicines, catalog=catalog
            )
        else:
            matching_results = result_data.get(
                "medicine_matching",
                [],
            )

        if not isinstance(matching_results, list):
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Dữ liệu medicine_matching của lịch sử "
                    f"{record.id} không hợp lệ."
                ),
            )

        selected_prescriptions.append({
            "history_id": record.id,
            "filename": record.original_filename,
            "created_at": record.created_at,
            "prescription_date": record.prescription_date,
            "profile_id": record.profile_id,
        })

        for item in matching_results:

            if not isinstance(item, dict):
                continue

            if item.get("match_status") != "matched":
                unmatched_medicines.append({
                    "history_id": record.id,
                    "prescription_medicine": item.get(
                        "prescription_medicine"
                    ),
                    "match_status": item.get("match_status"),
                    "match_reasons": item.get("match_reasons", []),
                    "ingredient_resolution": item.get("ingredient_resolution"),
                })

                # Chưa chọn được sản phẩm nhưng đã xác định được hoạt chất: vẫn đưa vào phân
                # tích (id âm duy nhất theo đơn + vị trí) để không bỏ sót tương tác.
                resolution = item.get("ingredient_resolution") or {}

                if (
                    resolution.get("status") == "resolved"
                    and resolution.get("ingredients")
                ):
                    virtual_counter[record.id] = virtual_counter.get(record.id, 0) + 1
                    analysis_id = -(record.id * 1000 + virtual_counter[record.id])

                    matching_by_id[analysis_id] = dict(item, analysis_id=analysis_id)
                    medicine_sources.setdefault(analysis_id, set()).add(record.id)

                continue

            matched = item.get("matched_medicine")

            if not isinstance(matched, dict):
                continue

            raw_id = (
                matched.get("id")
                or matched.get("medicine_id")
            )

            try:
                medicine_id = int(raw_id)
            except (TypeError, ValueError):
                continue

            # Mỗi medicine ID chỉ đưa vào phân tích một lần.
            matching_by_id.setdefault(
                medicine_id,
                item,
            )

            # Nhưng vẫn lưu tất cả đơn có chứa thuốc này.
            medicine_sources.setdefault(
                medicine_id,
                set(),
            ).add(record.id)

    # -----------------------------------------------------
    # BƯỚC 3: KIỂM TRA THUỐC ĐÃ GHÉP THÀNH CÔNG
    # -----------------------------------------------------

    if not matching_by_id:
        return {
            "success": True,
            "status": "unavailable",
            "message": (
                "Không có thuốc nào được ghép thành công "
                "với cơ sở dữ liệu."
            ),
            "selected_prescriptions": selected_prescriptions,
            "interaction_analysis": {
                "status": "unavailable",
                "medicine_count": 0,
                "ingredient_count": 0,
                "checked_pairs": 0,
                "expected_pairs": 0,
                "interactions": [],
                "unverified_pairs": [],
            },
            "unmatched_medicines": unmatched_medicines,
        }

    medicine_ids = sorted(matching_by_id.keys())

    # -----------------------------------------------------
    # BƯỚC 4: TẠO CÁC CẶP THUỐC NẰM Ở HAI ĐƠN KHÁC NHAU
    # -----------------------------------------------------

    allowed_medicine_pairs = set()

    for index, left_id in enumerate(medicine_ids):

        left_sources = medicine_sources.get(left_id, set())

        for right_id in medicine_ids[index + 1:]:

            right_sources = medicine_sources.get(
                right_id,
                set(),
            )

            # Chỉ chấp nhận nếu hai thuốc có thể thuộc
            # hai đơn khác nhau.
            has_cross_prescription = any(
                left_history_id != right_history_id
                for left_history_id in left_sources
                for right_history_id in right_sources
            )

            if has_cross_prescription:
                allowed_medicine_pairs.add(
                    (left_id, right_id)
                )

    # -----------------------------------------------------
    # BƯỚC 5: PHÂN TÍCH TƯƠNG TÁC
    # -----------------------------------------------------

    interaction_result = analyze_drug_interactions(
        db,
        matched_medicines=list(matching_by_id.values()),
        allowed_medicine_pairs=allowed_medicine_pairs,
    )

    # -----------------------------------------------------
    # BƯỚC 6: BỔ SUNG NGUỒN ĐƠN THUỐC CHO TỪNG THUỐC
    # -----------------------------------------------------

    medicine_provenance = {}

    for medicine in interaction_result.get("medicines", []):

        medicine_id = medicine.get("analysis_id", medicine.get("medicine_id"))

        sources = sorted(
            medicine_sources.get(medicine_id, set())
        )

        medicine["prescription_history_ids"] = sources

        medicine_provenance[medicine_id] = {
            "medicine_id": medicine_id if medicine_id > 0 else None,
            "medicine_name": medicine.get("medicine_name"),
            "prescription_history_ids": sources,
        }

    for duplicate in interaction_result.get("duplicate_ingredients", []):

        history_ids = set()

        for item in duplicate.get("medicines", []):
            history_ids.update(
                medicine_sources.get(item.get("analysis_id"), set())
            )

        duplicate["prescription_history_ids"] = sorted(history_ids)

    # -----------------------------------------------------
    # BƯỚC 7: GẮN NGUỒN THUỐC VÀO TỪNG CẶP HOẠT CHẤT
    # -----------------------------------------------------

    def normalize_name(value):
        return " ".join(
            str(value or "").strip().casefold().split()
        )

    ingredient_provenance = {}

    for medicine in interaction_result.get("medicines", []):

        medicine_id = medicine.get("analysis_id", medicine.get("medicine_id"))

        provenance = medicine_provenance.get(medicine_id)

        if not provenance:
            continue

        for ingredient in medicine.get("active_ingredients", []):

            # drug_interaction_service trả active_ingredients dạng object
            # {"name": ..., "sources": [...]}; vẫn hỗ trợ chuỗi cũ.
            if isinstance(ingredient, dict):
                ingredient_name = ingredient.get("name")
            else:
                ingredient_name = ingredient

            key = normalize_name(ingredient_name)

            if not key:
                continue

            ingredient_provenance.setdefault(
                key,
                {},
            )[medicine_id] = provenance

    def enrich_pair(pair):

        ingredient_a = normalize_name(
            pair.get("ingredient_a")
        )

        ingredient_b = normalize_name(
            pair.get("ingredient_b")
        )

        medicines_a = list(
            ingredient_provenance.get(
                ingredient_a,
                {},
            ).values()
        )

        medicines_b = list(
            ingredient_provenance.get(
                ingredient_b,
                {},
            ).values()
        )

        history_ids_a = {
            history_id
            for medicine in medicines_a
            for history_id in medicine["prescription_history_ids"]
        }

        history_ids_b = {
            history_id
            for medicine in medicines_b
            for history_id in medicine["prescription_history_ids"]
        }

        pair["ingredient_a_medicines"] = medicines_a
        pair["ingredient_b_medicines"] = medicines_b

        pair["prescription_history_ids"] = sorted(
            history_ids_a | history_ids_b
        )

        return pair

    for pair in interaction_result.get("interactions", []):
        enrich_pair(pair)

    for pair in interaction_result.get("unverified_pairs", []):
        enrich_pair(pair)

    # -----------------------------------------------------
    # BƯỚC 8: GIẢI THÍCH BẰNG AI
    # -----------------------------------------------------

    try:
        if not explain:
            raise RuntimeError("explanation skipped")

        interaction_explanation = explain_drug_interactions(
            interaction_result
        )

    except Exception:
        interaction_explanation = {
            "status": "unavailable" if explain else "skipped",
            "explanation": (
                "Chưa tạo được phần giải thích bằng AI. "
                "Hãy xem kết quả đối chiếu từ cơ sở dữ liệu."
                if explain
                else "Bỏ qua phần giải thích AI; dùng kết quả đối chiếu từ cơ sở dữ liệu."
            ),
            "source_based": False,
        }

    # -----------------------------------------------------
    # BƯỚC 9: TRẢ KẾT QUẢ
    # -----------------------------------------------------

    return {
        "success": True,
        "status": interaction_result.get("status"),

        "selected_prescriptions": selected_prescriptions,

        "prescription_count": len(selected_prescriptions),

        "medicine_count": interaction_result.get(
            "medicine_count",
            0,
        ),

        "ingredient_count": interaction_result.get(
            "ingredient_count",
            0,
        ),

        "interaction_analysis": interaction_result,

        "interaction_explanation": interaction_explanation,

        "unmatched_medicines": unmatched_medicines,

        "scope": "cross_prescription_only",
    }
