# BKT Rule Engine — Nhóm 11 (Track A: Dr May Day)

> **DISCLAIMER:** Sản phẩm phục vụ học tập/nghiên cứu với dữ liệu giả lập (synthetic data) — **NOT FOR CLINICAL USE**.

---

## 1. Giới thiệu sản phẩm
Hệ thống **Rule Engine** hỗ trợ cấp cứu y tế, tự động phân loại nguy cơ phản vệ và sốc phản vệ theo **Bảng quyết định WAO/EAACI V1**, tuân thủ nguyên tắc **Zero PII** (không nhận và không lưu trữ thông tin định danh cá nhân) và có khả năng giải thích rõ ràng (Explainable).

- **Mã bài thi:** BKT-1 (Track A — Dr May Day: Rule Engine Sprint)
- **Nhóm thực hiện:** Nhóm 11
- **Kho mã nguồn hoàn chỉnh:** [https://github.com/phg-nam/ktpmud-bkt-ruleengine-starter](https://github.com/phg-nam/ktpmud-bkt-ruleengine-starter)

---

## 2. Kết quả kiểm thử & Hiệu năng
- **Kiểm thử tự động:** Đạt **61/61 test cases passed** (100%), bao phủ toàn diện 45 Acceptance Criteria (AC-01 đến AC-45) bao gồm các ca bình thường, ca biên sốc, ca chuyển đổi ranh giới tuổi kề nhau (0.99 vs 1.0, 10.9 vs 11.0, 17.9 vs 18.0) và ca xử lý input lỗi/thiếu theo policy không hạ mức.
- **Benchmark độ trễ:** Đo liên tục 5.000 lượt với `time.perf_counter()`, kết quả phân vị $p50 = 0.0015\text{ ms}$, **$p95 = 0.0021\text{ ms} \ll 100\text{ ms}$** (đạt xuất sắc tiêu chí đề bài).

---

## 3. Cài đặt và Chạy thử nghiệm từ Clean Checkout
Yêu cầu môi trường: Python 3.9+ (đã kiểm tra trên Python 3.13 Windows x64).

```bash
# 1. Clone repo fork chứa mã nguồn
git clone https://github.com/phg-nam/ktpmud-bkt-ruleengine-starter.git
cd ktpmud-bkt-ruleengine-starter

# 2. Tạo môi trường ảo và cài đặt thư viện
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# 3. Chạy toàn bộ 61 test cases
pytest -q

# 4. Chạy đo benchmark hiệu năng
python benchmark.py
```

---

## 4. Hồ sơ kỹ thuật bài nộp (Thư mục `artifacts/`)
- `REQUIREMENTS.md`: Đặc tả yêu cầu chức năng (FR-01..10), phi chức năng (NFR-01..06), chính sách xử lý input lỗi và danh sách 45 AC.
- `DECISIONS.md`: 4 nhật ký quyết định kiến trúc (ADR-001 tách hàm thuần, ADR-002 ưu tiên R01>R02>R03, ADR-003 policy lỗi, ADR-004 audit trail).
- `TEST_REPORT.md`: Báo cáo chi tiết kết quả test tự động và số liệu đo đạc cấu hình máy.
- `SECURITY_PRIVACY_CHECKLIST.md`: Bằng chứng tuân thủ bảo mật Zero PII.
- `AI_USE.md`: Bản khai báo minh bạch việc sử dụng công cụ AI theo chính sách `ai-allowed`.
- `CONTRIBUTIONS.md`: Phân công nhiệm vụ theo vai trò của các thành viên (202414275 - Lead, 202414072 - QA, 202414215 - BE).
