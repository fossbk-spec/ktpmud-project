# Đặc tả yêu cầu MVP — Component Lab, Nhóm 31

## Mục tiêu
Xây dựng website tra cứu thông tin kỹ thuật, mua bán và quản lý kho linh kiện điện tử, phục vụ khách hàng, nhân viên và chủ cửa hàng.

## Các nhóm chức năng
- Tra cứu mã/tên, danh mục, giá, tình trạng tồn, thông số; xem datasheet và so sánh.
- Tài khoản, đăng nhập, lưu BOM, giỏ hàng và đặt COD.
- Theo dõi/hủy đơn chờ, xử lý đơn và trạng thái giao hàng.
- Quản lý linh kiện, danh mục, nhà cung cấp, vị trí, nhập/xuất và lịch sử kho.
- Quản lý tài khoản nhân viên, phân quyền, nhật ký, báo cáo và cấu hình.

## Điều kiện nghiệp vụ quan trọng
Tồn khả dụng = tồn vật lý - lượng giữ. Đặt đơn tạo phân bổ nguyên tử và chưa trừ tồn thực tế. Xác nhận phiếu mới thay đổi tồn, lịch sử và trạng thái. Không xác nhận xuất lặp hay cho tồn âm. Dữ liệu BOM, giỏ và đơn thuộc tài khoản. Nhân viên không tự cấp quyền; giá bán do chủ quản lý.

## Tài liệu đối chiếu
Tổng hợp từ thiết kế và mã nguồn của nhóm: `src/docs/TRACEABILITY.md` đối chiếu 25 FR và 35 UC; `src/server/schema.sql` mô tả 14 bảng; `src/tests/business.test.js` là kiểm thử tự động.

## Giới hạn
Một cửa hàng, một kho nhiều vị trí, thanh toán COD; không có thanh toán trực tuyến, API vận chuyển, hóa đơn điện tử và chức năng AI.
