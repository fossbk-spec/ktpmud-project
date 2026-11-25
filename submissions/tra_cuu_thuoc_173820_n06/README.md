
# CS-10 — Hệ thống hỗ trợ tra cứu và phân tích thuốc

## 1. Giới thiệu sản phẩm

Hệ thống hỗ trợ tra cứu và phân tích thuốc là ứng dụng phần mềm phục vụ việc tra cứu thông tin thuốc, tiếp nhận đơn thuốc dưới dạng hình ảnh, trích xuất thông tin và hỗ trợ kiểm tra tương tác giữa các hoạt chất.

Người dùng chính của hệ thống là dược sĩ. Bác sĩ là nhóm người dùng phụ có thể tham khảo kết quả phân tích. Bệnh nhân là đối tượng hưởng lợi từ việc rà soát thông tin thuốc. Hệ thống đóng vai trò hỗ trợ tra cứu và kiểm tra, không thay thế quyết định chuyên môn của nhân viên y tế.

Các chức năng MVP:
- Tra cứu thông tin thuốc và hoạt chất.
- Tiếp nhận ảnh đơn thuốc và nhận diện nội dung bằng OCR.
- Chuẩn hóa thông tin thuốc được trích xuất.
- Kiểm tra tương tác thuốc dựa trên cơ sở dữ liệu.
- Lưu và tra cứu lịch sử đơn thuốc.
- Hiển thị thông tin giải thích kết quả kiểm tra có căn cứ dữ liệu.

Demo: Đang phát triển.

## 2. Phạm vi MVP

| Chức năng | Trạng thái |
|---|---|
| Cơ sở dữ liệu thuốc | Đã triển khai |
| Tra cứu thuốc | Đang rà soát |
| Cơ sở dữ liệu tương tác thuốc | Đã triển khai dữ liệu ban đầu |
| Kiểm tra tương tác thuốc | Đang phát triển/kiểm thử |
| OCR đơn thuốc bằng PaddleOCR | Đã tích hợp thử nghiệm |
| Hiệu chỉnh văn bản OCR bằng Qwen | Đang đánh giá |
| Quản lý lịch sử đơn thuốc | Đang phát triển |
| Giao diện hoàn chỉnh | Đang phát triển |
| Triển khai demo công khai | Chưa thực hiện |

## 3. Kiến trúc và công nghệ

Kiến trúc dự kiến gồm các thành phần:

- Frontend: Giao diện tương tác với người dùng.
- Backend: Python, FastAPI.
- Database: SQLite trong giai đoạn phát triển.
- OCR: PaddleOCR.
- Xử lý văn bản: Qwen chạy cục bộ, được đánh giá theo nhu cầu thực tế.
- Drug Interaction Engine: Đối chiếu hoạt chất với dữ liệu tương tác thuốc đã được xây dựng từ nguồn tham khảo.

Luồng xử lý chính:

1. Người dùng nhập thông tin hoặc tải ảnh đơn thuốc.
2. Backend tiếp nhận và xử lý dữ liệu.
3. OCR trích xuất nội dung từ ảnh nếu có.
4. Hệ thống chuẩn hóa thông tin thuốc.
5. Drug Interaction Engine đối chiếu dữ liệu tương tác.
6. Backend trả kết quả cho giao diện.

Sơ đồ kiến trúc C4 và ERD sẽ được bổ sung trong thư mục report/.

## 4. Cài đặt và cách sử dụng

Môi trường phát triển:
- Windows 10/11.
- Python 3.12.5.
- FastAPI.
- SQLite.
- PaddleOCR.
- Ollama (nếu sử dụng chức năng hiệu chỉnh OCR bằng Qwen).

Cách sử dụng dự kiến:

1. Tra cứu thông tin một loại thuốc theo tên hoặc hoạt chất.
2. Tải ảnh đơn thuốc để trích xuất danh sách thuốc.
3. Kiểm tra tương tác giữa các thuốc trong đơn.
4. Tra cứu và rà soát tương tác giữa các đơn thuốc trong lịch sử.

Hướng dẫn cài đặt chi tiết, lệnh chạy backend, lệnh kiểm thử và dữ liệu mẫu synthetic sẽ được hoàn thiện trong quá trình phát triển MVP.

## 5. Hướng phát triển Tuần 11–15

| Tuần | Mục tiêu | Đầu việc | MSSV phụ trách | Tiêu chí hoàn thành |
|---|---|---|---|---|
| 11 | Chốt MVP | Rà soát chức năng và kiến trúc | 202414030, 202414334 | Thống nhất phạm vi |
| 12 | Hoàn thiện hồ sơ | SRS, README, submission và PR #1 | 202414030, 202414334 | CI PASSED |
| 13 | Kiểm thử | Unit test, Integration test | 202414030, 202414334 | Coverage module cốt lõi >= 60% |
| 14 | Bảo mật | Validate input, phân quyền, rà soát dữ liệu | 202414030, 202414334 | Hoàn thiện báo cáo bảo mật |
| 15 | Hoàn thiện sản phẩm | Review chéo, sửa lỗi, quay video demo | 202414030, 202414334 | Có bản demo và code freeze |

Trạng thái công việc sẽ được cập nhật theo tiến độ thực tế.

## 6. Nhóm và tuân thủ

Case Study ID: CS-10

Case Study Slug: tra_cuu_thuoc

Mã nhóm: 173820_n06

Thành viên:
- 202414030
- 202414334

Cam kết tuân thủ:
- Chỉ sử dụng dữ liệu synthetic cho kiểm thử.
- Không đưa thông tin cá nhân hoặc thông tin sức khỏe của bệnh nhân thật vào repository.
- Không công khai mật khẩu, token, API key hoặc file .env.
- Chỉ sử dụng MSSV trong tài liệu và repository.
- Các kết quả phân tích tương tác thuốc phải dựa trên dữ liệu có nguồn tham khảo.

Công cụ AI hỗ trợ phát triển: ChatGPT, Qwen (thử nghiệm xử lý văn bản OCR).
