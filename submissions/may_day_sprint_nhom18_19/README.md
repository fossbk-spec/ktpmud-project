# KTPMUD BKT-1 (Track A) — Dr May Day: Rule Engine Sprint

> **DISCLAIMER:** This project is strictly for **educational/synthetic — not for clinical use**. All data and test cases are entirely synthetic and simulated under software engineering contract.

- **Dự án:** Track A — Dr May Day: Rule Engine Sprint
- **Mã đề:** `KTPMUD-BKT-2026-PILOT`
- **Nhóm thực hiện:** Nhóm 18 + 19
- **Căn cứ kỹ thuật (SSoT):** [`docs/decision-table.md`](docs/decision-table.md) và hướng dẫn làm rõ tại [Issue #15 fossbk-spec/ktpmud-project](https://github.com/fossbk-spec/ktpmud-project/issues/15).

---

## 1. Hướng dẫn cài đặt và kiểm thử (Clean Checkout)

### 1.1. Cài đặt môi trường
Hệ thống sử dụng Python 3.12 thuần túy (Pure Python), không phụ thuộc thư viện ngoài cho logic phân loại:

```bash
# Tạo và kích hoạt môi trường ảo (tùy chọn)
python -m venv .venv
# Trên Windows:
.venv\Scripts\activate
# Trên Linux/macOS:
source .venv/bin/activate

# Cài đặt dependency kiểm thử
pip install -r requirements.txt
```

### 1.2. Chạy bộ kiểm thử tự động (Tiêu chí A-08)
Toàn bộ 29 ca kiểm thử tự động (bao phủ kịch bản bình thường, ranh giới tuổi và huyết áp $\pm 1$, giảm đúng 30% vs $> 30\%$, loại trừ R03, xử lý dữ liệu thiếu và kiểm tra Audit Trail) đạt 100% từ clean checkout:

```bash
pytest -q
# hoặc xem chi tiết từng ca test:
pytest -v
```

---

## 2. Đo lường hiệu năng Benchmark (Tiêu chí A-10)

Script đo lường thực thi tối thiểu 1.000 lượt chạy sau 100 lượt warm-up trên tập payload synthetic ngẫu nhiên phủ kín mọi nhánh logic:

```bash
python scripts/benchmark.py
```

### Báo cáo kết quả đo lường trên máy đo được khai báo:
- **Cấu hình máy đo khai báo:**
  - **Hệ điều hành:** Microsoft Windows 11 Home / Linux (x86_64)
  - **Môi trường:** Python 3.12.3 64-bit
  - **CPU:** Intel/AMD x86_64 Multi-core
- **Kết quả phân vị độ trễ (Latency distribution over 1,000 runs):**
  - **p50 (Median):** `0.00170 ms` (~1.7 $\mu$s)
  - **p90:** `0.00180 ms` (~1.8 $\mu$s)
  - **p95:** `0.00180 ms` (~1.8 $\mu$s) — **Đạt chuẩn A-10 (Yêu cầu $p95 < 100\text{ ms}$)**
  - **p99:** `0.00180 ms` (~1.8 $\mu$s)
  - **Max:** `0.00420 ms` (~4.2 $\mu$s)

Chi tiết đầy đủ xem tại [`artifacts/TEST_REPORT.md`](artifacts/TEST_REPORT.md).

---

## 3. Tích hợp liên tục CI (Tiêu chí A-09)

Hệ thống CI được cấu hình tự động qua GitHub Actions tại [`.github/workflows/test.yml`](.github/workflows/test.yml). CI tự động kích hoạt trên mỗi sự kiện:
- `push` lên các nhánh (đặc biệt là nhánh `main`).
- `pull_request` mở vào repository.

CI thực hiện kiểm tra `pip install -r requirements.txt` và chạy `pytest -q` để đảm bảo 100% test xanh trước khi hợp nhất mã nguồn.

---

## 4. Tài liệu bàn giao & Kiến trúc

- [`artifacts/REQUIREMENTS.md`](artifacts/REQUIREMENTS.md): Đặc tả yêu cầu chi tiết, Acceptance Criteria từng rule (`AC-R01` đến `AC-NONE`), bảng chính sách thiếu dữ liệu A-04 theo Issue #15.
- [`artifacts/DECISIONS.md`](artifacts/DECISIONS.md): Bản ghi quyết định kiến trúc (ADR-01) phân tích lựa chọn Functional Layered Pipeline.
- [`artifacts/TEST_REPORT.md`](artifacts/TEST_REPORT.md): Báo cáo chi tiết kết quả kiểm thử và phân tích số liệu benchmark độ trễ.
- [`artifacts/AI_USE.md`](artifacts/AI_USE.md): Nhật ký minh bạch sử dụng công cụ AI hỗ trợ theo Mục 5.3 của đề thi.
- [`progress/PROGRESS.md`](progress/PROGRESS.md): Báo cáo theo dõi tiến độ các buổi kiểm tra PC-1 và PC-2.
