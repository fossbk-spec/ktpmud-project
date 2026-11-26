# KẾ HOẠCH KIỂM THỬ VÀ NGHIỆM THU BẢN DEMO (TEST PLAN)
## Dự án: Soccer Booker (GitHub Pages Static SPA + Browser Storage Engine)

**Mục tiêu:** Bảo đảm toàn bộ luồng nghiệp vụ Nhánh 1, 2, 4 chạy ổn định trực tiếp trên GitHub Pages không cần backend/database ngoài, và đạt 100% pass trên bộ kiểm thử tự động Vitest.

---

## 1. PHẠM VI & CẤP ĐỘ KIỂM THỬ
- **Unit & Schema Tests (Vitest):** Kiểm thử validation (Zod), hàm tiện ích đặt sân/giá/khung giờ, quản lý sân.
- **Adapter Integration Tests (`frontend/src/shared/api/__tests__/localMockAdapter.test.ts`):** Kiểm thử toàn bộ vòng đời dữ liệu trên `localStorage`: load 10 cụm sân Hà Nội, đăng nhập Client/Owner, tạo đơn giữ chỗ 4h, chặn đặt trùng slot (`409`), gửi báo cọc, chủ sân xác nhận đơn (`CONFIRMED`).
- **Component Tests (Vitest + React Testing Library):** Kiểm thử `LoginForm`, `RegisterForm`, `BookingConfirmModal`, `SlotCard`, `SelectedSlotsBar`, `VenueCard`.
- **Build Verification:** `tsc -b && vite build` biên dịch TypeScript sạch 0 lỗi và đóng gói bundle tối ưu cho GitHub Pages (`./`).

---

## 2. BỘ CA KIỂM THỬ CỐT LÕI (CORE TEST CASES)

| Mã TC | Phân hệ | Kịch bản kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Auth (Nhánh 1) | Điền nhanh / Đăng nhập `client@soccerbooker.vn` và `owner@soccerbooker.vn` (`Demo@123`) | Điều hướng đúng giao diện Khách hàng (`/#/`) và Chủ sân (`/#/admin`); Client vào `/#/admin` bị chặn. |
| **TC-02** | Tìm sân (Nhánh 2) | Truy cập `/#/booking`, tìm không dấu `"bach khoa"` hoặc chuyển chế độ Bản đồ | Lọc chính xác `Cụm Sân Bóng Đá Bách Khoa`, hiển thị marker GPS và giá từ `250k–300k`. |
| **TC-03** | Đặt sân & Chống trùng (Nhánh 2) | Đặt 1 khung giờ trống ngày `2026-12-22`; thử đặt lại đúng slot đó lần 2 | Lần 1 thành công (`WAITING_FOR_DEPOSIT`, giữ 4h); lần 2 bị chặn (`409`). |
| **TC-04** | Báo cọc & Duyệt đơn (Nhánh 2 + 4) | Tại `/#/checkout` gửi báo cọc; đăng nhập Owner vào `/#/admin/orders` duyệt & chốt hóa đơn | Trạng thái chuyển `WAITING_FOR_DEPOSIT` → `CONFIRMED` → `COMPLETED`; doanh thu Dashboard & Audit Log cập nhật ngay. |
| **TC-05** | Đánh giá & Bình luận (Nhánh 2) | Mở trang chi tiết sân xem Review/Hỏi đáp và gửi bình luận mới | Lưu bền vững vào `localStorage`, F5 vẫn hiển thị bình luận mới. |
