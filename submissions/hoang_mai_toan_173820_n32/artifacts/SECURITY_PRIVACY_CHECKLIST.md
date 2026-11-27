# SECURITY_PRIVACY_CHECKLIST.md

Track B, nhóm 173820_N32. Đánh dấu ☑ khi đã kiểm và có bằng chứng. Ghi người kiểm bằng alias, không ghi họ tên.
Vi phạm PII/PHI, secret hoặc truy cập production ⇒ **dừng chấm** (đề §9.3).

## 1. Dữ liệu và quyền riêng tư

| # | Kiểm tra | Trạng thái | Bằng chứng / cách kiểm |
|---|---|---|---|
| 1 | Chỉ dùng tài khoản synthetic `hocsinh01`..`hocsinh99`, `giaovien01` | ☑ | `test/seed.test.js` kiểm mọi `username` |
| 2 | 12 câu `estimate` là số liệu tự đặt, không lấy từ dữ liệu học sinh thật | ☑ | `data/seed.json` bộ `phieu-uoc-luong`, `docs/Test_plan.md` mục 2 |
| 3 | Không có họ tên thật trong code, README, tên file, commit message | ☐ | Rà soát tay trước Freeze |
| 4 | `progress/PROGRESS.md` không ghi họ tên/MSSV (trang Progress Check yêu cầu) | ☐ | Kiểm lại mục 1.6 |
| 5 | Không commit `data/vuon-toan.db` (chứa điểm thật khi chạy) | ☑ | `.gitignore` có `data/*.db*` |
| 6 | `answers_json` chỉ chứa đáp án dạng số, không thu thập thông tin cá nhân mới | ☑ | ADR-003; không thêm trường dữ liệu người dùng nào |

## 2. Secret và cấu hình

| # | Kiểm tra | Trạng thái | Bằng chứng / cách kiểm |
|---|---|---|---|
| 7 | Không có file `.env` trong repo | ☑ | `git ls-files` (18/11); `.gitignore` có `.env` |
| 8 | Không có API key/token/private key | ☑ | Quét bằng đúng các regex của `validate_submission.py` (18/11): không khớp |
| 9 | Không đổi `SESSION_SECRET`, `ADMIN_SECRET`, `GOOGLE_CLIENT_ID` hay cách đọc chúng | ☑ | `server/auth.js` không đổi (T-40) |
| 10 | Không kết nối starter tới production/Railway/CSDL thật | ☑ | Chỉ chạy local với SQLite; test dùng CSDL tạm |

## 3. Ranh giới hệ thống (B-07)

| # | Kiểm tra | Trạng thái | Bằng chứng / cách kiểm |
|---|---|---|---|
| 11 | `server/auth.js`, Dockerfile, DEPLOY.md không đổi so với tag `bkt-2026-v1` | ☑ | `git diff 057a482 -- server/auth.js Dockerfile DEPLOY.md` rỗng (18/11) |
| 12 | Route `/api/auth/*`, `/api/teacher/*`, `/api/admin/*` không đổi | ☑ | Diff `server/api.js` chỉ ở dòng `require('./grading')` và thân `POST /submissions` |
| 13 | Tài khoản mẫu không đổi | ☑ | Diff `data/seed.json` chỉ thêm `questionSets.phieu-uoc-luong` |

## 4. Tính đúng đắn của việc chấm (dữ liệu/AI)

| # | Kiểm tra | Trạng thái | Bằng chứng / cách kiểm |
|---|---|---|---|
| 14 | Đáp án và khoảng chấp nhận không gửi xuống trình duyệt trước khi nộp (B-04) | ☑ | T-31 |
| 15 | Chấm hoàn toàn bằng code tất định; không gọi LLM lúc chạy | ☑ | `server/estimate.js` thuần logic; T-04 |
| 16 | Đầu vào lạ (chuỗi rất dài, object, `1e3`, số âm) không làm server lỗi | ☑ | T-10..T-12; `express.json` giới hạn 256kb sẵn có |
| 17 | Giá trị người dùng hiển thị lại trên giao diện được escape HTML | ☑ | `esc()` trong `components/estimate-question.js` |
| 18 | Dùng AI được khai báo đầy đủ | ☐ | `docs/AI_USE.md`, cả nhóm xác nhận |

## 5. Rủi ro còn lại (chấp nhận và giải trình)

- Có thể bỏ qua thứ tự hai bước bằng cách gọi API trực tiếp (ADR-003). Đây là giới hạn đã chấp nhận, không phải lỗ hổng lộ dữ liệu.
- `lesson.js` có sẵn từ trước vẫn chèn `q.prompt` không escape. Nội dung câu hỏi do giáo viên nhập; nhóm không sửa vì ngoài phạm vi. Câu `estimate` dùng prompt đã escape trong component.
- `npm audit` (18/11) báo 12 cảnh báo ở dependency có sẵn của starter: 11 mức high, 1 mức moderate.
  - 11 cảnh báo nằm trong cây phụ thuộc của devDependency `tailwindcss` (`picomatch`, `micromatch`, `chokidar`, `postcss-selector-parser`…). Gói này chỉ dùng khi chạy `npm run build:css`, không chạy trên server.
  - 1 cảnh báo ở dependency chạy thật (`npm audit --omit=dev`): `body-parser <1.20.9`, mức high, lỗi DoS khi body nén có byte thừa ([GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828)). Gói này đi kèm `express`; `npm audit fix` sửa được mà không phải nâng phiên bản lớn.
  - Nhóm không nâng version để tránh đổi hành vi starter.
