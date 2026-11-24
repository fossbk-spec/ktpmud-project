# SECURITY & PRIVACY CHECKLIST

Phạm vi rà soát: hồ sơ nộp Track B — Vườn Toán Lớp 3 và chức năng ước lượng trước khi tính đúng.

| Hạng mục | Trạng thái tại bản PC-2 | Ghi chú / việc cần làm |
|---|---|---|
| Dữ liệu học sinh trong fixture | Đã thiết kế theo dữ liệu số tổng hợp | Không dùng dữ liệu cá nhân thật trong 12 phép tính mẫu. |
| API không tiết lộ đáp án trước khi nộp | Cần xác minh tích hợp | Kiểm tra response của API lấy câu hỏi, bảo đảm không trả correct_answer/lower/upper/exact. |
| Kiểm tra dữ liệu đầu vào ở backend | Có unit test cho dữ liệu thiếu, sai kiểu và số âm | Cần kiểm tra thêm giới hạn số lớn và payload không đúng cấu trúc trong API thật. |
| Chấm điểm ở server | Đã đặc tả; cần xác minh tích hợp | Không tin kết quả đúng/sai do frontend gửi lên. |
| Secret/token/API key | Chưa có biên bản quét độc lập toàn bộ repo trong hồ sơ này | Rà soát trước Freeze; không đưa token hoặc mật khẩu vào Git. |
| File .env và thông tin cấu hình riêng tư | Chưa có biên bản rà soát độc lập toàn bộ repo | Kiểm tra cả file bị theo dõi và file mới trước khi nộp. |
| Quyền truy cập và dữ liệu attempts/progress | Cần kiểm thử tích hợp | Xác minh người học chỉ xem/sửa dữ liệu thuộc tài khoản của mình. |
| Dữ liệu cá nhân trong README, artifacts và slide | Cần rà soát trước Freeze | Chỉ dùng mã nhóm/alias; không đưa MSSV hoặc thông tin cá nhân vào nội dung không cần thiết. |
| Phụ thuộc có cảnh báo bảo mật | Có cảnh báo trong lần CI | `npm ci` báo 2 vulnerabilities (1 moderate, 1 high); cần chạy `npm audit`, đánh giá phạm vi ảnh hưởng và ghi nhận cách xử lý trước bản cuối. |

## Kết luận

Đây là checklist sơ bộ cho PC-2, không phải chứng nhận đã hoàn tất kiểm toán bảo mật. Các mục ghi “Cần xác minh” phải được kiểm tra và cập nhật bằng bằng chứng thực tế trước Freeze.
