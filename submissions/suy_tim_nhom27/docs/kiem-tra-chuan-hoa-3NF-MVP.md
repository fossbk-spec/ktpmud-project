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
| `medication_entry` | `id` | — | `encounter_id`, `medication_name`, `ingredient`, `strength`, `dose_number`, `dose_unit`, `dose_text`, `route`, `frequency`, `started_on`, `ended_on`, `medication_status`, `medication_category`, `source_note`, `observed_at`, `recorded_by`, `recorded_at` | Khóa chính xác định các thuộc tính còn lại; tên thuốc không được dùng để suy trạng thái, hoạt chất hoặc liều. |
| `observation` | `id` | `encounter_id`, `field_id`, `event_key` | — | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `observation_version` | `id` | `observation_id`, `version_no` | `value_status`, `value_text`, `value_number`, `value_date`, `value_boolean`, `value_code`, `unit`, `observed_at`, `reported_name`, `source_note`, `recorded_by`, `recorded_at` | Tên trên phiếu và nguồn thuộc bản kết quả, không suy từ định nghĩa trường. |
| `mapping_profile` | `id` | `name`, `version_no` | `form_version_id` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `mapping_rule` | `id` | `profile_id`, `source_column` | `field_id` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `import_batch` | `id` | — | `source_name`, `file_ref`, `mapping_profile_id`, `zero_requires_review`, `status`, `uploaded_by`, `uploaded_at` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
| `import_item` | `id` | `batch_id`, `source_location` | `mapping_rule_id`, `raw_value`, `encounter_id`, `status`, `message` | Khóa chính xác định các thuộc tính còn lại; cần xác nhận không có phụ thuộc bắc cầu ngoài các giả định nghiệp vụ. |
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

## Tập phụ thuộc và phép kiểm tra trong phạm vi thiết kế

Với mỗi bảng R trong bảng phân tích trên, lấy tập F gồm: PK → mọi thuộc tính còn lại, và mỗi khóa ứng viên K → mọi thuộc tính còn lại. Khóa nhiều cột được hiểu là cả bộ, không phải từng thành phần độc lập. Các thuộc tính không khóa được liệt kê theo hợp của tất cả khóa ứng viên.

Giả định nghiệp vụ dùng trong phép kiểm tra: mã và nhãn chỉ có nghĩa trong đúng phạm vi khóa khai báo; mã ICD, tên thuốc và dữ liệu văn bản trong bản ghi là thông tin ghi nhận tại thời điểm đó, không là danh mục toàn cục suy ra duy nhất từ một mã khác; thời gian, người ghi và nguồn là sự kiện của bản ghi, không suy từ cột không khóa. Tên mẫu/vai trò không được giả định duy nhất. file_ref không được coi là định danh duy nhất của nguồn hoặc lần nhập. Một cột có thể chứa giá trị chưa biết; không sử dụng NULL như một khóa ứng viên hay một giá trị có thể suy ra thông tin khác.

1. **1NF:** các cột lưu một giá trị của miền đã định; dữ liệu nhiều thuốc được tách dòng medication_entry, nhiều lần đo tách observation theo event_key, nhiều phiên bản tách observation_version. Các trường văn bản không được dùng để nhét danh sách thay cho các quan hệ đã định. Các cấu trúc chưa hỗ trợ nằm ngoài phạm vi kết luận.
2. **2NF:** bảng liên kết user_role và role_permission chỉ có thuộc tính khóa. Với khóa tự nhiên ghép của các bảng còn lại, sự kiện/định nghĩa được nhận diện bởi cả bộ; không giả định một thành phần của bộ xác định thuộc tính không khóa. Khóa id một cột không có phụ thuộc bộ phận.
3. **3NF:** trong F, mọi định thức của phụ thuộc không tầm thường đều là siêu khóa. Bởi vậy các quan hệ thỏa điều kiện 3NF đối với F. Không có chuỗi X → Y → A với Y không là siêu khóa và A là thuộc tính không khóa trong cùng quan hệ theo các giả định trên.

Đã sửa trường hợp bắc cầu cụ thể: trước đây import_item lưu mapping_rule_id và lặp field_id/source_column; vì mapping_rule_id xác định hai thuộc tính này nên đã bỏ chúng khỏi import_item. Trường đích và cột ánh xạ được suy qua mapping_rule; tọa độ nguồn thực giữ ở source_location. Phiên bản trường được suy qua form_section, không lưu lặp ở form_field. Ngày sinh đầy đủ và năm sinh riêng không lưu đồng thời; tuổi tính toán không lưu lặp ở patient.

**Kết luận:** lược đồ 25 bảng đạt 3NF đối với tập phụ thuộc F và giả định nghiệp vụ được nêu cho phạm vi hiện tại. Đây là kết luận thiết kế có điều kiện, không là chứng nhận mọi dữ liệu lâm sàng có thể được đưa vào hoặc các biến giai đoạn sau đã được mô hình hóa. Khi bổ sung danh mục mã chuẩn, quy tắc suy diễn hoặc cấu trúc lặp mới, phải kiểm tra lại các phụ thuộc và cập nhật schema nếu cần. Kết quả chạy SQL được báo cáo riêng và không dùng làm chứng minh chuẩn hóa.

## Các thuộc tính bổ sung sau đối chiếu demo

`medication_entry` ghi thêm hoạt chất, hàm lượng, liều nguyên văn, trạng thái, loại sản phẩm, nguồn và thời điểm; các thuộc tính này phụ thuộc vào chính dòng thuốc `id`, không suy từ tên thuốc. `observation_version` ghi tên chỉ số trên phiếu và nguồn do người dùng khai báo; hai thuộc tính phụ thuộc vào bản giá trị `id`, không lấy từ định nghĩa trường. Đơn vị và thời điểm tiếp tục thuộc bản giá trị, nên hai lần xét nghiệm cùng loại không ghi đè nhau. Kết luận 3NF vẫn giới hạn trong các giả định nghiệp vụ đã nêu; chưa chứng minh chuẩn hóa danh mục thuốc và thuật ngữ xét nghiệm.
