"""
Hậu xử lý thuốc cho ứng dụng y tế (an toàn trước, tiện lợi sau).

1. DrugIndex: đối chiếu tên thuốc / biệt dược / hoạt chất / hàm lượng với CSDL
   thuốc (20.000+ bản ghi, CSV / JSON / JSONL).
   - Khớp chính xác sau khi bỏ dấu/hoa-thường/dấu câu  -> lấy cách viết chuẩn của CSDL.
   - Chỉ khớp gần đúng (lỗi OCR)                       -> CHỈ GỢI Ý, không tự thay tên
     thuốc (nhiều thuốc thật chỉ khác nhau 1-2 ký tự: hydroxyzine/hydralazine).
2. parse_usage: chuyển cách dùng thành dữ liệu có cấu trúc rồi dựng lại câu bằng
   mẫu cố định => chính tả đúng tuyệt đối, và kiểm tra tổng liều = tổng các buổi.
   Câu nào không hiểu hết thì KHÔNG đoán: giữ nguyên + đánh dấu cần kiểm tra.
3. finalize_medicine: gom các bước trên, gắn needs_review / review_reasons.

Biến môi trường:
    DRUG_DB_PATH          đường dẫn CSDL thuốc (.csv/.json/.jsonl)
    DRUG_DB_COLUMNS       (tuỳ chọn) JSON ánh xạ cột, ví dụ
                          {"brand":"TenThuoc","active":"HoatChat","strength":"HamLuong"}
    DRUG_AUTO_CORRECT     "1" để tự sửa tên khi khớp gần đúng RẤT chắc (mặc định "0")
"""
from __future__ import annotations

import csv
import difflib
import json
import os
import re
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

try:  # nhanh hơn nhiều nếu có: pip install rapidfuzz
    from rapidfuzz import fuzz as _rf_fuzz
except Exception:  # pragma: no cover
    _rf_fuzz = None


# =========================================================
# 1. TIỆN ÍCH CHUẨN HÓA CHỮ
# =========================================================

def fold(text: Any) -> str:
    """Bỏ dấu, hạ chữ thường, thay mọi ký tự không phải chữ/số bằng khoảng trắng."""
    text = str(text or "")
    text = text.replace("đ", "d").replace("Đ", "D")
    text = unicodedata.normalize("NFD", text.casefold())
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = re.sub(r"[^0-9a-z]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _similarity(a: str, b: str) -> float:
    if _rf_fuzz is not None:
        return _rf_fuzz.ratio(a, b) / 100.0
    return difflib.SequenceMatcher(None, a, b, autojunk=False).ratio()


def _edit_distance(a: str, b: str, cap: int = 3) -> int:
    """Khoảng cách Levenshtein (dừng sớm khi vượt cap)."""
    if abs(len(a) - len(b)) > cap:
        return cap + 1
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


# Các cặp ký tự OCR hay đọc nhầm: thay thế giữa chúng chỉ tính nửa điểm.
_OCR_CONFUSABLE = {
    frozenset(pair)
    for pair in (
        ("c", "e"), ("o", "0"), ("l", "1"), ("i", "1"), ("l", "i"),
        ("s", "5"), ("b", "6"), ("g", "9"), ("u", "v"), ("n", "h"), ("a", "o"),
    )
}


def ocr_distance(a: str, b: str, cap: float = 2.0) -> float:
    """Levenshtein có trọng số: nhầm ký tự kiểu OCR (c/e, l/1, o/0...) = 0,5; còn lại = 1."""
    if abs(len(a) - len(b)) > cap:
        return cap + 1
    prev = [float(j) for j in range(len(b) + 1)]
    for i, ca in enumerate(a, 1):
        cur = [float(i)]
        for j, cb in enumerate(b, 1):
            if ca == cb:
                sub = 0.0
            elif frozenset((ca, cb)) in _OCR_CONFUSABLE:
                sub = 0.5
            else:
                sub = 1.0
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + sub))
        prev = cur
    return prev[-1]


def max_name_distance(length: int) -> float:
    """Ngưỡng sai khác cho phép theo độ dài tên (tên ngắn: không khớp mờ để tránh nhầm thuốc)."""
    if length < 5:
        return 0.0
    if length < 9:
        return 1.0
    return 2.0


def _pretty(name: str) -> str:
    """CSDL hay viết HOA toàn bộ: đổi thành dạng Title, giữ nguyên nếu đã có chữ thường."""
    name = re.sub(r"\s+", " ", name).strip()
    return name.title() if name.isupper() else name


_STRENGTH_RE = re.compile(
    r"(?<![\w.])(\d+(?:[.,]\d+)?)\s*(mcg|μg|µg|ug|mg|g|ml|iu|ui|%)(?![^\W\d_])",
    re.IGNORECASE,
)


def norm_strength(value: str) -> str | None:
    m = _STRENGTH_RE.search(str(value or ""))
    if not m:
        return None
    num = m.group(1).replace(",", ".")
    if "." in num:
        num = num.rstrip("0").rstrip(".")
    unit = m.group(2).lower().replace("μg", "mcg").replace("µg", "mcg")
    unit = {"ug": "mcg", "ui": "iu"}.get(unit, unit)
    return f"{num}{unit}"


def extract_strengths(text: str) -> set[str]:
    out = set()
    for m in _STRENGTH_RE.finditer(str(text or "")):
        s = norm_strength(m.group(0))
        if s:
            out.add(s)
    return out


# =========================================================
# 2. CSDL THUỐC
# =========================================================

COLUMN_ALIASES: dict[str, list[str]] = {
    "brand": ["ten thuoc", "tenthuoc", "ten biet duoc", "biet duoc", "brand",
              "brand name", "ten thuong mai", "medicine name", "drug name", "name"],
    "active": ["hoat chat", "hoatchat", "ten hoat chat", "hoat chat chinh",
               "active ingredient", "active", "ingredient", "thanh phan", "generic"],
    "strength": ["ham luong", "hamluong", "nong do ham luong", "nong do", "strength"],
    "form": ["dang bao che", "dangbaoche", "dosage form", "form"],
    "reg_id": ["so dang ky", "sodangky", "sdk", "registration", "ma thuoc", "id"],
}

# Một ít cặp tên đồng nghĩa phổ biến để nhận ra "biệt dược" thật ra là hoạt chất.
BUILTIN_GENERICS = {
    "mecobalamin", "methylcobalamin", "mecobalamine", "cobalamin", "cyanocobalamin",
    "paracetamol", "acetaminophen", "etoricoxib", "glucosamin", "glucosamine",
    "glucosamin sulfat", "glucosamine sulfate",
}

_VOCAB_STOP = {
    "tablets", "capsules", "sustained", "release", "extended", "coated", "daily",
    "before", "after", "meal", "food", "water", "mixture", "solution", "injection",
    "oral", "powder", "cream", "syrup", "plus", "forte", "extra", "premium",
}

_FORM_WORDS = {"capsules", "capsule", "tablets", "tablet", "film", "coated", "vien",
               "nen", "bao", "phim", "nang", "goi", "sachet", "powder", "bot"}


@dataclass
class DrugRecord:
    rid: int
    brand: str
    actives: list[str]
    strengths: set[str]
    form: str | None = None
    reg_id: str | None = None


def _split_actives(text: str) -> list[str]:
    text = _STRENGTH_RE.sub(" ", text or "")
    parts = re.split(r"[;,+]|\s/\s|\svà\s|\sand\s", text)
    out = []
    for p in parts:
        p = re.sub(r"\s+", " ", p).strip(" ()-")
        if len(fold(p)) >= 3:
            out.append(p)
    return out


def _resolve_columns(header: list[str], override: dict[str, str] | None) -> dict[str, str]:
    folded = {fold(h): h for h in header}
    mapping: dict[str, str] = {}
    for key, aliases in COLUMN_ALIASES.items():
        if override and key in override and override[key] in header:
            mapping[key] = override[key]
            continue
        for alias in aliases:
            if alias in folded:
                mapping[key] = folded[alias]
                break
    if "brand" not in mapping and "active" not in mapping:
        raise ValueError(
            "Không nhận ra cột tên thuốc trong CSDL. Cột hiện có: "
            f"{header}. Đặt DRUG_DB_COLUMNS để ánh xạ cột."
        )
    return mapping


def _read_rows(path: Path) -> list[dict[str, Any]]:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        with open(path, encoding="utf-8-sig", newline="") as f:
            return list(csv.DictReader(f))
    if suffix == ".jsonl":
        with open(path, encoding="utf-8") as f:
            return [json.loads(line) for line in f if line.strip()]
    if suffix == ".json":
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else data.get("data", [])
    raise ValueError(f"Định dạng CSDL không hỗ trợ: {suffix} (dùng csv/json/jsonl)")


def _trigrams(s: str) -> set[str]:
    s = f"  {s} "
    return {s[i:i + 3] for i in range(len(s) - 2)}


@dataclass
class Lookup:
    exact_key: str | None = None
    suggestions: list[tuple[str, float]] = field(default_factory=list)  # (khóa đã fold, điểm)


class DrugIndex:
    def __init__(self, records: list[DrugRecord]):
        self.records = records
        self.brand_exact: dict[str, list[int]] = defaultdict(list)
        self.active_exact: dict[str, list[int]] = defaultdict(list)
        self.display: dict[str, str] = {}
        for r in records:
            if r.brand:
                k = fold(r.brand)
                if k:
                    self.brand_exact[k].append(r.rid)
                    self.display.setdefault(k, _pretty(r.brand))
                # Tên trong CSDL hay kèm hãng/dạng ("Colchicin 1mg Pharbaco",
                # "Bostacet dạng viên nén bao phim"): đăng ký thêm từ đầu như khóa tên.
                words = r.brand.split()
                if len(words) > 1:
                    first = fold(words[0])
                    if len(first) >= 4 and first.isalpha() and first != k:
                        if r.rid not in self.brand_exact[first]:
                            self.brand_exact[first].append(r.rid)
                        self.display.setdefault(first, _pretty(words[0]))
            for a in r.actives:
                k = fold(a)
                if k:
                    self.active_exact[k].append(r.rid)
                    self.display.setdefault(k, _pretty(a))

        self.names: list[str] = sorted(set(self.brand_exact) | set(self.active_exact))
        self._tri: dict[str, list[int]] = defaultdict(list)
        for i, n in enumerate(self.names):
            for g in _trigrams(n):
                self._tri[g].append(i)
        self.generics: set[str] = set(self.active_exact) | {fold(g) for g in BUILTIN_GENERICS}

    # ---------- nạp ----------
    @classmethod
    def load(cls, path: str | Path, column_map: dict[str, str] | None = None) -> "DrugIndex":
        path = Path(path)
        rows = _read_rows(path)
        if not rows:
            raise ValueError(f"CSDL thuốc rỗng: {path}")
        cols = _resolve_columns(list(rows[0].keys()), column_map)
        records = []
        for i, row in enumerate(rows):
            def cell(key: str) -> str:
                c = cols.get(key)
                v = row.get(c) if c else None
                return "" if v is None else str(v).strip()

            brand, active_txt = cell("brand"), cell("active")
            strengths = extract_strengths(cell("strength")) | extract_strengths(active_txt)
            records.append(DrugRecord(
                rid=i, brand=brand, actives=_split_actives(active_txt),
                strengths=strengths, form=cell("form") or None, reg_id=cell("reg_id") or None,
            ))
        return cls(records)

    @classmethod
    def from_sqlite(cls, db_path: str | Path) -> "DrugIndex":
        """Dựng chỉ mục từ chính CSDL SQLite của ứng dụng (bảng medicines).

        Hoạt chất lấy từ liên kết cũ (medicines.active_ingredient_id) và từ
        medicine_ingredients chỉ khi review_status = 'verified'. Thuốc chưa có hoạt chất
        vẫn được đưa vào để xác minh TÊN thuốc, nhưng không có hoạt chất để đối chiếu.
        """
        import sqlite3

        uri = f"file:{Path(db_path).as_posix()}?mode=ro"
        conn = sqlite3.connect(uri, uri=True)
        try:
            ingredient_rows = conn.execute(
                """
                SELECT m.id, a.name
                FROM medicines m JOIN active_ingredients a ON a.id = m.active_ingredient_id
                UNION
                SELECT mi.medicine_id, a.name
                FROM medicine_ingredients mi JOIN active_ingredients a ON a.id = mi.active_ingredient_id
                WHERE mi.review_status = 'verified'
                """
            ).fetchall()
            actives_by_id: dict[int, list[str]] = defaultdict(list)
            for med_id, name in ingredient_rows:
                if name and name not in actives_by_id[med_id]:
                    actives_by_id[med_id].append(name)

            records = []
            for med_id, name, strength, form, sdk in conn.execute(
                "SELECT id, name, strength, dosage_form, sdk_code FROM medicines"
            ):
                if not name:
                    continue
                # Tên trong DB thường kèm hàm lượng ("Myonal 50mg"); bỏ phần hàm lượng để
                # khớp với tên viết trên đơn. Hàm lượng vẫn được giữ trong `strengths`.
                base_name = re.sub(r"\s+", " ", _STRENGTH_RE.sub(" ", str(name))).strip(" -,;")
                records.append(DrugRecord(
                    rid=len(records),
                    brand=base_name or str(name).strip(),
                    actives=actives_by_id.get(med_id, []),
                    strengths=extract_strengths(strength or "") | extract_strengths(name),
                    form=form or None,
                    reg_id=sdk or None,
                ))
        finally:
            conn.close()

        if not records:
            raise ValueError("Bảng medicines rỗng: không dựng được chỉ mục thuốc.")
        return cls(records)

    # ---------- tra cứu ----------
    def lookup(self, query: str, limit: int = 5, min_score: float = 0.80) -> Lookup:
        q = fold(query)
        if not q:
            return Lookup()
        if q in self.brand_exact or q in self.active_exact:
            return Lookup(exact_key=q)
        if len(q) < 5:  # quá ngắn: gợi ý mờ chỉ gây nhiễu
            return Lookup()

        counts: Counter[int] = Counter()
        for g in _trigrams(q):
            for idx in self._tri.get(g, ()):
                counts[idx] += 1
        limit_d = max_name_distance(len(q))
        scored = []
        for idx, _ in counts.most_common(120):
            name = self.names[idx]
            sim = _similarity(q, name)
            dist = ocr_distance(q, name, cap=limit_d)
            # Giữ ứng viên khi đủ giống HOẶC chỉ khác vài ký tự kiểu OCR.
            if sim >= min_score or dist <= limit_d:
                scored.append((dist, -sim, name, sim))
        scored.sort()
        return Lookup(suggestions=[(n, s) for _, _, n, s in scored[:limit]])

    def vocabulary(self) -> dict[str, str]:
        """Từ đơn lẻ (chỉ chữ cái, >= 5 ký tự) lấy từ tên thuốc và hoạt chất trong CSDL."""
        if getattr(self, "_vocab", None) is None:
            vocab: dict[str, str] = {}
            for name in self.names:
                for word in name.split():
                    if len(word) >= 5 and word.isalpha() and word.isascii():
                        if word not in _FORM_WORDS and word not in _VOCAB_STOP:
                            vocab[word] = word
            self._vocab = vocab
        return self._vocab

    def records_for(self, key: str) -> list[DrugRecord]:
        ids = set(self.brand_exact.get(key, ())) | set(self.active_exact.get(key, ()))
        return [self.records[i] for i in sorted(ids)]


_INDEX: DrugIndex | None = None
_INDEX_LOADED = False


def get_drug_index() -> DrugIndex | None:
    """Nạp CSDL một lần (lazy). Trả None nếu chưa cấu hình DRUG_DB_PATH."""
    global _INDEX, _INDEX_LOADED
    if _INDEX_LOADED:
        return _INDEX
    _INDEX_LOADED = True
    path = os.getenv("DRUG_DB_PATH", "").strip()
    if path.lower() == "off":
        print("[DRUG DB] DRUG_DB_PATH=off: bỏ qua bước đối chiếu CSDL thuốc.")
        return None
    try:
        if path:
            cols = os.getenv("DRUG_DB_COLUMNS", "").strip()
            _INDEX = DrugIndex.load(path, json.loads(cols) if cols else None)
        else:
            # Mặc định: dùng chính SQLite của ứng dụng để chỉ có MỘT nguồn dữ liệu thuốc.
            from database.database import DB_PATH
            _INDEX = DrugIndex.from_sqlite(DB_PATH)
    except Exception as exc:  # không để lỗi nạp chỉ mục làm hỏng cả luồng OCR
        print(f"[DRUG DB] Không nạp được CSDL thuốc ({type(exc).__name__}: {exc}); bỏ qua đối chiếu.")
        _INDEX = None
        return None
    print(f"[DRUG DB] Đã nạp {len(_INDEX.records)} bản ghi, {len(_INDEX.names)} tên duy nhất.")
    return _INDEX


# =========================================================
# 3. CÁCH DÙNG: PHÂN TÍCH -> DỰNG LẠI BẰNG MẪU CỐ ĐỊNH
# =========================================================

_UNITS = r"viên|gói|ống|giọt|ml|lọ|chai|tuýp|nhát|muỗng|thìa"
_NUM = r"\d+(?:[.,/]\d+)?"
_TIMES = ("sáng", "trưa", "chiều", "tối")
_TIMES_RE = "|".join(_TIMES)
_FILLER = {"ngày", "uống", "dùng", "mỗi", "lần", "chia", "buổi", "và", "lúc", "vào"}


@dataclass
class UsageParse:
    ok: bool
    text: str | None = None
    data: dict[str, Any] = field(default_factory=dict)
    reason: str = ""


def _fail(reason: str) -> UsageParse:
    return UsageParse(ok=False, reason=reason)


def _parse_usage_sentence(text: str | None) -> UsageParse:
    if not text or not text.strip():
        return _fail("không có nội dung cách dùng")

    work = re.sub(r"\s+", " ", text.strip())

    # 1. Thời điểm so với bữa ăn.
    meals = list(re.finditer(r"\b(sau|trước|trong)\s+(?:khi\s+)?ăn\b", work, re.I))
    if len(meals) > 1:
        return _fail("nhiều thời điểm ăn")
    meal = None
    if meals:
        m = meals[0]
        meal = f"{m.group(1).lower()} ăn"
        work = work[:m.start()] + " " + work[m.end():]

    # 2. "chia N lần"
    split_n = None
    m = re.search(rf"\bchia\s+({_NUM})\s+lần\b", work, re.I)
    if m:
        split_n = m.group(1)
        work = work[:m.start()] + " " + work[m.end():]

    # 3. "sáng 1 viên, trưa 1 viên ..."
    breakdown = [
        (t.lower(), n, u.lower())
        for t, n, u in re.findall(rf"\b({_TIMES_RE})\s+({_NUM})\s*({_UNITS})\b", work, re.I)
    ]
    work = re.sub(rf"\b(?:{_TIMES_RE})\s+{_NUM}\s*(?:{_UNITS})\b", " ", work, flags=re.I)

    # 4. "mỗi lần X viên"
    per_dose = None
    m = re.search(rf"\bmỗi\s+lần\s+({_NUM})\s*({_UNITS})\b", work, re.I)
    if m:
        per_dose = (m.group(1), m.group(2).lower())
        work = work[:m.start()] + " " + work[m.end():]

    # 5. "N lần (/ngày)"
    times_n = None
    m = re.search(rf"\b({_NUM})\s+lần(?:\s*/\s*ngày)?\b", work, re.I)
    if m:
        times_n = m.group(1)
        work = work[:m.start()] + " " + work[m.end():]

    # 6. "buổi sáng"
    single_time = None
    m = re.search(rf"\bbuổi\s+({_TIMES_RE})\b", work, re.I)
    if m:
        single_time = m.group(1).lower()
        work = work[:m.start()] + " " + work[m.end():]

    # 7. Tổng liều trong ngày
    total = None
    m = re.search(rf"\b({_NUM})\s*({_UNITS})\b", work, re.I)
    if m:
        total = (m.group(1), m.group(2).lower())
        work = work[:m.start()] + " " + work[m.end():]

    # 8. Còn sót chữ/số lạ => không đoán.
    leftover = re.sub(r"[^\w]+", " ", work, flags=re.UNICODE)
    leftover = " ".join(w for w in leftover.split() if w.casefold() not in _FILLER)
    if leftover:
        return _fail(f"còn nội dung chưa nhận diện: '{leftover[:60]}'")

    data: dict[str, Any] = {"meal": meal}
    tail = f", {meal}" if meal else ""

    if breakdown:
        units = {u for _, _, u in breakdown} | ({total[1]} if total else set())
        if len(units) != 1:
            return _fail("đơn vị các buổi không thống nhất")
        unit = units.pop()
        try:
            s = sum(float(n.replace(",", ".")) for _, n, _ in breakdown)
        except ValueError:  # phân số kiểu 1/2
            return _fail("không kiểm tra được tổng liều (phân số)")
        if total is None:
            return _fail("thiếu tổng liều trong ngày")
        if abs(s - float(total[0].replace(",", "."))) > 1e-9:
            return _fail(f"tổng các buổi ({s:g}) khác tổng liều ({total[0]})")
        if split_n is not None and int(float(split_n)) != len(breakdown):
            return _fail(f"'chia {split_n} lần' nhưng có {len(breakdown)} buổi")
        if len({t for t, _, _ in breakdown}) != len(breakdown):
            return _fail("lặp buổi uống")
        if single_time or times_n or per_dose:
            return _fail("mô tả liều mâu thuẫn")
        parts = ", ".join(f"{t} {n} {unit}" for t, n, _ in breakdown)
        data.update(total=total[0], unit=unit, split=len(breakdown),
                    schedule=[{"time": t, "amount": n} for t, n, _ in breakdown])
        return UsageParse(True, f"{total[0]} {unit} chia {len(breakdown)} lần, {parts}{tail}", data)

    if per_dose and times_n and not total and not split_n and not single_time:
        data.update(times_per_day=times_n, per_dose=per_dose[0], unit=per_dose[1])
        return UsageParse(True, f"{times_n} lần/ngày, mỗi lần {per_dose[0]} {per_dose[1]}{tail}", data)

    if total and not per_dose and not times_n:
        text_out = f"{total[0]} {total[1]}"
        data.update(total=total[0], unit=total[1])
        if split_n:
            text_out += f" chia {split_n} lần"
            data["split"] = split_n
        if single_time:
            if split_n:
                return _fail("vừa 'chia lần' vừa một buổi cố định")
            text_out += f" buổi {single_time}"
            data["time"] = single_time
        return UsageParse(True, text_out + tail, data)

    return _fail("cấu trúc liều dùng chưa hỗ trợ hoặc mơ hồ")


# ---------------------------------------------------------
# Cách dùng dạng bảng: "Sáng: 1   Chiều: 1   Tối: 0"
# ---------------------------------------------------------
_TIME_WORDS = {"sang": "Sáng", "trua": "Trưa", "chieu": "Chiều", "toi": "Tối"}
_TIME_ORDER = ["Sáng", "Trưa", "Chiều", "Tối"]
_SCHEDULE_PAIR = re.compile(
    r"(?<![^\W\d_])([^\W\d_]{3,6})\s*[:：]?\s*(\d+(?:[.,]\d+)?(?:\s*/\s*\d+)?)(?!\d)"
)


def _time_label(word: str) -> str | None:
    key = fold(word)
    if key in _TIME_WORDS:
        return _TIME_WORDS[key]
    if len(key) >= 3:
        # OCR hay mất/nhầm dấu: "Chiu" -> Chiều, "Tôi" -> Tối.
        for known, label in _TIME_WORDS.items():
            if abs(len(key) - len(known)) <= 1 and ocr_distance(key, known, cap=1.0) <= 1.0:
                return label
    return None


def parse_schedule(text: str | None) -> dict[str, str]:
    """{'Sáng': '1', 'Chiều': '1', 'Tối': '0'} từ chuỗi có các cặp buổi + số, không phụ thuộc thứ tự OCR."""
    schedule: dict[str, str] = {}
    for match in _SCHEDULE_PAIR.finditer(text or ""):
        label = _time_label(match.group(1))
        if label and label not in schedule:
            schedule[label] = re.sub(r"\s+", "", match.group(2)).replace(",", ".")
    return schedule


def _dose_is_zero(dose: str) -> bool:
    try:
        return float(dose.split("/")[0]) == 0
    except ValueError:
        return False


def format_schedule(schedule: dict[str, str]) -> str | None:
    """'Sáng 1, Chiều 1' theo thứ tự trong ngày, bỏ buổi bằng 0."""
    parts = [
        f"{label} {schedule[label]}"
        for label in _TIME_ORDER
        if label in schedule and not _dose_is_zero(schedule[label])
    ]
    return ", ".join(parts) or None


# Từ khóa cách dùng hay bị OCR làm mất/nhầm dấu ("buői tői" -> buổi tối). So khớp theo dạng đã bỏ dấu.
_USAGE_KEYWORDS = {
    "ngay": "ngày", "uong": "uống", "vien": "viên", "goi": "gói", "ong": "ống", "buoi": "buổi",
    "sang": "sáng", "trua": "trưa", "chieu": "chiều", "toi": "tối", "truoc": "trước",
    "chia": "chia", "lan": "lần",
}


def canonicalize_usage_text(text: str | None) -> str:
    """Đưa các từ khóa cách dùng về dạng chuẩn có dấu; không đụng tới chữ số hay từ lạ."""
    if not text:
        return ""

    def fix(match: re.Match[str]) -> str:
        word = match.group(0)
        canonical = _USAGE_KEYWORDS.get(fold(word))
        if canonical is None:
            return word
        return canonical.capitalize() if word[:1].isupper() else canonical

    out = re.sub(r"[^\W\d_]+", fix, text)
    # "moi lan" -> "mỗi lần" (không đổi riêng "moi" vì "mới" cũng bỏ dấu thành "moi").
    out = re.sub(r"\bmoi\s+lần\b", "mỗi lần", out, flags=re.I)
    # "sau an"/"truoc an" mất dấu ở chữ "ăn" khi đứng sau sau/trước.
    out = re.sub(r"\b(sau|trước)\s+(?:khi\s+)?an\b", lambda m: f"{m.group(1)} ăn", out, flags=re.I)
    return re.sub(r"\s+", " ", out).strip()


_SENTENCE_CUE = re.compile(r"\b(uống|chia|mỗi lần|ngày)\b", re.I)


def parse_usage(text: str | None) -> UsageParse:
    cleaned = canonicalize_usage_text(text)

    # Câu kiểu "Ngày uống 2 viên chia 2 lần, sáng 1 viên, trưa 1 viên, sau ăn": giữ đủ tổng liều,
    # số lần chia và thời điểm ăn (không rút gọn thành bảng buổi).
    if _SENTENCE_CUE.search(cleaned):
        result = _parse_usage_sentence(cleaned)
        if result.ok:
            return result

        # Có nội dung lạ ở cuối ("..., có thể chóng mặt khi mới dùng"): giữ phần nhận diện được
        # ở đầu câu, phần còn lại trả về trong data["leftover"] để hiển thị và đánh dấu cần xem lại.
        clauses = [c.strip() for c in cleaned.split(",")]
        for keep in range(len(clauses) - 1, 0, -1):
            head = ", ".join(clauses[:keep])
            partial = _parse_usage_sentence(head)
            if partial.ok:
                partial.data["leftover"] = ", ".join(clauses[keep:])
                return partial

        # Câu hỏng nặng: vẫn cứu được "Ngày uống N <đơn vị>" ở đầu câu, phần còn lại để người dùng xem.
        head = re.match(
            rf"^\s*(?:ngày\s+)?uống\s+({_NUM})\s*({_UNITS})\b(.*)$", cleaned, re.I
        )
        if head:
            total, unit = head.group(1), head.group(2).lower()
            leftover = head.group(3).strip(" ,;.")
            data = {"total": total, "unit": unit, "meal": None}
            if leftover:
                data["leftover"] = leftover
            return UsageParse(True, f"{total} {unit}", data)

        return result

    schedule = parse_schedule(text)
    if schedule:
        formatted = format_schedule(schedule)
        if formatted:
            return UsageParse(ok=True, text=formatted, data={"schedule": schedule})

    return _parse_usage_sentence(cleaned)


def extract_usage_candidates(section: str | None) -> list[str]:
    """
    Trả về các đoạn có thể là phần cách dùng, từ ngắn đến dài:
      A: từ dòng "Ngày uống..." đến dòng trống đầu tiên;
      B: đến hết đoạn (dừng ở dòng đánh số thuốc kế tiếp).
    Parser tự quyết đoạn nào hợp lệ, nên đoạn dài thừa do tách đoạn sai không gây hại.
    """
    if not section:
        return []
    lines = section.splitlines()
    start = None
    for i, line in enumerate(lines):
        if re.match(r"\s*(?:ngày\s+uống|uống|cách\s+dùng|dùng)\b", canonicalize_usage_text(line), re.I):
            start = i
            break
    if start is None:
        return []

    block_a, block_b = [], []
    seen_blank = False
    for line in lines[start:]:
        text = line.strip()
        if re.match(r"\d{1,2}[.)]\s+\S", text):
            break  # dòng đánh số thuốc kế tiếp
        if not text:
            seen_blank = True
            continue
        if not seen_blank:
            block_a.append(text)
        block_b.append(text)

    out = []
    for block in (block_a, block_b):
        joined = " ".join(block)
        if joined and joined not in out:
            out.append(joined)
    return out


# =========================================================
# 4. HẬU XỬ LÝ TỪNG THUỐC
# =========================================================

def _is_generic_name(brand: str, others: list[str | None], generics: set[str]) -> bool:
    b = fold(brand)
    if not b:
        return False
    if b in {fold(o) for o in others if o} or b in generics:
        return True
    words = b.split()
    while words and words[-1] in _FORM_WORDS:
        words.pop()
    return bool(words) and " ".join(words) in generics


def finalize_medicine(
    med: dict[str, Any],
    section: str | None,
    index: DrugIndex | None,
    number: int,
    auto_correct: bool | None = None,
) -> tuple[list[str], list[str]]:
    """
    Sửa `med` tại chỗ. Trả về (warnings_cho_người_dùng, debug_notes).
    Thêm các trường: name_status, needs_review, review_reasons, usage_structured, suggestions.
    """
    if auto_correct is None:
        auto_correct = os.getenv("DRUG_AUTO_CORRECT", "0") == "1"

    reasons: list[str] = []
    debug: list[str] = []
    section_fold = fold(section) if section else ""
    generics = index.generics if index else {fold(g) for g in BUILTIN_GENERICS}

    # --- 1. Trường tên phải xuất hiện thật trong đoạn OCR của thuốc ---
    if section:
        for key in ("brand_name", "active_ingredient"):
            v = med.get(key)
            if v and fold(v) not in section_fold:
                debug.append(f"Thuốc {number}: {key}='{v}' không có trong đoạn OCR, đã bỏ.")
                med[key] = None

    # --- 2. Biệt dược thật ra là tên hoạt chất => bỏ ---
    brand = med.get("brand_name")
    if brand and _is_generic_name(brand, [med.get("prescription_name"), med.get("active_ingredient")], generics):
        debug.append(f"Thuốc {number}: '{brand}' là tên hoạt chất, không phải biệt dược. Đã đặt brand_name=null.")
        med["brand_name"] = None

    # --- 3. Đối chiếu CSDL thuốc ---
    med["name_status"] = "not_checked" if index is None else "unverified"
    matched: list[DrugRecord] = []

    if index is not None:
        name_lk = index.lookup(med["prescription_name"])
        brand_lk = index.lookup(med["brand_name"]) if med.get("brand_name") else Lookup()

        exact_keys = [k for k in (name_lk.exact_key, brand_lk.exact_key) if k]
        if exact_keys:
            sets = [set(r.rid for r in index.records_for(k)) for k in exact_keys]
            common = set.intersection(*sets)
            if len(sets) == 2 and not common:
                reasons.append(
                    "Tên thuốc và biệt dược trên đơn không cùng một thuốc trong CSDL; cần kiểm tra ảnh gốc."
                )
            ids = common or set.union(*sets)
            matched = [index.records[i] for i in sorted(ids)]
            med["name_status"] = "verified"
            if name_lk.exact_key:
                med["prescription_name"] = index.display[name_lk.exact_key]
            if brand_lk.exact_key:
                med["brand_name"] = index.display[brand_lk.exact_key]
        else:
            # Khớp gần đúng: chỉ gợi ý.
            sugg = name_lk.suggestions or brand_lk.suggestions
            if sugg:
                top_key, top_score = sugg[0]
                query_fold = fold(med["prescription_name"])
                dist_top = _edit_distance(query_fold, top_key)
                # Duy nhất: không có ứng viên thứ hai cũng chỉ cách <= 1 ký tự.
                unique_top = all(
                    _edit_distance(query_fold, k) > 1 for k, _ in sugg[1:]
                )
                strength_ok = True
                if med.get("strength"):
                    s = norm_strength(med["strength"])
                    cand = index.records_for(top_key)
                    strength_ok = any(s in r.strengths for r in cand if r.strengths) or not any(
                        r.strengths for r in cand
                    )
                if (auto_correct and name_lk.suggestions and dist_top == 1
                        and len(top_key) >= 8 and unique_top and strength_ok):
                    old = med["prescription_name"]
                    med["prescription_name"] = index.display[top_key]
                    matched = index.records_for(top_key)
                    med["name_status"] = "corrected"
                    reasons.append(
                        f"Tên thuốc '{old}' đã được sửa thành '{med['prescription_name']}' "
                        f"theo CSDL (độ giống {top_score:.2f}); cần xác nhận."
                    )
                else:
                    med["name_status"] = "suggested"
                    med["suggestions"] = [index.display[k] for k, _ in sugg[:3]]
                    reasons.append(
                        f"Tên thuốc '{med['prescription_name']}' không khớp chính xác với CSDL. "
                        f"Có phải: {', '.join(med['suggestions'])}?"
                    )
            else:
                reasons.append(
                    f"Tên thuốc '{med['prescription_name']}' chưa có trong CSDL; cần kiểm tra ảnh gốc."
                )

        # Biệt dược phải thuộc nhóm thuốc đã khớp (cho phép hậu tố hàm lượng: "Roticox 90").
        if matched and med.get("brand_name") and not brand_lk.exact_key:
            bf = fold(med["brand_name"])
            if not any(fold(r.brand) == bf or fold(r.brand).startswith(bf + " ") for r in matched):
                hint = ", ".join(index.display[k] for k, _ in brand_lk.suggestions[:3])
                reasons.append(
                    f"Biệt dược '{med['brand_name']}' không khớp CSDL cho thuốc này"
                    + (f". Có phải: {hint}?" if hint else "; cần kiểm tra ảnh gốc.")
                )

        # Hoạt chất theo CSDL.
        if matched:
            db_actives = {fold(a): _pretty(a) for r in matched for a in r.actives}
            cur = med.get("active_ingredient")
            if cur:
                cf = fold(cur)
                if cf in db_actives:
                    med["active_ingredient"] = db_actives[cf]
                elif any(
                    df.startswith(cf + " ") or cf.startswith(df + " ") or _edit_distance(cf, df, 1) <= 1
                    for df in db_actives
                ):
                    # Cùng hoạt chất, khác muối/dạng ("Glucosamin" ~ "Glucosamin sulfat"): giữ nguyên theo đơn.
                    pass
                elif db_actives:
                    reasons.append(
                        f"Hoạt chất '{cur}' khác với CSDL ({', '.join(db_actives.values())}); cần kiểm tra."
                    )
            elif len({tuple(sorted(r.actives)) for r in matched}) == 1 and matched[0].actives:
                med["active_ingredient"] = ", ".join(_pretty(a) for a in matched[0].actives)
                debug.append(f"Thuốc {number}: hoạt chất lấy từ CSDL.")

            # Hàm lượng so với CSDL (không tự sửa).
            db_strengths = set().union(*(r.strengths for r in matched))
            if med.get("strength") and db_strengths:
                s = norm_strength(med["strength"])
                if s and s not in db_strengths:
                    reasons.append(
                        f"Hàm lượng '{med['strength']}' không có trong CSDL cho thuốc này "
                        f"(CSDL: {', '.join(sorted(db_strengths))}); cần kiểm tra ảnh gốc."
                    )

    # --- 4. Cách dùng: dựng lại bằng mẫu cố định ---
    src_texts = extract_usage_candidates(section)
    if section and len(parse_schedule(section)) >= 2:
        # Bố cục Sáng/Trưa/Chiều/Tối: chính đoạn OCR là bằng chứng.
        src_texts = list(src_texts) + [section]
    src_parses = [(t, parse_usage(t)) for t in src_texts]
    ok_src = [(t, p) for t, p in src_parses if p.ok]
    qwen_usage = med.get("usage")
    parsed_qwen = parse_usage(qwen_usage) if qwen_usage else None

    if ok_src:
        distinct = {p.text for _, p in ok_src}
        chosen = ok_src[-1][1]  # đoạn dài nhất hợp lệ: không làm mất chữ như "sau ăn"
        med["usage"] = chosen.text
        med["usage_structured"] = {k: v for k, v in chosen.data.items() if k != "leftover"}
        leftover = chosen.data.get("leftover")
        if leftover:
            # Không bỏ rơi phần chưa nhận diện: giữ nguyên văn trong usage_note và yêu cầu xem lại.
            med["usage_note"] = leftover
            reasons.append(
                f"Cách dùng còn đoạn chưa nhận diện được: '{leftover}'; cần kiểm tra ảnh gốc."
            )
        if len(distinct) > 1:
            reasons.append(
                "Cách dùng có thể gồm nhiều đoạn OCR; hệ thống chọn bản đầy đủ nhất, cần kiểm tra."
            )
        if parsed_qwen and parsed_qwen.ok and parsed_qwen.text != chosen.text:
            debug.append(f"Thuốc {number}: cách dùng Qwen ('{qwen_usage}') khác OCR; đã dùng OCR.")
    elif src_parses:
        raw_usage = re.sub(r"\s+", " ", src_texts[0]).strip()
        med["usage"] = raw_usage
        reasons.append(
            f"Cách dùng chưa chuẩn hóa tự động được ({src_parses[0][1].reason}); "
            "đang hiển thị nguyên văn OCR."
        )
    elif parsed_qwen and parsed_qwen.ok:
        med["usage"] = parsed_qwen.text
        med["usage_structured"] = parsed_qwen.data
        reasons.append("Cách dùng chưa đối chiếu được với văn bản OCR; cần kiểm tra.")
    elif qwen_usage:
        reasons.append("Cách dùng chưa đối chiếu và chuẩn hóa được; cần kiểm tra.")

    med["review_reasons"] = reasons
    med["needs_review"] = bool(reasons)
    label = med.get("prescription_name") or f"#{number}"
    return [f"Thuốc thứ {number} ({label}): {r}" for r in reasons], debug

# =========================================================
# SỬA CHÍNH TẢ TÊN THUỐC THEO CSDL (trước khi đưa cho Qwen)
# =========================================================

_MED_LINE_START = re.compile(r"^\s*\d{1,2}\s*[.)]")
_LONE_NUMBER = re.compile(r"^\s*\d{1,2}\s*[.)]\s*$")
# Từ chỉ gồm chữ cái ASCII, không dính chữ cái có dấu liền kề.
_ASCII_WORD = re.compile(r"(?<![^\W\d_])[A-Za-z]{6,}(?![^\W\d_])")


def _nearest_vocab_word(key: str, vocab: dict[str, str]) -> str | None:
    """Từ gần nhất (khoảng cách <= 1) khi DUY NHẤT; ngược lại None."""
    scored: list[tuple[float, str]] = []
    for word in vocab:
        if abs(len(word) - len(key)) > 1:
            continue
        if word[0] != key[0] and word[-1] != key[-1]:
            continue
        distance = ocr_distance(key, word, cap=1.0)
        if distance <= 1.0:
            scored.append((distance, word))
    if not scored:
        return None
    scored.sort()
    if len(scored) == 1 or scored[1][0] > scored[0][0]:
        return scored[0][1]
    return None


def correct_with_vocabulary(text: str, index: "DrugIndex | None") -> tuple[str, list[dict[str, str]]]:
    """Sửa từ sai chính tả OCR trên các dòng thuốc bằng từ vựng của CSDL thuốc.

    Chỉ sửa chữ cái (không bao giờ đụng tới chữ số, hàm lượng, đơn vị), chỉ trên dòng
    có dạng dòng thuốc (đánh số hoặc có hàm lượng), chỉ khi từ không có trong CSDL và có
    đúng một từ CSDL khác nó <= 1 ký tự. Mọi chỗ sửa đều trả về trong notes để hiện cảnh báo.
    """
    if index is None or not text:
        return text, []

    vocab = index.vocabulary()
    if not vocab:
        return text, []

    notes: list[dict[str, str]] = []
    out_lines: list[str] = []
    previous_was_lone_number = False

    for line in text.split("\n"):
        is_medicine_line = (
            bool(_MED_LINE_START.match(line))
            or bool(_STRENGTH_RE.search(line))
            or previous_was_lone_number
        )
        previous_was_lone_number = bool(_LONE_NUMBER.match(line))

        if not is_medicine_line:
            out_lines.append(line)
            continue

        def replace(match: re.Match[str]) -> str:
            token = match.group(0)
            key = fold(token)
            if (
                not key
                or key in vocab
                or key in _FORM_WORDS
                or key in _VOCAB_STOP
                or key in index.brand_exact
                or key in index.active_exact
            ):
                return token
            best = _nearest_vocab_word(key, vocab)
            if best is None:
                return token
            if token.isupper():
                fixed = best.upper()
            elif token[0].isupper():
                fixed = best.capitalize()
            else:
                fixed = best
            notes.append({
                "original": token,
                "reason": (
                    f"OCR đọc '{token}'; đối chiếu CSDL thuốc và sửa thành '{fixed}' "
                    "(sai khác chính tả). Cần đối chiếu ảnh gốc."
                ),
            })
            return fixed

        out_lines.append(_ASCII_WORD.sub(replace, line))

    return "\n".join(out_lines), notes
