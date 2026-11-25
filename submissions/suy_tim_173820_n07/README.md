## 1. Giới thiệu sản phẩm
Hệ thống quản lý và hỗ trợ quyết định lâm sàng cho bệnh nhân suy tim tại Bệnh viện Hữu Nghị được xây dựng nhằm tập trung hóa quản lý hồ sơ bệnh án, lịch khám và tái khám, đơn thuốc cũng như theo dõi chỉ số sức khỏe tại nhà (cân nặng, huyết áp, nhịp tim, mức độ phù và triệu chứng). Giải pháp kết nối dữ liệu theo dõi ngoại trú với quy trình khám lâm sàng của bác sĩ, hỗ trợ đánh giá các đặc thù ở bệnh nhân suy tim cao tuổi như kiểu hình phân suất tống máu (HFrEF, HFmrEF, HFpEF), phân độ NYHA, bệnh đồng mắc, đa thuốc và hội chứng dễ bị tổn thương (frailty) theo hướng dẫn chuyên môn.

## 2. Phạm vi MVP
Phạm vi MVP bám sát các nhóm chức năng 01–06 của hệ thống:
- Quản lý hồ sơ bệnh án và lượt khám: tạo/liên kết hồ sơ bệnh án, quản lý khung giờ và lịch hẹn, tiếp nhận/mở lượt khám, ghi nhận thông tin khám và tra cứu lịch sử khám, điều trị.
- Tích hợp và tiền xử lý dữ liệu: tiếp nhận, đối chiếu, kiểm tra hợp lệ/thiếu/trùng, chuẩn hóa dữ liệu từ HIS/EMR, LIS, PACS/RIS và quản lý trạng thái trao đổi dữ liệu.
- Hỗ trợ bệnh nhân ngoại trú và quản trị hệ thống: theo dõi và cập nhật chỉ số sức khỏe tại nhà, cảnh báo chỉ số bất thường, quản lý lịch khám và xem kết quả/kế hoạch đã công bố, nhắc lịch/nhắc thuốc, quản lý tài khoản/vai trò/quyền truy cập, nhật ký hệ thống (Audit Log) và sao lưu dữ liệu

## 3. Kiến trúc & công nghệ
Hệ thống được tổ chức theo kiến trúc phân tầng và mô hình C4 (Context, Container) gồm 5 tầng xử lý dữ liệu từ nguồn bệnh viện (HIS/EMR, LIS, PACS/RIS), tầng tích hợp và tiền xử lý HL7/FHIR ETL (chuẩn hóa bộ biến đầu vào), động cơ AI-CDSS 4 mô hình nối tiếp (Diagnosis, Lab/Test, Treatment, MedSafety), tầng kiểm duyệt lâm sàng (Human-in-the-Loop) đến tầng đầu ra cập nhật EMR/đơn thuốc và lưu vết Audit Log.
- Frontend Web & giao diện bệnh nhân: React, TypeScript, Tailwind CSS.
- Backend & xử lý nghiệp vụ: Python, FastAPI.
- AI-CDSS Engine: Python (Scikit-learn, PyTorch/TensorFlow).
- Lưu trữ, hàng đợi & hạ tầng: PostgreSQL, Redis, RabbitMQ, Docker Compose.

## 4. Cài đặt & cách sử dụng
1. Yêu cầu môi trường: Node.js (>= 18), Python (>= 3.10), Git và Docker (nếu chạy trọn bộ dịch vụ).
2. Cài đặt và chạy Frontend:
   - Cài đặt các gói phụ thuộc: `npm install`
   - Khởi chạy ứng dụng web: `npm run dev` (hoặc `npm start`)
3. Cài đặt và chạy Backend / dịch vụ API (khi triển khai kèm API):
   - Cài đặt các gói phụ thuộc: `pip install -r requirements.txt`
   - Khởi chạy dịch vụ: `uvicorn main:app --reload`
4. Sử dụng bản demo: đăng nhập theo các vai trò (Bác sĩ, Bệnh nhân, Nhân viên y tế, Quản trị viên) bằng tài khoản dữ liệu giả lập để tạo/liên kết hồ sơ bệnh án, ghi nhận chỉ số sinh hiệu, tiếp nhận và xử lý cảnh báo, ghi nhận thông tin khám và theo dõi lịch sử thao tác.

## 5. Hướng phát triển Tuần 11–15
- Tuần 12 (25/11): Nộp Báo cáo cuối kỳ v1 (2026.11.25) đã bổ sung đủ 3 mục trước Tài liệu tham khảo (Trang web và tài khoản; Form khảo sát; Timeline và nội dung cập nhật project đến cuối kỳ), hoàn thiện README đủ 6 mục, `submission.json` và mở PR #1 đạt CI `[PASSED]`.
- Tuần 13 (30/11): Thực hiện kiểm thử chức năng, dữ liệu và hiệu năng MVP, nộp Test Report v1 trong thư mục `report/`.
- Tuần 14 (07/12): Hoàn thiện báo cáo bảo mật và đánh giá kết quả, độ an toàn lâm sàng của phân hệ AI-CDSS.
- Tuần 15 (14/12): Thực hiện review chéo với 1 nhóm khác, đóng băng mã nguồn (code freeze) và hoàn thiện video demo (3–5 phút).
- Tuần 16 (20/12): Nộp PR bản cuối (`tag v1.0`) gồm mã nguồn, báo cáo, slide, video và bảo vệ đồ án.

## 6. Nhóm & tuân thủ
- Thành viên nhóm (173820_n07):
  - `202414322` — Front-End Developer (FE)
  - `202414335` — Business Analyst (BA)
  - `202413975` — Back-End Developer (BE)
- Tuân thủ quy định: Toàn bộ hồ sơ bệnh nhân, chỉ số lâm sàng, tài khoản và dữ liệu thử nghiệm trong dự án đều là dữ liệu giả lập (synthetic); không sử dụng dữ liệu thật của người bệnh tại Bệnh viện Hữu Nghị, không ghi họ tên thành viên trong các file nộp và không lưu file `.env`, khóa bí mật hoặc file vượt quá 10MB trong repository.

Để thầy cô và hội đồng thuận tiện kiểm tra các phân hệ chức năng tương ứng với từng vai trò tác nhân, hệ thống thiết lập sẵn 3 tài khoản mẫu sau:

### 1. Phân hệ Bệnh nhân (Patient Portal)
* **Vai trò:** `PATIENT` (Bệnh nhân ngoại trú)
* **Tên đăng nhập:** minhquantram
* **Mật khẩu:** `Lamvlog06`


### 2. Phân hệ Bác sĩ / Lâm sàng (Doctor Dashboard)
* **Vai trò:** `DOCTOR` (Bác sĩ điều trị khoa Tim mạch)
* **Tên đăng nhập:** `minhquantran06`
* **Mật khẩu:** `Lamvlog06`


### 3. Phân hệ Quản trị hệ thống (Admin Dashboard)
* **Vai trò:** `ADMIN` (Quản trị viên hệ thống IT)
* **Tên đăng nhập:** `minhquantran2006`
* **Mật khẩu:** `Lamvlog06`
