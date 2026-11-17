# CONTRIBUTIONS — nhom05 — Track B

Ánh xạ thành viên – đầu việc – commit/review. Chỉ dùng alias/vai trò (MSSV đã khai trong `submission.json`).
Commit trên fork code: https://github.com/Zeref52/ktpmud-bkt-vuontoan-starter/commits

| Alias / vai trò | GitHub | Đầu việc chính | Commit tiêu biểu | Review |
|---|---|---|---|---|
| BA | `Zeref52` | Đặc tả dạng bài (spec v2.0), 12 câu synthetic, checklist kiểm thử, CI workflow, PROGRESS.md, hồ sơ nộp bài (PR #27) | `b71c1f7` (spec v1, CI, AI log, test), `6e03914` (sửa test sang `node:test`, CI xanh), commit PC-1 (PROGRESS, spec v2.0, fixtures, CI `npm ci`) | Review logic chấm của BE, UI của FE |
| BE | `namfa7071-hash` | Module `server/math-logic.js`, route `GET /api/math/generate`, `POST /api/math/score`, script `npm test`, unit test logic | `02cee8f`, `d24a19e`, `df5a25c`, `f1edeb9`, `41e2fe9` | Review test của BA |
| FE | `lehoangg12339-oss` | Trang `public/estimate-exact.html` và component `estimate-exact.js` (luồng 2 bước, khoá ô ước lượng) | `d4faf27`, `715908e` | Review API contract với BE |

Việc còn lại và phân công đến Freeze: xem `progress/PROGRESS.md` bảng 1.3 / 2.4.
