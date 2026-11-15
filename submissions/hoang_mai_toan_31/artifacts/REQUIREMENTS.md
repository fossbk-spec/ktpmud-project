# REQUIREMENTS — Vườn Toán Lớp 3

**Nhóm:** 31  
**Track:** B — Vườn Toán Lớp 3  
**Checkpoint:** PC-2

## 1. Mục tiêu

Phát triển thêm dạng bài tập ước lượng kết quả phép tính vào website Vườn Toán Lớp 3, giúp học sinh rèn luyện kỹ năng ước lượng trước khi tính chính xác.

Tính năng được tích hợp vào website hiện có, giữ nguyên các chức năng bài tập trước đó.

## 2. Yêu cầu chức năng

### FR-01: Hiển thị bài tập

- Hệ thống cung cấp một phiếu gồm 12 câu hỏi ước lượng.
- Mỗi câu hỏi có phép nhân hoặc phép chia phù hợp với học sinh lớp 3.
- Các câu hỏi được hiển thị lần lượt, mỗi lần một câu.

### FR-02: Nhập kết quả ước lượng

- Học sinh nhập kết quả ước lượng trước.
- Thời gian dành cho bước ước lượng tối đa 15 giây.
- Sau khi xác nhận hoặc hết thời gian, kết quả ước lượng không được chỉnh sửa.
- Học sinh không được xem đáp án chính xác trước khi hoàn thành bước ước lượng.

### FR-03: Nhập kết quả chính xác

- Sau bước ước lượng, học sinh nhập kết quả tính chính xác.
- Không giới hạn thời gian ở bước này.
- Sau khi xác nhận, hệ thống chuyển sang câu tiếp theo.

### FR-04: Chấm điểm

Với mỗi câu hỏi, gọi:

- A: Đáp án chính xác.
- E: Kết quả học sinh ước lượng.
- X: Kết quả học sinh tính chính xác.

Một câu được tính đúng khi đồng thời:

- E nằm trong khoảng từ 80% đến 120% của A, tính cả hai biên.
- X bằng A.

Nếu không thỏa mãn cả hai điều kiện, câu được tính sai. Không cho điểm một phần.

Điểm phần trăm được tính theo công thức:

`Math.round(soCauDung / 12 * 100)`

### FR-05: Kết quả

Sau khi hoàn thành 12 câu, hệ thống hiển thị số câu đúng, tổng số câu và tỷ lệ phần trăm.

### FR-06: Tích hợp website

- Có đường dẫn vào bài tập ước lượng từ trang chủ.
- Giữ phong cách giao diện hiện tại.
- Không làm ảnh hưởng đến các dạng bài tập cũ.

## 3. Yêu cầu phi chức năng

- **NFR-01:** Website chạy được với Node.js 22.
- **NFR-02:** Giao diện tiếng Việt, dễ thao tác đối với học sinh lớp 3.
- **NFR-03:** Đáp án chính xác không được gửi trước cho trình duyệt khi tải câu hỏi.
- **NFR-04:** Thời hạn ước lượng phải được kiểm tra phía máy chủ, không chỉ dựa vào đồng hồ trình duyệt.
- **NFR-05:** Có quy trình CI kiểm tra cài đặt dependencies và cú pháp JavaScript.

## 4. Tiêu chí nghiệm thu

- [ ] Hiển thị đủ 12 câu hỏi.
- [ ] Mỗi câu có hai bước: ước lượng và tính chính xác.
- [ ] Bước ước lượng giới hạn 15 giây.
- [ ] Không thể sửa kết quả ước lượng sau khi khóa.
- [ ] Chấm đúng khi cả hai đáp án đạt yêu cầu.
- [ ] Chấp nhận hai biên ±20%.
- [ ] Không cộng điểm một phần.
- [ ] Hiển thị kết quả sau 12 câu.
- [ ] Truy cập được bài tập từ trang chủ.
- [ ] Các chức năng cũ vẫn hoạt động.

## 5. Phạm vi

**Trong phạm vi:** Bài tập ước lượng, chấm điểm, giao diện, tích hợp website và kiểm thử.

**Ngoài phạm vi:** Thay đổi hệ thống đăng nhập, quản trị giáo viên hoặc viết lại toàn bộ website.