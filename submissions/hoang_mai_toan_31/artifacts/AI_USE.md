# AI USE — Báo cáo sử dụng trí tuệ nhân tạo

**Dự án:** BKT Vườn Toán Lớp 3  
**Nhóm:** 31  
**Track:** B  
**Checkpoint:** PC-2  
**Ngày cập nhật:** 15/11/2026

## 1. Công cụ AI sử dụng

- **Công cụ:** ChatGPT (OpenAI).
- **Mục đích:** Hỗ trợ phân tích yêu cầu, đề xuất giải pháp, lập trình, kiểm thử, xử lý lỗi và viết tài liệu kỹ thuật.
- **Phạm vi:** Phát triển tính năng bài tập ước lượng gồm 12 câu hỏi trên website Vườn Toán Lớp 3.

## 2. Các hoạt động có sử dụng AI

| STT | Hoạt động | Vai trò của AI |
|---|---|---|
| 1 | Phân tích yêu cầu Track B | Giải thích đề bài, xác định chức năng và tiêu chí nghiệm thu |
| 2 | Thiết kế bài tập ước lượng | Đề xuất 12 câu hỏi và quy trình trả lời hai giai đoạn |
| 3 | Thiết kế quy tắc chấm điểm | Đề xuất ngưỡng sai số ±20%, không cộng điểm một phần |
| 4 | Hỗ trợ lập trình | Hướng dẫn bổ sung giao diện, JavaScript, API và xử lý dữ liệu |
| 5 | Hỗ trợ kiểm thử | Đề xuất các trường hợp kiểm thử chức năng, thời gian và giá trị biên |
| 6 | Xử lý lỗi môi trường | Hỗ trợ cài đặt Node.js, npm và xử lý lỗi chạy dự án |
| 7 | Quản lý Git/GitHub | Hướng dẫn commit, push, GitHub Actions và chuẩn bị Pull Request |
| 8 | Viết tài liệu | Hỗ trợ soạn REQUIREMENTS, DECISIONS, TEST_REPORT và các tài liệu nộp bài |

## 3. Ví dụ sử dụng AI

### Ví dụ 1: Thiết kế luồng làm bài

**Yêu cầu gửi AI:** Đề xuất cách tổ chức bài tập ước lượng sao cho học sinh phải ước lượng trước khi nhập kết quả chính xác.

**Đề xuất của AI:** Chia mỗi câu thành hai giai đoạn. Giai đoạn đầu giới hạn 15 giây, sau đó khóa đáp án ước lượng và chuyển sang giai đoạn tính chính xác.

**Cách nhóm sử dụng:** Lựa chọn phương án hai giai đoạn để định hướng thiết kế tính năng.

### Ví dụ 2: Xây dựng quy tắc chấm điểm

**Yêu cầu gửi AI:** Xây dựng cách chấm điểm cho bài tập ước lượng với ngưỡng sai số ±20%.

**Đề xuất của AI:** Chỉ tính đúng khi kết quả ước lượng nằm trong khoảng cho phép và đáp án chính xác hoàn toàn đúng.

**Cách nhóm sử dụng:** Đưa quy tắc vào tài liệu yêu cầu và thiết kế xử lý chấm điểm.

### Ví dụ 3: Hỗ trợ tích hợp source code

**Yêu cầu gửi AI:** Hướng dẫn tích hợp tính năng 12 câu hỏi vào website hiện có mà không làm mất các chức năng cũ.

**Đề xuất của AI:** Tách giao diện bài tập ước lượng thành `estimate.html` và `estimate.js`, đồng thời cập nhật API và dữ liệu câu hỏi.

**Cách nhóm sử dụng:** Bổ sung các file tính năng và cập nhật repository trên GitHub.

### Ví dụ 4: Hỗ trợ CI

**Yêu cầu gửi AI:** Hướng dẫn tạo GitHub Actions CI cho dự án Node.js 22.

**Đề xuất của AI:** Tạo workflow tự động cài đặt dependencies, kiểm tra cú pháp JavaScript và chạy test nếu có.

**Kết quả:** Nhóm đã tạo workflow trên nhánh `develop` và ghi nhận một lần chạy thành công.

## 4. Kiểm tra kết quả do AI đề xuất

Nhóm không xem nội dung AI tạo ra là bằng chứng kiểm thử.

Các đề xuất cần được đối chiếu với:

- Yêu cầu và hướng dẫn chính thức của giảng viên.
- Cấu trúc và mã nguồn thực tế của dự án.
- Kết quả chạy chương trình trên máy.
- Kết quả GitHub Actions.
- Các trường hợp kiểm thử được ghi trong `TEST_REPORT.md`.

Những chức năng chưa được kiểm thử đầy đủ tiếp tục được đánh dấu là chưa xác minh.

## 5. Trách nhiệm của nhóm

AI đóng vai trò công cụ hỗ trợ. Nhóm chịu trách nhiệm lựa chọn giải pháp, quản lý mã nguồn, kiểm tra kết quả, sửa lỗi và bảo đảm tính chính xác của bài nộp.

Nhóm không sử dụng dữ liệu bệnh nhân, thông tin đăng nhập hoặc khóa API để làm đầu vào cho AI trong phạm vi công việc được ghi nhận ở tài liệu này.

## 6. Kết luận

ChatGPT được sử dụng để hỗ trợ quá trình phân tích, thiết kế, phát triển và chuẩn bị hồ sơ Checkpoint 2.

Việc sử dụng AI giúp nhóm xây dựng giải pháp có cấu trúc rõ ràng hơn, nhưng không thay thế trách nhiệm kiểm thử và nghiệm thu sản phẩm của nhóm.