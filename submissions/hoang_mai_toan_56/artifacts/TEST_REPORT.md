# KẾ HOẠCH KIỂM THỬ (TEST PLAN - CẬP NHẬT CHECKPOINT 2)
- **Hệ thống:** Vườn Toán Lớp 3
- **Nhóm thực hiện:** Nhóm 56 (Track B)

## 1. Mục tiêu kiểm thử
- Kiểm thử tính tất định của thuật toán ước lượng (phép nhân, phép chia hết, phép chia có dư) trên bộ 12 fixture chuẩn (B-02, B-03).
- Kiểm thử giá trị biên (Boundary Value Analysis) tại đúng đầu mút và sát ngoài đầu mút của khoảng chấp nhận.
- Kiểm thử chính sách giới hạn thử lại tối đa 2 lần, công thức tính điểm kết hợp 2 bước, và khả năng giữ trạng thái khi Refresh (B-05).
- Kiểm thử bảo mật API chống lộ khoảng ước lượng/đáp án (B-04) và kiểm thử hồi quy (Regression) cho 4 dạng bài cũ.

## 2. Bảng ca kiểm thử chi tiết (Test Cases)

| Mã TC | Nhóm kiểm thử | Tên ca kiểm thử | Dữ liệu đầu vào (Input) | Kết quả mong đợi (Expected Output) |
|---|---|---|---|---|
| **TC-01** | Tương đương | Ước lượng phép nhân (tâm khoảng) | Câu `48 x 3` (khoảng `[140, 160]`), nhập ước lượng `150` | Báo `valid: true`, mở khóa Bước 2 (`trang_thai_buoc = 'CALCULATING'`). |
| **TC-02** | **Ca biên (Boundary)** | **Đúng biên dưới của khoảng nhân** | Câu `48 x 3` (khoảng `[140, 160]`), nhập ước lượng **`140`** | Báo `valid: true`, chấp nhận ước lượng hợp lý. |
| **TC-03** | **Ca biên (Boundary)** | **Đúng biên trên của khoảng nhân** | Câu `48 x 3` (khoảng `[140, 160]`), nhập ước lượng **`160`** | Báo `valid: true`, chấp nhận ước lượng hợp lý. |
| **TC-04** | **Ca biên (Boundary)** | **Ngay ngoài biên dưới khoảng nhân** | Câu `48 x 3` (khoảng `[140, 160]`), nhập ước lượng **`139`** | Báo `valid: false`, từ chối, trừ 1 lượt thử (`retries_left: 1`). |
| **TC-05** | **Ca biên (Boundary)** | **Ngay ngoài biên trên khoảng nhân** | Câu `48 x 3` (khoảng `[140, 160]`), nhập ước lượng **`161`** | Báo `valid: false`, từ chối, trừ 1 lượt thử (`retries_left: 1`). |
| **TC-06** | **Ca biên (Boundary)** | **Biên và sát biên phép chia có dư** | Câu `87 : 4` (khoảng `[18, 22]`): thử lần lượt `18`, `22` và `17`, `23` | Nhập `18`, `22` $\rightarrow$ `valid: true`. Nhập `17`, `23` $\rightarrow$ `valid: false`. |
| **TC-07** | Phép chia có dư | Chấm kết quả chính xác phép chia dư | Câu `87 : 4`, Bước 2 nhập `Thương = 21, Dư = 3` (và thử `Thương = 21, Dư = 0`) | Nhập `(21, 3)` $\rightarrow$ Đúng. Nhập `(21, 0)` hoặc thiếu số dư $\rightarrow$ Sai. |
| **TC-08** | Giới hạn thử lại | Chặn thử lại quá 2 lần (Chống dò khoảng) | Câu `48 x 3`, nhập sai lần 1 (`80`), nhập sai lần 2 (`90`), gửi tiếp lần 3 (`150`) | Lần 2 sai: `ket_qua_uoc_luong = 0`, tự mở khóa Bước 2. Lần 3: API trả lỗi `400 Bad Request`. |
| **TC-09** | **Chấm điểm** | **Đúng ước lượng + Đúng tính chính xác** | Câu `48 x 3`: Ước lượng `150` (Đúng) + Tính `144` (Đúng) | Cộng **100% điểm** câu hỏi (`10/10` hoặc `1.0` điểm). |
| **TC-10** | **Chấm điểm** | **Sai ước lượng (hết 2 lượt) + Đúng chính xác** | Câu `48 x 3`: Ước lượng sai 2 lần (`80`, `90`) + Tính `144` (Đúng) | Cộng **70% điểm** câu hỏi (`7/10` hoặc `0.7` điểm). |
| **TC-11** | **Chấm điểm** | **Đúng ước lượng + Sai tính chính xác** | Câu `48 x 3`: Ước lượng `150` (Đúng) + Tính `140` (Sai) | Cộng **30% điểm** câu hỏi (`3/10` hoặc `0.3` điểm). |
| **TC-12** | **Chấm điểm** | **Sai cả 2 bước** | Câu `48 x 3`: Ước lượng sai 2 lần + Tính `140` (Sai) | Cộng **0% điểm** (`0` điểm). |
| **TC-13** | **Bảo mật B-04** | **Kiểm tra không lộ khoảng và đáp án** | Gọi API `POST /api/estimate-check`, kiểm tra toàn bộ keys của JSON trả về | JSON **không chứa** các trường `min_estimate`, `max_estimate`, `E_min`, `E_max`, `answer`, `thuong`, `so_du`. |
| **TC-14** | Trạng thái (B-05) | Giữ trạng thái khi Refresh (F5) giữa 2 bước | Ước lượng đúng câu `48 x 3` $\rightarrow$ bấm F5 tải lại trang trước khi nhập `144` | Trang tải lại vẫn giữ trạng thái đã xong Bước 1 (`CALCULATING`), ô Bước 2 mở sẵn. |
| **TC-15** | Luồng cưỡng bức | Bỏ qua bước ước lượng nộp thẳng bước 2 | Chưa ước lượng (`ESTIMATING`), gọi thẳng API nộp kết quả tính chính xác | Backend chặn request (`400 Bad Request`), yêu cầu hoàn thành bước ước lượng trước. |
| **TC-16** | **Hồi quy (Regression)** | **Kiểm thử hồi quy 4 dạng bài cũ** | Thực hiện làm bài và chấm điểm trên 4 dạng bài toán gốc của starter repo | Toàn bộ 4 dạng bài cũ hiển thị, nộp bài và lưu điểm vào SQLite bình thường (100% PASS). |
