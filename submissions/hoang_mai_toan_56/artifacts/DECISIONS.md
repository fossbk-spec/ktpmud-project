# CÁC QUYẾT ĐỊNH THIẾT KẾ KIẾN TRÚC (DECISIONS)

## ADR-01: Thuật toán ước lượng tất định, mở rộng CSDL SQLite và quản lý trạng thái 2 bước (B-03, B-04, B-05)

### 1. Bối cảnh
Cần bổ sung dạng bài "Ước lượng rồi tính" (nhân/chia) trên nền tảng Node.js/Express và SQLite sẵn có của starter repo, đảm bảo:
- Thuật toán kiểm tra ước lượng phải hoàn toàn tất định (deterministic).
- Không phá vỡ cấu trúc CSDL của 4 dạng bài cũ, không sửa cơ chế đăng nhập/session.
- Ngăn học sinh xem trộm khoảng ước lượng hoặc đáp án qua DevTools (B-04) và giữ nguyên trạng thái khi học sinh tải lại trang (F5) giữa 2 bước (B-05).

### 2. Quyết định kiến trúc

#### 2.1. Thuật toán tất định (Deterministic Engine tại `server/`)
- Xây dựng module tính toán độc lập ở phía Server:
  - Phép nhân `a x b`: Làm tròn `a` về hàng chục (`a < 100`, dung sai `Delta = 10`) hoặc hàng trăm (`a >= 100`, dung sai `Delta = 50`) gần nhất để xác định đoạn `[E_min, E_max]`.
  - Phép chia `a : b`: Tìm bội số tròn chục của `b` gần `a` nhất theo công thức `a_comp = Math.floor(a / (10 * b) + 0.5) * (10 * b)`, tâm ước lượng `E_center = a_comp / b` với dung sai cố định `Delta = 2`. Bước tính chính xác nhận và đối chiếu độc lập cả 2 trường `thuong` (`Math.floor(a / b)`) và `so_du` (`a % b`).

#### 2.2. Mô hình dữ liệu SQLite & Cơ chế Migration (B-05)
- **Bảng lưu trữ:** Mở rộng trực tiếp bảng lưu kết quả làm bài hiện có trong SQLite (bảng `attempts` / `submissions` theo schema của `server/db.js` và `docs/architecture-reference.md`), không tách bảng phụ nhằm giữ nguyên các truy vấn thống kê điểm của giáo viên.
- **Các cột bổ sung:**
  - `uoc_luong` (`INTEGER NULL`): Lưu giá trị ước lượng cuối cùng học sinh nhập.
  - `ket_qua_uoc_luong` (`INTEGER NULL`): Lưu `1` (Hợp lý), `0` (Không hợp lý sau 2 lần thử), hoặc `NULL` (đối với 4 dạng bài cũ / chưa làm).
  - `so_lan_thu_uoc_luong` (`INTEGER NOT NULL DEFAULT 0`): Đếm số lần học sinh đã gọi API kiểm tra ước lượng (giới hạn tối đa `2` lần).
  - `trang_thai_buoc` (`TEXT NOT NULL DEFAULT 'ESTIMATING'`): Trạng thái máy trạng thái hữu hạn của câu hỏi (`'ESTIMATING'` -> `'CALCULATING'` -> `'COMPLETED'`).
- **Chiến lược Migration:**
  - Khi khởi tạo kết nối SQLite tại backend (`server/db.js`), thực thi hàm migration tự động kiểm tra thông qua `PRAGMA table_info(...)` và chạy lệnh `ALTER TABLE ... ADD COLUMN ...` cho 4 cột trên nếu chưa tồn tại.
  - Cách làm này đảm bảo an toàn tuyệt đối (idempotent) khi khởi động lại container Docker/Node.js và giữ tương thích ngược 100% với 4 dạng bài cũ (các dòng dữ liệu cũ nhận giá trị `NULL`).

#### 2.3. Luồng API, Chống lộ đáp án (B-04) & Giữ trạng thái khi Refresh (F5)
- **Endpoint kiểm tra ước lượng (`POST /api/estimate-check`):**
  - Kiểm tra `so_lan_thu_uoc_luong < 2`. Tăng biến đếm lên 1 và lưu ngay vào SQLite.
  - Nếu giá trị nằm trong `[E_min, E_max]` HOẶC đã hết 2 lượt thử (`so_lan_thu_uoc_luong == 2`), Backend cập nhật ngay `trang_thai_buoc = 'CALCULATING'`, `uoc_luong`, và `ket_qua_uoc_luong` (`1` hoặc `0`) vào CSDL.
  - **Bảo mật B-04:** Payload JSON trả về từ endpoint này chỉ gồm `{"valid": boolean, "retries_left": number, "trang_thai_buoc": string, "hint": string | null}`. Tuyệt đối **không trả về** `E_min`, `E_max`, `E_center` hay đáp án chính xác để chống gian lận qua tab Network (F12).
- **Xử lý khi Refresh trang (F5) giữa Bước 1 và Bước 2:**
  - Do `trang_thai_buoc = 'CALCULATING'` và `uoc_luong` đã được ghi bền vững vào SQLite (và đồng bộ vào phiên làm bài hiện tại) ngay khi xong bước 1, khi học sinh bấm F5 trình duyệt, Frontend tải lại trạng thái câu hỏi từ Server sẽ nhận được `trang_thai_buoc = 'CALCULATING'` cùng giá trị `uoc_luong` đã nhập.
  - Giao diện tự động khóa ô ước lượng (hiển thị lại số đã ước lượng) và **mở sẵn ô nhập kết quả tính chính xác**, đảm bảo học sinh không bị mất trạng thái hay phải ước lượng lại để gian lận lượt thử.
