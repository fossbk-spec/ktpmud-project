# DECISIONS — Quyết định thiết kế

**Dự án:** BKT Vườn Toán Lớp 3  
**Nhóm:** 31  
**Track:** B  
**Checkpoint:** PC-2

## 1. Tổng quan

Nhóm phát triển dạng bài tập ước lượng gồm 12 câu hỏi trên nền tảng website Vườn Toán Lớp 3 có sẵn.

Các quyết định dưới đây nhằm bảo đảm bài tập phù hợp với học sinh lớp 3, có quy tắc chấm điểm rõ ràng và hạn chế việc học sinh sử dụng đáp án chính xác để điền ngược vào phần ước lượng.

## 2. Các quyết định kỹ thuật

### DEC-01: Sử dụng hai giai đoạn trả lời

**Quyết định:** Mỗi câu hỏi có hai bước riêng biệt:

1. Ước lượng kết quả phép tính.
2. Tính kết quả chính xác.

**Lý do:** Buộc học sinh thực hiện tư duy ước lượng trước khi tính toán chính xác.

**Phương án không chọn:** Hiển thị đồng thời hai ô nhập vì học sinh có thể tính đáp án chính xác trước rồi sao chép sang ô ước lượng.

### DEC-02: Giới hạn 15 giây cho bước ước lượng

**Quyết định:** Học sinh có tối đa 15 giây để nhập kết quả ước lượng.

**Lý do:** Khuyến khích ước lượng nhanh thay vì thực hiện phép tính chi tiết.

**Quy tắc:** Sau khi xác nhận hoặc hết thời gian, đáp án ước lượng được khóa và không thể chỉnh sửa.

Bước tính chính xác không giới hạn thời gian.

### DEC-03: Ngưỡng sai số ±20%

**Quyết định:** Một kết quả ước lượng E được chấp nhận khi nằm trong khoảng từ 80% đến 120% đáp án chính xác A, bao gồm hai biên.

Với A dương, có thể kiểm tra bằng phép toán số nguyên:

`5 * E >= 4 * A && 5 * E <= 6 * A`

**Lý do:** Cho phép học sinh đưa ra đáp án gần đúng, đồng thời có tiêu chí đánh giá nhất quán.

**Ví dụ:** Phép tính 19 × 4 có đáp án chính xác là 76. Kết quả ước lượng nguyên từ 61 đến 91 được chấp nhận.

### DEC-04: Chấm điểm toàn bộ câu hỏi

**Quyết định:** Một câu chỉ được tính đúng khi:

- Ước lượng nằm trong khoảng cho phép.
- Kết quả tính chính xác bằng đáp án.

Không có điểm một phần.

**Lý do:** Đánh giá đồng thời hai kỹ năng ước lượng và tính toán chính xác.

### DEC-05: Sử dụng 12 câu hỏi

**Quyết định:** Phiếu bài tập gồm 12 câu hỏi, kết hợp phép nhân và phép chia.

**Lý do:** Có đủ số lượng để đánh giá kỹ năng, đồng thời không khiến bài tập quá dài đối với học sinh lớp 3.

Các câu hỏi được hiển thị lần lượt, mỗi lần một câu.

### DEC-06: Tích hợp vào website hiện có

**Quyết định:** Bổ sung giao diện `estimate.html` và JavaScript `estimate.js` thay vì thay thế trang bài tập cũ.

**Lý do:**

- Giữ nguyên các chức năng hiện có.
- Hạn chế ảnh hưởng đến những dạng bài tập trước đó.
- Dễ kiểm thử và bảo trì.
- Duy trì phong cách giao diện Vườn Toán.

### DEC-07: Chấm điểm tại máy chủ

**Quyết định:** Máy chủ chịu trách nhiệm xác thực đáp án, giới hạn thời gian ước lượng và tính điểm.

**Lý do:** Tránh phụ thuộc hoàn toàn vào dữ liệu và đồng hồ của trình duyệt.

Đáp án chính xác không được công khai trước khi học sinh hoàn thành bài tập.

## 3. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Giao diện | HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| Cơ sở dữ liệu | SQLite |
| Quản lý phiên bản | Git, GitHub |
| CI | GitHub Actions, Node.js 22 |

## 4. Các rủi ro và hướng xử lý

| Rủi ro | Hướng xử lý |
|---|---|
| Học sinh chỉnh sửa ước lượng sau khi hết giờ | Khóa đáp án và xác thực ở backend |
| Sai số tại giá trị biên | Dùng so sánh số nguyên |
| Lộ đáp án qua API | Không trả đáp án trong API lấy câu hỏi |
| Ảnh hưởng bài tập cũ | Tách giao diện mới và kiểm thử hồi quy |
| Lỗi khi triển khai | Kiểm tra tự động bằng GitHub Actions |

## 5. Kết luận

Các quyết định trên định hướng triển khai bài tập ước lượng theo hai giai đoạn, sử dụng ngưỡng sai số ±20% và chấm điểm toàn câu.

Việc xác nhận các yêu cầu đã hoạt động đúng sẽ được ghi nhận trong `TEST_REPORT.md`.