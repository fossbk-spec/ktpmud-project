# Phân tích khóa và chuẩn hóa 3NF của MVP

Bảng dưới đây liệt kê các phụ thuộc hàm theo giả định nghiệp vụ: mỗi khóa nhận diện duy nhất một bản ghi; mã được đánh dấu UNIQUE là duy nhất trong phạm vi ràng buộc. Các khóa UNIQUE có cột nullable không tự được coi là khóa ứng viên. Các ràng buộc CHECK và trigger không tự chứng minh toàn bộ tập phụ thuộc hàm.

| Bảng | Khóa chính | Khóa ứng viên khác | Thuộc tính không thuộc khóa ứng viên | Phụ thuộc và kiểm tra |
| --- | --- | --- | --- | --- |
| `app_user` | `id` | `login_name` | `password_hash`, `active`, `created_at` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `app_role` | `id` | `code` | `name` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `user_role` | `user_id`, `role_id` | — | — | Khóa chính xác định các thuộc tính còn lại; khóa ghép chỉ chứa thuộc tính khóa, không có phụ thuộc bộ phận. |
| `permission` | `id` | `code` | `description` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `role_permission` | `role_id`, `permission_id` | — | — | Khóa chính xác định các thuộc tính còn lại; khóa ghép chỉ chứa thuộc tính khóa, không có phụ thuộc bộ phận. |
| `patient` | `id` | `patient_code` | `full_name`, `birth_date`, `birth_year`, `sex`, `insurance_no`, `created_at`, `created_by` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `patient_identifier` | `id` | `issuer_scope`, `identifier_type`, `raw_value` | `patient_id`, `verification_status` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `form_template` | `id` | `code` | `name` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `form_version` | `id` | `template_id`, `version_no` | `status`, `published_at` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `form_section` | `id` | `version_id`, `code` | `label`, `sort_order` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `form_field` | `id` | `section_id`, `code` | `label`, `value_kind`, `unit`, `required`, `source_reference`, `validation_note`, `sort_order` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `field_option` | `id` | `field_id`, `code` | `label` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `encounter` | `id` | `encounter_code` | `patient_id`, `form_version_id`, `occurred_at`, `status`, `created_by`, `created_at` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `encounter_identifier` | `id` | `issuer_scope`, `identifier_type`, `raw_value` | `encounter_id`, `verification_status` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `medication_entry` | `id` | — | `encounter_id`, `medication_name`, `dose_number`, `dose_unit`, `route`, `frequency`, `started_on`, `ended_on`, `recorded_by`, `recorded_at` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `observation` | `id` | `encounter_id`, `field_id`, `event_key` | — | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `observation_version` | `id` | `observation_id`, `version_no` | `value_status`, `value_text`, `value_number`, `value_date`, `value_boolean`, `value_code`, `unit`, `observed_at`, `recorded_by`, `recorded_at` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `mapping_profile` | `id` | `name`, `version_no` | `form_version_id` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `mapping_rule` | `id` | `profile_id`, `source_column` | `field_id` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `import_batch` | `id` | — | `source_name`, `file_ref`, `mapping_profile_id`, `zero_requires_review`, `status`, `uploaded_by`, `uploaded_at` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `import_item` | `id` | `batch_id`, `source_location` | `source_column`, `mapping_rule_id`, `raw_value`, `encounter_id`, `field_id`, `status`, `message` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `import_application` | `id` | `import_item_id`, `observation_version_id` | `applied_by`, `applied_at` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `clinic_slot` | `id` | — | `starts_at`, `ends_at`, `capacity` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `appointment` | `id` | — | `patient_id`, `slot_id`, `status`, `created_at` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `audit_event` | `id` | — | `actor_id`, `action`, `target_type`, `target_id`, `occurred_at`, `result` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |

## Các giả định và giới hạn

- **Ngày/năm sinh:** chỉ một trong hai được lưu. Không coi năm sinh suy ra từ ngày sinh là một cột được lưu đồng thời.
- **Tên mã danh mục:** mã và nhãn lựa chọn nằm cùng bảng định nghĩa; cần xác nhận tính ổn định của mã và phạm vi duy nhất khi triển khai.
- **Nguồn file:** vị trí và giá trị nguyên dạng thuộc lần nhập; kết quả ghi truy về phần nguồn. Dữ liệu từ file mẫu có 0 phải đưa vào diện kiểm tra.
- **Phiên bản:** trường thuộc nhóm, nhóm thuộc phiên bản; bảng trường không lưu lặp mã phiên bản. Một số quy tắc phiên bản được bảo vệ bằng trigger.
- **Đơn vị:** đơn vị mặc định của trường và đơn vị thực ghi của từng kết quả là hai sự kiện khác nhau; chưa có danh mục chuẩn hay quy tắc chuyển đổi.
- **Trạng thái và giá trị:** trạng thái chưa biết/không áp dụng không suy thành giá trị 0 hoặc false. Cần xác nhận quan hệ nghiệp vụ giữa các trạng thái và thuộc tính giá trị.
- **Dữ liệu lặp:** event_key cho phép nhiều quan sát của cùng trường trong lượt và mỗi phiên bản có thời điểm, đơn vị; medication_entry cho phép nhiều dòng thuốc. Chưa chứng minh cấu trúc biểu mẫu hỗ trợ đầy đủ mọi tình huống thuốc hoặc tập dữ liệu có cấu trúc.

**Kết luận trong phạm vi hiện có:** đã liệt kê khóa và phụ thuộc dự kiến, tách các quan hệ nhiều–nhiều và loại một số phụ thuộc bắc cầu đã nhận diện. Chưa đủ căn cứ kết luận toàn bộ lược đồ đạt 3NF vì danh mục, định nghĩa dữ liệu lâm sàng, các phụ thuộc nghiệp vụ và phạm vi dữ liệu thuốc/xét nghiệm chưa được xác nhận đầy đủ. Chạy DDL thành công không chứng minh 3NF.
