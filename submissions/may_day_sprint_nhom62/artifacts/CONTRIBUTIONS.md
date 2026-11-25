# BẢNG PHÂN CÔNG VÀ ĐÓNG GÓP THÀNH VIÊN — NHÓM 62

* **Mã nhóm:** Nhóm 62 (`Nhom_62`)
* **Track:** Track A — Dr May Day: Rule Engine Sprint
* **Repository:** `https://github.com/thaihop06/ktpmud-bkt-ruleengine-starter`

---

## 1. Bảng phân công vai trò và hạng mục thực hiện

| Alias Thành viên | Vai trò chính | Hạng mục phụ trách chi tiết | File / Sản phẩm bàn giao |
| :--- | :--- | :--- | :--- |
| `thaihop06` | Phân tích yêu cầu, Kiến trúc & Rà soát kiểm thử | - Phân tích bảng quyết định WAO/EAACI V1 và cập nhật đặc tả theo Issue #15.<br>- Xây dựng 26 tiêu chí nghiệm thu (`AC01–AC26`) và quyết định kiến trúc đánh đổi PII vs. No-Downgrade.<br>- Thiết kế kế hoạch 64 kịch bản kiểm thử (`TC01–TC64`) và thực hiện rà soát chéo mã nguồn, phát hiện các ca biên thiếu (`TC42–45`, `OverflowError` với `10**400`). | `REQUIREMENTS.md`, `docs/acceptance-criteria.md`, `docs/TEST_REPORT.md`, `docs/adr/ADR-001-rule-based-engine.md`, rà soát chéo `tests/test_classifier.py` |
| `huyvanle04112006` | Hiện thực Rule Engine, Kiểm thử tự động & Vận hành CI | - Cài đặt lõi phân loại 2 tầng, lọc trắng 9 trường, chống `OverflowError` và Audit Trail 4 trường.<br>- Hiện thực đầy đủ bộ kiểm thử tự động `TC01–TC60` (66 lượt chạy parametrized) kèm hàm Oracle độc lập duyệt 64 tổ hợp cờ bool.<br>- Xây dựng script đo hiệu năng (`p95 < 100 ms`), script trình diễn sản phẩm, cấu hình GitHub Actions CI xanh và tổng hợp báo cáo PC-1/PC-2. | `rule_engine/classifier.py`, `tests/test_classifier.py`, `benchmarks/run_benchmark.py`, `demo.py`, `progress/PROGRESS.md`, `TEST_REPORT.md`, `AI_USE.md`, `SECURITY_PRIVACY_CHECKLIST.md`, `CONTRIBUTIONS.md` |

---

## 2. Quy trình phối hợp và rà soát chéo (Cross-Review)

1. **Giai đoạn M1 / CP1 (Đến 11/11/2026):** `thaihop06` hoàn thiện đặc tả yêu cầu, tiêu chí nghiệm thu và ADR[cite: 1, 9]; `huyvanle04112006` cài đặt khung `classifier.py`, thiết lập CI và tổng hợp báo cáo **PC-1** trên Issue #17[cite: 1, 9].
2. **Giai đoạn CP2 & PC-2 (12/11 – 18/11/2026):** `thaihop06` đọc rà soát chéo toàn bộ mã nguồn và phát hiện danh sách các test case còn thiếu cùng nguy cơ `OverflowError`[cite: 1, 9]; `huyvanle04112006` bổ sung đầy đủ `TC01–TC60`, hàm Oracle, `demo.py` và bộ 4 tài liệu kiểm soát chất lượng cho **PC-2** trên Issue #18[cite: 1, 9].
3. **Giai đoạn Freeze, Submit & Demo/Viva (19/11 – 21/11/2026):** Cả hai thành viên cùng kiểm tra clean checkout trước khi gắn tag `bkt-2026-nhom62-rc1`, mở Pull Request nộp bài và phân chia nội dung trình bày Demo (7 phút) + Vấn đáp (8 phút).