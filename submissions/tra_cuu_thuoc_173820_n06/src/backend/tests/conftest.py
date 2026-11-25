import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
# Test không phụ thuộc DB thật hay Ollama.
os.environ.setdefault("DRUG_DB_PATH", "off")
os.environ.setdefault("OCR_INCLUDE_RAW_TEXT", "0")
