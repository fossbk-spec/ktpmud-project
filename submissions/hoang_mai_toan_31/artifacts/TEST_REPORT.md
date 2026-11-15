# TEST REPORT — Báo cáo kiểm thử

**Dự án:** BKT Vườn Toán Lớp 3  
**Nhóm:** 31  
**Track:** B  
**Checkpoint:** PC-2  
**Ngày lập báo cáo:** 15/11/2026

## 1. Mục tiêu kiểm thử

Kiểm tra tính năng bài tập ước lượng gồm 12 câu hỏi, bảo đảm:

- Hiển thị đầy đủ các câu hỏi.
- Có hai giai đoạn: ước lượng và tính chính xác.
- Giới hạn thời gian ước lượng 15 giây.
- Chấm điểm theo ngưỡng sai số ±20%.
- Không cộng điểm một phần.
- Hiển thị kết quả sau khi hoàn thành.
- Không làm ảnh hưởng đến chức năng cũ.

## 2. Môi trường kiểm thử

| Thành phần | Môi trường |
|---|---|
| Hệ điều hành | Windows |
| Node.js | 22.23.4 |
| Trình duyệt | Chrome |
| Backend | Node.js, Express |
| Database | SQLite |
| CI | GitHub Actions — Node.js 22 |

## 3. Các trường hợp kiểm thử

| ID | Trường hợp kiểm thử | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| TC-01 | Mở trang bài tập ước lượng | Trang hiển thị bình thường | Đã xác nhận |
| TC-02 | Hiển thị phiếu 12 câu hỏi | Có đầy đủ 12 câu | Đã xác nhận |
| TC-03 | Nhập ước lượng rồi tính chính xác | Hai giai đoạn hoạt động đúng thứ tự | Chưa xác minh riêng |
| TC-04 | Hết 15 giây | Tự động khóa bước ước lượng | Chưa kiểm thử |
| TC-05 | Sửa ước lượng sau khi khóa | Hệ thống từ chối thay đổi | Chưa kiểm thử |
| TC-06 | Ước lượng nằm trong ±20%, tính chính xác đúng | Câu được tính đúng | Chưa kiểm thử |
| TC-07 | Ước lượng ngoài ±20%, tính chính xác đúng | Câu được tính sai | Chưa kiểm thử |
| TC-08 | Ước lượng đúng, tính chính xác sai | Câu được tính sai | Chưa kiểm thử |
| TC-09 | Ước lượng đúng tại biên dưới | Được chấp nhận | Chưa kiểm thử |
| TC-10 | Ước lượng đúng tại biên trên | Được chấp nhận | Chưa kiểm thử |
| TC-11 | Hoàn thành 12 câu | Hiển thị số câu đúng và tỷ lệ phần trăm | Chưa xác minh riêng |
| TC-12 | Mở bài tập từ trang chủ | Điều hướng đến trang ước lượng | Chưa xác minh sau khi chuyển source |
| TC-13 | Kiểm tra các bài tập cũ | Chức năng cũ không bị ảnh hưởng | Chưa kiểm thử |
| TC-14 | GitHub Actions CI | Workflow hoàn thành thành công | Đạt |

## 4. Kiểm thử giá trị biên

Áp dụng công thức:

`5 * E >= 4 * A && 5 * E <= 6 * A`

Trong đó:

- A: Kết quả chính xác.
- E: Kết quả ước lượng.

Ví dụ với câu hỏi `19 × 4 = 76`:

| E | Đánh giá mong đợi |
|---|---|
| 60 | Không đạt — dưới biên |
| 61 | Đạt |
| 76 | Đạt |
| 91 | Đạt |
| 92 | Không đạt — trên biên |

Các trường hợp này là dữ liệu kiểm thử dự kiến, chưa phải kết quả đã chạy thực tế.

## 5. Kiểm thử CI

Nhóm đã cấu hình workflow `Node.js CI` trên nhánh `develop`.

Các bước kiểm tra được cấu hình:

1. Checkout repository.
2. Thiết lập Node.js 22.
3. Cài đặt dependencies bằng `npm ci`.
4. Kiểm tra cú pháp JavaScript.
5. Chạy `npm test --if-present`.

**Kết quả:** Workflow đã hoàn thành thành công, hiển thị dấu tích xanh trên GitHub Actions.

Đường dẫn lần chạy CI được lưu tại `source-ref.json`.

Lưu ý: `npm test --if-present` có thể bỏ qua bước test khi dự án chưa khai báo script `test`. Vì vậy, CI xanh không đồng nghĩa với việc toàn bộ trường hợp kiểm thử nghiệp vụ đã đạt.

## 6. Kết quả hiện tại

- Website đã chạy và hiển thị bài tập 12 câu hỏi.
- Source code đã được commit và push lên nhánh `develop`.
- Workflow GitHub Actions đã chạy thành công.
- Các trường hợp kiểm thử về thời gian, chấm điểm, bảo mật API và hồi quy cần tiếp tục xác minh.

## 7. Kết luận

Tại Checkpoint 2, nhóm đã tích hợp tính năng bài tập ước lượng và thiết lập CI.

Nhóm tiếp tục thực hiện kiểm thử chức năng, trường hợp biên và hồi quy trước khi hoàn thiện bản nộp cuối cùng.