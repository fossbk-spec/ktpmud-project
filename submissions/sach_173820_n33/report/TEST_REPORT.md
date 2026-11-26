# Báo cáo kiểm thử – PinkBook Manager

## 1. Phạm vi
Kiểm thử tập trung vào API/backend, giao diện chính, luồng bán hàng, quản lý kho, phân quyền, dữ liệu và khả năng build frontend.

## 2. Môi trường tham chiếu
- Node.js: yêu cầu trong dự án `>=22.12.0`.
- Frontend: React 19, Vite 8.
- Backend: Express 5.
- Database: PGlite hoặc PostgreSQL.
- Lệnh kiểm thử dự án: `npm test` (chạy Node test runner và build frontend).

## 3. Kết quả đã ghi nhận
Tài liệu kiểm thử trong repository mã nguồn ghi nhận:
- Bộ kiểm thử backend: 31/31 ca đạt trong lần kiểm thử được ghi ngày 26–27/10/2026.
- Luồng giao diện được kiểm tra bằng Chromium Headless: tìm kiếm sách, xem chi tiết, đăng ký/đăng nhập, thêm giỏ, đặt đơn, xác nhận đơn, xử lý kho, hoàn tất và đối chiếu doanh thu.
- Build frontend bằng Vite thành công trong lần kiểm thử được ghi nhận.
- Tài liệu nguồn: `docs/test-result.md` trong repository PinkBook Manager.

Ngoài ra, lịch sử làm việc của nhóm ghi nhận lần chạy `npm test` ngày 23/11/2026 hoàn tất: runtime test đạt và Vite build thành công. Nhóm cần chạy lại trên đúng commit nộp cuối cùng để xác nhận kết quả.

## 4. Danh sách kiểm thử đề xuất cho nghiệm thu
| ID | Kịch bản | Kết quả mong đợi |
|---|---|---|
| TC-01 | Đăng nhập bằng tài khoản hợp lệ | Tạo phiên và vào đúng vai trò |
| TC-02 | Đăng nhập sai mật khẩu | Hiển thị lỗi, không tạo phiên |
| TC-03 | Nhân viên truy cập chức năng quản lý giá | Backend từ chối |
| TC-04 | Tìm kiếm sách theo mã/tên | Trả về danh sách phù hợp |
| TC-05 | Thêm sách mới với dữ liệu hợp lệ | Sách xuất hiện trong danh mục |
| TC-06 | Bán số lượng vượt tồn kho | Backend từ chối giao dịch |
| TC-07 | Thanh toán cho khách thành viên | Hóa đơn được ghi nhận và tính điểm |
| TC-08 | Nhập kho hợp lệ | Tồn kho tăng đúng số lượng |
| TC-09 | Tìm khách hàng theo số điện thoại | Hiển thị đúng hồ sơ |
| TC-10 | Xem báo cáo doanh thu | Số liệu khớp với giao dịch hợp lệ |

## 5. Hạn chế
- Kết quả lịch sử không thay thế việc chạy kiểm thử lại trên commit nộp cuối.
- Cần lưu log đầu ra `npm test` và ảnh chụp màn hình minh chứng.
- Cần kiểm thử bổ sung trên trình duyệt/màn hình thực tế và dữ liệu synthetic độc lập.
