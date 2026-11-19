# BÁO CÁO KẾT QUẢ KIỂM THỬ (TEST REPORT)
- **Hệ thống:** Vườn Toán Lớp 3 — Dạng bài "Ước lượng trước khi tính đúng"
- **Nhóm thực hiện:** Nhóm 56 (Track B)

## 1. Môi trường kiểm thử
- **Hệ điều hành:** Windows 11 (Local) & Ubuntu 22.04 LTS (GitHub Actions CI)
- **Runtime:** Node.js 18+ / npm 9+
- **Cơ sở dữ liệu:** SQLite3
- **Lệnh chạy kiểm thử:** `npm ci && npm test`

## 2. Kết quả kiểm thử (16/16 PASS)

| Mã TC | Nhóm kiểm thử | Tên ca kiểm thử | Dữ liệu đầu vào (Input) | Kết quả thực tế (Actual Output) | Trạng thái |
|---|---|---|---|---|---|
| **TC-01** | Tương đương | Ước lượng phép nhân (tâm khoảng) | Câu `48 x 3` (`[140, 160]`), nhập `150` | Báo `valid: true`, mở khóa Bước 2 (`CALCULATING`). | **PASS** |
| **TC-02** | **Ca biên** | Đúng biên dưới khoảng nhân | Câu `48 x 3` (`[140, 160]`), nhập **`140`** | Báo `valid: true`, chấp nhận ước lượng hợp lý. | **PASS** |
| **TC-03** | **Ca biên** | Đúng biên trên khoảng nhân | Câu `48 x 3` (`[140, 160]`), nhập **`160`** | Báo `valid: true`, chấp nhận ước lượng hợp lý. | **PASS** |
| **TC-04** | **Ca biên** | Ngay ngoài biên dưới khoảng nhân | Câu `48 x 3` (`[140, 160]`), nhập **`139`** | Báo `valid: false`, từ chối, còn `retries_left: 1`. | **PASS** |
| **TC-05** | **Ca biên** | Ngay ngoài biên trên khoảng nhân | Câu `48 x 3` (`[140, 160]`), nhập **`161`** | Báo `valid: false`, từ chối, còn `retries_left: 1`. | **PASS** |
| **TC-06** | **Ca biên** | Biên và sát biên phép chia có dư | Câu `87 : 4` (`[18, 22]`): thử `18, 22` và `17, 23` | `18, 22` -> `valid: true`; `17, 23` -> `valid: false`. | **PASS** |
| **TC-07** | Phép chia dư | Chấm kết quả chính xác phép chia dư | Câu `87 : 4`, nhập `(Thương=21, Dư=3)` và `(21, 0)` | `(21, 3)` -> Đúng; `(21, 0)` -> Sai. | **PASS** |
| **TC-08** | Giới hạn thử | Chặn thử lại quá 2 lần | Câu `48 x 3`, sai lần 1 (`80`), lần 2 (`90`), lần 3 (`150`) | Lần 2 mở Bước 2 (`ket_qua_uoc_luong = 0`); lần 3 trả `400`. | **PASS** |
| **TC-09** | **Chấm điểm** | Đúng ước lượng + Đúng chính xác | Câu `48 x 3`: Ước lượng `150` + Tính `144` | Cộng **100% điểm** (`10/10` điểm). | **PASS** |
| **TC-10** | **Chấm điểm** | Sai ước lượng (2 lần) + Đúng chính xác | Câu `48 x 3`: Sai 2 lần (`80`, `90`) + Tính `144` | Cộng **70% điểm** (`7/10` điểm). | **PASS** |
| **TC-11** | **Chấm điểm** | Đúng ước lượng + Sai chính xác | Câu `48 x 3`: Ước lượng `150` + Tính `140` | Cộng **30% điểm** (`3/10` điểm). | **PASS** |
| **TC-12** | **Chấm điểm** | Sai cả 2 bước | Câu `48 x 3`: Sai 2 lần + Tính `140` | Cộng **0% điểm** (`0` điểm). | **PASS** |
| **TC-13** | **Bảo mật B-04** | Không lộ khoảng và đáp án | Gọi `POST /api/estimate-check`, kiểm tra keys JSON | JSON không chứa `E_min`, `E_max`, `answer`, `thuong`, `so_du`. | **PASS** |
| **TC-14** | Trạng thái B-05 | Giữ trạng thái khi Refresh (F5) | Ước lượng đúng `48 x 3` -> bấm F5 trước khi nhập `144` | Giữ nguyên trạng thái `CALCULATING`, ô Bước 2 mở sẵn. | **PASS** |
| **TC-15** | Luồng cưỡng bức | Bỏ qua bước 1 nộp thẳng bước 2 | Chưa ước lượng, gọi thẳng API nộp kết quả tính | Backend chặn trả lỗi `400 Bad Request`. | **PASS** |
| **TC-16** | **Hồi quy** | Kiểm thử hồi quy 4 dạng bài cũ | Làm bài và chấm điểm trên 4 dạng bài gốc | 4 dạng bài cũ hiển thị, nộp bài và lưu SQLite bình thường. | **PASS** |

## 3. Giới hạn hiện tại
- Phạm vi số áp dụng cho chương trình Toán lớp 3 (`10 <= a <= 999`, `2 <= b <= 9`), chưa hỗ trợ phép nhân/chia với số có từ 2 chữ số trở lên.
- Gợi ý khi ước lượng sai hiện hiển thị dạng văn bản tĩnh theo quy tắc làm tròn chục/trăm, chưa có minh họa trục số trực quan.
