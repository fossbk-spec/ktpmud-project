"""Đọc đơn thuốc dạng bảng bằng luật xác định (không dùng Qwen).

Nhận diện các bố cục phổ biến ở bệnh viện (văn bản OCR đã gom hàng, ô cách nhau bằng tab):

    1 . Colchicin 1mg                      30 viên          (bảng Sáng/Chiều/Tối)
        Sáng: 1     Chiều: 1     Tối: 0
    2 . Etoricoxib(Roticox 90mg film-coated tablets)   30   Viên     (kiểu Bạch Mai)
        Ngày uống 1 viên buổi sáng, sau ăn

Chịu được: tên thuốc xuống dòng, số thứ tự bị OCR làm mất, số lượng bị lệch sang dòng cách dùng,
chữ cuối đơn (lời dặn, chữ ký, ghi chú) và từ khóa mất dấu. Mọi giá trị lấy nguyên văn từ chữ trên đơn:
không thêm đơn vị, không suy ra dạng bào chế. Không nhận ra bố cục thì trả confident=False
để luồng cũ (Qwen) xử lý.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

try:
    from .medicine_postprocess import canonicalize_usage_text, fold, format_schedule, parse_schedule
except ImportError:  # chạy trực tiếp ngoài package
    from medicine_postprocess import canonicalize_usage_text, fold, format_schedule, parse_schedule

_ANCHOR = re.compile(r"^\s*(\d{1,2})\s*[.)]\s*(.*?)\s*$")

_UNIT = r"(?:mg|mcg|µg|ug|g|ml|iu|ui|%)"
_NUM = r"\d+(?:[.,]\d+)?"
_STRENGTH = re.compile(
    rf"(?<![\w.,])({_NUM})(?:\s*{_UNIT}(?![^\W\d_]))?"
    rf"(?:\s*[+/]\s*{_NUM}(?:\s*{_UNIT}(?![^\W\d_]))?)*",
    re.I,
)
_HAS_UNIT = re.compile(rf"\d\s*{_UNIT}(?![^\W\d_])", re.I)

_COUNT_UNITS = {"vien": "viên", "goi": "gói", "ong": "ống", "chai": "chai", "lo": "lọ",
                "tuyp": "tuýp", "hop": "hộp", "vi": "vỉ"}
_INT_CELL = re.compile(r"^\d{1,4}$")
_QTY_CELL = re.compile(r"^(\d{1,4})\s*([^\W\d_]{1,5})?\s*$")
_QTY_TAIL = re.compile(r"(\d{1,4})\s*(viên|vien|gói|goi|ống|ong|chai|lọ|lo|tuýp|tuyp|hộp|hop|vỉ|vi)\s*$", re.I)

_FORM_WORDS = {"film", "coated", "film-coated", "tablet", "tablets", "capsule", "capsules", "caps",
               "sachet", "powder", "viên", "vien", "nén", "nen", "bao", "phim", "nang", "gói", "goi"}

_FOOTER_PREFIXES = ("loi dan", "toa cap", "cong khoan", "ky ten", "tai kham", "ngay tai kham", "bac si")


@dataclass
class TableResult:
    medicines: list[dict[str, Any]] = field(default_factory=list)
    header_count: int = 0
    confident: bool = False


# ---------------------------------------------------------------- hàm lượng, tên
def find_strength(text: str) -> tuple[str | None, str | None, int | None]:
    """(strength chuẩn hóa hoặc None, nguyên văn, vị trí bắt đầu).

    Số thuần không đơn vị chỉ được coi là hàm lượng khi có dấu '+' hoặc '/' ("325 +37.5"); khi đó
    strength = None (không bịa đơn vị) còn nguyên văn vẫn được giữ để người dùng kiểm tra.
    """
    for match in _STRENGTH.finditer(text or ""):
        raw = match.group(0).strip()
        has_unit = bool(_HAS_UNIT.search(raw))
        has_connector = bool(re.search(r"[+/]", raw))
        if not (has_unit or has_connector):
            continue
        all_have_units = has_unit and all(
            _HAS_UNIT.search(part) for part in re.split(r"[+/]", raw)
        )
        normalized = re.sub(r"\s+", "", raw).replace(",", ".") if all_have_units else None
        return normalized, re.sub(r"\s+", " ", raw), match.start()
    return None, None, None


def _balance_parentheses(text: str) -> str:
    depth, out = 0, []
    for ch in text:
        if ch == "(":
            depth += 1
        elif ch == ")":
            if depth == 0:
                continue  # ")" lẻ do tên bị xuống dòng/OCR
            depth -= 1
        out.append(ch)
    return "".join(out) + ")" * depth


def _strip_form_words(text: str) -> str:
    words = [w for w in text.split() if fold(w) not in {fold(f) for f in _FORM_WORDS}]
    return " ".join(words)


def _clean_name(text: str) -> str:
    text = re.sub(r"\s*-\s*", "-", text)  # "Viartril- S" -> "Viartril-S"
    return re.sub(r"[\s\-–:,.;]+$", "", re.sub(r"\s+", " ", text)).strip()


def parse_name_text(name_text: str) -> dict[str, Any]:
    """Tách tên thuốc theo quy ước "Hoạt chất (Biệt dược hàm lượng)".

    Ví dụ:
      Etoricoxib(Roticox 90mg film-coated tablets)  -> tên Etoricoxib, biệt dược Roticox, 90mg
      Glucosamin (dưới dạng ... 1884 mg)(Viartril- S 1500mg) -> Glucosamin, biệt dược Viartril-S, 1500mg
      Mecobalamin (methylcobalamin)(Methylcobalamin Capsules 1500mcg) -> Mecobalamin, tên khác methylcobalamin, 1500mcg
    """
    text = _balance_parentheses(re.sub(r"\s+", " ", name_text or "").strip())
    groups = re.findall(r"\(([^()]*)\)", text)
    outer = re.sub(r"\([^()]*\)", " ", text)
    outer = re.sub(r"\s+", " ", outer).strip()

    strength, strength_raw, pos = find_strength(outer)
    outer_name = _clean_name(outer[:pos] if pos is not None else outer)

    brand: str | None = None
    alternatives: list[str] = []
    salt_note: str | None = None
    known = {fold(outer_name)}

    for group in groups:
        group = group.strip()
        if not group:
            continue
        if fold(group).startswith(("duoi dang", "dang ", "as ")):
            salt_note = group  # dạng muối/dẫn chất: hàm lượng ở đây KHÔNG phải hàm lượng sản phẩm
            continue

        g_strength, g_raw, g_pos = find_strength(group)
        base = _clean_name(_strip_form_words(group[:g_pos] if g_pos is not None else group))

        if strength is None and g_raw:
            strength, strength_raw = g_strength, g_raw
        if not base or fold(base) in known:
            continue

        if g_raw is None and base == _clean_name(group):
            # "(methylcobalamin)": thêm một tên khác; để bước đối chiếu quyết định là hoạt chất hay biệt dược.
            alternatives.append(base)
        elif brand is None:
            brand = base
        known.add(fold(base))

    return {
        "prescription_name": outer_name,
        "brand_name": brand,
        # Quy ước "Hoạt chất (Biệt dược ...)": tên ngoài là hoạt chất khi có nhóm biệt dược trong ngoặc.
        "active_ingredient": outer_name if brand else None,
        "name_alternatives": alternatives,
        "strength": strength,
        "strength_raw": strength_raw,
        "salt_note": salt_note,
        "name_text": text,
    }


# ---------------------------------------------------------------- số lượng
def _parse_quantity(cells: list[str]) -> tuple[str | None, str | None]:
    quantity, unit = None, None
    for cell in cells:
        if fold(cell.strip()) in _COUNT_UNITS:  # ô chỉ có đơn vị: "Viên"
            unit = unit or _COUNT_UNITS[fold(cell.strip())]
            continue
        match = _QTY_CELL.match(cell.strip())
        if not match:
            continue
        word = fold(match.group(2) or "")
        if word and word not in _COUNT_UNITS:
            continue
        if quantity is None and match.group(1):
            quantity = match.group(1)
        if word and unit is None:
            unit = _COUNT_UNITS[word]
    return quantity, unit


def _is_qty_cell(cell: str) -> bool:
    if fold(cell.strip()) in _COUNT_UNITS:
        return True
    match = _QTY_CELL.match(cell.strip())
    return bool(match) and (not match.group(2) or fold(match.group(2)) in _COUNT_UNITS)


def _split_quantity_cells(cells: list[str]) -> tuple[list[str], list[str]]:
    """(các ô nội dung, các ô số lượng/đơn vị ở cuối hàng)."""
    content = list(cells)
    qty: list[str] = []
    while len(content) > 1 and _is_qty_cell(content[-1]):
        qty.insert(0, content.pop())
    return content, qty


# ---------------------------------------------------------------- ngày kê đơn
_DATE_VN = re.compile(r"ngay\s+(\d{1,2})\s+thang\s+(\d{1,2})\s+nam\s+(\d{4})")
_DATE_SLASH = re.compile(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b")


def extract_prescription_date(text: str) -> str | None:
    """Ngày kê đơn (ISO yyyy-mm-dd) nếu đọc được đủ ngày/tháng/năm; lấy ngày cuối cùng trong đơn."""
    key = fold(text or "")
    found = _DATE_VN.findall(key) or _DATE_SLASH.findall(key)
    for day, month, year in reversed(found):
        try:
            import datetime

            return datetime.date(int(year), int(month), int(day)).isoformat()
        except ValueError:
            continue
    return None


# ---------------------------------------------------------------- bộ phân tích chính
def _is_footer(key: str) -> bool:
    return (
        key.startswith(_FOOTER_PREFIXES)
        or bool(re.match(r"ngay\s+\d{1,2}\s+thang\s+\d{1,2}", key))
        or ("benh nhan" in key and "nguoi giao" in key)
    )


def _usage_kind(cells: list[str]) -> str | None:
    first = cells[0] if cells else ""
    key = fold(canonicalize_usage_text(first))
    if key.startswith("ghi chu"):
        return "note"
    if key.startswith(("ngay uong", "uong", "cach dung", "dung ")):
        return "sentence"
    joined = " ".join(cells)
    if parse_schedule(joined) and len(re.findall(r"[^\W\d_]{4,}", joined)) <= 6:
        return "schedule"
    return None


def parse_table_prescription(text: str) -> TableResult:
    lines = (text or "").splitlines()
    meds: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    pending_qty: tuple[str | None, str | None] | None = None
    header_count = 0
    i = 0

    def new_med(name_text: str, qty_cells: list[str]) -> dict[str, Any]:
        nonlocal pending_qty
        quantity, unit = _parse_quantity(qty_cells)
        carried = False
        if quantity is None:
            tail = _QTY_TAIL.search(name_text)
            if tail:
                quantity, unit = tail.group(1), _COUNT_UNITS.get(fold(tail.group(2)))
                name_text = name_text[: tail.start()].rstrip()
        if quantity is None and pending_qty is not None:
            quantity, unit = pending_qty
            carried = True
        pending_qty = None
        med = {
            "_name_text": name_text,
            "quantity": quantity,
            "quantity_unit": unit,
            "_carried_qty": carried,
            "_sentences": [],
            "_schedule": {},
            "note": None,
            "_name_open": True,
        }
        meds.append(med)
        return med

    while i < len(lines):
        line = lines[i].strip()
        i += 1
        if not line:
            continue
        cells = [c.strip() for c in line.split("\t") if c.strip()]
        key = fold(line)

        if meds and _is_footer(key):
            break  # hết danh sách thuốc: lời dặn, ngày kê đơn, chữ ký, ghi chú chung

        # --- dòng bắt đầu một thuốc mới
        anchor = _ANCHOR.match(cells[0]) if cells else None
        started = False
        if anchor:
            number = int(anchor.group(1))
            rest = anchor.group(2)
            qty_cells = cells[1:]
            if not rest and qty_cells:
                rest, qty_cells = qty_cells[0], qty_cells[1:]
            if not rest and i < len(lines):  # OCR tách số thứ tự thành dòng riêng
                nxt = [c.strip() for c in lines[i].split("\t") if c.strip()]
                if nxt:
                    rest, qty_cells = nxt[0], nxt[1:]
                    i += 1
            has_letters = len(re.findall(r"[^\W\d_]", rest)) >= 3
            _content, trailing = _split_quantity_cells(qty_cells)
            sequential = number == len(meds) + 1
            complete_prev = current is not None and (current["_sentences"] or current["_schedule"])
            if has_letters and (sequential or (complete_prev and trailing)):
                header_count += 1
                current = new_med(rest, qty_cells)
                started = True
        elif (
            current is not None
            and (current["_sentences"] or current["_schedule"])
            and _usage_kind(cells) is None
            and len(cells) >= 2
            and len(re.findall(r"[^\W\d_]", cells[0])) >= 3
            and _split_quantity_cells(cells)[1]
        ):
            # Thuốc bị mất số thứ tự ("2." không đọc được): hàng có chữ + số lượng ngay sau cách dùng.
            header_count += 1
            current = new_med(cells[0], cells[1:])
            started = True
        if started:
            continue

        if current is None:
            continue

        kind = _usage_kind(cells)
        content, qty_cells = _split_quantity_cells(cells)

        # Ô số lượng bị lệch sang dòng khác: gán cho thuốc hiện tại nếu còn thiếu, không thì mang sang thuốc kế.
        if qty_cells:
            quantity, unit = _parse_quantity(qty_cells)
            if quantity is not None:
                if current["quantity"] is None:
                    current["quantity"], current["quantity_unit"] = quantity, unit
                    current["_carried_qty"] = True
                else:
                    pending_qty = (quantity, unit)

        if kind == "note":
            note = re.sub(r"^[^:：]*[:：]?", "", content[0], count=1).strip()
            if note:
                current["note"] = note
            continue

        if kind == "sentence":
            current["_name_open"] = False
            current["_sentences"].append(" ".join(content))
            continue

        if kind == "schedule":
            current["_name_open"] = False
            for label, dose in parse_schedule(" ".join(content)).items():
                current["_schedule"].setdefault(label, dose)
            continue

        # Dòng chữ khác: phần nối tiếp của tên thuốc (tên dài xuống dòng) nếu chưa có cách dùng.
        if current["_name_open"] and len(re.findall(r"[^\W\d_]", content[0])) >= 2:
            current["_name_text"] += " " + content[0]

    medicines: list[dict[str, Any]] = []
    for med in meds:
        parsed = parse_name_text(med["_name_text"])
        sentence = " ".join(med["_sentences"]).strip() or None
        usage = format_schedule(med["_schedule"]) or sentence
        quantity_unit = med["quantity_unit"]
        section_lines = [f"{parsed['name_text']}\t{med['quantity'] or ''} {quantity_unit or ''}".rstrip()]
        section_lines += med["_sentences"]
        if med["_schedule"]:
            section_lines.append("   ".join(f"{k}: {v}" for k, v in med["_schedule"].items()))
        medicines.append({
            **parsed,
            "dosage_form": "Viên" if quantity_unit == "viên" else None,
            "quantity": med["quantity"],
            "quantity_unit": quantity_unit,
            "quantity_inferred": med["_carried_qty"],
            "usage": usage,
            "note": med["note"],
            "extraction_method": "layout",
            "_section": "\n".join(section_lines),
        })

    # Chỉ tin luật khi MỌI thuốc đều có tên, số lượng và cách dùng; còn lại để luồng Qwen xử lý.
    confident = bool(medicines) and all(
        len(m["prescription_name"]) >= 3 and m["quantity"] and m["usage"] for m in medicines
    )
    return TableResult(medicines=medicines, header_count=header_count, confident=confident)
