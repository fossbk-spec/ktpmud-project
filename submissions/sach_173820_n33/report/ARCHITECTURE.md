# Mô tả kiến trúc hệ thống – PinkBook Manager

## 1. Tổng quan
Hệ thống được tổ chức theo kiến trúc frontend–backend. Trình duyệt tải ứng dụng React; các thao tác nghiệp vụ gọi REST API do Express cung cấp; backend xác thực người dùng, kiểm tra quyền, thực thi logic nghiệp vụ và truy cập cơ sở dữ liệu.

## 2. Các khối chính
- **Presentation layer:** React components, workspace và CSS; hiển thị danh mục sách, bán hàng, khách hàng, nhân viên và thống kê.
- **API layer:** Express routes trong backend; xử lý request/response, cookie phiên, kiểm tra nguồn yêu cầu và giới hạn tần suất một số endpoint.
- **Business/service layer:** các hàm nghiệp vụ trong `server/service.js`; xử lý sách, đơn hàng, tồn kho, khách hàng, người dùng, lịch làm và audit log.
- **Data access layer:** `server/db.js`; cung cấp truy vấn và transaction trên PGlite hoặc PostgreSQL.
- **Database:** schema SQL định nghĩa người dùng, phiên, sản phẩm, thể loại, kho, đơn hàng, khách hàng, nhân viên và các bảng nghiệp vụ liên quan.

## 3. Luồng dữ liệu tiêu biểu
### 3.1 Đăng nhập
1. Người dùng nhập số điện thoại và mật khẩu trên giao diện.
2. Frontend gửi request đến `POST /api/login`.
3. Backend xác thực thông tin, kiểm tra trạng thái tài khoản và tạo phiên.
4. Trình duyệt nhận cookie phiên; các request tiếp theo gửi cookie để backend xác định người dùng.

### 3.2 Bán hàng tại quầy
1. Nhân viên tìm sách và thêm mặt hàng vào giỏ.
2. Giao diện gửi danh sách sản phẩm/số lượng đến API bán hàng.
3. Backend kiểm tra tồn kho và dữ liệu khách hàng, tính tổng tiền/điểm.
4. Giao dịch được ghi vào cơ sở dữ liệu; giao diện hiển thị kết quả hóa đơn.

### 3.3 Quản lý kho
1. Quản lý chọn sản phẩm và số lượng nhập.
2. Backend kiểm tra dữ liệu và ghi nhận biến động kho.
3. Số lượng khả dụng được tính từ tồn thực tế trừ số lượng đang giữ (nếu nghiệp vụ áp dụng).
4. Lịch sử biến động được lưu để phục vụ tra cứu.

## 4. Bảo mật
- Mật khẩu được xử lý bằng hàm băm trong module security.
- Cookie phiên được cấu hình HttpOnly và SameSite.
- Backend kiểm tra vai trò/quyền trước khi thực hiện thao tác nhạy cảm.
- Có kiểm tra header xác nhận request và origin cho request ghi dữ liệu.
- Không đưa file dữ liệu cá nhân, `.env` hoặc thông tin đăng nhập vào bản nộp.

## 5. Triển khai và cấu hình
- Frontend build bằng Vite.
- Backend chạy bằng Node.js/Express.
- PGlite được dùng làm cơ sở dữ liệu cục bộ mặc định; PostgreSQL ngoài có thể cấu hình qua `DATABASE_URL`.
- Thư mục dữ liệu được cấu hình bằng `DATA_DIR`; cổng chạy qua `PORT`.

## 6. Sơ đồ ngữ cảnh (mô tả)
- Chủ cửa hàng/quản lý và nhân viên tương tác với ứng dụng web.
- Ứng dụng web gọi backend API.
- Backend truy cập cơ sở dữ liệu và trả dữ liệu về giao diện.
- Quản lý sử dụng các chức năng quản trị, nhân viên sử dụng các chức năng được phân quyền.

## 7. Điểm cần hoàn thiện khi nghiệm thu
Cần bổ sung sơ đồ C4 dạng hình (Context/Container/Component), xác nhận các endpoint theo phiên bản triển khai cuối và kiểm tra lại các chức năng có dữ liệu demo/cấu hình cục bộ.
