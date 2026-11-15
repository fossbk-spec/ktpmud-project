# SECURITY & PRIVACY CHECKLIST

**Dự án:** BKT Vườn Toán Lớp 3  
**Nhóm:** 31  
**Track:** B  
**Checkpoint:** PC-2  
**Ngày cập nhật:** 15/11/2026

## 1. Mục tiêu

Rà soát các vấn đề bảo mật và quyền riêng tư của website Vườn Toán Lớp 3, đặc biệt đối với tính năng bài tập ước lượng gồm 12 câu hỏi.

## 2. Kiểm tra bảo mật mã nguồn

| ID | Nội dung kiểm tra | Trạng thái |
|---|---|---|
| SEC-01 | Không đưa mật khẩu, API key hoặc token vào repository | Chưa xác minh đầy đủ |
| SEC-02 | Không commit file `.env` chứa thông tin nhạy cảm | Chưa xác minh đầy đủ |
| SEC-03 | Không đưa thư mục `node_modules` vào Git | Đã kiểm tra trong commit tính năng |
| SEC-04 | Không đưa database chứa dữ liệu người dùng thật vào Git | Đã kiểm tra trong commit tính năng |
| SEC-05 | Các thư viện được quản lý bằng npm | Đã thực hiện |
| SEC-06 | Kiểm tra cảnh báo bảo mật dependencies | Đã phát hiện cảnh báo, cần xử lý |

## 3. Kiểm tra API và chấm điểm

| ID | Nội dung kiểm tra | Trạng thái |
|---|---|---|
| API-01 | API lấy câu hỏi không trả đáp án chính xác | Cần kiểm thử |
| API-02 | Backend kiểm tra thời gian ước lượng 15 giây | Cần kiểm thử |
| API-03 | Không cho sửa đáp án ước lượng sau khi khóa | Cần kiểm thử |
| API-04 | Điểm số được tính tại backend | Cần kiểm thử |
| API-05 | Không cho gửi bài nhiều lần để tăng điểm bất hợp lệ | Cần kiểm thử |
| API-06 | Dữ liệu đầu vào được kiểm tra trước khi xử lý | Cần kiểm thử |

## 4. Kiểm tra quyền riêng tư

| ID | Nội dung kiểm tra | Trạng thái |
|---|---|---|
| PRIV-01 | Không sử dụng thông tin cá nhân thật của học sinh trong dữ liệu mẫu | Cần xác minh |
| PRIV-02 | Không công khai mật khẩu hoặc thông tin đăng nhập | Cần xác minh |
| PRIV-03 | Không đưa dữ liệu cá nhân vào tài liệu nộp bài | Cần kiểm tra trước khi commit |
| PRIV-04 | Chỉ lưu dữ liệu cần thiết cho hoạt động học tập | Cần rà soát |
| PRIV-05 | Không sử dụng dữ liệu nhạy cảm để kiểm thử | Cần xác minh |

## 5. Kiểm tra GitHub và CI

- [x] Đã tạo repository fork cho dự án.
- [x] Đã push mã nguồn lên nhánh `develop`.
- [x] Đã cấu hình GitHub Actions với Node.js 22.
- [x] Đã ghi nhận workflow CI chạy thành công.
- [ ] Chưa xác minh đầy đủ các trường hợp kiểm thử bảo mật.
- [ ] Chưa kiểm tra kết quả `validate` của Draft PR nộp bài.

## 6. Rủi ro còn tồn tại

### Rủi ro 1: Phụ thuộc vào đồng hồ trình duyệt

Nếu chỉ kiểm tra 15 giây bằng JavaScript phía trình duyệt, học sinh có thể thay đổi thời gian hoặc gửi yêu cầu trực tiếp.

**Biện pháp:** Xác thực thời gian ở backend và kiểm thử trường hợp gửi yêu cầu quá hạn.

### Rủi ro 2: Lộ đáp án chính xác

Nếu API trả về đáp án trước khi học sinh hoàn thành bài, kết quả đánh giá có thể không còn đáng tin cậy.

**Biện pháp:** Kiểm tra phản hồi API và chỉ công bố đáp án ở thời điểm phù hợp.

### Rủi ro 3: Dữ liệu không hợp lệ

Người dùng có thể gửi giá trị không phải số, số âm hoặc dữ liệu không đúng cấu trúc.

**Biện pháp:** Kiểm tra kiểu dữ liệu, miền giá trị và trạng thái lượt làm bài ở backend.

### Rủi ro 4: Thư viện có lỗ hổng

Trong quá trình cài đặt dependencies, npm đã hiển thị cảnh báo bảo mật.

**Biện pháp:** Sử dụng `npm audit` để xác định thư viện bị ảnh hưởng, đánh giá mức độ nghiêm trọng và cập nhật có kiểm soát.

## 7. Kết luận

Nhóm đã thực hiện một số bước kiểm tra cơ bản về mã nguồn và CI.

Các kiểm thử liên quan đến xác thực thời gian, bảo vệ đáp án, xử lý dữ liệu đầu vào và quyền riêng tư cần được hoàn thiện trước khi nghiệm thu cuối cùng.

Tài liệu này phản ánh trạng thái rà soát tại Checkpoint 2, không khẳng định hệ thống đã vượt qua toàn bộ kiểm thử bảo mật.