# CONTRIBUTIONS — Bảng đóng góp của các thành viên

> Nhóm: Nhóm 11 · Track A: Dr May Day Rule Engine Sprint

---

## 1. Phân công vai trò và trách nhiệm

| MSSV | Vai trò | Trách nhiệm chính | Sản phẩm đầu ra cụ thể |
|---|---|---|---|
| **202414275** | **Lead (Quản trị kho Git)** | - Quản trị kho mã nguồn Git, phân nhánh, pull request.<br>- Quản lý tiến độ dự án qua các mốc PC-1, PC-2, Freeze.<br>- Rà soát bảo mật Zero PII và tổng hợp báo cáo nộp bài. | • Quản lý nhánh và PR repo starter & cổng nộp bài<br>• `progress/PROGRESS.md`<br>• `SECURITY_PRIVACY_CHECKLIST.md` |
| **202414072** | **QA (Kiểm thử & Chất lượng)** | - Xây dựng ma trận kiểm thử chi tiết trong `TEST_PLAN.md`.<br>- Hiện thực hóa 61 test cases bao phủ 45 Acceptance Criteria trong `tests/test_classifier.py`.<br>- Đảm bảo kiểm thử tự động đạt 100% pass từ clean checkout. | • `TEST_PLAN.md`<br>• `tests/test_classifier.py` (61 tests passed)<br>• Cấu hình `pytest.ini` |
| **202414215** | **BE (Backend & Logic Rule)** | - Phân tích đặc tả bảng quyết định WAO/EAACI 2020.<br>- Hiện thực hóa logic nghiệp vụ 2 tầng trong `rule_engine/classifier.py` (`r01`, `r02`, `r03`, `is_hypotensive`, `classify`).<br>- Cài đặt Audit Trail `classify_with_audit` và script benchmark đo độ trễ. | • `rule_engine/classifier.py`<br>• `benchmark.py`<br>• `TEST_REPORT.md` |

---

## 2. Cam kết của nhóm
Các thành viên trong nhóm đã phối hợp chặt chẽ, cùng nhau thảo luận, review chéo tài liệu và mã nguồn, đảm bảo 100% thành viên đều hiểu rõ logic hệ thống và sẵn sàng cho buổi kiểm tra vấn đáp.
