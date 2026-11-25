import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup, Tag, NavigableString

INPUT_HTML = "input.html"
OUTPUT_JSON = "drugs.json"

# ============================================================
# CONFIG
# ============================================================

DRUG_FIELDS = [
    "name", "strength", "dosage_form", "registration_number",
    "packaging", "indication", "usage", "contraindication",
    "side_effect", "interaction", "warning", "storage"
]

INGREDIENT_FIELDS = [
    "name", "strength", "effect", "pharmacokinetics", "indication", "dosage",
    "contraindication", "interaction", "side_effect", "warning"
]

FOOTER_STOP_WORDS = [
    "hỗ trợ khách hàng",
    "tư vấn mua hàng",
    "gửi đơn thuốc",
    "hotline",
    "sản phẩm cùng hoạt chất",
    "thuốc liên quan",
    "sản phẩm liên quan",
]

DRUG_SECTION_MAP = {
    "chỉ định": "indication",
    "liều lượng - cách dùng": "usage",
    "liều lượng và cách dùng": "usage",
    "liều dùng - cách dùng": "usage",
    "liều dùng": "usage",
    "cách dùng": "usage",
    "chống chỉ định": "contraindication",
    "tác dụng phụ": "side_effect",
    "tác dụng không mong muốn": "side_effect",
    "tương tác thuốc": "interaction",
    "tương tác": "interaction",
    "thận trọng": "warning",
    "thận trọng lúc dùng": "warning",
    "cảnh báo": "warning",
    "lưu ý": "warning",
    "bảo quản": "storage",
}

INGREDIENT_SECTION_MAP = {
    "dược lực": "effect",
    "tác dụng": "effect",
    "chỉ định": "indication",
    "liều dùng": "dosage",
    "liều lượng - cách dùng": "dosage",
    "liều lượng và cách dùng": "dosage",
    "liều dùng - cách dùng": "dosage",
    "chống chỉ định": "contraindication",
    "tương tác": "interaction",
    "tương tác thuốc": "interaction",
    "tác dụng phụ": "side_effect",
    "tác dụng không mong muốn": "side_effect",
    "thận trọng": "warning",
    "cảnh báo": "warning",
    "lưu ý": "warning",
}


def normalize_text(text):
    if not text:
        return ""
    text = text.replace("\xa0", " ")
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def clean_text(text):
    if not text:
        return ""
    text = text.replace("\xa0", " ")
    text = text.replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n", text)
    text = re.sub(r"\s+([,.!?;:])", r"\1", text)
    return text.strip()


def is_footer_text(text):
    n = normalize_text(text)
    return any(word in n for word in FOOTER_STOP_WORDS)


def dedupe_parts(parts):
    result = []
    seen = set()
    for part in parts:
        part = clean_text(part)
        key = normalize_text(part)
        if not key or key in seen:
            continue
        seen.add(key)
        result.append(part)
    return result


def clean_field(text):
    if not text:
        return ""

    text = clean_text(text)
    if normalize_text(text) in {"null", "none", "n/a", "-"}:
        return ""

    # Loại các đoạn UI/footer bị website chèn vào.
    for marker in FOOTER_STOP_WORDS:
        pattern = re.compile(rf"\s*{re.escape(marker)}.*$", re.I)
        text = pattern.sub("", text).strip()

    # Xóa heading bị lặp ở đầu field.
    text = re.sub(
        r"^(Chỉ định|Liều dùng|Liều lượng\s*-\s*Cách dùng|"
        r"Chống chỉ định|Tương tác(?: thuốc)?|Tác dụng phụ|"
        r"Bảo quản|Thận trọng|Cảnh báo)(?:\s*[:\-]\s*|$)",
        "",
        text,
        flags=re.I,
    )

    # Xóa đoạn bị lặp nguyên văn liên tiếp.
    words = text.split()
    if len(words) >= 6:
        for size in range(len(words) // 2, 2, -1):
            a = " ".join(words[:size])
            b = " ".join(words[size:size * 2])
            if normalize_text(a) == normalize_text(b):
                words = words[size:]
                break
        text = " ".join(words)

    return clean_text(text)


def is_heading(tag):
    return isinstance(tag, Tag) and tag.name in {"h1", "h2", "h3", "h4", "h5", "h6"}


def heading_level(tag):
    return int(tag.name[1]) if is_heading(tag) else 99


def heading_text(tag):
    return clean_text(tag.get_text(" ", strip=True))


def is_section_heading(tag):
    return is_heading(tag) and normalize_text(heading_text(tag)) in set(DRUG_SECTION_MAP) | set(INGREDIENT_SECTION_MAP)


def visible_text(element):
    if element is None:
        return ""
    clone = BeautifulSoup(str(element), "html.parser")
    for tag in clone.find_all(["script", "style", "noscript"]):
        tag.decompose()
    # Link tên hoạt chất kiểu "Diphenhydramine Chính" không phải nội dung.
    for a in clone.find_all("a"):
        a.decompose()
    return clean_field(clone.get_text(" ", strip=True))


def visible_text_keep_links(element):
    """Lấy cả chữ nằm trong liên kết; dùng cho tên hoạt chất trong bảng thành phần."""
    if element is None:
        return ""
    clone = BeautifulSoup(str(element), "html.parser")
    for tag in clone.find_all(["script", "style", "noscript"]):
        tag.decompose()
    return clean_field(clone.get_text(" ", strip=True))


def document_nodes(soup):
    return soup.find_all(True)


def find_exact_headings(soup, names):
    wanted = {normalize_text(x) for x in names}
    return [
        tag for tag in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"])
        if normalize_text(heading_text(tag)) in wanted
    ]


def _is_active_boundary(title):
    n = normalize_text(title)
    return n.startswith(("thông tin từ hoạt chất", "thông tin về hoạt chất"))


def _is_drug_boundary(title):
    """Heading mở mục mới ở cấp thuốc; chặn cả heading lồng sâu hơn."""
    n = normalize_text(title).strip(" :.-")
    if _is_active_boundary(n):
        return True
    if n in set(DRUG_SECTION_MAP) | set(INGREDIENT_SECTION_MAP):
        return True
    # Phần quảng bá này thường sao chép chỉ định và không phải mục lâm sàng độc lập.
    if n.startswith("công dụng ") or n.startswith("thông tin chi tiết về "):
        return True
    if n in {"thông tin nhanh", "thông tin công ty", "mục lục", "hỗ trợ khách hàng"}:
        return True
    return False


def extract_heading_block(heading, stop_at_footer=True, mode="drug"):
    """Lấy nội dung sau heading đến ranh giới mục kế tiếp, không đọc cả div cha.

    Các heading con được giữ lại làm marker để tách nội dung chi tiết hoạt chất.
    """
    if not heading:
        return ""

    level = heading_level(heading)
    parts = []
    for node in heading.next_elements:
        if isinstance(node, Tag) and is_heading(node):
            title = heading_text(node)
            if mode == "drug" and _is_drug_boundary(title):
                break
            if mode == "ingredient":
                if _is_active_boundary(title):
                    break
                # Các heading hoạt chất có thể cùng cấp (h3/h4) tùy mẫu HTML.
                # Chỉ tiếp tục với heading ngữ nghĩa đã nhận diện; heading khác là ranh giới ngoài.
                if heading_level(node) <= level and not map_ingredient_heading(title):
                    break
            # Heading con là ranh giới ngữ nghĩa hữu ích trong mục hoạt chất.
            parts.append(title.rstrip(" :") + ":")
            continue

        if not isinstance(node, NavigableString):
            continue
        parent = node.parent
        if not parent or parent.name in {"script", "style", "noscript", "nav", "footer", "header"}:
            continue
        if parent.name in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            continue
        value = clean_text(str(node))
        if not value:
            continue
        if stop_at_footer and is_footer_text(value):
            break
        parts.append(value)

    text = clean_text(" ".join(parts))
    # Dừng chính xác ở footer, không cắt nội dung ở giữa chỉ vì nhắc tới một từ chung.
    for marker in FOOTER_STOP_WORDS:
        text = re.sub(rf"(?i)\b{re.escape(marker)}\b.*$", "", text).strip()
    return text


# Nhãn nội dung xuất hiện bên trong các mục lớn trên một số trang.
INLINE_LABELS = [
    ("contraindication", r"chống\s+chỉ\s+định"),
    ("side_effect", r"tác\s+dụng\s+ngoài\s+ý\s+muốn|tác\s+dụng\s+không\s+mong\s+muốn|tác\s+dụng\s+phụ"),
    ("interaction", r"tương\s+tác(?:\s+thuốc)?|tăng\s+độc\s+tính|tương\s+kỵ(?:\s+thuốc)?"),
    ("usage", r"liều\s+lượng\s*(?:&|và|-)\s*cách\s+dùng|liều\s+dùng|liều\s+lượng|cách\s+dùng"),
    ("warning", r"thận\s+trọng(?:\s+lúc\s+dùng)?|cảnh\s+báo|lưu\s+ý"),
    ("storage", r"bảo\s+quản"),
    ("indication", r"chỉ\s+định"),
    ("pharmacokinetics", r"đặc\s+tính\s+dược\s+động\s+học|dược\s+động(?:\s+học)?"),
    ("effect", r"đặc\s+tính\s+dược\s+lực\s+học|dược\s+lực(?:\s+học)?|tác\s+dụng|công\s+dụng"),
]


def _inline_markers(text, ingredient_name=""):
    """Tìm nhãn mục phụ cả dạng có dấu câu lẫn heading 'Chỉ định Paracetamol'."""
    text = clean_text(text)
    patterns = []
    for field, label_pattern in INLINE_LABELS:
        # Trường hợp nhãn theo sau là tên hoạt chất: nhận diện có kiểm soát,
        # không coi mọi cụm 'liều dùng ...' trong câu văn là heading.
        if ingredient_name:
            named = re.compile(
                rf"(?i)(?<![\w])({label_pattern})\s+{re.escape(ingredient_name)}(?=\s*[:：]|\s|$)"
            )
            for match in named.finditer(text):
                patterns.append((match.start(), match.end(), field))
        # Nhãn kết thúc bằng dấu câu hoặc gạch ngang.
        patterns.append((field, re.compile(rf"(?i)(?<![\w])({label_pattern})(?:\s*[:：]\s*|\s*[-–—]\s*)")))

    found = []
    for item in patterns:
        if len(item) == 3 and isinstance(item[0], int):
            found.append(item)
        else:
            field, pattern = item
            for match in pattern.finditer(text):
                found.append((match.start(), match.end(), field))
    found.sort(key=lambda item: (item[0], -(item[1] - item[0])))

    result = []
    last_end = -1
    for item in found:
        if item[0] < last_end:
            continue
        result.append(item)
        last_end = item[1]
    return text, result


def extract_semantic_value(raw, target_field, scope="drug", ingredient_name=""):
    """Tách một mục khỏi các nhãn con; khi thấy nhãn khác nhưng không thấy nhãn đích thì không đoán."""
    raw = clean_field(raw)
    if not raw:
        return ""

    text, markers = _inline_markers(raw, ingredient_name)
    if not markers:
        return raw

    mapped = []
    for start, end, field in markers:
        if scope == "ingredient" and field == "usage":
            field = "dosage"
        if scope == "drug" and field == "effect":
            # Dược lực/dược động học không phải chỉ định của chế phẩm.
            field = "_ignore_effect"
        if field in {"usage", "dosage"} and scope == "drug":
            field = "usage"
        mapped.append((start, end, field))

    chunks = []
    for i, (start, end, field) in enumerate(mapped):
        next_start = mapped[i + 1][0] if i + 1 < len(mapped) else len(text)
        content = clean_field(text[end:next_start].strip(" :-–—	"))
        if content:
            chunks.append((field, content))

    matching = [content for field, content in chunks if field == target_field]
    if matching:
        return clean_field(" ".join(dedupe_parts(matching)))

    # Có nhãn ngữ nghĩa khác trong block: không lấy nhầm chúng làm nội dung target.
    return "" if markers else raw

def choose_drug_heading(soup, section_names):
    """Chọn heading của thuốc chính, tuyệt đối không lấy heading trong phần hoạt chất."""
    all_headings = soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"])
    matches = [
        tag for tag in all_headings
        if normalize_text(heading_text(tag)) in {normalize_text(x) for x in section_names}
    ]
    if not matches:
        return None

    # Phần "Thông tin từ hoạt chất: ..." đánh dấu ranh giới.
    active_indexes = [
        i for i, tag in enumerate(all_headings)
        if normalize_text(heading_text(tag)).startswith(("thông tin từ hoạt chất", "thông tin về hoạt chất"))
    ]
    if active_indexes:
        cutoff = min(active_indexes)
        main_matches = [tag for i, tag in enumerate(all_headings) if i < cutoff and tag in matches]
        return main_matches[0] if main_matches else None

    # Nếu trang không có phần hoạt chất chi tiết, dùng heading đầu tiên.
    return matches[0]


def _truncate_basic_value(value):
    value = clean_text(value)
    # Chặn trường hợp markup gộp nhiều cặp nhãn-giá trị trong cùng một node.
    stop = re.search(
        r"(?i)\b(?:dạng\s+bào\s+chế|lượt\s+xem|danh\s+mục|thành\s+phần|"
        r"quy\s+cách\s+đóng\s+gói|đóng\s+gói|số\s+đăng\s+ký|đăng\s+ký)\b",
        value,
    )
    if stop:
        value = value[:stop.start()].strip()
    return value


def find_value_by_label(soup, labels):
    """Đọc giá trị từ cặp nhãn/giá trị; không lấy text của div tổ tiên chứa metadata."""
    wanted = {normalize_text(x) for x in labels}

    # 1) Bảng HTML: nhãn và giá trị nằm cùng hàng là cấu trúc đáng tin nhất.
    for row in soup.find_all("tr"):
        cells = row.find_all(["th", "td"], recursive=False)
        if len(cells) >= 2 and normalize_text(cells[0].get_text(" ", strip=True)) in wanted:
            value = visible_text_keep_links(cells[1])
            if value and normalize_text(value) not in wanted:
                return _truncate_basic_value(value)

    # 2) Danh sách định nghĩa <dt>/<dd>.
    for label in soup.find_all("dt"):
        if normalize_text(label.get_text(" ", strip=True)) in wanted:
            value_node = label.find_next_sibling("dd")
            if value_node:
                value = visible_text_keep_links(value_node)
                if value:
                    return _truncate_basic_value(value)

    # 3) Nhãn riêng biệt với phần tử anh em kế tiếp. Không đọc div cha tổng hợp.
    for tag in soup.find_all(["span", "strong", "b", "th", "td", "dt", "label", "div"]):
        label_text = normalize_text(tag.get_text(" ", strip=True))
        if label_text not in wanted:
            continue
        sibling = tag.find_next_sibling()
        if sibling:
            value = visible_text_keep_links(sibling)
            if value and normalize_text(value) not in wanted:
                return _truncate_basic_value(value)

    # 4) Chỉ nhận nhãn + giá trị cùng node nhỏ, không lấy div cha.
    for tag in soup.find_all(["p", "li", "span", "strong", "b", "td", "th", "div"]):
        text = clean_text(tag.get_text(" ", strip=True))
        n = normalize_text(text)
        for label in sorted(wanted, key=len, reverse=True):
            if n.startswith(label + ":") or n.startswith(label + " "):
                value = re.sub(rf"(?i)^{re.escape(label)}\s*:?\s*", "", text)
                value = _truncate_basic_value(value)
                if value:
                    return value
    return ""


def parse_basic_info(soup):
    strength = find_value_by_label(soup, ["Hàm lượng", "Hàm lượng hoạt chất", "Nồng độ", "Strength"])
    dosage_form = find_value_by_label(soup, ["Dạng bào chế", "Dạng thuốc"])
    registration_number = find_value_by_label(soup, ["Số đăng ký", "Đăng ký", "Số ĐK"])
    packaging = find_value_by_label(soup, ["Quy cách đóng gói", "Đóng gói"])

    # Mã đăng ký chỉ giữ token đầu tiên có hình dạng mã; bỏ text giao diện theo sau.
    if registration_number:
        match = re.search(r"(?i)\b(?:VD|VN|QLĐB|GC|SP|TCT)[- ]?[A-Z0-9/-]+\b|\b\d{8,}\b", registration_number)
        registration_number = match.group(0).replace(" ", "") if match else ""

    return strength, dosage_form, registration_number, packaging

def parse_drug_sections(soup):
    result = {field: "" for field in DRUG_FIELDS if field not in {"name", "strength", "dosage_form", "registration_number", "packaging"}}
    field_candidates = {
        "indication": ["chỉ định"],
        "usage": ["liều lượng & cách dùng", "liều lượng và cách dùng", "liều lượng - cách dùng", "liều dùng - cách dùng", "liều dùng", "cách dùng"],
        "contraindication": ["chống chỉ định"],
        "side_effect": ["tác dụng ngoài ý muốn", "tác dụng không mong muốn", "tác dụng phụ"],
        "interaction": ["tương tác thuốc", "tương tác"],
        "warning": ["thận trọng lúc dùng", "thận trọng", "cảnh báo", "lưu ý"],
        "storage": ["bảo quản"],
    }
    for field, labels in field_candidates.items():
        heading = choose_drug_heading(soup, labels)
        if not heading:
            continue
        raw = extract_heading_block(heading, mode="drug")
        result[field] = extract_semantic_value(raw, field, scope="drug")
    return result

def find_ingredient_table(soup):
    heading = None
    for tag in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"]):
        n = normalize_text(heading_text(tag))
        if n in {"thành phần hoạt chất", "thành phần"}:
            heading = tag
            break

    if heading:
        # Tìm table sau heading nhưng trước heading cấp cao hơn.
        level = heading_level(heading)
        for node in heading.next_elements:
            if isinstance(node, Tag) and is_heading(node) and heading_level(node) <= level:
                break
            if isinstance(node, Tag) and node.name == "table":
                return node

    return None


def extract_ingredients(soup):
    ingredients = []
    table = find_ingredient_table(soup)
    if not table:
        return ingredients

    for row in table.find_all("tr"):
        cells = row.find_all(["td", "th"])
        if len(cells) < 2:
            continue

        name = visible_text_keep_links(cells[0])
        strength = visible_text_keep_links(cells[1])
        if not name:
            continue

        name = re.sub(r"\s+chính$", "", name, flags=re.I).strip()
        n = normalize_text(name)
        if n in {"tên hoạt chất", "hoạt chất", "tên thành phần", "thành phần"}:
            continue

        ingredient = {field: "" for field in INGREDIENT_FIELDS}
        ingredient["name"] = name
        if normalize_text(strength) in {"null", "none", "-"}:
            strength = ""
        # Một số bảng ghi '20mg Atorvastatin'; hàm lượng lưu riêng không kèm tên hoạt chất.
        strength = re.sub(r"(?i)^null(?:\s+|$)", "", strength).strip()
        strength = re.sub(rf"(?i)\s*{re.escape(name)}\s*$", "", strength).strip()
        # Chuẩn hóa dạng '12,5mg Dobutamin/ml' thành '12,5mg/ml'.
        strength = re.sub(r"(?i)(\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|g))\s+[A-Za-zÀ-ỹ-]+\s*(/\s*(?:\d+(?:[.,]\d+)?\s*)?(?:ml|g|l))", r"\1\2", strength)
        if normalize_text(strength) in {"null", "none", "n/a", "-"}:
            strength = ""
        ingredient["strength"] = clean_text(strength)
        ingredients.append(ingredient)

    return ingredients


def find_active_heading(soup, ingredient_name):
    ingredient_norm = normalize_text(ingredient_name)
    headings = soup.find_all(["h2", "h3", "h4", "h5", "h6"])

    # Ưu tiên khớp chính xác tên hoạt chất sau tiền tố.
    for tag in headings:
        n = normalize_text(heading_text(tag))
        if not n.startswith(("thông tin từ hoạt chất", "thông tin về hoạt chất")):
            continue
        suffix = re.sub(r"^thông tin (?:từ|về) hoạt chất\s*[:\-]?\s*", "", n).strip()
        if suffix == ingredient_norm:
            return tag

    # Cho phép khác biệt dấu câu/viết hoa và biến thể Cafein/Caffein.
    def key(value):
        value = normalize_text(value)
        value = value.replace("caffein", "cafein")
        return re.sub(r"[^a-z0-9]+", "", value)

    target = key(ingredient_name)
    for tag in headings:
        n = normalize_text(heading_text(tag))
        if n.startswith(("thông tin từ hoạt chất", "thông tin về hoạt chất")):
            suffix = re.sub(r"^thông tin (?:từ|về) hoạt chất\s*[:\-]?\s*", "", n).strip()
            if key(suffix) == target:
                return tag
    return None


def map_ingredient_heading(title, ingredient_name=""):
    """Nhận diện heading hoạt chất kể cả dạng 'Chỉ định Diphenhydramine'."""
    title = normalize_text(title)
    ingredient = normalize_text(ingredient_name)
    if ingredient:
        title = title.replace(ingredient, " ")
    title = re.sub(r"^thông tin (?:từ|về) hoạt chất\s*[:\-]?", "", title)
    title = re.sub(r"\s+", " ", title).strip(" :–-\t")

    # Các nhãn dài/đặc hiệu phải được xét trước nhãn ngắn.
    rules = [
        ("contraindication", ("chống chỉ định",)),
        ("side_effect", ("tác dụng không mong muốn", "tác dụng phụ")),
        ("interaction", ("tương tác thuốc", "tương tác")),
        ("dosage", ("liều lượng và cách dùng", "liều lượng - cách dùng", "liều dùng - cách dùng", "liều dùng", "liều lượng", "cách dùng")),
        ("warning", ("thận trọng lúc dùng", "thận trọng", "cảnh báo", "lưu ý")),
        ("indication", ("chỉ định",)),
        ("pharmacokinetics", ("đặc tính dược động học", "dược động học")),
        ("effect", ("đặc tính dược lực học", "dược lực học", "dược lực", "tác dụng", "công dụng")),
    ]
    for field, labels in rules:
        if any(title == label or title.startswith(label + " ") or title.endswith(" " + label) for label in labels):
            return field
    return None


def extract_active_ingredient_sections(soup, ingredients):
    """Tách nội dung hoạt chất theo nhãn ngữ nghĩa, kể cả nhãn in đậm nằm trong đoạn."""
    for ingredient in ingredients:
        active_heading = find_active_heading(soup, ingredient["name"])
        if not active_heading:
            continue

        raw = extract_heading_block(active_heading, mode="ingredient")
        _, markers = _inline_markers(raw, ingredient["name"])
        if not markers:
            # Intro kiểu 'để biết thêm thông tin... vui lòng xem' không phải dữ liệu dược lý.
            continue

        for field in ["effect", "pharmacokinetics", "indication", "dosage", "contraindication", "interaction", "side_effect", "warning"]:
            value = extract_semantic_value(raw, field, scope="ingredient", ingredient_name=ingredient["name"])
            if value:
                ingredient[field] = value

    return ingredients

def extract_strength_from_name(name):
    if not name:
        return ""
    match = re.search(
        r"\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|g|ml|%)"
        r"(?:\s*/\s*(?:\d+(?:[.,]\d+)?\s*)?(?:ml|g|l))?\b",
        name, re.I
    )
    return clean_text(match.group(0)) if match else ""


def parse_drug_page(html):
    soup = BeautifulSoup(html, "html.parser")

    # Xóa thành phần chắc chắn không phải nội dung thuốc.
    for tag in soup.find_all(["script", "style", "noscript"]):
        tag.decompose()

    h1 = soup.find("h1")
    name = clean_field(h1.get_text(" ", strip=True)) if h1 else ""
    if not name:
        title = soup.find("title")
        name = clean_field(title.get_text(" ", strip=True)) if title else ""

    strength, dosage_form, registration_number, packaging = parse_basic_info(soup)
    sections = parse_drug_sections(soup)

    # Một số trang dùng khối riêng "Công dụng [tên thuốc]" thay cho heading "Chỉ định".
    # Chỉ dùng làm fallback khi trường indication chuẩn chưa có dữ liệu.
    if not sections.get("indication"):
        indication_block = soup.find(id="cong-dung-thuoc")
        if indication_block:
            content = indication_block.select_one(".prose") or indication_block
            indication_text = visible_text(content)
            if indication_text:
                sections["indication"] = indication_text

    ingredients = extract_ingredients(soup)
    ingredients = extract_active_ingredient_sections(soup, ingredients)

    # Chuẩn hóa hàm lượng cấp thuốc nếu nguồn gắn thêm tên hoạt chất vào giá trị.
    # Chỉ áp dụng khi một hoạt chất và hai giá trị khớp rõ ràng; không gộp chế phẩm phối hợp.
    if len(ingredients) == 1 and strength:
        ingredient = ingredients[0]
        ingredient_strength = clean_field(ingredient.get("strength", ""))
        ingredient_name = clean_field(ingredient.get("name", ""))
        normalized_strength = normalize_text(strength)
        accepted = {
            normalize_text(ingredient_strength),
            normalize_text(f"{ingredient_strength} {ingredient_name}"),
            normalize_text(f"{ingredient_name} {ingredient_strength}"),
        }
        if ingredient_strength and normalized_strength in accepted:
            strength = ingredient_strength

    # Hàm lượng có thể chỉ nằm trong tên thuốc hoặc bảng thành phần.
    if not strength:
        strength = extract_strength_from_name(name)
    if not strength and ingredients:
        # Hàm lượng cấp thuốc chỉ giữ giá trị/hàm lượng, không nối lặp tên hoạt chất.
        parts = []
        for item in ingredients:
            component_strength = clean_field(item.get("strength", ""))
            component_name = clean_field(item.get("name", ""))
            if not component_strength or normalize_text(component_strength) == "null":
                continue
            if component_name:
                component_strength = re.sub(rf"(?i)\s*{re.escape(component_name)}\s*$", "", component_strength).strip()
            if component_strength and normalize_text(component_strength) not in {normalize_text(x) for x in parts}:
                parts.append(component_strength)
        strength = "; ".join(parts)

    # Một số trang chỉ công bố thông tin ở cấp thuốc; dùng làm fallback cho
    # hoạt chất còn trống, không ghi đè dữ liệu riêng đã trích xuất được.
    for ingredient in ingredients:
        if not ingredient.get("strength") and len(ingredients) == 1:
            ingredient["strength"] = strength

    drug = {
        "name": name,
        "strength": strength,
        "dosage_form": dosage_form,
        "registration_number": registration_number,
        "packaging": packaging,
        "indication": sections["indication"],
        "usage": sections["usage"],
        "contraindication": sections["contraindication"],
        "side_effect": sections["side_effect"],
        "interaction": sections["interaction"],
        "warning": sections["warning"],
        "storage": sections["storage"],
    }

    # Không sao chép mục ở cấp thuốc sang hoạt chất: hai vùng thông tin trên
    # website có ý nghĩa khác nhau. Mục nào nguồn không có thì giữ chuỗi rỗng.

    return {
        "drug": drug,
        "ingredients": ingredients,
    }


def validate_record(data):
    """Trả về cảnh báo QA riêng; không chèn metadata kiểm tra vào dữ liệu API."""
    drug = data.get("drug", {})
    warnings = []
    if not drug.get("name"):
        warnings.append("Thiếu tên thuốc")
    if not drug.get("registration_number"):
        warnings.append("Thiếu số đăng ký")
    if not data.get("ingredients"):
        warnings.append("Không tìm thấy bảng thành phần hoạt chất")
    for field, label in [
        ("indication", "chỉ định"), ("usage", "liều dùng/cách dùng"),
        ("contraindication", "chống chỉ định"), ("side_effect", "tác dụng phụ"),
        ("interaction", "tương tác thuốc"), ("warning", "cảnh báo/thận trọng"),
        ("storage", "bảo quản")
    ]:
        if not drug.get(field):
            warnings.append(f"Thiếu mục thuốc: {label} (cần xác minh nguồn có mục này hay không)")
    for i, ingredient in enumerate(data.get("ingredients", []), 1):
        if not ingredient.get("name"):
            warnings.append(f"Hoạt chất #{i} thiếu tên")
        if not ingredient.get("strength"):
            warnings.append(f"Hoạt chất {ingredient.get('name') or i} thiếu hàm lượng")
        if ingredient.get("effect") and re.search(r"(?i)dược động học|hấp thu|thải trừ|thời gian bán thải", ingredient["effect"]):
            warnings.append(f"Hoạt chất {ingredient.get('name') or i}: trường effect có dấu hiệu lẫn dược động học")
        if ingredient.get("effect") and re.search(r"(?i)tương tác thuốc|tăng độc tính|dùng đồng thời", ingredient["effect"]):
            warnings.append(f"Hoạt chất {ingredient.get('name') or i}: trường effect có dấu hiệu lẫn tương tác thuốc")
        if ingredient.get("pharmacokinetics") and re.search(r"(?i)chống chỉ định|liều dùng|tương tác thuốc", ingredient["pharmacokinetics"]):
            warnings.append(f"Hoạt chất {ingredient.get('name') or i}: trường pharmacokinetics có dấu hiệu lẫn mục khác")
    # Không tự sửa mâu thuẫn liều dùng giữa cấp thuốc và hoạt chất; chỉ cảnh báo để người duyệt đối chiếu.
    if drug.get("usage"):
        for ingredient in data.get("ingredients", []):
            dosage = ingredient.get("dosage", "")
            if dosage and normalize_text(dosage) != normalize_text(drug["usage"]):
                if re.search(r"(?i)tối đa|không quá|max", drug["usage"]) and re.search(r"(?i)tối đa|không quá|max", dosage):
                    warnings.append(f"Có thể có khác biệt liều tối đa giữa mục thuốc và hoạt chất {ingredient.get('name', '')}; cần đối chiếu nguyên văn nguồn")
    return warnings


def post_process_drug(data):
    drug = data.get("drug", {})
    for key in DRUG_FIELDS:
        drug[key] = clean_field(drug.get(key, ""))

    for ingredient in data.get("ingredients", []):
        for key in INGREDIENT_FIELDS:
            ingredient[key] = clean_field(ingredient.get(key, ""))

    return data


def save_json(data, output_file):
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def main():
    input_file = Path(INPUT_HTML)
    output_file = Path(OUTPUT_JSON)

    if not input_file.exists():
        print(f"Không tìm thấy file: {INPUT_HTML}")
        sys.exit(1)

    html = input_file.read_text(encoding="utf-8")
    drug = post_process_drug(parse_drug_page(html))
    save_json([drug], output_file)

    print(f"Đã tạo: {output_file}")
    print(json.dumps(drug, ensure_ascii=False, indent=4))
    warnings = validate_record(drug)
    if warnings:
        print("\nCẢNH BÁO QA — cần đối chiếu trang nguồn:")
        for warning in warnings:
            print(f"- {warning}")


if __name__ == "__main__":
    main()
