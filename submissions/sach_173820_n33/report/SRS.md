# Đặc tả yêu cầu phần mềm (SRS)
## PinkBook Manager – Hệ thống quản lý cửa hàng sách

### 1. Mục đích
Tài liệu mô tả các yêu cầu chức năng và phi chức năng của hệ thống PinkBook Manager. Hệ thống hỗ trợ số hóa các hoạt động quản lý sách, bán hàng, kho, khách hàng và nhân viên tại cửa hàng.

### 2. Phạm vi
Hệ thống gồm giao diện web cho chủ cửa hàng/quản lý và nhân viên, backend cung cấp REST API, cùng cơ sở dữ liệu lưu trữ thông tin nghiệp vụ. Các chức năng quản lý giá và tài khoản nhân viên được giới hạn theo quyền.

### 3. Nhóm người dùng
- **Chủ cửa hàng/Quản lý:** quản lý danh mục sách, giá, nhập kho, nhân viên, báo cáo và cấu hình.
- **Nhân viên:** tra cứu sách, thực hiện nghiệp vụ bán hàng và các tác vụ được cấp quyền.
- **Khách hàng:** thông tin khách hàng/thành viên được lưu để phục vụ chăm sóc khách hàng và tích điểm; không mặc định được truy cập giao diện quản trị.

### 4. Yêu cầu chức năng
| Mã | Yêu cầu |
|---|---|
| FR-01 | Đăng nhập, đăng xuất bằng số điện thoại và mật khẩu. |
| FR-02 | Phân quyền thao tác theo vai trò chủ cửa hàng và nhân viên. |
| FR-03 | Thêm, xem, cập nhật và tìm kiếm sách theo mã, tên, tác giả. |
| FR-04 | Quản lý thể loại và thông tin mô tả sách. |
| FR-05 | Quản lý giá bán theo quyền được cấp. |
| FR-06 | Theo dõi tồn kho và ghi nhận nhập sách. |
| FR-07 | Tạo giỏ hàng, lập hóa đơn và thanh toán tại quầy. |
| FR-08 | Lưu thông tin khách hàng và tra cứu hồ sơ. |
| FR-09 | Tính điểm thành viên theo giao dịch đủ điều kiện. |
| FR-10 | Quản lý tài khoản nhân viên và trạng thái duyệt/kích hoạt. |
| FR-11 | Xếp ca, ghi nhận giờ vào/ra và tổng hợp công. |
| FR-12 | Thống kê doanh thu, kho, khách hàng và nhân viên. |
| FR-13 | Ghi nhận nhật ký các thao tác quan trọng và hỗ trợ sao lưu/khôi phục dữ liệu. |

### 5. Yêu cầu phi chức năng
- **Bảo mật:** mật khẩu phải được băm; cookie phiên có thuộc tính bảo mật; kiểm tra quyền ở backend; không đưa bí mật vào Git.
- **Toàn vẹn dữ liệu:** các thao tác cập nhật nhiều bảng cần nằm trong transaction; không cho phép số lượng kho âm.
- **Khả dụng:** giao diện có thể sử dụng trên màn hình desktop và thiết bị di động phổ biến.
- **Hiệu năng:** tìm kiếm và thao tác thông thường cần phản hồi trong thời gian phù hợp với quy mô cửa hàng.
- **Bảo trì:** mã nguồn phân chia frontend, backend, nghiệp vụ và kiểm thử.
- **Khôi phục:** có quy trình sao lưu và khôi phục dữ liệu.

### 6. Ràng buộc và giả định
- Ứng dụng cần Node.js tương thích với yêu cầu trong `package.json`.
- Cấu hình kết nối PostgreSQL có thể được cung cấp qua `DATABASE_URL`; nếu không, ứng dụng sử dụng PGlite cục bộ.
- Dữ liệu demo chỉ dùng để minh họa, không phải dữ liệu khách hàng thực.
- Các quy tắc tính điểm, quyền nhân viên và quy trình kho cần được giảng viên/chủ cửa hàng xác nhận khi nghiệm thu.

### 7. Tiêu chí nghiệm thu
Mỗi yêu cầu FR phải có ít nhất một ca kiểm thử tương ứng; các luồng đăng nhập, quản lý sách, bán hàng, cập nhật tồn kho, tích điểm và báo cáo phải được chạy thử trên bản triển khai cuối.
