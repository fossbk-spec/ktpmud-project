"""Ollama explanation service.

The LLM receives only interactions already verified by drug_interaction_service
against the local database. It never decides whether a pair interacts.
"""
from __future__ import annotations

import json
import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()


def _ollama_generate(prompt: str) -> str:
    base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b").strip()
    timeout = int(os.getenv("OLLAMA_EXPLAIN_TIMEOUT", "180"))
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Bạn là trợ lý giải thích dữ liệu tương tác thuốc. "
                    "Chỉ diễn giải dữ liệu được cung cấp, không tự bổ sung kiến thức."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "stream": False,
        "options": {"temperature": 0.1, "num_ctx": 8192},
    }

    last_error = None
    for attempt in range(2):
        try:
            response = requests.post(
                f"{base_url}/api/chat",
                json=payload,
                timeout=(10, timeout),
            )
            response.raise_for_status()
            data = response.json()
            text = data.get("message", {}).get("content", "").strip()
            if not text:
                raise ValueError("Ollama không trả về nội dung giải thích.")
            return text
        except (requests.exceptions.RequestException, ValueError) as exc:
            last_error = exc
            if attempt == 0 and isinstance(exc, requests.exceptions.RequestException):
                time.sleep(1)
                continue
            break

    raise RuntimeError(f"Không tạo được giải thích bằng Ollama: {last_error}") from last_error


def explain_drug_interactions(interaction_result):
    """Explain only verified DB records; missing pairs are never called safe."""
    status = interaction_result.get("status")
    interactions = interaction_result.get("interactions", []) or []
    unverified_pairs = interaction_result.get("unverified_pairs", []) or []

    if status == "unavailable":
        return {
            "status": "unavailable",
            "explanation": interaction_result.get("message")
            or "Không thể thực hiện phân tích tương tác thuốc.",
            "source_based": True,
        }

    if not interactions:
        return {
            "status": "no_verified_interactions",
            "explanation": (
                "Không tìm thấy cặp nào trong danh mục tương tác hiện có của hệ thống "
                "(danh mục này chỉ gồm các tương tác đã được nạp từ nguồn chính thức). "
                "Điều này không có nghĩa là các thuốc chắc chắn an toàn khi dùng cùng nhau."
            ),
            "source_based": True,
        }

    verified_data = []
    for item in interactions:
        verified_data.append({
            "ingredient_a": item.get("ingredient_a"),
            "ingredient_b": item.get("ingredient_b"),
            "severity": item.get("severity"),
            "description": item.get("description"),
            "recommendation": item.get("recommendation"),
            "source": item.get("source"),
        })

    prompt = f"""
Giải thích bằng tiếng Việt, dễ hiểu, ngắn gọn, dựa đúng dữ liệu backend đã xác minh bên dưới.

QUY TẮC BẮT BUỘC:
1. Chỉ nói về các cặp hoạt chất trong dữ liệu đã xác minh.
2. Không tự thêm tương tác, triệu chứng, hậu quả, mức độ hoặc nguồn.
3. Không thay đổi ý nghĩa khuyến cáo của nguồn.
4. Nếu trường mô tả/khuyến cáo/nguồn trống, nói rõ dữ liệu không cung cấp.
5. Không kết luận các cặp chưa xác minh là an toàn.
6. Không thay thế đánh giá của bác sĩ hoặc dược sĩ.
7. Phân biệt dữ liệu nguồn và phần diễn giải.

DỮ LIỆU TƯƠNG TÁC ĐÃ XÁC MINH:
{json.dumps(verified_data, ensure_ascii=False)}

SỐ CẶP CHƯA XÁC MINH: {len(unverified_pairs)}

Hãy nêu từng cặp hoạt chất, mức độ (nếu có), mô tả, khuyến cáo và nguồn đúng như dữ liệu.
Nhắc người đọc rằng các cặp chưa xác minh không thể được xem là an toàn.
"""

    explanation = _ollama_generate(prompt)
    return {
        "status": "generated",
        "explanation": explanation,
        "source_based": True,
    }
