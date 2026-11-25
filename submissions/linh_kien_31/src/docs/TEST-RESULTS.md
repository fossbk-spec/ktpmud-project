# Kết quả kiểm tra bản bàn giao

Ngày: 26–27/10/2026. Môi trường: Linux, Node.js 24.22.1, PGlite 0.5.12, React 19.3.1, Vite 8.3.5. Chưa trực tiếp chạy trên máy Windows của người dùng.

## Kiểm thử tự động backend

`npm test`: **31/31 ca đạt**. Bộ test dựng cơ sở dữ liệu riêng và tự đóng/xóa dữ liệu thử.

1. Đăng ký không tự nâng thành chủ.
2. Đăng nhập và phiên xác thực.
3. Chặn khách/chưa đăng nhập/nhân viên truy cập chức năng chủ.
4. BOM và giỏ không giữ hàng.
5. Đặt đơn giữ hàng, không giảm tồn vật lý.
6. Gửi lại checkout cùng request_key không tạo trùng; khác nội dung bị chặn.
7. Giá chốt trong đơn không đổi; checkout phát hiện giá mới.
8. Chặn truy cập đơn/BOM của người khác.
9. Chặn chuyển trạng thái sai.
10. Không hủy đơn đã xác nhận.
11. Phiếu nháp không tác động tồn.
12. Xác nhận phiếu đồng thời ba lần chỉ ghi một biến động.
13. Không sửa phiếu xác nhận hoặc xuất cùng đơn lần hai.
14. Chỉ tính doanh thu khi hoàn thành và xác nhận thu COD.
15. Hủy giải phóng giữ đúng một lần, giữ lịch sử.
16. Nhập chỉ tăng tồn khi xác nhận; xác nhận lặp không tăng thêm.
17. Chuyển vị trí bảo toàn tổng và có lịch sử hai phía.
18. Phiếu nhiều dòng thất bại không thay đổi bất kỳ số dư nào.
19. Kiểm kê phát hiện số dư cũ và chặn giảm dưới giữ.
20. 20 yêu cầu tranh một đơn vị: chỉ một thành công.
21. Nhân viên có quyền sản phẩm vẫn không sửa giá qua payload.
22. Thu hồi quyền có hiệu lực với phiên đang mở.
23. Khóa tài khoản thu hồi phiên nhưng giữ đơn cũ.
24. Bảo vệ tài khoản chủ, nhật ký không chứa mật khẩu/hash.
25. Chặn số lượng âm và khoảng ngày đảo ngược.
26. Chặn thiếu CSRF header hoặc origin lạ.
27. Gây lỗi sau bước ghi thật: transaction rollback.
28. Sao lưu/khôi phục sang DB trống bảo toàn đơn, kho và tài khoản; chặn restore đè dữ liệu.
29. Xuất được hàng giữ của chính đơn dù tồn khả dụng chung bằng 0.
30. Thêm giỏ đồng thời không mất lần tăng số lượng.
31. Dữ liệu file còn sau đóng/mở DB; khóa ngăn mở hai tiến trình.

## Kiểm tra giao diện bằng Chromium headless

Đã chạy luồng tìm không dấu → so sánh → đăng ký/đăng nhập → thêm giỏ → đặt COD → chủ xác nhận → lập/xác nhận phiếu xuất → đang giao → hoàn thành → đối chiếu báo cáo. Không ghi nhận lỗi JavaScript trong luồng này.

Đã kiểm tra thêm biểu mẫu danh mục/thuộc tính, tạo linh kiện, sửa giá bằng chủ, tạo nhân viên, cấp quyền, nhập kho và tạo/chuyển dòng BOM sang giỏ.

Đã xem ảnh render trang danh mục, tồn kho và báo cáo ở desktop 1440px; danh mục ở 390px không tràn ngang. Đây chưa thay thế toàn bộ nghiệm thu responsive 360/768/1366 và Chrome/Edge/Firefox.

## Build

`npm run build`: thành công. Thư mục `frontend/dist` có sẵn trong ZIP để có thể dùng `npm start` sau khi cài thư viện.

## Chưa kết luận đã đạt

Hiệu năng tập dữ liệu 10.000 mã/50.000 dòng, khảo sát 5 người, RPO24h/RTO4h trên máy thật, triển khai HTTPS thực tế, PostgreSQL server bên ngoài và các trình duyệt khác. Các mục này được nêu trong README và TRACEABILITY, không bị đánh dấu hoàn tất chỉ từ bộ test nhỏ.
