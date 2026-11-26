# KẾ HOẠCH TRIỂN KHAI HỆ THỐNG SOCCER BOOKER (GITHUB PAGES STATIC SPA)
**Phạm vi:** Nhánh 1 (Tài khoản), Nhánh 2 (Đặt sân, Giữ chỗ 4h, Cọc & Đánh giá), Nhánh 4 (Quản lý sân & Doanh thu) — *Ngoài phạm vi: Nhánh 3 (Giải đấu)*  
**Nền tảng chạy chính thức:** Static Web App deploy trực tiếp trên **GitHub Pages** (`https://<user>.github.io/KTPMUD-demo/#/`) với **Browser Storage Engine (`localStorage`)** — không phụ thuộc database hay dịch vụ bên thứ 3.

---

## 1. KIẾN TRÚC TRIỂN KHAI
1. **Frontend SPA (`frontend/`):** React 19 + TypeScript + Vite 8 (`base: "./"`, `HashRouter`, `React.lazy` tách chunk).
2. **Tầng lưu trữ tại trình duyệt (`frontend/src/shared/api/localMockAdapter.ts`):**
   - Đóng vai trò REST API + Database in-browser qua `apiClient.defaults.adapter`.
   - Nạp sẵn 10 cụm sân Hà Nội (15 sân con, 6 khung giờ chuẩn `06:00–22:00`, đơn mẫu, đánh giá, bình luận, dịch vụ sân, nhật ký hoạt động).
   - Bảo toàn dữ liệu thao tác của người dùng trong `localStorage`.
3. **CI/CD GitHub Pages (`.github/workflows/deploy-gh-pages.yml`):**
   - Tự động build `frontend` (`VITE_USE_MOCK_DB=true npm run build`) và deploy `frontend/dist` lên GitHub Pages mỗi khi push nhánh `main`.

---

## 2. LỘ TRÌNH THỰC HIỆN (ĐÃ HOÀN THÀNH MVP TUẦN 11)
- **Bước 1:** Làm sạch thương hiệu & cập nhật thông tin Nhóm 04 (`202414021`, `20233605`, `202414018`).
- **Bước 2:** Chuẩn hóa dữ liệu 10 cụm sân Hà Nội, 6 khung giờ chuẩn (`06:00–22:00`), tìm kiếm không dấu & bản đồ OpenStreetMap.
- **Bước 3:** Xây dựng `localMockAdapter.ts` đáp ứng toàn bộ endpoint Nhánh 1, 2, 4 (Auth/Profile, Availability, 4h Hold Booking, Deposit Report, Owner Confirm/Settle/Schedule/Dashboard, Reviews/Comments, Notifications, Activity Logs).
- **Bước 4:** Cấu hình `HashRouter` + Vite relative `base: "./"` + code-splitting (`195 kB` main bundle) + GitHub Actions workflow `.github/workflows/deploy-gh-pages.yml`.
- **Bước 5:** Kiểm thử tự động toàn bộ bằng Vitest + build production (`tsc -b && vite build`) và cập nhật gói nộp bài `submissions/dat_san_bong_173820_n04/`.
