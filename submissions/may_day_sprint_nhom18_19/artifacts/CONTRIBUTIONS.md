# BÁO CÁO PHÂN CÔNG & ĐÓNG GÓP THÀNH VIÊN (CONTRIBUTIONS REPORT)

- **Dự án:** Track A — Dr May Day: Rule Engine Sprint
- **Mã đề:** `KTPMUD-BKT-2026-PILOT`
- **Nhóm thực hiện:** Nhóm 18 + 19
- **Căn cứ đánh giá:** Mục 6 và Rubric Mục 9 (Maintainability, handoff và đánh giá đóng góp cá nhân)

---

## 1. BẢNG TỔNG HỢP PHÂN CÔNG TRÁCH NHIỆM & MINH CHỨNG ĐÓNG GÓP

| STT | MSSV | Vai trò / Alias | Đầu việc chính phụ trách | Sản phẩm bàn giao chính | Minh chứng Commit / PR tiêu biểu | Tỷ lệ đóng góp |
| :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| **1** | `202414288` | **Lead** | - Quản trị kho mã nguồn (Fork/PR).<br>- Thiết lập kiến trúc & quyết định thiết kế ADR-01.<br>- Thiết lập CI GitHub Actions & `pytest.ini`.<br>- Báo cáo tiến độ PC-1, PC-2. | - `artifacts/DECISIONS.md`<br>- `.github/workflows/test.yml`<br>- `pytest.ini`<br>- `progress/PROGRESS.md`<br>- `README.md` | Commit `848c9d9`, `0d52ce0`, `48413af`, `f7fe471` | **25%** |
| **2** | `202414324` | **BE-1** | - Phân tích yêu cầu & Acceptance Criteria.<br>- Hiện thực logic cốt lõi Rule Engine 2 tầng.<br>- Hiện thực chính sách thiếu dữ liệu A-04 (Issue #15). | - `artifacts/REQUIREMENTS.md`<br>- `rule_engine/classifier.py` (`classify`) | Commit `316e53f`, `c5244a9` | **25%** |
| **3** | `202414276` | **BE-2** | - Thiết kế & hiện thực Module Audit Trail (A-06).<br>- Rà soát ranh giới bảo mật & Zero PII.<br>- Lập danh mục tự kiểm tra an toàn thông tin. | - `rule_engine/audit.py`<br>- `tests/test_audit.py`<br>- `artifacts/SECURITY_PRIVACY_CHECKLIST.md` | Commit `c5244a9` | **25%** |
| **4** | `202414384` | **QA** | - Thiết kế ma trận 29 unit tests (biên $\pm 1$, drop 30%, R03, missing data).<br>- Xây dựng kịch bản benchmark p95 1.000 ca.<br>- Lập báo cáo kiểm thử & đo lường hiệu năng. | - `tests/test_classifier.py`<br>- `scripts/benchmark.py`<br>- `tests/test_benchmark.py`<br>- `artifacts/TEST_REPORT.md` | Commit `316e53f`, `c5244a9` | **25%** |

---

## 2. QUY TRÌNH PHỐI HỢP VÀ ĐÁNH GIÁ CHÉO (PEER REVIEW)

- **Quy trình làm việc:** Nhóm áp dụng mô hình Feature Branching và Pull Request Review trên fork. Mọi tính năng (code logic, audit trail, test suite, benchmark) đều phải vượt qua toàn bộ 29 unit test tự động trước khi merge vào nhánh chính `main`.
- **Đánh giá mức độ đồng đều:** Tất cả 4 thành viên đều tham gia trực tiếp vào việc rà soát phản hồi từ Giảng viên, kiểm tra chéo các ca kiểm thử biên và đối chiếu kỹ thuật với SSoT `docs/decision-table.md` và Issue #15.
- **Cam kết trách nhiệm cá nhân:** Từng thành viên nắm vững 100% phần việc mình đảm nhận để sẵn sàng trả lời chất vấn ngẫu nhiên tại buổi vấn đáp cá nhân (Viva ngày 21/11).
