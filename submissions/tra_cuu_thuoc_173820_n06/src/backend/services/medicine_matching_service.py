
import re
import unicodedata

from sqlalchemy import text

try:
    from .medicine_postprocess import max_name_distance, ocr_distance
except ImportError:  # chạy trực tiếp ngoài package
    from medicine_postprocess import max_name_distance, ocr_distance


def normalize(value):
    if not value:
        return ""

    value = str(value).strip().lower()
    value = unicodedata.normalize("NFKD", value)
    value = "".join(
        char for char in value
        if not unicodedata.combining(char)
    )
    value = value.replace("đ", "d")
    value = re.sub(r"[^a-z0-9]+", " ", value)

    return re.sub(r"\s+", " ", value).strip()


def normalize_strength(value):
    """Chuẩn hóa khoảng trắng trong hàm lượng."""
    return re.sub(r"\s+", "", normalize(value))


def _contains_name(name, text_value):
    name = normalize(name)
    text_value = normalize(text_value)

    if not name or not text_value:
        return False

    return (
        name == text_value
        or f" {name} " in f" {text_value} "
    )


def _ingredient_list(value):
    """Chuyển hoạt chất đầu vào thành danh sách tên."""
    if not value:
        return []

    if isinstance(value, (list, tuple, set)):
        values = value
    else:
        values = [value]

    result = []
    seen = set()

    for item in values:
        if isinstance(item, dict):
            item = (
                item.get("name")
                or item.get("active_ingredient")
                or item.get("ingredient")
            )

        name = str(item or "").strip()
        normalized = normalize(name)

        if normalized and normalized not in seen:
            result.append(name)
            seen.add(normalized)

    return result


_UNIT_TOKENS = {"mg", "g", "mcg", "ml", "iu", "ui"}


def _name_base(value):
    """Phần tên thuốc trước hàm lượng: 'Mericine 500mg film' -> 'mericine'."""
    normalized = normalize(value)
    words = []

    for word in normalized.split():
        if any(char.isdigit() for char in word) or word in _UNIT_TOKENS:
            break
        words.append(word)

    return " ".join(words) or normalized


def _fuzzy_name_distance(query_base, db_base):
    """Khoảng cách chính tả (có tính nhầm lẫn OCR) hoặc None nếu không đủ gần."""
    if not query_base or not db_base:
        return None

    limit = max_name_distance(len(query_base))

    if limit <= 0:
        return None

    candidate = " ".join(db_base.split()[: len(query_base.split())])

    if abs(len(candidate) - len(query_base)) > limit:
        return None

    distance = ocr_distance(query_base, candidate, cap=limit)

    return distance if distance <= limit else None


def _resolve_ingredient(normalized_name, known_ingredients):
    """Đưa tên hoạt chất viết sai chính tả về tên có trong CSDL nếu có đúng MỘT ứng viên gần nhất."""
    if normalized_name in known_ingredients:
        return normalized_name, None

    limit = max_name_distance(len(normalized_name))

    if limit <= 0:
        return normalized_name, None

    scored = []

    for key in known_ingredients:
        if abs(len(key) - len(normalized_name)) > limit:
            continue

        distance = ocr_distance(normalized_name, key, cap=limit)

        if distance <= limit:
            scored.append((distance, key))

    scored.sort()

    if scored and (len(scored) == 1 or scored[1][0] > scored[0][0]):
        key = scored[0][1]
        return key, (
            f"Hoạt chất '{normalized_name}' trên đơn gần giống "
            f"'{known_ingredients[key]}' trong CSDL (sai khác chính tả); cần xác nhận."
        )

    return normalized_name, None


def load_catalog(db):
    """Đọc danh mục thuốc/hoạt chất MỘT lần để dùng cho cả đơn thuốc."""
    medicine_rows = db.execute(text("""
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
            ON a.id = m.active_ingredient_id
    """)).mappings().all()

    # Hoạt chất từ khóa ngoại cũ và liên kết mới đã xác minh.
    ingredient_rows = db.execute(text("""
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
    """)).mappings().all()

    ingredients_by_medicine = {}

    for row in ingredient_rows:
        ingredients_by_medicine.setdefault(
            row["medicine_id"], {}
        )[row["ingredient_id"]] = row["ingredient_name"]

    # Liên kết nhập từ dữ liệu crawl nhưng CHƯA duyệt: chỉ dùng để gợi ý hoạt chất ở mức
    # "provisional", không bao giờ dùng như đã xác minh.
    provisional_by_medicine = {}

    for row in db.execute(text("""
        SELECT mi.medicine_id AS medicine_id, a.id AS ingredient_id, a.name AS ingredient_name
        FROM medicine_ingredients AS mi
        JOIN active_ingredients AS a ON a.id = mi.active_ingredient_id
        WHERE mi.review_status = 'pending_review'
    """)).mappings().all():
        provisional_by_medicine.setdefault(
            row["medicine_id"], {}
        )[row["ingredient_id"]] = row["ingredient_name"]

    known_ingredients = {}

    for row in db.execute(
        text("SELECT name FROM active_ingredients")
    ).mappings().all():
        key = normalize(row["name"])

        if key:
            known_ingredients.setdefault(key, row["name"])

    entries = []

    for row in medicine_rows:
        medicine = dict(row)
        name = medicine.get("name") or ""
        entries.append({
            "medicine": medicine,
            "norm_name": normalize(name),
            "base": _name_base(name),
            "norm_strength": normalize_strength(
                medicine.get("strength") or ""
            ),
            "norm_form": normalize(medicine.get("dosage_form") or ""),
        })

    return {
        "entries": entries,
        "ingredients_by_medicine": ingredients_by_medicine,
        "provisional_by_medicine": provisional_by_medicine,
        "known_ingredients": known_ingredients,
    }


_SLIM_KEYS = (
    "id", "name", "sdk_code", "strength", "dosage_form", "manufacturer",
    "active_ingredient_id", "active_ingredient", "active_ingredients",
)


def _slim_medicine(medicine):
    """Chỉ giữ trường nhận diện; bỏ chỉ định/tác dụng phụ dài khỏi danh sách ứng viên."""
    return {key: medicine.get(key) for key in _SLIM_KEYS}


def _match_core(db, prescription_medicine, catalog=None):
    """
    Đối chiếu thuốc theo tên, hoạt chất, hàm lượng và dạng bào chế.

    Tên thuốc cho phép sai khác chính tả nhỏ (ví dụ OCR đọc "Mericin" thay vì "Mericine"):
    khớp gần đúng chỉ được tự xác nhận khi hoạt chất (đủ tập) VÀ hàm lượng cũng khớp
    và chỉ có một ứng viên tốt nhất; ngược lại trả needs_review kèm danh sách ứng viên.

    Các liên kết trong medicine_ingredients chỉ được sử dụng khi review_status = 'verified'.
    Không tự động xác nhận thuốc phối hợp nếu chưa khớp đủ các hoạt chất đơn thuốc nêu.
    """
    catalog = catalog or load_catalog(db)
    ingredients_by_medicine = catalog["ingredients_by_medicine"]
    known_ingredients = catalog["known_ingredients"]

    notes = []

    prescription_name = prescription_medicine.get("prescription_name")
    brand_name = prescription_medicine.get("brand_name")

    wanted_ingredient_set = set()

    for name in _ingredient_list(
        prescription_medicine.get("active_ingredient")
    ):
        resolved, note = _resolve_ingredient(
            normalize(name), known_ingredients
        )
        wanted_ingredient_set.add(resolved)

        if note:
            notes.append(note)

    strength = prescription_medicine.get("strength")
    dosage_form = prescription_medicine.get("dosage_form")

    name_to_match = brand_name or prescription_name

    # Mọi tên in trên đơn đều là bằng chứng: biệt dược, tên chính, tên khác trong ngoặc.
    names_to_match = []

    for candidate in (
        [brand_name, prescription_name]
        + list(prescription_medicine.get("name_alternatives") or [])
    ):
        if candidate and candidate not in names_to_match:
            names_to_match.append(candidate)

    query_base = _name_base(name_to_match)
    query_bases = [b for b in (_name_base(n) for n in names_to_match) if b]
    names_normalized = [normalize(n) for n in names_to_match]
    wanted_strength = normalize_strength(strength)
    wanted_form = normalize(dosage_form)

    candidates = []

    for entry in catalog["entries"]:
        medicine = dict(entry["medicine"])
        ingredient_map = ingredients_by_medicine.get(medicine["id"], {})
        ingredient_names = list(ingredient_map.values())
        db_ingredient_set = {normalize(name) for name in ingredient_names}

        # Giữ trường cũ để không làm hỏng frontend đang sử dụng.
        medicine["active_ingredients"] = ingredient_names

        db_name = medicine.get("name") or ""
        db_strength = medicine.get("strength") or ""

        name_exact = entry["norm_name"] in names_normalized
        name_contained = any(
            _contains_name(n, db_name) for n in names_to_match
        )

        name_distance = None

        if names_to_match and not (name_exact or name_contained):
            distances = [
                d for d in (
                    _fuzzy_name_distance(b, entry["base"]) for b in query_bases
                ) if d is not None
            ]
            name_distance = min(distances) if distances else None

        name_fuzzy = name_distance is not None

        # Khớp hoạt chất chỉ khi tất cả hoạt chất đầu vào đều có.
        ingredient_match = bool(
            wanted_ingredient_set
            and wanted_ingredient_set.issubset(db_ingredient_set)
        )

        # Với thuốc phối hợp, yêu cầu tập hoạt chất bằng nhau
        # để tránh kết luận khớp hoàn toàn khi thiếu/thừa hoạt chất.
        ingredient_set_exact = bool(
            wanted_ingredient_set
            and wanted_ingredient_set == db_ingredient_set
        )

        strength_match = bool(
            wanted_strength
            and wanted_strength == entry["norm_strength"]
        )
        form_match = bool(
            wanted_form
            and wanted_form == entry["norm_form"]
        )

        # Nếu dữ liệu hai bên có thông tin mâu thuẫn thì loại.
        if (
            wanted_ingredient_set
            and db_ingredient_set
            and not ingredient_match
        ):
            continue

        if (
            wanted_strength
            and db_strength
            and not strength_match
        ):
            continue

        score = 0
        reasons = []

        if name_exact:
            score += 60
            reasons.append("Khớp chính xác tên thuốc")
        elif name_contained:
            score += 40
            reasons.append("Khớp một phần tên thuốc")
        elif name_fuzzy:
            score += 30
            reasons.append(
                "Tên gần giống (sai khác chính tả/OCR): "
                f"'{name_to_match}' ~ '{db_name}'"
            )

        if ingredient_match:
            score += 25
            reasons.append("Khớp các hoạt chất được cung cấp")

        if strength_match:
            score += 25
            reasons.append("Khớp hàm lượng")

        if form_match:
            score += 10
            reasons.append("Khớp dạng bào chế")

        # Hàm lượng/dạng bào chế chỉ củng cố ứng viên, không tự tạo ứng viên
        # (tránh "Omez 20mg" trở thành ứng viên của "Gastroprazol 20mg" chỉ vì cùng 20mg).
        has_identity_evidence = (
            name_exact or name_contained or name_fuzzy or ingredient_match
        )

        if score and has_identity_evidence:
            candidates.append({
                "medicine": medicine,
                "score": score,
                "reasons": reasons,
                "name_exact": name_exact,
                "name_contained": name_contained,
                "name_fuzzy": name_fuzzy,
                "name_distance": name_distance,
                "ingredient_match": ingredient_match,
                "ingredient_set_exact": ingredient_set_exact,
                "strength_match": strength_match,
                "form_match": form_match,
            })

    candidates.sort(
        key=lambda item: (
            item["score"],
            item["name_exact"],
            item["ingredient_match"],
            item["strength_match"],
            item["form_match"],
            -(item["name_distance"] or 0),
        ),
        reverse=True,
    )

    if not candidates:
        return {
            "prescription_medicine": prescription_medicine,
            "match_status": "not_found",
            "matched_medicine": None,
            "match_reasons": [],
            "match_notes": notes,
            "candidates": [],
        }

    best = candidates[0]

    tied = [
        candidate for candidate in candidates
        if candidate["score"] == best["score"]
    ]

    # Chỉ tự xác nhận khi có tên (kể cả gần đúng), hàm lượng và hoạt chất phù hợp.
    # Với thuốc phối hợp, cần khớp chính xác toàn bộ tập hoạt chất.
    ingredient_confident = (
        best["ingredient_set_exact"]
        if wanted_ingredient_set
        else False
    )

    confident = (
        ingredient_confident
        and best["strength_match"]
        and (
            best["name_exact"]
            or best["name_contained"]
            or best["name_fuzzy"]
        )
    )

    if confident and len(tied) == 1:
        status = "matched"
    else:
        status = "needs_review"

    if best["name_fuzzy"]:
        notes.append(
            f"Tên thuốc trên đơn '{name_to_match}' gần giống "
            f"'{best['medicine'].get('name')}' trong CSDL (sai khác chính tả); "
            "cần xác nhận với ảnh gốc."
        )

    return {
        "prescription_medicine": prescription_medicine,
        "match_status": status,
        "matched_medicine": (
            best["medicine"] if status == "matched" else None
        ),
        "match_reasons": best["reasons"],
        "match_notes": notes,
        "product_choice_required": (
            status != "matched"
            and len({c["medicine"]["id"] for c in tied}) > 1
        ),
        "candidates": [
            {
                "medicine": _slim_medicine(candidate["medicine"]),
                "score": candidate["score"],
                "reasons": candidate["reasons"],
                "name_fuzzy": candidate["name_fuzzy"],
            }
            for candidate in candidates[:5]
        ],
    }


def _group_ingredients(entries, wanted_strength, ingredients_by, provisional_by):
    """Hoạt chất chung của một nhóm sản phẩm cùng tên: (tập tên đã chuẩn hóa, độ tin cậy, số sản phẩm).

    Không lọc theo hàm lượng: các sản phẩm cùng tên phải có cùng hoạt chất, nên nếu chúng khác nhau
    (ví dụ dữ liệu crawl ghi nhầm "Viartril-S 1500mg" là Lidocaine) thì coi là xung đột và KHÔNG dùng.
    """
    verified, provisional = set(), set()

    for entry in entries:
        medicine_id = entry["medicine"]["id"]
        linked = frozenset(
            normalize(n) for n in ingredients_by.get(medicine_id, {}).values()
        )

        if linked:
            verified.add(linked)

        pending = frozenset(
            normalize(n) for n in provisional_by.get(medicine_id, {}).values()
        )

        if pending:
            provisional.add(pending)

    if len(verified) == 1 and not (provisional - verified):
        return next(iter(verified)), "verified", len(entries)
    if len(verified) + len(provisional - verified) > 1:
        return None, "conflict", len(entries)
    if len(verified) == 1:
        return next(iter(verified)), "verified", len(entries)
    if len(provisional) == 1:
        return next(iter(provisional)), "provisional", len(entries)

    return None, "none", len(entries)


def _candidate_names(prescription_medicine):
    """Các tên có thể là hoạt chất (tên chính + tên khác trong ngoặc) và tên biệt dược."""
    generic = [prescription_medicine.get("prescription_name")]
    generic += list(prescription_medicine.get("name_alternatives") or [])
    generic = [n for n in generic if n]
    brand = prescription_medicine.get("brand_name")
    return generic, brand


def resolve_ingredients(prescription_medicine, match_result, catalog):
    """Xác định HOẠT CHẤT của thuốc trên đơn, độc lập với việc chọn đúng sản phẩm/hãng.

    Kiểm tra tương tác chỉ cần hoạt chất; đơn thường chỉ ghi tên chung hoặc biệt dược, không ghi
    hãng, nên không thể (và không cần) chọn một sản phẩm duy nhất. Thứ tự tin cậy:
      1. đã ghép được sản phẩm                                   -> verified
      2. một tên trên đơn chính là một hoạt chất                 -> verified
      3. mọi sản phẩm cùng tên có chung hoạt chất                -> verified (liên kết đã duyệt) / provisional
      4. tên gần giống một hoạt chất                             -> near; nâng lên verified nếu chính đơn
         có ghi đúng tên hoạt chất đó ở chỗ khác (ví dụ "dưới dạng ... Glucosamine sulfate")
      5. tên gần giống một sản phẩm                              -> near (cần người dùng xác nhận)
    Nguồn xung đột hoặc không có dữ liệu thì trả unresolved/conflict, không đoán.
    """
    known = catalog["known_ingredients"]
    ingredients_by = catalog["ingredients_by_medicine"]
    provisional_by = catalog["provisional_by_medicine"]
    notes = []

    def done(items, status="resolved"):
        return {"status": status, "ingredients": items, "notes": notes}

    def named(keys, source, confidence):
        return [
            {"name": known.get(key, key), "source": source, "confidence": confidence}
            for key in sorted(keys)
        ]

    matched = match_result.get("matched_medicine")

    if matched and matched.get("active_ingredients"):
        return done([
            {"name": n, "source": "matched_product", "confidence": "verified"}
            for n in matched["active_ingredients"]
        ])

    generic_names, brand = _candidate_names(prescription_medicine)
    generic_bases = [b for b in (_name_base(n) for n in generic_names) if b]
    brand_base = _name_base(brand) if brand else ""

    if not generic_bases and not brand_base:
        return done([], "unresolved")

    wanted_strength = normalize_strength(prescription_medicine.get("strength"))
    entries = catalog["entries"]
    name_text = normalize(prescription_medicine.get("name_text") or "")

    # 2. tên trên đơn chính là hoạt chất
    for base in generic_bases:
        if base in known:
            return done(named({base}, "name_is_ingredient", "verified"))

    # Khi đơn ghi rõ hoạt chất (kiểu "Hoạt chất (Biệt dược ...)" hoặc có tên khác trong ngoặc),
    # tên in trên đơn đáng tin hơn liên kết sản phẩm trong CSDL (có thể sai/chưa duyệt).
    explicit_generic = bool(
        prescription_medicine.get("active_ingredient")
        or prescription_medicine.get("name_alternatives")
    )

    def try_near_ingredient():
        for base in generic_bases:
            near_key, near_note = _resolve_ingredient(base, known)

            if near_key in known and near_key != base:
                corroborated = bool(
                    name_text
                    and re.search(rf"(?<!\w){re.escape(near_key)}(?!\w)", name_text)
                )

                if corroborated:
                    notes.append(
                        f"Tên '{base}' gần giống hoạt chất '{known[near_key]}', và đơn cũng ghi "
                        f"đúng tên này trong cùng dòng thuốc."
                    )
                    return done(named({near_key}, "name_in_text", "verified"))

                notes.append(near_note)
                return done(named({near_key}, "name_near_ingredient", "near"))

        return None

    def try_products():
        conflict = False

        for base in ([brand_base] if brand_base else []) + generic_bases:
            group = [
                e for e in entries
                if e["base"] and (e["base"] == base or e["base"].startswith(base + " "))
            ]

            if not group:
                continue

            keys, confidence, _count = _group_ingredients(
                group, wanted_strength, ingredients_by, provisional_by
            )

            if keys:
                if confidence == "provisional":
                    notes.append(
                        "Hoạt chất lấy từ liên kết thuốc - hoạt chất nhập từ dữ liệu crawl "
                        "và chưa được duyệt."
                    )
                return done(named(keys, "product_consensus", confidence))

            conflict = conflict or confidence == "conflict"

        if conflict:
            notes.append(
                "Các sản phẩm cùng tên có hoạt chất khác nhau trong CSDL (dữ liệu có thể sai); "
                "không dùng để xác định hoạt chất."
            )

        return None

    steps = (
        (try_near_ingredient, try_products)
        if explicit_generic
        else (try_products, try_near_ingredient)
    )

    for step in steps:
        result = step()

        if result is not None:
            return result

    # 5. tên gần giống sản phẩm
    for base in ([brand_base] if brand_base else []) + generic_bases:
        fuzzy_group = [
            e for e in entries
            if e["base"] and _fuzzy_name_distance(base, e["base"]) is not None
        ]

        if not fuzzy_group:
            continue

        keys, confidence, _count = _group_ingredients(
            fuzzy_group, wanted_strength, ingredients_by, provisional_by
        )

        if keys:
            notes.append(
                f"Tên '{base}' gần giống tên sản phẩm trong CSDL (sai khác chính tả); "
                "hoạt chất lấy theo sản phẩm đó, cần xác nhận."
            )
            if confidence == "provisional":
                notes.append("Liên kết hoạt chất này chưa được duyệt.")
            return done(named(keys, "product_near_name", "near"))

    return done([], "unresolved")


def _confirmed_result(prescription_medicine, catalog):
    """Người dùng đã chọn đúng sản phẩm (confirmed_medicine_id): ghi nhận, không đoán lại."""
    wanted = prescription_medicine.get("confirmed_medicine_id")

    for entry in catalog["entries"]:
        if entry["medicine"]["id"] == wanted:
            medicine = dict(entry["medicine"])
            medicine["active_ingredients"] = list(
                catalog["ingredients_by_medicine"].get(wanted, {}).values()
            )
            return {
                "prescription_medicine": prescription_medicine,
                "match_status": "matched",
                "matched_medicine": medicine,
                "match_reasons": ["Người dùng xác nhận sản phẩm"],
                "match_notes": [],
                "product_choice_required": False,
                "user_confirmed": True,
                "candidates": [],
            }

    return None


def match_medicine(db, prescription_medicine, catalog=None):
    catalog = catalog or load_catalog(db)

    if prescription_medicine.get("confirmed_medicine_id"):
        confirmed = _confirmed_result(prescription_medicine, catalog)

        if confirmed is not None:
            confirmed["ingredient_resolution"] = resolve_ingredients(
                prescription_medicine, confirmed, catalog
            )
            return confirmed

    result = _match_core(db, prescription_medicine, catalog)
    result["ingredient_resolution"] = resolve_ingredients(
        prescription_medicine, result, catalog
    )
    return result


def match_prescription_medicines(db, medicines, catalog=None):
    # Đọc danh mục một lần cho cả đơn thuốc (hoặc dùng lại catalog do người gọi truyền vào).
    catalog = catalog or load_catalog(db)

    return [
        match_medicine(db, medicine, catalog)
        for medicine in medicines
    ]
