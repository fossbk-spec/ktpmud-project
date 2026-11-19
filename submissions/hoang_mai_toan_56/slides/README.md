# KỊCH BẢN DEMO & THUYẾT TRÌNH (TỐI ĐA 7 PHÚT) — NHÓM 56 (TRACK B)

## Phân bổ thời gian (Tổng: 7 phút)

### Phần 1: Bài toán & Quyết định thiết kế cốt lõi (1 phút 30 giây) — `N56-Member-01`
1. **Vấn đề sư phạm:** Học sinh lớp 3 thường đặt tính ngay mà thiếu phản xạ ước lượng độ lớn kết quả.
2. **Giải pháp kiến trúc (ADR-01 & ADR-02):**
   - Máy trạng thái hữu hạn 2 bước lưu trực tiếp trên SQLite: `ESTIMATING` -> `CALCULATING` -> `COMPLETED`.
   - Công thức tất định 100% cho phép nhân (`a x b`) và phép chia có dư (`a : b` qua bội số tròn chục tương thích `a_comp`).

### Phần 2: Live Demo End-to-End trên giao diện (3 phút) — `N56-Member-02`
1. **Truy cập từ luồng học hiện có (B-01, B-12):** Đăng nhập tài khoản mẫu `hocsinh01`, chọn dạng bài "Ước lượng trước khi tính đúng", thao tác bằng bàn phím (`Tab`, `Enter`).
2. **Kịch bản 1 — Ước lượng hợp lý & Tính đúng (100% điểm):**
   - Câu `48 x 3`, nhập ước lượng `150` (hoặc biên `140`) -> Hệ thống báo *"Ước lượng hợp lý!"* (B-06) -> Mở khóa Bước 2 -> Nhập `144` -> Nhận 10/10 điểm.
3. **Kịch bản 2 — Chống lộ đáp án (B-04) & Giữ trạng thái khi F5 (B-05):**
   - Câu chia có dư `87 : 4`: Mở tab Network (F12) chứng minh JSON không trả về `E_min`, `E_max` hay đáp án.
   - Nhập ước lượng `20` -> Nhấn **F5** -> Trang giữ nguyên trạng thái `CALCULATING`, mở sẵn ô `Thương` và `Số dư`. Nhập `21` và `3`.
4. **Kịch bản 3 — Giới hạn 2 lần thử & Chấm điểm từng phần:**
   - Nhập sai ước lượng 2 lần -> Hệ thống khóa Bước 1, hiện gợi ý làm tròn, mở Bước 2 -> Tính đúng -> Nhận 70% điểm (7/10).

### Phần 3: Kiểm thử tự động, Clean Checkout & Hồi quy (2 phút 30 giây) — `N56-Member-03`
1. Chạy `npm test` (B-08, B-09): Chỉ rõ các ca kiểm thử biên (`139, 140, 160, 161`), bảo mật B-04, 12 fixtures (`B-F01` -> `B-F12`) và hồi quy 4 dạng bài cũ (B-07).
2. Chiếu màn hình GitHub Actions CI chạy xanh trên Pull Request (B-10).
