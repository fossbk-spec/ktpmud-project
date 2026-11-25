"""Dựng lại hàng/cột từ kết quả OCR có tọa độ.

PaddleOCR trả từng dòng chữ riêng lẻ theo thứ tự nó tự chọn. Với đơn thuốc dạng bảng, cột phải
("30 viên") nằm CÙNG hàng với tên thuốc nhưng thường được đọc trước hoặc sau cả cụm dòng, làm số
lượng rơi nhầm sang thuốc khác. Module này gom các ô cùng hàng (có bù độ nghiêng của ảnh chụp)
và nối chúng bằng ký tự tab để các bước sau thấy "tên thuốc <tab> 30 viên" trên một dòng.

Thuần Python, không phụ thuộc PaddleOCR nên kiểm thử được độc lập.
"""
from __future__ import annotations

import math
import re
import statistics
from typing import Any, Iterable

# Mỗi phần tử: (text, score, box). box có thể là polygon 4 điểm, [x0, y0, x1, y1] hoặc None.
OcrItem = tuple[str, Any, Any]


class _Cell:
    __slots__ = ("text", "cx", "cy", "left", "right", "height")

    def __init__(self, text: str, cx: float, cy: float, left: float, right: float, height: float):
        self.text, self.cx, self.cy = text, cx, cy
        self.left, self.right, self.height = left, right, height


def _points(box: Any) -> list[tuple[float, float]] | None:
    if box is None:
        return None
    if hasattr(box, "tolist"):
        box = box.tolist()
    try:
        flat = list(box)
    except TypeError:
        return None
    if len(flat) == 4 and all(isinstance(v, (int, float)) for v in flat):
        x0, y0, x1, y1 = (float(v) for v in flat)
        return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    pts: list[tuple[float, float]] = []
    for point in flat:
        if hasattr(point, "tolist"):
            point = point.tolist()
        try:
            pts.append((float(point[0]), float(point[1])))
        except (TypeError, ValueError, IndexError, KeyError):
            return None
    return pts if len(pts) >= 4 else None


def _cell(text: str, box: Any) -> _Cell | None:
    pts = _points(box)
    if not pts:
        return None
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    if len(pts) == 4:
        height = (math.dist(pts[0], pts[3]) + math.dist(pts[1], pts[2])) / 2
    else:
        height = max(ys) - min(ys)
    return _Cell(
        text=text,
        cx=(min(xs) + max(xs)) / 2,
        cy=(min(ys) + max(ys)) / 2,
        left=min(xs),
        right=max(xs),
        height=max(height, 1.0),
    )


def _best_slope(cells: list[_Cell], bin_width: float) -> float:
    """Độ dốc (dy/dx) làm các hàng chữ thẳng nhất, tìm theo profile chiếu trong khoảng ±6°."""

    def sharpness(slope: float) -> float:
        bins: dict[int, float] = {}
        for c in cells:
            key = int(round((c.cy - slope * c.cx) / bin_width))
            bins[key] = bins.get(key, 0.0) + len(c.text)
        return sum(v * v for v in bins.values())

    best_slope, best_score = 0.0, sharpness(0.0)
    steps = 48
    for i in range(-steps, steps + 1):
        slope = i * 0.105 / steps  # ~ ±6°
        score = sharpness(slope)
        if score > best_score * 1.02:
            best_slope, best_score = slope, score
    return best_slope


_ANCHOR_CELL = re.compile(r"^\s*(\d{1,2})\s*[.)](?:\s*\S|\s*$)")
_NUMBER_CELL = re.compile(r"^\s*\d{1,4}\s*$")
_UNIT_CELL = re.compile(r"^\s*(viên|vien|gói|goi|ống|ong|chai|lọ|lo|tuýp|tuyp|hộp|hop|vỉ|vi)\s*$", re.I)


def _snap_quantity_cells(cells: list[_Cell], slope: float, median_height: float) -> None:
    """Gán ô số lượng/đơn vị ở cột phải về đúng hàng của thuốc (hàng bắt đầu bằng "n.").

    Ảnh chụp nghiêng/cong làm cột phải lệch so với cột trái, nên chỉ nhóm theo tọa độ y dễ đẩy
    "60 Viên" sang dòng cách dùng của thuốc trên. Cách này không phụ thuộc độ lệch: các ô số lượng
    trong cột phải và các hàng thuốc đều xếp từ trên xuống, nên khi số lượng khớp nhau thì ghép
    theo thứ tự; nếu không khớp thì ghép với hàng thuốc gần nhất (trong ngưỡng).
    """
    anchors = sorted(
        (c for c in cells if _ANCHOR_CELL.match(c.text)), key=lambda c: c.cy - slope * c.cx
    )
    if len(anchors) < 2:
        return

    left = min(c.left for c in cells)
    right = max(c.right for c in cells)
    column_start = left + 0.62 * (right - left)
    top = anchors[0].cy - slope * anchors[0].cx - median_height
    bottom = anchors[-1].cy - slope * anchors[-1].cx + 6 * median_height

    def y_of(c: _Cell) -> float:
        return c.cy - slope * c.cx

    in_column = [
        c for c in cells
        if c.cx >= column_start and top <= y_of(c) <= bottom
        and (_NUMBER_CELL.match(c.text) or _UNIT_CELL.match(c.text))
    ]
    numbers = sorted((c for c in in_column if _NUMBER_CELL.match(c.text)), key=y_of)
    units = [c for c in in_column if _UNIT_CELL.match(c.text)]
    anchor_y = [y_of(a) for a in anchors]

    owner: dict[int, int] = {}  # id(ô số) -> chỉ số hàng thuốc

    if len(numbers) == len(anchors):
        for idx, cell in enumerate(numbers):
            owner[id(cell)] = idx
    else:
        for cell in numbers:
            dists = [abs(y_of(cell) - y) for y in anchor_y]
            best = min(range(len(dists)), key=dists.__getitem__)
            if dists[best] <= 1.5 * median_height:
                owner[id(cell)] = best

    # Ghép đơn vị với ô số NẰM CẠNH nó (so y gốc, trước khi dịch chuyển), rồi mới dịch cả cặp về hàng thuốc.
    raw_y = {id(n): n.cy for n in numbers}
    unit_owner: dict[int, _Cell] = {}

    for unit in units:
        near = [n for n in numbers if id(n) in owner]
        if not near:
            continue
        nearest = min(near, key=lambda n: abs(raw_y[id(n)] - unit.cy))
        if abs(raw_y[id(nearest)] - unit.cy) <= 2.0 * median_height:
            unit_owner[id(unit)] = nearest

    for cell in numbers:
        if id(cell) in owner:
            cell.cy = anchor_y[owner[id(cell)]] + slope * cell.cx

    for unit in units:
        number = unit_owner.get(id(unit))
        if number is not None:
            unit.cy = number.cy


def rows_from_items(items: Iterable[OcrItem], column_gap_factor: float = 1.2) -> list[str] | None:
    """Danh sách hàng đã nối ô bằng tab; None nếu không đủ tọa độ (để gọi lại cách cũ)."""
    items = [it for it in items if it[0] and str(it[0]).strip()]
    if not items:
        return None

    cells = [c for c in (_cell(str(t).strip(), b) for t, _s, b in items) if c]
    if len(cells) < max(2, int(0.6 * len(items))):
        return None

    median_height = max(statistics.median(c.height for c in cells), 8.0)
    slope = _best_slope(cells, bin_width=max(2.0, median_height * 0.5))
    _snap_quantity_cells(cells, slope, median_height)

    ordered = sorted(cells, key=lambda c: c.cy - slope * c.cx)
    tolerance = 0.5 * median_height

    rows: list[list[_Cell]] = []
    row_y: list[float] = []
    for cell in ordered:
        y = cell.cy - slope * cell.cx
        if rows and abs(y - row_y[-1]) <= tolerance:
            rows[-1].append(cell)
            row_y[-1] = sum(c.cy - slope * c.cx for c in rows[-1]) / len(rows[-1])
        else:
            rows.append([cell])
            row_y.append(y)

    lines: list[str] = []
    for row in rows:
        row.sort(key=lambda c: c.cx)
        parts = [row[0].text]
        for prev, cur in zip(row, row[1:]):
            gap = cur.left - prev.right
            parts.append("\t" if gap > column_gap_factor * median_height else " ")
            parts.append(cur.text)
        lines.append("".join(parts))
    return lines
