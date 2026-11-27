# CONTRIBUTIONS.md

Đóng góp của nhóm 173820_N32, Track B. Ghi bằng **alias/vai trò**, không ghi họ tên.
Đề: điểm cá nhân có thể khác điểm nhóm, dựa trên bằng chứng đóng góp và vấn đáp; **số commit không phải thước đo duy nhất**. Mỗi người phải giải thích được phần mình.

## 1. Bảng phân công

| Alias | Vai trò | Việc chính | Commit / PR tiêu biểu | Review cho ai (PR/commit) | Phần sẽ trả lời ở vấn đáp |
|---|---|---|---|---|---|
| `dev-backend` | Backend / Logic | `server/estimate.js`, `server/grading.js`, nhánh chấm ở `POST /api/submissions`, 12 câu seed | _SHA_ | _SHA_ | ADR-002, ADR-004, ADR-006 |
| `dev-frontend` | Frontend | `components/estimate-question.js`, `lesson.js`, lối vào trong `exercise.js`, kiểm tra tay T-33 | _SHA_ | _SHA_ | ADR-003, ADR-005, B-12 |
| `dev-qa-devops` | QA / DevOps | `test/*.test.js`, workflow CI, `TEST_REPORT.md`, rà soát bảo mật, Draft PR nộp bài | _SHA_ | _SHA_ | B-08..B-11, cách chạy một test |

## 2. Đóng góp có hỗ trợ AI

Xem `AI_USE.md`. Với mỗi phần AI viết, ghi ai đã review và chịu trách nhiệm. Người đó phải giải thích được phần đó mà không dùng AI.

| Phần do AI hỗ trợ | Người review & chịu trách nhiệm | Đã tự chạy lại / sửa gì |
|---|---|---|
| Quy tắc chấm `estimate` + test | | |
| Giao diện 2 bước | | |
| CI + tài liệu bàn giao | | |

## 3. Xác nhận

Cả nhóm xác nhận bảng trên đúng sự thật (mỗi người ghi alias + ngày):

- `<alias>` — _ngày_
- `<alias>` — _ngày_
- `<alias>` — _ngày_
