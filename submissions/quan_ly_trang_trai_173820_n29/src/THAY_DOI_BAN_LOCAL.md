# Những thay đổi trong bản local độc lập

## Đã loại khỏi gói giao

- `node_modules`: thư viện cài lại từ `pnpm-lock.yaml`.
- `.next`, `.vinext`, `dist`: kết quả build có thể tạo lại.
- `.sites-runtime`: kho tạm của môi trường phát triển.
- `.wrangler`, `.wrangler-config`, `.wrangler-local`: trạng thái và database
  local cũ của máy chủ dự án.
- `preview`, `dev-server.log`, `dev-server-error.log`, `tsconfig.tsbuildinfo`:
  phần thử nghiệm hoặc file tạm không cần cho bản chạy chính.
- `.env`, `.dev.vars`, khóa và thông tin đăng nhập: không đưa vào gói chia sẻ.
- `scripts/dev-ui.mjs` và `vite.ui.config.ts`: công cụ preview phụ thuộc thư mục
  `preview` đã được loại bỏ.

## Đã bổ sung

- `CHAY_HAHA_LOCAL.bat`: chạy nhanh trên Windows.
- `scripts/run-local.mjs`: tự cài thư viện, build, khởi tạo D1 local và mở web.
- `scripts/local-schema.sql`: tạo schema database local theo cách có thể chạy
  lặp lại an toàn.
- `README.md` và `HUONG_DAN_CHAY_LOCAL.md`: hướng dẫn sử dụng và xử lý lỗi.
- `.local-data/` trong `.gitignore`: tách dữ liệu của từng máy khỏi mã nguồn.

## Đã điều chỉnh

- `package.json`: lệnh `start`/`local` chạy bộ local mới.
- Database local được cố định trong `.local-data` để không bị mất khi build lại.
- Server chỉ nghe tại `127.0.0.1:8787`, không mở công khai ra mạng Internet.

Không thay đổi nghiệp vụ quản lý trang trại, dữ liệu mẫu, báo cáo, phân quyền
chủ trại/nhân viên hoặc giao diện của phiên bản nguồn được nhận.
