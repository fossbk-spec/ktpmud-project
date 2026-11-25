
"""Local OCR adapter for PaddleOCR 3.x and legacy 2.x.

The OCR engine is loaded lazily once per worker.
No cloud OCR API is used.
"""

from __future__ import annotations

import inspect
import json
import os
import threading
from functools import lru_cache
from pathlib import Path
from typing import Any


class LocalOCRError(RuntimeError):
    pass


_INFERENCE_LOCK = threading.Lock()


def _supported_kwargs(callable_obj, candidates: dict[str, Any]) -> dict[str, Any]:
    """Pass supported options, including options accepted through **kwargs."""
    try:
        signature = inspect.signature(callable_obj)
        parameters = signature.parameters

        accepts_kwargs = any(
            param.kind == inspect.Parameter.VAR_KEYWORD
            for param in parameters.values()
        )

        return {
            key: value
            for key, value in candidates.items()
            if key in parameters or accepts_kwargs
        }

    except (TypeError, ValueError):
        return candidates



@lru_cache(maxsize=1)
def _get_engine():
    try:
        from paddleocr import PaddleOCR
        import paddleocr
    except ImportError as exc:
        raise LocalOCRError(
            "Chưa cài PaddleOCR/PaddlePaddle. "
            "Hãy kiểm tra môi trường .venv312."
        ) from exc

    language = os.getenv("OCR_LANG", "vi").strip() or "vi"
    device = os.getenv("OCR_DEVICE", "cpu").strip() or "cpu"

    # Cho phép chọn PP-OCRv5 hoặc PP-OCRv6
    ocr_version = os.getenv(
        "OCR_VERSION", "PP-OCRv6"
    ).strip()

    options = {
        "lang": language,
        "ocr_version": ocr_version,
        "device": device,

        "use_textline_orientation": False,
        "use_doc_orientation_classify": False,
        "use_doc_unwarping": False,

        "enable_mkldnn": True,
        "cpu_threads": 4,
    }

    kwargs = _supported_kwargs(
        PaddleOCR.__init__,
        options,
    )

    print("\n========== OCR CONFIG ==========")
    print("PaddleOCR version:", paddleocr.__version__)
    print("Language:", language)
    print("OCR version:", ocr_version)
    print("Device:", device)
    print("Actual kwargs:", kwargs)
    print("================================\n")

    try:
        return PaddleOCR(**kwargs)
    except Exception as exc:
        raise LocalOCRError(
            f"Không khởi tạo được PaddleOCR: {exc}"
        ) from exc



def _to_text_lines(
    result: Any,
    boxes_out: list | None = None,
) -> list[tuple[str, float | None]]:
    """Normalize PaddleOCR 2.x/3.x output into [(text, confidence)].

    Nếu truyền boxes_out, mỗi dòng được giữ lại sẽ có một phần tử tọa độ tương ứng
    (polygon/hộp hoặc None) được thêm vào danh sách này.
    """

    lines: list[tuple[str, float | None]] = []

    def add(text: Any, score: Any = None, box: Any = None):
        if text is None:
            return

        value = str(text).strip()

        if not value:
            return

        try:
            confidence = float(score) if score is not None else None
        except (TypeError, ValueError):
            confidence = None

        lines.append((value, confidence))

        if boxes_out is not None:
            boxes_out.append(box)

    def walk(item: Any):
        if item is None:
            return

        # PaddleOCR 3.x result object may expose json property.
        if hasattr(item, "json"):
            try:
                nested = item.json

                if callable(nested):
                    nested = nested()

                if isinstance(nested, str):
                    nested = json.loads(nested)

                walk(nested)
                return
            except Exception:
                pass

        if isinstance(item, dict) or hasattr(item, "get"):
            texts = item.get("rec_texts")
            scores = item.get("rec_scores")

            if texts is not None:
                polys = None

                for key in ("rec_polys", "rec_boxes", "dt_polys"):
                    candidate_boxes = item.get(key)

                    if candidate_boxes is not None and len(candidate_boxes) == len(texts):
                        polys = candidate_boxes
                        break

                for index, text in enumerate(texts):
                    score = (
                        scores[index]
                        if scores is not None and index < len(scores)
                        else None
                    )
                    add(
                        text,
                        score,
                        polys[index] if polys is not None else None,
                    )

                return

            for key in ("res", "result", "data"):
                nested = item.get(key)

                if nested is not None:
                    walk(nested)
                    return

        if isinstance(item, (list, tuple)):
            # PaddleOCR 2.x format:
            # [box, (recognized_text, confidence)]
            if (
                len(item) >= 2
                and isinstance(item[1], (list, tuple))
                and item[1]
                and isinstance(item[1][0], (str, bytes))
            ):
                candidate = item[1]

                text = candidate[0]

                if isinstance(text, bytes):
                    text = text.decode("utf-8", errors="replace")

                add(
                    text,
                    candidate[1] if len(candidate) > 1 else None,
                    item[0],
                )
                return

            for child in item:
                walk(child)

    walk(result)

    return lines


def extract_text_from_image(image: Any) -> str:
    """Run PaddleOCR on an image path or an OpenCV/numpy image."""

    if isinstance(image, (str, Path)):
        image_path = Path(image)

        if not image_path.is_file():
            raise LocalOCRError(
                f"Không tìm thấy ảnh để OCR: {image}"
            )

        image = str(image_path)

    engine = _get_engine()

    try:
        with _INFERENCE_LOCK:
            # PaddleOCR 3.x
            predict = getattr(engine, "predict", None)

            if callable(predict):
                result = predict(input=image)

            else:
                # PaddleOCR 2.x
                ocr = getattr(engine, "ocr", None)

                if not callable(ocr):
                    raise LocalOCRError(
                        "Phiên bản PaddleOCR hiện tại "
                        "không có predict() hoặc ocr()."
                    )

                try:
                    result = ocr(image, cls=True)
                except TypeError:
                    result = ocr(image)

        threshold = float(
            os.getenv("OCR_MIN_CONFIDENCE", "0.30")
        )

        boxes: list = []
        normalized = _to_text_lines(result, boxes)

        accepted_items = [
            (text, score, box)
            for (text, score), box in zip(normalized, boxes)
            if score is None or score >= threshold
        ]

        text = ""

        # Gom các ô cùng hàng (có bù độ nghiêng) để số lượng/đơn vị ở cột phải nằm cùng dòng với
        # tên thuốc. Thiếu tọa độ hoặc lỗi thì dùng cách cũ. Tắt bằng OCR_LAYOUT_ROWS=0.
        if os.getenv("OCR_LAYOUT_ROWS", "1").strip() == "1":
            try:
                from .layout_service import rows_from_items
            except ImportError:
                from layout_service import rows_from_items

            try:
                rows = rows_from_items(accepted_items)
            except Exception as exc:
                print(f"[OCR] Bỏ qua dựng hàng/cột: {exc}", flush=True)
                rows = None

            if rows:
                text = "\n".join(rows).strip()

        if not text:
            text = "\n".join(item[0] for item in accepted_items).strip()

        if not text:
            raise LocalOCRError(
                "PaddleOCR không đọc được chữ trong ảnh. "
                "Hãy chụp rõ hơn, đủ sáng và đặt ảnh thẳng."
            )

        return text

    except LocalOCRError:
        raise

    except Exception as exc:
        raise LocalOCRError(
            f"Lỗi khi chạy PaddleOCR: {exc}"
        ) from exc


def _prepare_image(image: Any) -> Any:
    """Phóng to ảnh nhỏ trước khi OCR. Chữ quá nhỏ là nguyên nhân chính khiến OCR sai chính tả.

    Chỉ phóng to (không làm mờ/nhị phân hóa) để không làm hỏng chữ. Tắt bằng OCR_UPSCALE=0;
    chỉnh ngưỡng bằng OCR_MIN_LONG_SIDE (px cạnh dài, mặc định 1600).
    """
    if os.getenv("OCR_UPSCALE", "1").strip() != "1":
        return image

    import cv2

    try:
        min_long_side = int(os.getenv("OCR_MIN_LONG_SIDE", "1600"))
    except ValueError:
        min_long_side = 1600

    height, width = image.shape[:2]
    long_side = max(height, width)

    if long_side >= min_long_side:
        return image

    scale = min_long_side / long_side

    return cv2.resize(
        image,
        None,
        fx=scale,
        fy=scale,
        interpolation=cv2.INTER_CUBIC,
    )


def extract_text_from_bytes(image_bytes: bytes) -> str:
    """Decode uploaded image bytes and run local OCR."""

    try:
        import cv2
        import numpy as np
    except ImportError as exc:
        raise LocalOCRError(
            "Thiếu OpenCV hoặc NumPy để đọc ảnh."
        ) from exc

    if not image_bytes:
        raise LocalOCRError("Ảnh tải lên rỗng.")

    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8,
    )

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR,
    )

    if image is None:
        raise LocalOCRError(
            "File tải lên không phải ảnh hợp lệ hoặc ảnh bị hỏng."
        )

    return extract_text_from_image(_prepare_image(image))
