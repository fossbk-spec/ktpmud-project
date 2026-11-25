
import unicodedata

from sqlalchemy import inspect, text


def normalize_ingredient(value):
    """Chuẩn hóa tên hoạt chất: hạ chữ thường, bỏ dấu tiếng Việt, gộp khoảng trắng.

    Dùng cùng một cách chuẩn hóa cho tên từ đơn thuốc, tên trong DB và tên trong
    drug_interactions để "Acid mefenamic" / "acid mefenamic" / "Acid mêfenamic" khớp nhau.
    """
    if not value:
        return ""

    text_value = str(value).replace("đ", "d").replace("Đ", "D")
    text_value = unicodedata.normalize("NFD", text_value.casefold())
    text_value = "".join(
        ch for ch in text_value if unicodedata.category(ch) != "Mn"
    )

    return " ".join(text_value.split())


def find_duplicate_ingredients(
    ingredient_by_medicine,
    medicine_names,
    allowed_medicine_pairs=None,
):
    """Hoạt chất xuất hiện ở từ hai thuốc trở lên (nguy cơ trùng hoạt chất / dùng trùng).

    Đây KHÔNG phải tương tác thuốc; kết quả được trả riêng. Nếu có allowed_medicine_pairs
    (kiểm tra giữa nhiều đơn) thì chỉ tính các thuốc nằm trong cặp được phép.
    """
    holders = {}

    for med_id, ingredient_map in ingredient_by_medicine.items():
        for key, name in ingredient_map.items():
            holders.setdefault(key, {"name": name, "ids": set()})["ids"].add(med_id)

    duplicates = []

    for key, info in holders.items():
        ids = sorted(info["ids"])

        if allowed_medicine_pairs is not None:
            ids = sorted({
                med_id
                for left in ids
                for right in ids
                if left < right and (left, right) in allowed_medicine_pairs
                for med_id in (left, right)
            })

        if len(ids) < 2:
            continue

        duplicates.append({
            "ingredient": info["name"],
            "medicines": [
                {
                    "medicine_id": med_id if med_id > 0 else None,
                    "analysis_id": med_id,
                    "medicine_name": medicine_names.get(med_id),
                }
                for med_id in ids
            ],
            "status": "duplicate_ingredient",
            "message": (
                "Cùng một hoạt chất xuất hiện ở nhiều thuốc; cần xem xét nguy cơ "
                "dùng trùng hoạt chất."
            ),
        })

    return sorted(duplicates, key=lambda item: normalize_ingredient(item["ingredient"]))


def extract_ingredient_names(medicine):
    """
    Extract ingredient names from OCR/matching medicine dictionaries.
    These are OCR-provided values, not automatically verified DB data.
    """
    if not isinstance(medicine, dict):
        return []

    values = []

    single = medicine.get("active_ingredient")

    if isinstance(single, str) and single.strip():
        values.append(single.strip())

    multiple = medicine.get("active_ingredients") or []

    if isinstance(multiple, str):
        multiple = [multiple]

    if isinstance(multiple, list):
        for item in multiple:
            if isinstance(item, str):
                name = item.strip()

            elif isinstance(item, dict):
                name = (
                    item.get("name")
                    or item.get("ingredient_name")
                    or item.get("active_ingredient")
                    or item.get("active_ingredient_name")
                )

                name = str(name).strip() if name else ""

            else:
                name = ""

            if name:
                values.append(name)

    unique = {}

    for name in values:
        key = normalize_ingredient(name)

        if key:
            unique.setdefault(key, name)

    return list(unique.values())


def _empty_result(message, medicines=None, skipped=None):
    return {
        "status": "unavailable",
        "medicine_count": len(medicines or []),
        "ingredient_count": 0,
        "checked_pairs": 0,
        "pairs_with_interaction_records": 0,
        "expected_pairs": 0,
        "medicines": medicines or [],
        "ingredients": [],
        "interactions": [],
        "unverified_pairs": [],
        "duplicate_ingredients": [],
        "not_analyzed_medicines": [],
        "skipped_medicines": skipped or [],
        "message": message,
        "safety_note": (
            "Không tìm thấy bản ghi trong cơ sở dữ liệu không đồng nghĩa "
            "với việc phối hợp thuốc an toàn."
        ),
    }


def analyze_drug_interactions(
    db,
    matched_medicines=None,
    medicine_ids=None,
    allowed_medicine_pairs=None,
):
    """
    Check ingredient pairs using database interaction records.

    Inputs:
    - matched_medicines: OCR medicine matching results.
    - medicine_ids: Explicit medicine IDs.
    - allowed_medicine_pairs: Optional set of allowed medicine ID pairs.

    Ingredient sources:
    - OCR ingredient text: retained as unverified OCR input.
    - medicines.active_ingredient_id: legacy DB relationship.
    - medicine_ingredients: only review_status='verified'.

    Missing interaction records are reported as unverified.
    """

    matched_medicines = matched_medicines or []
    medicine_ids = medicine_ids or []

    selected = []
    seen_ids = set()

    # --------------------------------------------------
    # 1. Extract successfully matched medicines
    # --------------------------------------------------

    for item in matched_medicines:

        if not (
            isinstance(item, dict)
            and item.get("match_status") == "matched"
            and isinstance(item.get("matched_medicine"), dict)
        ):
            continue

        med = item["matched_medicine"]

        raw_id = med.get("id") or med.get("medicine_id")

        try:
            med_id = int(raw_id)
        except (TypeError, ValueError):
            continue

        if med_id <= 0:
            continue

        if med_id in seen_ids:
            continue

        selected.append({
            "id": med_id,
            "name": med.get("name") or med.get("medicine_name"),
            "active_ingredient": med.get("active_ingredient"),
            "active_ingredients": med.get("active_ingredients") or [],
        })

        seen_ids.add(med_id)

    # --------------------------------------------------
    # 1b. Thuốc chưa chọn được sản phẩm cụ thể nhưng đã xác định được HOẠT CHẤT
    #     (đơn chỉ ghi tên chung/biệt dược, không ghi hãng). Kiểm tra tương tác chỉ cần hoạt chất.
    #     Dùng id âm để không trùng id thuốc trong CSDL.
    # --------------------------------------------------

    virtual_count = 0
    not_analyzed = []

    for item in matched_medicines:

        if not isinstance(item, dict) or item.get("match_status") == "matched":
            continue

        resolution = item.get("ingredient_resolution") or {}
        resolved = resolution.get("ingredients") or []

        if resolution.get("status") != "resolved" or not resolved:
            # Phải nói rõ thuốc nào CHƯA được kiểm tra, để không ai tưởng đã kiểm tra cả đơn.
            prescription = item.get("prescription_medicine") or {}
            not_analyzed.append({
                "medicine_name": (
                    prescription.get("prescription_name")
                    or prescription.get("brand_name")
                ),
                "status": (
                    "ingredient_conflict"
                    if resolution.get("status") == "conflict"
                    else "ingredient_unresolved"
                ),
                "reason": (
                    "Chưa xác định được hoạt chất nên thuốc này chưa được kiểm tra tương tác."
                ),
            })
            continue

        virtual_count += 1
        prescription = item.get("prescription_medicine") or {}

        # Người gọi có thể cấp id âm riêng (để theo dõi nguồn đơn thuốc); mặc định -1, -2...
        requested_id = item.get("analysis_id")
        virtual_id = (
            requested_id
            if isinstance(requested_id, int) and requested_id < 0 and requested_id not in seen_ids
            else -virtual_count
        )
        seen_ids.add(virtual_id)

        selected.append({
            "id": virtual_id,
            "name": (
                prescription.get("prescription_name")
                or prescription.get("brand_name")
            ),
            "active_ingredient": None,
            "active_ingredients": [entry["name"] for entry in resolved],
            "_virtual": True,
            "_meta": {
                normalize_ingredient(entry["name"]): {
                    "source": entry.get("source"),
                    "confidence": entry.get("confidence"),
                }
                for entry in resolved
            },
        })

    # --------------------------------------------------
    # 2. Add explicitly supplied medicine IDs
    # --------------------------------------------------

    for raw_id in medicine_ids:

        try:
            med_id = int(raw_id)
        except (TypeError, ValueError):
            continue

        if med_id <= 0 or med_id in seen_ids:
            continue

        selected.append({
            "id": med_id,
            "name": None,
            "active_ingredient": None,
            "active_ingredients": [],
        })

        seen_ids.add(med_id)

    not_analyzed_note = (
        f" Lưu ý: {len(not_analyzed)} thuốc chưa được kiểm tra vì chưa xác định được hoạt chất "
        f"({', '.join(str(n['medicine_name']) for n in not_analyzed)})."
        if not_analyzed
        else ""
    )

    if not selected:
        result = _empty_result(
            "Không có thuốc đã được xác nhận để kiểm tra." + not_analyzed_note
        )
        result["not_analyzed_medicines"] = not_analyzed
        return result

    # --------------------------------------------------
    # 3. Read medicine and ingredient information
    # --------------------------------------------------

    try:

        inspector = inspect(db.get_bind())
        tables = set(inspector.get_table_names())

        if "medicines" not in tables or "active_ingredients" not in tables:
            return _empty_result(
                "Thiếu bảng medicines hoặc active_ingredients.",
                selected,
            )

        ids = [med["id"] for med in selected if med["id"] > 0]

        params = {
            f"id_{i}": value
            for i, value in enumerate(ids)
        }

        in_clause = ", ".join(
            f":id_{i}"
            for i in range(len(ids))
        ) or "NULL"

        # Read medicine names and legacy ingredient links.
        medicine_rows = db.execute(
            text(f"""
                SELECT
                    m.id,
                    m.name,
                    ai.name AS ingredient_name
                FROM medicines m
                LEFT JOIN active_ingredients ai
                    ON ai.id = m.active_ingredient_id
                WHERE m.id IN ({in_clause})
            """),
            params,
        ).mappings().all()

        medicine_by_id = {
            int(row["id"]): row
            for row in medicine_rows
        }

        # --------------------------------------------------
        # 4. Build ingredient information per medicine
        # --------------------------------------------------

        ingredient_by_medicine = {}

        # Track ingredient data sources.
        ingredient_sources = {}

        for med in selected:

            med_id = med["id"]

            ingredient_by_medicine[med_id] = {}
            ingredient_sources[med_id] = {}

            # OCR-provided ingredients.
            for name in extract_ingredient_names(med):

                key = normalize_ingredient(name)

                if not key:
                    continue

                ingredient_by_medicine[med_id].setdefault(
                    key,
                    name,
                )

                ingredient_sources[med_id].setdefault(
                    key,
                    set(),
                ).add("resolved" if med.get("_virtual") else "ocr")

            row = medicine_by_id.get(med_id)

            if row:

                med["name"] = med.get("name") or row["name"]

                # Legacy medicine.active_ingredient_id.
                name = row["ingredient_name"]

                if name:

                    key = normalize_ingredient(name)

                    ingredient_by_medicine[med_id].setdefault(
                        key,
                        name,
                    )

                    ingredient_sources[med_id].setdefault(
                        key,
                        set(),
                    ).add("legacy_database")

        # --------------------------------------------------
        # 5. Read verified medicine_ingredients links
        # --------------------------------------------------

        if "medicine_ingredients" in tables:

            mi_columns = {
                column["name"]
                for column in inspector.get_columns(
                    "medicine_ingredients"
                )
            }

            required_columns = {
                "medicine_id",
                "active_ingredient_id",
                "review_status",
            }

            if required_columns.issubset(mi_columns):

                rows = db.execute(
                    text(f"""
                        SELECT DISTINCT
                            mi.medicine_id,
                            ai.name AS ingredient_name
                        FROM medicine_ingredients mi
                        JOIN active_ingredients ai
                            ON ai.id = mi.active_ingredient_id
                        WHERE mi.review_status = 'verified'
                          AND mi.medicine_id IN ({in_clause})
                    """),
                    params,
                ).mappings().all()

                for row in rows:

                    med_id = int(row["medicine_id"])
                    name = row["ingredient_name"]

                    if not name:
                        continue

                    key = normalize_ingredient(name)

                    ingredient_by_medicine.setdefault(
                        med_id,
                        {},
                    ).setdefault(key, name)

                    ingredient_sources.setdefault(
                        med_id,
                        {},
                    ).setdefault(key, set()).add(
                        "verified_database"
                    )

    except Exception as exc:

        return _empty_result(
            f"Lỗi lấy thông tin thuốc/hoạt chất: {exc}",
            selected,
        )

    # --------------------------------------------------
    # 6. Build response medicine list
    # --------------------------------------------------

    response_medicines = []
    skipped = []
    all_ingredients = {}

    for med in selected:

        med_id = med["id"]

        row = medicine_by_id.get(med_id)

        ingredient_map = ingredient_by_medicine.get(
            med_id,
            {},
        )

        names = list(ingredient_map.values())

        source_map = ingredient_sources.get(
            med_id,
            {},
        )

        meta = med.get("_meta") or {}

        response_medicines.append({
            "medicine_id": None if med.get("_virtual") else med_id,
            "analysis_id": med_id,
            "product_resolved": not med.get("_virtual"),
            "medicine_name": (
                med.get("name")
                or (row["name"] if row else None)
            ),
            "active_ingredients": [
                {
                    "name": name,
                    "sources": sorted(
                        source_map.get(
                            normalize_ingredient(name),
                            set(),
                        )
                    ),
                    "confidence": meta.get(
                        normalize_ingredient(name), {}
                    ).get("confidence", "verified"),
                    "resolution_source": meta.get(
                        normalize_ingredient(name), {}
                    ).get("source"),
                }
                for name in names
            ],
        })

        if med.get("_virtual"):
            pass

        elif not row:

            skipped.append({
                "medicine_id": med_id,
                "status": "medicine_not_found",
            })

        elif not names:

            skipped.append({
                "medicine_id": med_id,
                "medicine_name": row["name"],
                "status": "missing_ingredient",
            })

        for name in names:

            key = normalize_ingredient(name)

            all_ingredients.setdefault(key, name)

    ingredients = list(all_ingredients.values())

    duplicate_ingredients = find_duplicate_ingredients(
        ingredient_by_medicine,
        {item["analysis_id"]: item["medicine_name"] for item in response_medicines},
        allowed_medicine_pairs,
    )

    # --------------------------------------------------
    # 7. Build medicine pairs
    # --------------------------------------------------

    pair_map = {}

    valid_medicine_ids = [
        med_id
        for med_id, ingredient_map in ingredient_by_medicine.items()
        if ingredient_map
    ]

    for index, left_id in enumerate(valid_medicine_ids):

        left_ingredients = ingredient_by_medicine.get(
            left_id,
            {},
        )

        for right_id in valid_medicine_ids[index + 1:]:

            # Restrict pairs when the caller provides a whitelist.
            if allowed_medicine_pairs is not None:

                pair_ids = tuple(sorted((left_id, right_id)))

                if pair_ids not in allowed_medicine_pairs:
                    continue

            right_ingredients = ingredient_by_medicine.get(
                right_id,
                {},
            )

            for left_name in left_ingredients.values():

                for right_name in right_ingredients.values():

                    left_key = normalize_ingredient(left_name)
                    right_key = normalize_ingredient(right_name)

                    if (
                        not left_key
                        or not right_key
                        or left_key == right_key
                    ):
                        continue

                    pair_key = tuple(
                        sorted((left_key, right_key))
                    )

                    pair_map.setdefault(
                        pair_key,
                        (left_name, right_name),
                    )

    pairs = list(pair_map.values())

    # --------------------------------------------------
    # 8. Handle cases with no valid pairs
    # --------------------------------------------------

    if not pairs:

        result = _empty_result(
            "Chưa đủ hai hoạt chất đã xác định để tạo cặp kiểm tra.",
            response_medicines,
            skipped,
        )

        result["medicine_count"] = len(response_medicines)
        result["ingredient_count"] = len(ingredients)
        result["ingredients"] = ingredients
        result["duplicate_ingredients"] = duplicate_ingredients
        result["not_analyzed_medicines"] = not_analyzed
        result["message"] = result["message"] + not_analyzed_note

        if (
            allowed_medicine_pairs is not None
            and not allowed_medicine_pairs
        ):

            result["status"] = "no_cross_prescription_pairs"

            result["message"] = (
                "Không có cặp thuốc thuộc hai đơn khác nhau "
                "để thực hiện kiểm tra."
            )

        return result

    # --------------------------------------------------
    # 9. Read interaction database
    # --------------------------------------------------

    try:

        if "drug_interactions" not in tables:
            raise ValueError(
                "Không tìm thấy bảng drug_interactions."
            )

        di_columns = {
            column["name"]
            for column in inspector.get_columns(
                "drug_interactions"
            )
        }

        required_di = {
            "ingredient_a",
            "ingredient_b",
            "severity",
            "description",
            "recommendation",
            "source",
        }

        if not required_di.issubset(di_columns):

            missing = required_di - di_columns

            raise ValueError(
                "Bảng drug_interactions thiếu cột: "
                + ", ".join(sorted(missing))
            )

        rows = db.execute(
            text("""
                SELECT
                    ingredient_a,
                    ingredient_b,
                    severity,
                    description,
                    recommendation,
                    source
                FROM drug_interactions
            """)
        ).mappings().all()

    except Exception as exc:

        result = _empty_result(
            f"Không đọc được dữ liệu tương tác: {exc}",
            response_medicines,
            skipped,
        )

        result.update({
            "medicine_count": len(response_medicines),
            "ingredient_count": len(ingredients),
            "ingredients": ingredients,
            "duplicate_ingredients": duplicate_ingredients,
            "expected_pairs": len(pairs),
            "checked_pairs": len(pairs),
            "unverified_pairs": [
                {
                    "ingredient_a": a,
                    "ingredient_b": b,
                    "status": "unverified",
                }
                for a, b in pairs
            ],
        })

        return result

    # --------------------------------------------------
    # 10. Create interaction lookup index
    # --------------------------------------------------

    interaction_index = {}

    for row in rows:

        left = normalize_ingredient(row["ingredient_a"])
        right = normalize_ingredient(row["ingredient_b"])

        if left and right and left != right:

            key = frozenset((left, right))

            interaction_index.setdefault(
                key,
                [],
            ).append(dict(row))

    # --------------------------------------------------
    # 11. Check all generated pairs
    # --------------------------------------------------

    interactions = []
    unverified = []

    for a, b in pairs:

        key = frozenset((
            normalize_ingredient(a),
            normalize_ingredient(b),
        ))

        found = interaction_index.get(key, [])

        if found:

            for row in found:

                interactions.append({
                    "ingredient_a": a,
                    "ingredient_b": b,
                    "severity": row["severity"],
                    "description": row["description"],
                    "recommendation": row["recommendation"],
                    "source": row["source"],
                    "status": "interaction_found",
                })

        else:

            unverified.append({
                "ingredient_a": a,
                "ingredient_b": b,
                "status": "unverified",
                "message": (
                    "Cặp này không có trong danh mục tương tác hiện có của hệ thống; "
                    "điều đó không đồng nghĩa với việc phối hợp an toàn."
                ),
            })

    # --------------------------------------------------
    # 12. Determine final status
    # --------------------------------------------------

    # Độ tin cậy của hoạt chất tham gia từng cặp: hoạt chất suy ra từ tên gần đúng hoặc từ liên kết
    # chưa duyệt không được trình bày như đã xác minh.
    _rank = {"verified": 0, "provisional": 1, "near": 2}
    confidence_by_key = {}

    for med in selected:
        meta = med.get("_meta") or {}

        for key in ingredient_by_medicine.get(med["id"], {}):
            level = meta.get(key, {}).get("confidence", "verified")
            best = confidence_by_key.get(key)

            if best is None or _rank.get(level, 2) < _rank.get(best, 2):
                confidence_by_key[key] = level

    for entry in interactions + unverified:
        level_a = confidence_by_key.get(normalize_ingredient(entry["ingredient_a"]), "verified")
        level_b = confidence_by_key.get(normalize_ingredient(entry["ingredient_b"]), "verified")
        entry["ingredient_confidence"] = {"ingredient_a": level_a, "ingredient_b": level_b}
        entry["needs_confirmation"] = "verified" != level_a or "verified" != level_b

    found_pair_count = len(pairs) - len(unverified)

    if not unverified:

        status = "completed"

        message = (
            "Tất cả cặp hoạt chất được kiểm tra đều có bản ghi trong "
            "danh mục tương tác hiện có."
        )

    elif found_pair_count:

        status = "partial"

        message = (
            "Một phần cặp hoạt chất có bản ghi tương tác; các cặp còn lại không có "
            "trong danh mục hiện có (không đồng nghĩa với an toàn)."
        )

    else:

        # Tách khỏi "unavailable" (lỗi dữ liệu/dịch vụ): ở đây việc kiểm tra đã chạy
        # bình thường nhưng danh mục hiện có không chứa cặp nào trong số này.
        status = "no_records_found"

        message = (
            "Các cặp này không có trong danh mục tương tác hiện có của hệ thống; "
            "không thể kết luận chúng an toàn."
        )

    return {
        "status": status,
        "medicine_count": len(response_medicines),
        "ingredient_count": len(ingredients),
        "checked_pairs": len(pairs),
        "pairs_with_interaction_records": found_pair_count,
        "expected_pairs": len(pairs),
        "medicines": response_medicines,
        "ingredients": ingredients,
        "interactions": interactions,
        "unverified_pairs": unverified,
        "duplicate_ingredients": duplicate_ingredients,
        "data_scope": {
            "interaction_records": len(rows),
            "sources": sorted({str(r["source"]) for r in rows if r["source"]}),
            "severities": sorted({str(r["severity"]) for r in rows if r["severity"]}),
        },
        "skipped_medicines": skipped,
        "not_analyzed_medicines": not_analyzed,
        "message": message + not_analyzed_note,
        "safety_note": (
            "Không tìm thấy bản ghi trong cơ sở dữ liệu "
            "không đồng nghĩa với việc phối hợp thuốc an toàn."
        ),
    }
