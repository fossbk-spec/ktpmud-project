# Component Lab — Website linh kiện điện tử · Nhóm 31

Mã nguồn cho đề tài **Tra cứu, mua bán và quản lý kho linh kiện điện tử**, dựa trên 25 FR, 35 UC và BR01–BR12 của Chương 2 đã cung cấp. Đây là bản triển khai chạy cục bộ có backend, lưu trữ bền vững và kiểm thử nghiệp vụ; không chỉ là giao diện dữ liệu giả trong trình duyệt.

## 1. Chạy trên Windows — làm lần lượt

1. Giải nén toàn bộ ZIP ra một thư mục mới, ví dụ `D:\CODE\website-linh-kien-full`. Không chép đè ba file mẫu cũ; dự án này có cấu trúc và backend riêng.
2. Mở VS Code → File → Open Folder → chọn thư mục **có file package.json**.
3. Dừng Terminal của website cũ bằng Ctrl+C để tránh trùng cổng 5173.
4. Mở Terminal → chọn **Command Prompt** (tránh lỗi PowerShell chặn npm.ps1).
5. Cài đúng thư viện trong lockfile:

```bat
npm ci
```

6. Khởi động frontend và backend cùng lúc:

```bat
npm run dev
```

7. Mở **http://localhost:5173/**. Nếu Vite chọn cổng khác, hãy dừng ứng dụng khác đang dùng 5173 rồi chạy lại. API chỉ cho phép origin đã cấu hình.
8. Giữ Terminal đang chạy. Lần sau chỉ cần mở thư mục và chạy `npm run dev`; không cài lại thư viện.

Yêu cầu: Node.js 24 trở lên (máy đã có 24.22.1), npm, trình duyệt. Internet cần ở lần `npm ci` đầu tiên. Font Google là tùy chọn; mất mạng dùng Arial. Ảnh/datasheet bên ngoài cần mạng.

## 2. Đăng nhập và dữ liệu mẫu

Lần chạy đầu tạo:
- **Chủ cửa hàng:** `owner@nhom31.local`.
- Mật khẩu ngẫu nhiên được ghi trong **data/first-login.txt** (mở bằng VS Code). Không có mật khẩu chung cố định trong code.
- 8 mã linh kiện, 4 danh mục, 3 vị trí kho, 1 nhà cung cấp mẫu và phiếu nhập tồn đầu kỳ có lịch sử. Giá/tồn/thông số là dữ liệu minh họa; đối chiếu đúng mã/nhà sản xuất trước khi sử dụng thực tế.
- Khách hàng: bấm Đăng nhập → Đăng ký. Đăng ký công khai chỉ tạo vai trò khách hàng.
- Nhân viên: chủ cửa hàng vào Tài khoản & quyền → Tạo nhân viên → Phân quyền. Tài khoản mới chưa có quyền nghiệp vụ.
- Đổi mật khẩu trong Hồ sơ. Đổi mật khẩu sẽ đăng xuất tất cả phiên của tài khoản.

Không chia sẻ `data/first-login.txt`, `.env`, thư mục `data` hoặc bản sao lưu. File ZIP bàn giao không chứa dữ liệu kiểm thử, mật khẩu phát sinh hoặc node_modules.

## 3. Các màn hình

**Khách:** danh mục, tìm mã/tên không dấu, bộ lọc danh mục/giá/tồn/thông số, chi tiết, datasheet/pinout qua URL, so sánh 2–4 mã cùng danh mục, BOM có số lượng/ghi chú, chọn dòng BOM chuyển giỏ, giỏ lưu theo tài khoản, đặt COD, xem/hủy đơn chờ.

**Nhân viên theo quyền:** thêm/sửa thông tin kỹ thuật và trạng thái bán, cấu hình danh mục/thuộc tính/đơn vị, nhà cung cấp, vị trí, xem tồn/giữ/khả dụng, nhập/xuất/chuyển vị trí, lịch sử kho, xác nhận/từ chối đơn và cập nhật giao hàng.

**Chủ:** tất cả nghiệp vụ nhân viên; sửa giá riêng, điều chỉnh sau kiểm kê, tạo/sửa nhân viên, cấp/thu hồi quyền, khóa/mở khách/nhân viên, nhật ký trước–sau, thống kê doanh thu và cấu hình cửa hàng/ngưỡng tồn thấp.

Ảnh, tài liệu và pinout được nhập bằng **liên kết HTTP(S)**. Phiên bản này không có trình tải tệp lên máy chủ. Danh mục/nhà cung cấp/linh kiện được ngừng sử dụng thay vì xóa cứng.

## 4. Demo đầy đủ quy trình

1. Đăng ký khách → thêm PIC16F877A vào giỏ → nhập người nhận/điện thoại/địa chỉ → đặt COD.
2. Kiểm tra đơn Chờ xác nhận. Tồn vật lý chưa giảm; lượng giữ tăng.
3. Đăng nhập chủ hoặc nhân viên có quyền Orders và Shipping → Xử lý đơn → Xác nhận.
4. Lập phiếu xuất từ đơn → chọn vị trí còn đủ tồn → Lưu phiếu nháp.
5. Vào Phiếu nhập–xuất → Xác nhận phiếu. Tồn vật lý và lượng giữ cùng giảm, đơn chuyển Đã xuất kho.
6. Chuyển Đang giao → Hoàn thành / đã thu tiền.
7. Chủ mở Báo cáo bán hàng, chọn khoảng ngày có ngày hoàn thành. Doanh thu dùng đơn giá đã chốt.
8. Thử đơn khác rồi khách hủy lúc Chờ xác nhận: lượng giữ được giải phóng, không tăng tồn vật lý.

Có thể dùng cửa sổ ẩn danh để đăng nhập khách song song với chủ.

## 5. Nhập, xuất và kiểm kê

- Nhập: chọn nhà cung cấp, mã, vị trí, số lượng, giá nhập → lưu nháp → xác nhận.
- Xuất khác: nhập lý do, mã, vị trí, số lượng → nháp → xác nhận; không sử dụng lượng đã giữ cho đơn.
- Xuất theo đơn: toàn bộ đơn một lần. Nếu một mã nằm nhiều vị trí, chia số lượng thành các dòng khác vị trí; tổng phải đúng đơn.
- Chuyển vị trí: chọn đi/đến khác nhau; bảo toàn tổng tồn, ghi hai dòng lịch sử.
- Kiểm kê: chỉ chủ; chọn mã/vị trí, số đếm, lý do và phiếu gốc nếu sửa sai. Số dư tại lúc lập được lưu để kiểm tra khi xác nhận. Nếu tồn đã thay đổi, mở sửa nháp, chọn lại vị trí, kiểm đếm lại rồi lưu.
- Phiếu đã xác nhận bất biến. Muốn sửa sai: tạo phiếu điều chỉnh có tham chiếu phiếu cũ. Không chỉnh trực tiếp CSDL.
- Quyền Inventory cho phép xem số dư/phiếu; Receiving/Shipping mới cho phép xác nhận nhập/xuất. Chủ giữ riêng quyền điều chỉnh, giá và quản trị.

## 6. Cấu trúc code

- `frontend/src/App.jsx`: khung trang, điều hướng và đăng nhập.
- `Catalog.jsx`: danh mục, bộ lọc, so sánh, chi tiết.
- `Customer.jsx`: BOM, giỏ, đơn hàng.
- `Manage.jsx`: quản lý, kho, báo cáo, tài khoản.
- `common.jsx`: form, bảng, lời gọi API; `style.css`: giao diện responsive.
- `server/app.js`: HTTP API, phiên đăng nhập, CSRF, giới hạn thử đăng nhập.
- `server/service.js`: nghiệp vụ và quyền (máy chủ), tất cả lệnh trong transaction.
- `server/schema.sql`: bảng, ràng buộc, chỉ mục.
- `server/db.js`: adapter PostgreSQL/PGlite.
- `server/seed.js`: khởi tạo tài khoản chủ/dữ liệu mẫu một lần.
- `tests/business.test.js`: kiểm thử nghiệp vụ và HTTP.
- `docs/TRACEABILITY.md`: đối chiếu báo cáo với code.

## 7. Cơ sở dữ liệu và phạm vi triển khai

Mặc định **PGlite** chạy PostgreSQL nhúng qua WebAssembly trong tiến trình Node, lưu ở `data/db`. Không cần cài PostgreSQL riêng để học/demo. Đây không phải cơ sở dữ liệu lưu bằng localStorage; tắt/mở web không mất dữ liệu. Chỉ chạy **một tiến trình backend** với cùng thư mục data; khóa tiến trình giúp tránh mở nhầm hai lần.

Để dùng PostgreSQL riêng:
1. Cài PostgreSQL và tạo một database rỗng, ví dụ `nhom31`.
2. Sao chép `.env.example` thành `.env` tại thư mục gốc.
3. Điền `DATABASE_URL=postgresql://ten_user:mat_khau@localhost:5432/nhom31` (URL-encode ký tự đặc biệt trong mật khẩu).
4. Chạy `npm run dev`. Schema và dữ liệu khởi tạo được tạo ở database mới. **Chuyển cấu hình không tự chuyển dữ liệu cũ**; cần backup/restore sang DB trống nếu muốn giữ dữ liệu.

Adapter dùng SQL PostgreSQL chung. PostgreSQL server sử dụng transaction + advisory lock để tuần tự hóa nghiệp vụ; PGlite sử dụng transaction đơn tiến trình. Thiết kế ưu tiên tính đúng cho quy mô đồ án, chưa tối ưu tải lớn. Kiểm thử tự động bàn giao chạy trên PostgreSQL nhúng; cần chạy lại trên PostgreSQL server đích trước triển khai.

## 8. Build và chạy bản đóng gói

```bat
npm run build
npm start
```

Mở **http://localhost:3001/**. Cách này chỉ cần một tiến trình; backend phục vụ luôn giao diện đã build.

Khi triển khai công khai: cấu hình reverse proxy HTTPS, `COOKIE_SECURE=1`, `APP_ORIGIN=https://ten-mien-cua-ban`, HOST phù hợp hạ tầng; cấp quyền DB tối thiểu, sao lưu ngoài máy, đổi tài khoản mẫu và nghiệm thu bảo mật/tải. Bản bàn giao mặc định chỉ lắng nghe loopback máy cá nhân. Khoảng ngày báo cáo dùng múi giờ Asia/Ho_Chi_Minh.

## 9. Sao lưu / khôi phục

Với DB nhúng, dừng web bằng Ctrl+C trước khi chạy lệnh. Không mở hai tiến trình vào cùng data/db.

```bat
npm run backup
```

File JSON nằm trong `backups/`, gồm dữ liệu và mật khẩu đã băm; bảo vệ như dữ liệu nhạy cảm. Không chứa phiên đăng nhập. Nên sao lưu ít nhất mỗi ngày và cất một bản ngoài máy. Chưa tự cài lịch sao lưu Windows.

Khôi phục sang **database trống**, không ghi đè dữ liệu đang có:
1. Dừng web. Giữ nguyên thư mục dữ liệu gốc.
2. Trong `.env`, đặt `DATA_DIR=./data-restored` (hoặc DATABASE_URL tới PostgreSQL trống).
3. Chạy `npm run restore -- backups/ten-file.json`.
4. Chạy web, dùng tài khoản và mật khẩu của bản sao lưu để đối chiếu đơn/phiếu/tồn.

Nếu máy tắt đột ngột và có thông báo khóa tiến trình: chắc chắn mọi tiến trình Node của dự án đã dừng rồi xóa file `.process-lock` trong thư mục DATA_DIR. Không xóa data/db.

## 10. Kiểm thử và giới hạn

```bat
npm test
```

Bộ kiểm thử sử dụng database bộ nhớ riêng, không đụng dữ liệu đang dùng. Xem `docs/TEST-RESULTS.md` để biết phạm vi đã kiểm chứng. Các chỉ tiêu 10.000 mã/50.000 giao dịch/20 phiên, 5 người dùng, RPO/RTO và đa trình duyệt của báo cáo vẫn cần nghiệm thu trên môi trường nhóm; không coi test nghiệp vụ nhỏ là đã đạt tất cả NFR.

Phạm vi đúng báo cáo: một cửa hàng, một kho nhiều vị trí, số lượng nguyên, COD ghi nhận thủ công. Không có thanh toán online, vận chuyển API, AI/chat, hoàn trả sau giao, công nợ, hóa đơn điện tử hoặc lợi nhuận kế toán.

## 11. Lỗi thường gặp

- `npm.ps1 cannot be loaded`: dùng Terminal Command Prompt, hoặc `npm.cmd` thay `npm`.
- `ENOENT package.json`: đang đứng sai thư mục. Mở thư mục gốc có package.json.
- Không kết nối máy chủ: kiểm tra cả hai tiến trình trong Terminal và cổng 3001.
- `EADDRINUSE`: dừng bản web cũ đang chiếm cổng; không xóa dữ liệu.
- Đã sửa nhưng trang chưa đổi: Ctrl+S, mở đúng địa chỉ Terminal, tải lại trang.
- Không thấy chức năng quản lý: kiểm tra vai trò và quyền do chủ cấp; quyền kiểm tra lại trên API mỗi lần.
- Chạy ở thư mục OneDrive có thể làm đồng bộ dữ liệu DB nặng; nên giải nén ở D:\CODE bên ngoài OneDrive.

Có thể nhấp đúp `CHAY-WINDOWS.bat` để tự cài thư viện lần đầu và chạy. Cách dùng Terminal phía trên giúp đọc rõ lỗi hơn khi đang học.
