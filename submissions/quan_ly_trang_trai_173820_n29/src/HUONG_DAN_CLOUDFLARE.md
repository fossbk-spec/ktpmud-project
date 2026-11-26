# Hướng dẫn đưa HaHa lên Cloudflare miễn phí

## Xem nhanh trên máy

Dùng `CHAY_HAHA_LOCAL.bat` hoặc xem `HUONG_DAN_CHAY_LOCAL.md`. Bản local độc lập không sử dụng script preview cũ hoặc cơ sở dữ liệu trực tuyến.

## Trước khi bắt đầu

- Tạo tài khoản tại https://dash.cloudflare.com/
- Cài Node.js 22 hoặc mới hơn. Node.js 24 của bạn dùng được.
- Giải nén thư mục này, rồi mở đúng thư mục `ha-ha-farm-cloudflare` bằng Visual Studio Code.
- Mở **Terminal > New Terminal**. Các lệnh dưới đây chạy trong PowerShell của VS Code.
- Không gửi mật khẩu Cloudflare hoặc mã API cho bất kỳ ai.

## Bước 1 — Cài thư viện

```powershell
npx pnpm@11.25.0 install
```

Chờ lệnh chạy xong và không có dòng lỗi màu đỏ.

## Bước 2 — Đăng nhập Cloudflare

```powershell
npx wrangler login
```

Trình duyệt sẽ mở trang Cloudflare. Bấm **Allow** để cho Wrangler triển khai vào tài khoản của bạn. Nếu trình duyệt không tự mở, chạy:

```powershell
npx wrangler login --device
```

## Bước 3 — Tạo cơ sở dữ liệu D1

```powershell
npx wrangler d1 create ha-ha-farm-db --location apac
```

Cloudflare trả về một dòng `database_id = "..."`. Sao chép phần mã UUID nằm trong dấu ngoặc kép. Mã này không phải mật khẩu.

Ví dụ:

```text
database_id = "12345678-1234-1234-1234-123456789abc"
```

## Bước 4 — Xây dựng web và nối với D1

Thay `DAN-MA-DATABASE-ID-VAO-DAY` bằng UUID vừa sao chép:

```powershell
npx pnpm@11.25.0 run build
$env:CLOUDFLARE_D1_ID="DAN-MA-DATABASE-ID-VAO-DAY"
$env:CLOUDFLARE_D1_NAME="ha-ha-farm-db"
npx pnpm@11.25.0 run cloudflare:prepare
```

Nếu muốn đổi phần đầu đường dẫn, đặt tên Worker trước lệnh chuẩn bị. Chỉ dùng chữ thường, số và dấu gạch ngang:

```powershell
$env:CLOUDFLARE_WORKER_NAME="ha-ha-farm"
```

## Bước 5 — Tạo các bảng dữ liệu

Chỉ cần chạy hai lệnh này **một lần** khi cài đặt lần đầu:

```powershell
npx wrangler d1 execute ha-ha-farm-db --remote --file=drizzle/0000_red_skullbuster.sql
npx wrangler d1 execute ha-ha-farm-db --remote --file=drizzle/0001_empty_vector.sql
```

Khi được hỏi xác nhận, nhập `y` rồi nhấn Enter.

## Bước 6 — Đưa web lên Internet

```powershell
npx pnpm@11.25.0 run cloudflare:deploy
```

Lần đầu Cloudflare có thể yêu cầu tạo tên miền phụ `workers.dev`; hãy chọn một tên dễ nhớ. Khi hoàn tất, terminal sẽ hiện đường dẫn của web.

## Bước 7 — Kiểm tra trước khi gửi cho người khác

1. Mở đường dẫn Cloudflare bằng cửa sổ ẩn danh.
2. Bấm **Chủ trang trại** > **Chưa có tài khoản? Tạo trang trại**.
3. Tạo mã trang trại, tên đăng nhập và mật khẩu chủ trại.
4. Vào **Quản lý nhân viên**, tạo một tài khoản nhân viên.
5. Đăng xuất rồi thử đăng nhập nhân viên.
6. Mở đường dẫn bằng điện thoại dùng 4G/5G để chắc chắn web truy cập được từ Internet.

## Những lần cập nhật sau

Mở PowerShell tại thư mục dự án rồi chạy:

```powershell
npx pnpm@11.25.0 run build
$env:CLOUDFLARE_D1_ID="MA-DATABASE-ID-CUA-BAN"
$env:CLOUDFLARE_D1_NAME="ha-ha-farm-db"
npx pnpm@11.25.0 run cloudflare:prepare
npx pnpm@11.25.0 run cloudflare:deploy
```

Không chạy lại hai file SQL nếu các bảng đã được tạo. Việc cập nhật mã web không xóa dữ liệu trong D1.

## Dữ liệu của bản chatgpt.site

Bản Cloudflare dùng cơ sở dữ liệu D1 riêng nên dữ liệu cũ trên `chatgpt.site` không tự chuyển sang. Nếu bản cũ đã có dữ liệu thật, hãy sao lưu JSON trong **Cài đặt trang trại** trước khi chuyển; sau đó tạo trang trại trên Cloudflare và khôi phục bản sao lưu. Tài khoản đăng nhập cần được tạo lại trên bản Cloudflare.

## Tên miền riêng (không bắt buộc)

Đường dẫn `workers.dev` là đủ để sử dụng. Nếu sau này bạn mua tên miền, vào Cloudflare Dashboard > **Workers & Pages** > chọn Worker `ha-ha-farm` > **Settings** > **Domains & Routes** > **Add Custom Domain**.

## Lỗi thường gặp

- **EPERM khi tạo node_modules:** đóng terminal đang chạy web, đóng File Explorer đang mở trong `node_modules`, tạm dừng phần mềm diệt virus cho đúng thư mục dự án hoặc mở VS Code bằng quyền Administrator rồi chạy lại.
- **Không nhận ra wrangler/pnpm:** luôn dùng đúng lệnh có tiền tố `npx` như hướng dẫn.
- **Thiếu CLOUDFLARE_D1_ID:** đặt lại biến `$env:CLOUDFLARE_D1_ID` trong đúng cửa sổ PowerShell hiện tại.
- **D1_ERROR no such table:** chạy lại hai lệnh ở Bước 5.
- **Tên Worker đã tồn tại:** đặt `$env:CLOUDFLARE_WORKER_NAME` thành tên khác, chạy lại `cloudflare:prepare`, rồi triển khai.
