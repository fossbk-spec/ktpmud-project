# Đối chiếu với Chương 2

Nguồn: “Chuong_2_Phan_tich_yeu_cau_va_Use_Case.docx”, phiên bản đọc ngày 26/10/2026. Cấu trúc 25 FR, 35 UC, 12 BR. Thông số seed là dữ liệu minh họa, không phải khảo sát cửa hàng thực tế.

| FR | UC | Giao diện / API xử lý |
|---|---|---|
| 01 | 01–04 | Đăng ký khách, đăng nhập, đăng xuất, Hồ sơ; /api/register, login, logout; profile |
| 02 | 05 | Catalog: mã/tên, danh mục, giá, tồn, thuộc tính; dữ liệu từ /api/state |
| 03 | 06–07 | Chi tiết thông số, ảnh URL, datasheet/pinout URL |
| 04 | 08 | So sánh 2–4 mã cùng danh mục, trường thiếu “Chưa có” |
| 05 | 09,35 | BOM: bom.save/delete/toCart, sở hữu theo user_id, chọn từng dòng |
| 06 | 10 | Giỏ hàng: cart.save, cộng mã trùng, lượng nguyên, giá hiện hành |
| 07 | 11,32 | order.create: kiểm giá/tồn, snapshot giá, khóa transaction, request_key |
| 08 | 12–14 | Đơn của tôi; order.status(cancelled); chỉ đơn của mình và đang chờ |
| 09 | 15 | Quản lý linh kiện: product.save, không sửa giá, không xóa cứng |
| 10 | 16 | category.save: bộ thuộc tính và đơn vị bằng dữ liệu cấu hình |
| 11 | 17 | price.save: chỉ chủ, audit trước–sau |
| 12 | 18 | Tồn kho & cảnh báo: thực tế, giữ, khả dụng, ngưỡng từ settings |
| 13 | 19 | location.save, voucher transfer với 2 dòng lịch sử và tổng không đổi |
| 14 | 20,33,34 | Phiếu in: nhà cung cấp, số lượng, vị trí, giá nhập; nháp/xác nhận |
| 15 | 21,32–34 | Phiếu sale/out: kiểm lượng, vị trí, giữ của đơn, không xuất lặp |
| 16 | 22,33,34 | Phiếu adjust: chủ, số đếm và số dư đối chiếu, lý do/tham chiếu |
| 17 | 23 | movements: kỳ, lọc văn bản mã/loại/người; phiếu và tham chiếu đơn |
| 18 | 24 | supplier.save, ngừng dùng, liệt kê phiếu nhập liên quan |
| 19 | 25 | Xử lý đơn: xác nhận/từ chối, lập phiếu xuất, đang giao, hoàn thành COD |
| 20 | 26 | user.save: tạo/sửa nhân viên, không tạo chủ qua giao diện |
| 21 | 27 | user.active: lý do, version chống sửa cũ, thu hồi phiên ngay |
| 22 | 28 | user.permissions: allowlist quyền, kiểm tra lại từ DB mỗi request |
| 23 | 29 | audit: người, thời điểm, thao tác, đối tượng, trước–sau; không có API sửa |
| 24 | 30 | report: đơn completed theo completed_at, snapshot giá, bán theo mã, đối chiếu đơn, tồn hiện tại |
| 25 | 31 | settings.save: tên/địa chỉ/điện thoại/ngưỡng tồn thấp, audit |

## Bất biến nghiệp vụ

- BR01: sessions trong DB; giỏ/BOM/đơn có user_id; không dùng dữ liệu client để xác nhận quyền.
- BR02: permit/owner/customer chạy trên máy chủ; giao diện chỉ là lớp hỗ trợ thao tác.
- BR03–06: lượng giữ được tính từ dòng đơn trạng thái pending/confirmed. Nhờ đó chỉ có một nguồn dữ liệu giữ hàng. Transaction tuần tự hóa kiểm tồn + tạo đơn hoặc cập nhật phiếu/trạng thái. Hủy/từ chối thay trạng thái nên giải phóng lượng giữ đúng một lần.
- BR05: xuất sale đối chiếu toàn bộ dòng với đơn confirmed và tồn từng vị trí. Không kiểm khả dụng chung để từ chối chính hàng đã giữ. Một phiếu sale cho mỗi đơn bằng unique index.
- BR07: nháp không ghi movements; xác nhận ghi stock, movements, voucher và order trong một transaction. Không có API xóa/chỉnh phiếu confirmed.
- BR08: sản phẩm dùng numeric giá nguyên VNĐ; order.lines lưu price/name/sku/unit tại lúc đặt. Sửa giá riêng chỉ chủ và có audit.
- BR09: BOM là danh sách riêng, không đặt giữ. So sánh cùng category, không tự kết luận thay thế tương thích.
- BR10: stock khóa chính (product_id,location_id); transfer ghi hai phía; adjust kiểm expected và tổng không dưới giữ.
- BR11: chỉ sửa trạng thái khách/nhân viên; không thao tác chủ. Phiên bị khóa bị xóa; quyền được đọc lại mỗi request.
- BR12: doanh thu tiền hàng từ completed_at; không tính đơn hủy/chờ/đang giao, không tự tính lợi nhuận.

## Thiết kế dữ liệu

Các bảng: users, sessions, categories, products, suppliers, locations, stock, carts, boms, orders, vouchers, movements, audit, settings. Dòng BOM/giỏ/đơn/phiếu và thuộc tính kỹ thuật lưu JSONB có kiểm tra phía máy chủ. Dòng đơn là snapshot bất biến sau khi tạo; phân bổ giữ được suy ra từ trạng thái thay vì có một bảng reservation riêng. Đây là lựa chọn triển khai cho quy mô đồ án, vẫn đáp ứng các bất biến của báo cáo.

Không xóa cứng danh mục/nhà cung cấp/sản phẩm trên API. Khóa ngoại bảo vệ các thực thể lõi; JSONB product_id được kiểm tra trước ghi. Mọi mutation nghiệp vụ đi qua service trong transaction.

## Phần cần nghiệm thu trên môi trường thực tế

- Hiệu năng 10.000 mã / 50.000 giao dịch / 20 phiên: chưa đo. Catalog hiện tải danh sách để lọc phía client, cần phân trang/tìm kiếm SQL khi dữ liệu lớn.
- Khả năng dùng bởi 5 người, Chrome/Edge/Firefox: cần nhóm tổ chức thử thực tế.
- HTTPS: chỉ cấu hình khi triển khai; mặc định localhost HTTP.
- Sao lưu hằng ngày: có script, chưa cài lịch tự động. Restore đã test trên DB trống với tập dữ liệu nhỏ; RPO24h/RTO4h chưa nghiệm thu thực địa.
- PostgreSQL server adapter: cần kiểm thử lại trên máy chủ đích. Bộ test bàn giao dùng PGlite.
- Hình ảnh/tài liệu dùng URL; không có quản lý upload file nội bộ.
- Các tính năng ngoài phạm vi không được thêm vào như chức năng đã triển khai.
