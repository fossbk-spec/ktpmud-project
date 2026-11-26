# HƯỚNG DẪN TRIỂN KHAI DATABASE CLOUD POSTGRESQL (PHƯƠNG ÁN 1)

Phương án này giúp Nhóm 04 có **Database PostgreSQL 15+ thật (hỗ trợ đầy đủ `btree_gist` & Partial Unique Index)** chạy ngay trên Cloud miễn phí, không cần cài Docker hay PostgreSQL nặng máy, đồng thời có giao diện web trực quan để mở cho giảng viên kiểm tra bảng dữ liệu khi demo.

---

## Bước 1: Tạo Database miễn phí trên Neon.tech (hoặc Supabase)
1. Truy cập [https://neon.tech](https://neon.tech) (khuyên dùng vì cực nhanh, không ngủ đông khó chịu) hoặc [https://supabase.com](https://supabase.com), đăng nhập bằng tài khoản **GitHub / Google**.
2. Nhấn **Create Project**:
   - **Project Name:** `soccer-booker-demo`
   - **Postgres Version:** `15` hoặc `16`
   - **Region:** `Singapore (ap-southeast-1)` để tốc độ truy cập tại Việt Nam nhanh nhất.

## Bước 2: Khởi tạo Bảng & Dữ liệu mẫu
1. Mở mục **SQL Editor** trên thanh bên trái của Neon (hoặc Supabase).
2. Copy toàn bộ nội dung file `V1__soccer_booker_demo_schema.sql` dán vào SQL Editor và nhấn **Run** → tạo thành công **19 bảng**, **4 enum**, **`btree_gist` exclusion constraint**, **Partial Unique Index `uq_booking_reserved_slot`** và **View `v_pitch_rating_summary`**.
3. Tiếp tục copy toàn bộ nội dung file `V2__seed_demo_data.sql` dán vào SQL Editor và nhấn **Run** → nạp sẵn tài khoản Demo (`owner@soccerbooker.vn`, `client@soccerbooker.vn`), 2 cụm sân Hà Nội, 3 sân con, 6 khung giờ và dữ liệu booking/đánh giá mẫu.

## Bước 3: Kiểm tra & Trình chiếu cho Thầy khi Demo
- Mở mục **Tables** trên Neon Console để xem trực tiếp dữ liệu trong các bảng (`users`, `pitch_complexes`, `pitches`, `bookings`, `financial_entries`, `reviews`).
- Copy **Connection String** (dạng `postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`) để cấu hình vào file `.env` của Backend khi chạy demo.
