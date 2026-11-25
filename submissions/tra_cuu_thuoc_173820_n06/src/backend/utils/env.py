import os
from dotenv import load_dotenv

load_dotenv()


def check_environment():
    """Kiểm tra cấu hình tối thiểu. Hệ thống chạy hoàn toàn local (PaddleOCR + Ollama/Qwen),
    không cần khóa API bên ngoài."""
    base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").strip()
    model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b").strip()
    if not base_url or not model:
        raise EnvironmentError("OLLAMA_BASE_URL và OLLAMA_MODEL không được để trống.")
    return True
