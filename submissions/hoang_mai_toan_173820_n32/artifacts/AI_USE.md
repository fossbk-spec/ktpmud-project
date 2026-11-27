# AI_USE.md

Nhật ký dùng AI của nhóm 173820_N32, Track B. Theo đề §5.3, mỗi lần dùng ghi đủ 6 trường: Công cụ/model, Mục đích, Phạm vi, Kiểm chứng, Quyết định của nhóm, Người chịu trách nhiệm.
Không cần dán toàn bộ prompt. Không ghi secret hay PII. Trong buổi vấn đáp **không** được dùng AI.

> Các dòng có `<alias>` hoặc ghi "nhóm điền" là phần **nhóm phải tự điền** sau khi tự review. AI không được tự xác nhận bài làm đúng.

| # | Ngày | Công cụ/model | Mục đích | Phạm vi (file / commit) | Kiểm chứng | Quyết định của nhóm | Người chịu trách nhiệm |
|---|---|---|---|---|---|---|---|
| 1 | 18/11/2026 | Claude Code, model Claude Opus 5.5 | Đọc codebase, viết `CLAUDE.md` hướng dẫn cho agent | `CLAUDE.md` | Người review đối chiếu với `server/*.js`, `docs/architecture-reference.md` | nhóm điền: giữ / sửa / bỏ, lý do | `<alias>` |
| 2 | 18/11/2026 | Claude Code, model Claude Opus 5.5 | Đọc đề chính thức, Progress Check, `CONTRIBUTING.md`, `validate_submission.py`, erratum #25 #28; lập bảng tự chấm và mẫu artifact | `docs/RUBRIC_CHECKLIST.md`, `docs/TEST_REPORT.md`, `docs/SECURITY_PRIVACY_CHECKLIST.md`, `docs/AI_USE.md`, `docs/CONTRIBUTIONS.md`, `submission/` | Đối chiếu từng mục với trang đề | nhóm điền | `<alias>` |
| 3 | 18/11/2026 | Claude Code, model Claude Opus 5.5 | Cài đặt quy tắc chấm `estimate` theo ADR-001..004 | `server/estimate.js`, `server/grading.js`, `server/api.js` (thân `POST /submissions`) | `npm test` 34/34; người review đọc lại công thức ADR-002 và nhánh type cũ | nhóm điền | `<alias>` |
| 4 | 18/11/2026 | Claude Code, model Claude Opus 5.5 | Thêm 12 câu synthetic theo bảng ở `Test_plan.md` | `data/seed.json` | T-20 kiểm phép tính khớp đáp án | nhóm điền | `<alias>` |
| 5 | 18/11/2026 | Claude Code, model Claude Opus 5.5 | Giao diện 2 bước, lưu ước lượng vào `sessionStorage`, lối vào từ phiếu Bài 10 | `public/assets/js/components/estimate-question.js`, `pages/lesson.js`, `pages/exercise.js`, `lesson.html`, `exercise.html` | **Chưa** kiểm tra tay trên trình duyệt (T-33) — nhóm phải làm | nhóm điền | `<alias>` |
| 6 | 18/11/2026 | Claude Code, model Claude Opus 5.5 | Viết test `node:test` và workflow CI | `test/*.test.js`, `.github/workflows/test.yml`, `package.json` (`npm test`) | Chạy local Node 22: 34/34; CI chưa chạy | nhóm điền | `<alias>` |
| 7 | 18/11/2026 | Claude Code, model Claude Opus 5.5 | Sửa lỗi `npm run build:css` trên Windows (spawn `npx.cmd` cần shell) | `tools/build-css.js`, `public/assets/css/tailwind.build.css` | Build lại thành công, class mới có trong CSS | nhóm điền | `<alias>` |
| 8 | 18/11/2026 | Claude Code, model Claude Opus 5.5 | Ghi ADR-005, ADR-006 và cập nhật một dòng phạm vi trong Requirements | `docs/Decisions.md`, `docs/Requirements.md` | Nhóm đọc và đồng ý/không đồng ý với từng lựa chọn | nhóm điền | `<alias>` |
| 9 | 18/11/2026 | Claude Code, model Claude Opus 5.5 | Chạy thử bản clone mới (T-41), rồi sửa bài nộp theo lỗi của `validate`: đổi tên thư mục và slug, điền `case_study_id`, `source-ref.json`, README bài nộp; thêm nhánh `test` vào trigger CI; sửa dòng `..` trong README; ghi kết quả `npm audit` | `submission/hoang_mai_toan_173820_n32/`, `.github/workflows/test.yml`, `README.md`, `docs/TEST_REPORT.md`, `docs/SECURITY_PRIVACY_CHECKLIST.md`, thư mục nộp bài trong fork `ktpmud-project` | Chạy `scripts/validate_submission.py` của đề; so tên file đúng chữ hoa/thường như CI Ubuntu | nhóm điền | `<alias>` |

## Lần dùng AI trước ngày 18/11 (nhóm bổ sung)

`progress/PROGRESS.md` còn các dấu `[cite: N]`, là dấu vết thường thấy khi chép từ công cụ AI. Nếu các tài liệu Checkpoint 1 (`Requirements.md`, `Decisions.md`, `Test_plan.md`, `PROGRESS.md`) có dùng AI, nhóm cần ghi thêm các dòng ở đây và xóa các dấu `[cite: …]` khỏi `PROGRESS.md`.

| # | Ngày | Công cụ/model | Mục đích | Phạm vi | Kiểm chứng | Quyết định của nhóm | Người chịu trách nhiệm |
|---|---|---|---|---|---|---|---|
| | | | | | | | |
