# Hướng dẫn chạy HaHa Farm độc lập trên máy Windows

## 1. Yêu cầu

- Windows 10 hoặc Windows 11.
- Node.js 22.13 trở lên. Khuyên dùng bản Node.js 22 LTS.
- Internet trong lần chạy đầu để tải thư viện.

Không cần tài khoản Cloudflare, không cần `wrangler login` và không sử dụng
database của website đang chạy trên Internet.

## 2. Cách chạy

1. Giải nén toàn bộ file ZIP vào một thư mục bình thường.
2. Mở thư mục `HaHaFarm-Local-DocLap`.
3. Nhấp đúp `CHAY_HAHA_LOCAL.bat`.
4. Lần đầu, chương trình tự cài thư viện, build web và tạo database local.
5. Khi hoàn tất, trình duyệt tự mở tại http://127.0.0.1:8787.

Không đóng cửa sổ màu đen khi đang sử dụng. Muốn dừng web, đóng cửa sổ đó hoặc
nhấn `Ctrl+C`.

## 3. Tạo dữ liệu riêng

Ở màn hình đăng nhập, bạn của bạn có thể:

- Dùng thử bằng dữ liệu mẫu; hoặc
- Chọn tạo trang trại và đăng ký tài khoản chủ trại mới.

Tất cả tài khoản, đàn gà, kho, thu chi và nhật ký được lưu trong `.local-data`
trên máy đó. Chúng không đồng bộ và không ảnh hưởng đến website của bạn.

## 4. Chạy những lần sau

Tiếp tục nhấp đúp `CHAY_HAHA_LOCAL.bat`. Database cũ được giữ nguyên trong
`.local-data`.

## 5. Sao lưu hoặc chuyển máy

- Dừng web trước.
- Sao chép cả thư mục `.local-data` sang nơi an toàn.
- Khi chuyển máy, đặt `.local-data` vào đúng thư mục dự án đã giải nén.

Bạn cũng có thể dùng chức năng **Sao lưu dữ liệu** trong phần cài đặt của web.

## 6. Lỗi thường gặp

### Không nhận lệnh `node`

Cài Node.js 22 LTS từ https://nodejs.org/, sau đó khởi động lại máy hoặc mở lại
thư mục và chạy file BAT.

### Cổng 8787 đang được sử dụng

Đóng cửa sổ HaHa Farm cũ rồi chạy lại. Nếu trình duyệt đã mở được
http://127.0.0.1:8787 thì web đang chạy và không cần mở thêm một bản nữa.

### Cài thư viện thất bại

Kiểm tra Internet rồi chạy lại `CHAY_HAHA_LOCAL.bat`. Không cần tự tạo
`node_modules`; chương trình sẽ cài đúng phiên bản từ `pnpm-lock.yaml`.

### Muốn làm mới hoàn toàn

Trước tiên sao lưu dữ liệu nếu còn cần. Sau đó dừng web và đổi tên thư mục
`.local-data`. Lần chạy tiếp theo sẽ tạo một database mới. Không xóa nhầm thư
mục dữ liệu của dự án gốc.
