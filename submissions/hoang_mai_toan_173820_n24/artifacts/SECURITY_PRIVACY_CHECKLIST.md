
# SECURITY_PRIVACY_CHECKLIST — N24 — Track B

**Dự án:** Vườn Toán Lớp 3
**Nhóm:** N24
**Track:** B – Phát triển tính năng
**Ngày rà soát:** 19/11/2026

## Phạm vi

Checklist tập trung vào phần nhóm bổ sung cho chức năng "Ước lượng trước khi tính đúng".

Các thành phần starter như cơ chế xác thực, quản lý session và cấu hình triển khai không thuộc phạm vi thay đổi của Track B (B-07). Việc rà soát này không thay thế kiểm thử xâm nhập hoặc đánh giá bảo mật chuyên sâu.

## 1. Dữ liệu và quyền riêng tư (B-11)

| # | Hạng mục | Trạng thái | Bằng chứng / ghi chú |
|---|---|---|---|
| 1 | Chỉ sử dụng dữ liệu giả lập trong phạm vi chức năng mới | Đạt | `data/seed.json`; dữ liệu câu hỏi phục vụ kiểm thử |
| 2 | Không sử dụng thông tin cá nhân thật trong dữ liệu kiểm thử chức năng mới | Đạt | Dữ liệu mẫu và dữ liệu kiểm thử phục vụ mục đích demo |
| 3 | Không đưa file `.env` hoặc cơ sở dữ liệu vào danh sách file Git theo dõi | Đạt | Đã kiểm tra bằng `git ls-files`; không phát hiện file `.env`, `.db`, `.sqlite`, `.sqlite3` |
| 4 | Cấu hình bí mật được đọc từ biến môi trường | Đạt | `GOOGLE_CLIENT_ID`, `ADMIN_SECRET` trong `server/api.js` |
| 5 | Không phát hiện giá trị bí mật thực tế bị ghi cứng trong các vị trí đã rà soát | Đạt | Đã tìm kiếm trong `README.md` và các file `server/*.js` |
| 6 | Quét toàn bộ lịch sử Git để tìm secret từng bị commit | Chưa thực hiện | Chưa sử dụng công cụ chuyên dụng như Gitleaks hoặc TruffleHog |

## 2. Ranh giới an toàn và hành vi hệ thống (B-07, B-04)

| # | Hạng mục | Trạng thái | Bằng chứng / ghi chú |
|---|---|---|---|
| 7 | Không chủ động thay đổi cơ chế xác thực và quản lý session của starter | Đạt | Đã rà soát phạm vi thay đổi B-07 |
| 8 | Không thay đổi hành vi của các dạng câu hỏi cũ | Đạt | Chức năng ước lượng được bổ sung riêng; có kiểm thử hồi quy |
| 9 | API không trả đáp án trước khi người học nộp bài | Đạt | Đã kiểm tra luồng API và các trường dữ liệu trả về |
| 10 | Kết quả chấm điểm được tính ở phía máy chủ | Đạt | Logic chấm điểm nằm trong `server/estimate.js`; dữ liệu kết quả do server tính toán |
| 11 | Không sử dụng LLM để sinh hoặc chấm đáp án trong lúc chạy ứng dụng | Đạt | Chức năng sử dụng logic xử lý xác định, không gọi dịch vụ AI bên ngoài |
| 12 | Khôi phục trạng thái bài làm sau khi tải lại trang | Đạt | Đã kiểm thử khôi phục bản nháp và kết quả đã nộp sau khi refresh |

## 3. Kiểm tra đầu vào và chống injection

| # | Hạng mục | Trạng thái | Bằng chứng / ghi chú |
|---|---|---|---|
| 13 | Kiểm tra dữ liệu đầu vào của chức năng ước lượng | Đạt | Logic kiểm tra đầu vào và các trường hợp không hợp lệ trong bộ kiểm thử |
| 14 | Từ chối dữ liệu không hợp lệ trước khi chấm điểm | Đạt | Automated tests bao gồm các trường hợp hợp lệ và không hợp lệ |
| 15 | Sử dụng truy vấn SQL tham số hóa tại các truy vấn đã rà soát | Đạt | Đã rà soát `db.prepare()` và cách truyền tham số trong `server/api.js`, `server/db.js` |
| 16 | Rà soát các vị trí sử dụng `innerHTML` | Đã rà soát | `curriculum-view.js`: dữ liệu bài học lấy từ dữ liệu tĩnh; `exercise.js`: các vị trí đã kiểm tra sử dụng giá trị cố định hoặc giá trị số do server tính toán |
| 17 | Không phát hiện dữ liệu HTML tùy ý từ người dùng được đưa trực tiếp vào các vị trí `innerHTML` đã rà soát | Đạt trong phạm vi rà soát | Chưa thực hiện kiểm thử XSS chuyên biệt |
| 18 | Thông báo lỗi không trả trực tiếp stack trace hoặc thông tin lỗi nội bộ | Đạt | Đã rà soát các phản hồi HTTP 500 trong `server/api.js`; phản hồi sử dụng thông báo cố định |

## 4. Tài khoản và cấu hình bảo mật

| # | Hạng mục | Trạng thái | Bằng chứng / ghi chú |
|---|---|---|---|
| 19 | Tài khoản mẫu được xác định là dữ liệu demo | Đạt | `README.md` công khai tài khoản giả lập dành cho kiểm thử và trình diễn |
| 20 | Mật khẩu được băm trước khi lưu vào cơ sở dữ liệu | Đạt | `bcrypt.hashSync()` trong `server/api.js`, `server/db.js` |
| 21 | Không ghi cứng giá trị `GOOGLE_CLIENT_ID` và `ADMIN_SECRET` trong các vị trí đã rà soát | Đạt | Hai giá trị được đọc từ biến môi trường |
| 22 | Giới hạn tần suất gửi request (rate limiting) | Chưa triển khai | Chưa phát hiện cơ chế rate limiting trong `server/*.js` |

## 5. Rủi ro còn tồn tại

Các hạn chế của phiên bản hiện tại:

- Chưa triển khai rate limiting cho API.
- Tài khoản mẫu sử dụng mật khẩu mặc định `123456`, chỉ dành cho môi trường kiểm thử và demo; không sử dụng cho tài khoản thật hoặc triển khai công khai.
- Chưa quét toàn bộ lịch sử Git bằng công cụ chuyên dụng để tìm secret từng bị commit.
- Chưa thực hiện kiểm thử XSS chuyên biệt.
- Chưa thực hiện kiểm thử xâm nhập hoặc đánh giá bảo mật toàn diện trên môi trường triển khai thực tế.

## 6. Trạng thái hoàn tất rà soát

Nhóm đã hoàn thành việc rà soát bảo mật trong phạm vi có thể thực hiện cho phiên bản Track B hiện tại.

Các hạn chế chưa được khắc phục được ghi nhận tại mục 5, không được xem là những hạng mục đã kiểm thử hoặc đã xử lý.

Tài liệu này phản ánh kết quả rà soát tại thời điểm 19/11/2026.

## 7. Kết luận

Nhóm N24 đã rà soát các khu vực liên quan đến chức năng Track B, bao gồm dữ liệu mẫu, cấu hình bí mật, truy vấn cơ sở dữ liệu, kiểm tra đầu vào, các vị trí sử dụng `innerHTML` và xử lý lỗi phía máy chủ.

Trong phạm vi đã kiểm tra, chưa phát hiện vấn đề nghiêm trọng rõ ràng. Tuy nhiên, phiên bản hiện tại vẫn còn những hạn chế như chưa triển khai rate limiting, chưa quét toàn bộ lịch sử Git bằng công cụ chuyên dụng và chưa thực hiện kiểm thử xâm nhập.

Ứng dụng được xây dựng phục vụ mục đích học tập và trình diễn hackathon, chưa được đánh giá bảo mật đầy đủ để triển khai công khai trong môi trường thực tế.
