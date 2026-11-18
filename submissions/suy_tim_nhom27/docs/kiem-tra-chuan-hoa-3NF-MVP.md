# Kiểm tra chuẩn hóa dữ liệu MVP

Phạm vi: các bảng trong [schema-MVP.sql](../database/schema-MVP.sql). Đây là phân tích theo phụ thuộc nghiệp vụ đang dùng để thiết kế, cần được nhóm xác nhận trước khi kết luận toàn bộ hệ thống đạt 3NF.

| Bảng | Khóa chính | Các khóa duy nhất khác | Phụ thuộc dự kiến |
| --- | --- | --- | --- |
| app_user | id | login_name | tài khoản xác định tên đăng nhập, mật khẩu băm và trạng thái |
| app_role | id | code | mã vai trò xác định tên vai trò |
| user_role | user_id, role_id | — | quan hệ tài khoản–vai trò, không có thuộc tính ngoài khóa |
| permission | id | code | mã quyền xác định mô tả quyền |
| role_permission | role_id, permission_id | — | quan hệ vai trò–quyền, không có thuộc tính ngoài khóa |
| patient | id | patient_code | hồ sơ xác định các thông tin hành chính; ngày sinh đầy đủ và năm sinh riêng không lưu đồng thời |
| form_template | id | code | mã mẫu xác định tên mẫu |
| form_version | id | template_id, version_no | mỗi phiên bản thuộc một mẫu |
| form_section | id | version_id, code | mỗi nhóm thuộc một phiên bản mẫu |
| form_field | id | section_id, code | mỗi trường thuộc một nhóm; phiên bản xác định qua nhóm |
| field_option | id | field_id, code | lựa chọn thuộc một trường |
| encounter | id | encounter_code | lượt khám xác định hồ sơ và phiên bản mẫu |
| observation | id | encounter_id, field_id, event_key | bản ghi xác định lượt, trường và lần ghi |
| observation_version | id | observation_id, version_no | bản giá trị xác định trạng thái, nội dung, thời điểm và người ghi |
| mapping_profile | id | name, version_no | phiên bản ánh xạ xác định mẫu áp dụng |
| mapping_rule | id | profile_id, source_column | cột nguồn trong cấu hình xác định trường đích |
| import_batch | id | — | lần nhập xác định nguồn, ánh xạ và trạng thái |
| import_item | id | batch_id, source_location | vị trí trong lần nhập xác định giá trị nguồn và kết quả đối chiếu |
| import_application | id | import_item_id, observation_version_id | liên kết phần nguồn và phiên bản giá trị được ghi |
| clinic_slot | id | — | khung giờ xác định thời gian và sức chứa |
| appointment | id | — | lịch hẹn xác định hồ sơ, khung giờ và trạng thái |
| audit_event | id | — | sự kiện xác định người thao tác, đối tượng và kết quả |

Tách bảng loại bỏ các phụ thuộc điển hình như `section_id → version_id` khỏi bảng trường biểu mẫu. Các mối quan hệ nhiều–nhiều dùng khóa ghép. Đánh giá này phụ thuộc vào các giả định nêu trong bảng; chưa phải chứng minh đầy đủ mọi phụ thuộc hàm của dữ liệu suy tim hoặc cấu hình nguồn. Không dùng kết quả chạy DDL làm bằng chứng đạt 3NF.

Ràng buộc đúng phiên bản mẫu, đúng người và lượt, lựa chọn thuộc đúng trường, sức chứa khi nhiều thao tác đồng thời, cùng khả năng tái lập phiên bản mẫu phải được triển khai và kiểm thử bổ sung. Việc tách bảng và phân tích khóa không thay thế các ràng buộc nghiệp vụ này.
