# Mã nguồn PinkBook Manager

## Nguồn mã
Mã nguồn được sao chép từ repository:
https://github.com/daohailinh10-code/tao-web-quan-li
Nhánh nguồn: `fix/pinkbook-local-database`.

## Cấu trúc
- `package.json`, `package-lock.json`: cấu hình và khóa phụ thuộc.
- `frontend/`: ứng dụng React/Vite, các màn hình sách, bán hàng, khách hàng, nhân viên và thống kê.
- `server/`: Express API, xử lý nghiệp vụ, bảo mật, cơ sở dữ liệu và schema.
- `scripts/`: script chạy, dừng, sao lưu, khôi phục và di chuyển dữ liệu cục bộ.
- `tests/runtime.test.js`: bộ kiểm thử runtime.
- `.env.example`: mẫu biến môi trường; không chứa thông tin bí mật.

## Yêu cầu
- Node.js `>=22.12.0`.
- npm.
- Không bắt buộc cài PostgreSQL nếu sử dụng PGlite mặc định.
- Nếu dùng PostgreSQL ngoài, thiết lập `DATABASE_URL`.

## Cài đặt và chạy
Mở terminal tại thư mục `submissions/sach_173820_n33/src/`, sau đó chạy:

```bash
npm ci
npm test
npm run dev
```

Để chạy ở chế độ start:

```bash
npm start
```

Backend mặc định chạy tại `http://127.0.0.1:3001`; Vite dev server chạy tại `http://127.0.0.1:5173` và proxy API sang backend.

## An toàn dữ liệu
- Chỉ dùng dữ liệu demo/synthetic khi kiểm thử.
- Không commit `.env`, mật khẩu, token, file database hoặc dữ liệu cá nhân.
- Cấu hình thật phải được cung cấp qua biến môi trường ở máy triển khai.
- Không tải thư mục `data/` hoặc `backups/` lên repository.

## Kiểm thử
`npm test` chạy Node.js test runner và build frontend. Cần chạy lại lệnh này trên commit cuối cùng và lưu log thực tế vào hồ sơ nghiệm thu.
