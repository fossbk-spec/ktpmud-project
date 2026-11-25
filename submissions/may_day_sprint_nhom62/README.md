# KTPMUD BKT-1 (Track A) — Dr May Day: Rule Engine Sprint

> **DISCLAIMER:** This project is strictly for **educational/synthetic — not for clinical use**. All data and test cases are entirely synthetic and simulated under software engineering contract.

- **Dự án:** Track A — Dr May Day: Rule Engine Sprint
- **Nhóm thực hiện:** Nhóm 62 (`nhom62`)
- **Repository mã nguồn:** [`thaihop06/ktpmud-bkt-ruleengine-starter`](https://github.com/thaihop06/ktpmud-bkt-ruleengine-starter) (nhánh `develop` · tag `bkt-2026-nhom62-rc1`)
- **Căn cứ kỹ thuật (SSoT):** [`docs/decision-table.md`](docs/decision-table.md) và hướng dẫn làm rõ tại [Issue #15 fossbk-spec/ktpmud-project](https://github.com/fossbk-spec/ktpmud-project/issues/15).

---

## 1. Hướng dẫn cài đặt và kiểm thử (Clean Checkout)

### 1.1. Cài đặt môi trường
Hệ thống sử dụng Python 3.10+ thuần túy (Pure Python), không phụ thuộc thư viện ngoài cho logic phân loại lõi trong `rule_engine/classifier.py`:

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

### 1.2. Chạy bộ kiểm thử tự động
Toàn bộ **66 lượt kiểm thử tự động** (`TC01–TC60` parametrized — bao phủ phân loại 2 tầng `R-SOC > R01-PV > R02-PV > R03-PV`, ranh giới tuổi `0..120` và HATT `1..300`, tính giảm > 30% HATT nền bằng số nguyên `10 * HATT < 7 * NEN`, chống `OverflowError`, nguyên tắc Không hạ mức *No-Downgrade*, lọc trắng Zero-PII, Audit Trail 4 trường và hàm Oracle duyệt 64 tổ hợp cờ boolean) đạt **100% PASSED** từ clean checkout:

```bash
pytest -q
# hoặc xem chi tiết từng ca test:
pytest -v
```

### 1.3. Chạy minh họa (Demo)
```bash
# Minh họa dòng lệnh (CLI)
python demo.py
```
- **Giao diện web minh họa:** Mở trực tiếp file `dr_may_day_demo.html` trên trình duyệt.

---

## 2. Đo lường hiệu năng Benchmark

Script đo lường thực thi **1.000 lượt chạy sau 100 lượt warm-up** trên tập payload synthetic phủ các nhánh logic:

```bash
python benchmarks/run_benchmark.py
```

### Báo cáo kết quả đo lường:
- **Môi trường đo:** Python 3.10+ 64-bit (Windows 11 / GitHub Actions Ubuntu x86_64)
- **Kết quả phân vị độ trễ (1.000 lượt chạy):**
  - **p50 (Median):** `~ 0.005 ms`
  - **p95:** `~ 0.015 ms` — **Đạt chuẩn (Yêu cầu `p95 < 100 ms`)**

Chi tiết đầy đủ xem tại [`TEST_REPORT.md`](TEST_REPORT.md) và [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md).

---

## 3. Tích hợp liên tục CI

Hệ thống CI được cấu hình tự động qua GitHub Actions tại [`.github/workflows/test.yml`](.github/workflows/test.yml). CI tự động kích hoạt trên mỗi sự kiện:
- `push` lên nhánh `develop` / `main`.
- `pull_request` mở vào repository.

CI thực hiện cài đặt `pip install -r requirements.txt` và chạy `pytest -q` để đảm bảo 100% kiểm thử xanh trước khi đóng băng và nộp bài.

---

## 4. Tài liệu bàn giao & Kiến trúc

- [`REQUIREMENTS.md`](REQUIREMENTS.md): Đặc tả yêu cầu chi tiết, thứ tự ưu tiên `R-SOC > R01-PV > R02-PV > R03-PV` và nguyên tắc Không hạ mức theo Issue #15.
- [`docs/acceptance-criteria.md`](docs/acceptance-criteria.md): 26 tiêu chí nghiệm thu (`AC01–AC26`) ánh xạ đầy đủ tới `A-01..A-11`.
- [`docs/decision-table.md`](docs/decision-table.md): Bảng quyết định chi tiết cho Rule Engine 2 tầng.
- [`docs/adr/ADR-001-rule-based-engine.md`](docs/adr/ADR-001-rule-based-engine.md): Bản ghi quyết định kiến trúc phân tích đánh đổi giữa an toàn Zero-PII (Whitelist Sanitization) và rủi ro hạ mức lâm sàng.
- [`TEST_REPORT.md`](TEST_REPORT.md) & [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md): Báo cáo chi tiết kết quả 66/66 lượt kiểm thử và số liệu benchmark độ trễ.
- [`SECURITY_PRIVACY_CHECKLIST.md`](SECURITY_PRIVACY_CHECKLIST.md): Rà soát an toàn thông tin, lọc trắng 9 trường Zero-PII và Audit Trail 4 trường `[Timestamp, User_UUID, Action_Type, Status]`.
- [`AI_USE.md`](AI_USE.md): Nhật ký minh bạch sử dụng công cụ AI hỗ trợ.
- [`CONTRIBUTIONS.md`](CONTRIBUTIONS.md): Bảng phân công và xác nhận đóng góp của các thành viên (`thaihop06`, `huyvanle04112006`).
- [`progress/PROGRESS.md`](progress/PROGRESS.md): Báo cáo tiến độ PC-1, PC-2, Freeze và bảng đối chiếu `A-01..A-11`.
