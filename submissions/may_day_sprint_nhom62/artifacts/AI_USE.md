# NHẬT KÝ SỬ DỤNG AI (AI-USE LOG) — NHÓM 62

* **Track:** Track A — Dr May Day: Rule Engine Sprint
* **Chính sách:** `ai-allowed`, có kiểm chứng và truy vết đầy đủ theo Mục 5.3 của đề thi.

| Công cụ / Model | Mục đích sử dụng | Phạm vi (File / Module) | Cách thức kiểm chứng | Quyết định của nhóm | Người chịu trách nhiệm |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Gemini | Hỗ trợ gợi ý cấu trúc cài đặt `classify()`, xử lý ngoại lệ đầu vào và ghi nhận Audit Trail 4 trường | `rule_engine/classifier.py` | Đối chiếu từng quy tắc với `docs/decision-table.md`, Issue #15; rà soát chéo phát hiện nguy cơ `OverflowError` khi `tuoi = 10**400` và sửa điều kiện `isinstance(tuoi, float)` trước khi gọi `math.isnan`/`math.isinf` | Giữ cấu trúc phân loại 2 tầng; áp dụng Whitelist Sanitization và sửa chặn `OverflowError` | `thaihop06`, `huyvanle04112006` |
| Gemini | Hỗ trợ sinh khung unit test ban đầu và mở rộng thành bộ kiểm thử đầy đủ `TC01–TC60` kèm hàm Oracle độc lập | `tests/test_classifier.py`, `benchmarks/run_benchmark.py` | Rà soát chéo từng hàm test với `docs/TEST_REPORT.md`, bổ sung các test case thiếu (`TC42–45`, nhánh 3b `TC03`, `TC54` Oracle) và cấu hình `sys.path` cho script benchmark; chạy `pytest -q` trên CI | Bổ sung đầy đủ 60 kịch bản kiểm thử tự động để khớp 100% với đặc tả kiểm thử | `huyvanle04112006`, `thaihop06` |
| Gemini | Hỗ trợ rà soát biểu mẫu tài liệu tiến độ và báo cáo bàn giao | `progress/PROGRESS.md`, `TEST_REPORT.md`, `SECURITY_PRIVACY_CHECKLIST.md` | Hai thành viên đọc kiểm tra chéo từng mục với `REQUIREMENTS.md` và `docs/acceptance-criteria.md` | Chỉnh sửa trạng thái sát thực tế tiến độ nhóm tại PC-1 và PC-2 | `thaihop06`, `huyvanle04112006` |