# AI_USE — Khai báo sử dụng AI

> Nhóm: Nhóm 11 · Track A: Dr May Day Rule Engine Sprint
> Tiêu chuẩn đối chiếu: Mục 5.3 của đề thi (chính sách `ai-allowed`).
> Cam kết: Không đưa dữ liệu cá nhân hay secret vào bản khai báo. Mọi nội dung do AI hỗ trợ đều được nhóm đọc, kiểm thử độc lập và chịu trách nhiệm toàn diện.

---

## Bảng khai báo sử dụng công cụ AI

| # | Công cụ / Model | Mục đích sử dụng | Phạm vi áp dụng | Phương pháp kiểm chứng | Quyết định của nhóm | Người chịu trách nhiệm |
|---|---|---|---|---|---|---|
| 1 | Claude / Antigravity | Phân tích đề bài, giải thích bảng quyết định WAO/EAACI | Tài liệu `REQUIREMENTS.md`, `DECISIONS.md` | Đối chiếu với `docs/decision-table.md` và issue #15 của môn học | Tiếp thu logic chuẩn 2 tầng và thứ tự ưu tiên R01 > R02 > R03 | 202414275 (Lead) |
| 2 | Antigravity AI Assistant | Sinh khung mã nguồn Rule Engine theo ADR-001..ADR-004 | `rule_engine/classifier.py` | Kiểm tra code review nội bộ, đối chiếu từng hàm thuần `r01`, `r02`, `r03`, `is_hypotensive` | Giữ nguyên kiến trúc hàm thuần và hàm bọc audit | 202414215 (BE) |
| 3 | Antigravity AI Assistant | Xây dựng bộ 61 ca unit test bao phủ 45 Acceptance Criteria | `tests/test_classifier.py` | Chạy thực tế bằng `pytest -q`, kiểm tra 61/61 ca passed | Chấp thuận 100% test cases | 202414072 (QA) |
| 4 | Antigravity AI Assistant | Xây dựng script benchmark độ trễ | `benchmark.py`, `TEST_REPORT.md` | Chạy 5.000 lượt với `time.perf_counter()`, kiểm chứng $p95 < 100\text{ ms}$ | Kết quả đạt $p95 \approx 0.002\text{ ms}$, đưa vào báo cáo | 202414215 (BE) |

---

## Ghi chú
- Tất cả các đề xuất của AI đều được nhóm xem xét kỹ lưỡng và xác minh bằng bộ test tự động trước khi commit.
- Nhóm hoàn toàn làm chủ mã nguồn và giải thích được mọi quyết định kỹ thuật khi vấn đáp với giảng viên.
