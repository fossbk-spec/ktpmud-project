# Dàn ý slide thuyết trình – PinkBook Manager

## Slide 1 – Trang bìa
- PinkBook Manager
- Hệ thống quản lý cửa hàng sách
- Lớp 173820 – Nhóm N33
- MSSV: 202414217, 202413991

## Slide 2 – Bối cảnh và vấn đề
- Quản lý sách, bán hàng, kho, khách hàng và nhân viên bằng các thao tác rời rạc dễ gây sai lệch.
- Khó theo dõi tồn kho và tổng hợp doanh thu nếu dữ liệu không tập trung.
- Cần một hệ thống thống nhất, dễ thao tác và có phân quyền.

## Slide 3 – Mục tiêu
- Tập trung dữ liệu nghiệp vụ cửa hàng.
- Giảm thao tác thủ công khi bán hàng và quản lý kho.
- Hỗ trợ chăm sóc khách hàng thành viên.
- Cung cấp thông tin tổng quan cho quản lý.

## Slide 4 – Công nghệ
- React + Vite: giao diện.
- Node.js + Express: backend API.
- PGlite/PostgreSQL: lưu trữ dữ liệu.
- Node test runner: kiểm thử.

## Slide 5 – Kiến trúc
- Người dùng → giao diện web → REST API → lớp nghiệp vụ → cơ sở dữ liệu.
- Phân quyền ở backend; frontend chỉ hiển thị chức năng tương ứng vai trò.

## Slide 6 – Các phân hệ
- Quản lý sách.
- Bán hàng và hóa đơn.
- Khách hàng và tích điểm.
- Nhân viên, lịch làm và chấm công.
- Thống kê.

## Slide 7 – Demo luồng bán hàng
- Tìm sách → thêm vào giỏ → chọn khách lẻ/khách thành viên → thanh toán → cập nhật dữ liệu.

## Slide 8 – Bảo mật và toàn vẹn dữ liệu
- Xác thực và quản lý phiên.
- Phân quyền thao tác.
- Kiểm tra dữ liệu đầu vào.
- Giao dịch cơ sở dữ liệu và nhật ký thao tác.

## Slide 9 – Kiểm thử
- Trình bày lệnh `npm test`.
- Đưa số liệu kiểm thử thực tế, log build và các ca kiểm thử tiêu biểu.
- Không trình bày kết quả lịch sử như kết quả vừa chạy nếu chưa chạy lại trên bản bàn giao.

## Slide 10 – Kết luận và hướng phát triển
- Tổng kết phạm vi đã hoàn thành.
- Nêu hạn chế còn tồn tại.
- Định hướng: hoàn thiện báo cáo C4, tăng kiểm thử giao diện, tối ưu trải nghiệm và triển khai thực tế.
