# TEST_REPORT.md

Báo cáo kiểm thử cho dạng bài "Ước lượng trước khi tính đúng" (Track B, nhóm 173820_N32).
Kế hoạch và mã test: `docs/Test_plan.md`. Bản này ghi **kết quả thực tế đã chạy**. Dòng nào chưa chạy ghi rõ "chưa chạy".

## 1. Môi trường

| Mục | Giá trị |
|---|---|
| Máy chạy local | Windows 10 Pro, Node.js v22.23.5, npm đi kèm |
| CI | GitHub Actions `ubuntu-latest`, ma trận Node 18.x / 20.x / 22.x (`.github/workflows/test.yml`) |
| Công cụ test | `node:test` có sẵn trong Node, không cài thêm thư viện |
| CSDL khi test | File SQLite tạm trong thư mục temp của hệ điều hành, tạo mới và xóa sau mỗi lần chạy; không đụng `data/vuon-toan.db` |
| Commit được test | `488f166` (18/11). Các commit sau đó đến 18/11 chỉ sửa README, tài liệu và workflow, không đổi code. Chạy lại ở commit Freeze. |

Lệnh:

```bash
npm ci
npm test                              # toàn bộ
node --test test/estimate.test.js     # chỉ test đơn vị phần chấm
node --test --test-name-pattern="T-31"  # một test theo tên
```

## 2. Kết quả tự động

Lần chạy local ngày 18/11/2026: **34 test, 34 đạt, 0 lỗi**, khoảng 11 giây. Phần lớn thời gian là bước seed băm bcrypt 100 tài khoản.

| Nhóm | ID | File | Kết quả |
|---|---|---|---|
| Bình thường | T-01..T-04, ước lượng trùng đáp án | `test/estimate.test.js` | Đạt |
| Biên | T-05..T-09, 6 chữ số, trim | `test/estimate.test.js` | Đạt |
| Không hợp lệ | T-10..T-12, `correct_answer` hỏng | `test/estimate.test.js` | Đạt |
| Phản hồi | T-13..T-16, 4 câu phản hồi khác nhau | `test/estimate.test.js` | Đạt |
| Hồi quy type cũ | T-17 (unit + qua API với `phieu-bai-9-10`) | `test/estimate.test.js`, `test/api.test.js` | Đạt |
| Điểm | T-18, 12/12 câu đúng → 100% | `test/estimate.test.js`, `test/api.test.js` | Đạt |
| Dữ liệu | T-20, id không trùng, tài khoản synthetic | `test/seed.test.js` | Đạt |
| API | T-30, T-31, T-32 | `test/api.test.js` | Đạt |
| Công thức | Khớp ADR-002 với mọi n từ 0 đến 5000 | `test/estimate.test.js` | Đạt |

## 3. Kiểm tra tay và quy trình

| ID | Nội dung | Kết quả |
|---|---|---|
| T-33 | Làm trọn một lượt chỉ bằng bàn phím, nhập sai thấy lỗi dễ hiểu, F5 giữa hai bước | **Chưa chạy.** Cần một người làm trên trình duyệt với `hocsinh01` và ghi kết quả vào đây. |
| T-40 | `git diff` so với tag `bkt-2026-v1` (057a482) không đụng `server/auth.js`, Dockerfile, DEPLOY.md, tài khoản mẫu | Đạt (18/11). Chạy lại trước Freeze. |
| T-41 | `npm test` đạt sau `npm ci` trên bản clone mới | Đạt (18/11): clone mới nhánh `test` tại `488f166`, `npm ci` + `npm test` trên Node 18.20.8, 20.20.2 và 22.23.5 đều 34/34. Sau đó `npm run reset-db` + `npm start` chạy, các trang trả HTTP 200. |
| T-42 | Workflow CI xanh trên Pull Request | Chưa chạy. Workflow chạy khi mở PR hoặc khi push lên `main`, `work`, `test`. Ghi link lần chạy vào `ci_run_url` của `source-ref.json`. |
| T-43 | Không có secret, `.env`, tên thật | Đạt (18/11): quét mẫu secret giống `validate_submission.py`, không có file `.env`. |
| Smoke | Chạy server với CSDL tạm: `lesson.html` nạp component, API trả câu hỏi không có đáp án, nộp bài trả 4 trường hợp | Đạt (18/11) |

## 4. Giới hạn đã biết

- **Thứ tự hai bước chỉ được bảo đảm ở giao diện** (ADR-003). Gọi thẳng `POST /api/submissions` thì gửi được cả hai giá trị cùng lúc.
- **Node quá mới trên Windows:** `npm ci` thất bại với Node 26 vì `better-sqlite3@11` chưa có bản dựng sẵn cho phiên bản đó và máy không có bộ biên dịch C++. Dùng Node 18–22 (LTS), như CI.
- **Giao diện chưa có test tự động.** Phần chấm, API và lưu trữ có test; phần tương tác trình duyệt (khóa ô, `sessionStorage`, bàn phím) dựa vào T-33 làm tay.
- **Bài 10 bị khóa** cho học sinh chưa hoàn thành Bài 9 (hành vi có sẵn, ADR-005). Demo dùng `hocsinh01`.
