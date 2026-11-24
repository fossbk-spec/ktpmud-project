# AI_USE — nhom05 — Track B

Theo đề thi Mục 5.3. Chỉ ghi alias/vai trò, không ghi họ tên/MSSV. Không lưu toàn bộ prompt riêng tư;
không đưa secret/PII vào AI.

Alias: **BA** · `Zeref52` (đặc tả, kiểm thử, CI, tài liệu) · **BE** · `namfa7071-hash` (backend) · **FE** · `lehoangg12339-oss` (giao diện).

| # | Công cụ/model | Mục đích | Phạm vi (file / commit) | Kiểm chứng | Quyết định của nhóm | Người chịu trách nhiệm |
|---|---|---|---|---|---|---|
| 1 | ChatGPT (GPT-4o) | Gợi ý khung đặc tả dạng bài ước lượng lớp 3 | `docs/ESTIMATION_FEATURE_SPEC.md` · `b71c1f7` | Đối chiếu đề thi Mục 8 và `docs/architecture-reference.md` | **Sửa**: bỏ làm tròn số thập phân; tự đặt dung sai. Quy tắc cuối cùng chốt ở DECISIONS ADR-02 | BA |
| 2 | GitHub Copilot | Gợi ý sinh toán hạng phép trừ không âm | `server/math-logic.js` · `02cee8f` | UT-03, UT-05 (1.000 đề) trong `tests/math-logic.test.js` | **Sửa**: thêm ràng buộc số bị trừ > số trừ, kết quả nguyên dương | BE |
| 3 | Claude 3.5 Sonnet | Gợi ý bố cục CSS 2 bước, nút lớn cho học sinh | `public/assets/js/components/estimate-exact.js` · `715908e` | Xem thủ công trên trình duyệt; kiểm tra focus bằng Tab | **Sửa**: cỡ chữ 22px, màu theo theme Vườn Toán | FE |
| 4 | ChatGPT | Gợi ý test case biên cho dung sai ước lượng | `tests/estimation.test.js` · `b71c1f7`, `6e03914` | Chạy `npm test`; CI run `43052984615` | **Giữ một phần, sẽ thay**: test hiện kiểm hàm cục bộ, không kiểm code thật (xem TEST_REPORT) | BA |
| 5 | Claude (Anthropic) | Hỗ trợ soạn PROGRESS.md, các file `artifacts/`, spec v2.0, 12 câu synthetic, checklist kiểm thử từ code và commit hiện có | `progress/PROGRESS.md`, `docs/ESTIMATION_FEATURE_SPEC.md`, `server/fixtures/estimate-fixtures.json`, `docs/MANUAL_TEST_CHECKLIST.md`, thư mục bài nộp này | Đối chiếu từng dòng với code, commit, CI run; chạy 36 mẫu chấm của fixture qua `scoreMathAnswer` (khớp 36/36); chạy validator `scripts/validate_submission.py` | **Giữ sau khi review**; trạng thái AC ghi đúng thực tế, không nâng "Đang" thành "Xong" | BA |

Nguyên tắc: AI không tự merge, không tự phát hành, không tự xác nhận bài đúng. Mọi logic chấm do nhóm
viết/kiểm tra bằng test và chịu trách nhiệm giải thích trong vấn đáp.
