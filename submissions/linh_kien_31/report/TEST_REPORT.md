# Test Report — Component Lab
Nguồn: `src/docs/TEST-RESULTS.md` (bản bàn giao ngày 26–27/10/2026).

- Lần chạy trước ghi nhận **31/31** ca backend thành công trên Node.js 24.22.1, PGlite 0.5.12.
- Đã chạy luồng trình duyệt Chromium headless từ tìm kiếm đến thanh toán COD, xác nhận xuất kho và hoàn thành đơn.
- `npm run build` được ghi nhận thành công vào đợt kiểm tra cũ.
- Các hạng mục **chưa nghiệm thu**: thử trên Edge/Firefox và Windows, đo tải lớn, PostgreSQL server, sao lưu định kỳ và RPO/RTO.

**Để xác nhận kết quả trên bản nộp:** vào `src/`, chạy `npm ci`, `npm test`, `npm run build`; lưu log/ảnh làm minh chứng mới. Không coi kết quả cũ là kiểm thử đã chạy cho commit hiện tại.
