# Từ điển dữ liệu MVP

Tài liệu được tạo từ schema PostgreSQL; PK là khóa chính, FK là khóa ngoại. NOT NULL: bắt buộc; các trường khác được phép để trống. GENERATED AS IDENTITY: mã tự tăng.

## app_user

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Khóa tài khoản | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| login_name | Tên đăng nhập | `text NOT NULL UNIQUE` |
| password_hash | Giá trị băm mật khẩu | `text NOT NULL` |
| active | Trạng thái hoạt động | `boolean NOT NULL DEFAULT true` |
| created_at | Thời điểm tạo | `timestamptz NOT NULL DEFAULT now()` |

Ràng buộc của bảng: không có ràng buộc bổ sung.

## app_role

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Định danh nội bộ | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| code | Mã nhận diện | `text NOT NULL UNIQUE` |
| name | Tên hiển thị | `text NOT NULL` |

Ràng buộc của bảng: không có ràng buộc bổ sung.

## user_role

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| user_id | Tài khoản | `bigint NOT NULL REFERENCES app_user(id)` |
| role_id | Vai trò | `bigint NOT NULL REFERENCES app_role(id)` |

Ràng buộc của bảng: `PRIMARY KEY(user_id,role_id)`

## permission

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Định danh nội bộ | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| code | Mã nhận diện | `text NOT NULL UNIQUE` |
| description | Mô tả | `text NOT NULL` |

Ràng buộc của bảng: không có ràng buộc bổ sung.

## role_permission

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| role_id | Vai trò | `bigint NOT NULL REFERENCES app_role(id)` |
| permission_id | Quyền truy cập | `bigint NOT NULL REFERENCES permission(id)` |

Ràng buộc của bảng: `PRIMARY KEY(role_id,permission_id)`

## patient

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Khóa nội bộ | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| patient_code | Mã hiển thị BN-xxxxx | `text NOT NULL UNIQUE CHECK(patient_code ~ '^BN-[0-9]{5}$')` |
| full_name | Họ tên người bệnh | `text NOT NULL` |
| birth_date | Thuộc tính birth_date | `date` |
| birth_year | Thuộc tính birth_year | `smallint CHECK (birth_year BETWEEN 1850 AND 2100)` |
| sex | Thuộc tính sex | `text` |
| insurance_no | Thuộc tính insurance_no | `text` |
| created_at | Thời điểm tạo | `timestamptz NOT NULL DEFAULT now()` |
| created_by | Người tạo | `bigint NOT NULL REFERENCES app_user(id)` |

Ràng buộc của bảng: `CHECK (birth_date IS NULL OR birth_year IS NULL)`

## patient_identifier

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Khóa liên kết | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| patient_id | Hồ sơ được liên kết | `bigint NOT NULL REFERENCES patient(id)` |
| issuer_scope | Nơi cấp và phạm vi mã | `text NOT NULL` |
| identifier_type | Loại mã nguồn | `text NOT NULL` |
| raw_value | Mã nguyên dạng | `text NOT NULL` |
| verification_status | Trạng thái đối chiếu | `text NOT NULL CHECK(verification_status IN ('pending','verified','rejected'))` |

Ràng buộc của bảng: `UNIQUE(issuer_scope,identifier_type,raw_value)`

## form_template

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Khóa mẫu | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| code | Mã mẫu | `text NOT NULL UNIQUE` |
| name | Tên mẫu | `text NOT NULL` |

Ràng buộc của bảng: không có ràng buộc bổ sung.

## form_version

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Khóa phiên bản | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| template_id | Mẫu gốc | `bigint NOT NULL REFERENCES form_template(id)` |
| version_no | Số phiên bản theo mẫu | `integer NOT NULL CHECK (version_no > 0)` |
| status | Nháp hoặc được áp dụng | `text NOT NULL CHECK (status IN ('draft','published','retired'))` |
| published_at | Thời điểm áp dụng | `timestamptz` |

Ràng buộc của bảng: `UNIQUE(template_id,version_no)`

## form_section

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Khóa nhóm | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| version_id | Thuộc tính version_id | `bigint NOT NULL REFERENCES form_version(id)` |
| code | Mã nhận diện | `text NOT NULL` |
| label | Tên nhóm | `text NOT NULL` |
| sort_order | Thứ tự hiển thị | `integer NOT NULL CHECK(sort_order >= 0)` |

Ràng buộc của bảng: `UNIQUE(version_id,code)`

## form_field

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Khóa trường theo phiên bản | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| section_id | Nhóm chứa trường | `bigint NOT NULL REFERENCES form_section(id)` |
| code | Mã nhận diện | `text NOT NULL` |
| label | Tên hiển thị | `text NOT NULL` |
| value_kind | Kiểu giá trị | `text NOT NULL CHECK(value_kind IN ('text','number','date','boolean','choice'))` |
| unit | Thuộc tính unit | `text` |
| required | Thuộc tính required | `boolean NOT NULL DEFAULT false` |
| source_reference | Thuộc tính source_reference | `text` |
| validation_note | Thuộc tính validation_note | `text` |
| sort_order | Thứ tự | `integer NOT NULL CHECK(sort_order >= 0)` |

Ràng buộc của bảng: `UNIQUE(section_id,code)`

## field_option

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Khóa lựa chọn | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| field_id | Trường chủ | `bigint NOT NULL REFERENCES form_field(id)` |
| code | Mã nhận diện | `text NOT NULL` |
| label | Nội dung | `text NOT NULL` |

Ràng buộc của bảng: `UNIQUE(field_id,code)`

## encounter

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Khóa lượt | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| patient_id | Hồ sơ chủ | `bigint NOT NULL REFERENCES patient(id)` |
| form_version_id | Mẫu được dùng | `bigint NOT NULL REFERENCES form_version(id)` |
| encounter_code | Mã lượt nội bộ | `text NOT NULL UNIQUE` |
| occurred_at | Thời điểm khám nếu biết | `timestamptz` |
| status | Trạng thái lượt | `text NOT NULL CHECK(status IN ('draft','in_progress','completed'))` |
| created_by | Người mở lượt | `bigint NOT NULL REFERENCES app_user(id)` |
| created_at | Thời điểm mở lượt | `timestamptz NOT NULL DEFAULT now()` |

Ràng buộc của bảng: không có ràng buộc bổ sung.

Chỉ mục bổ sung: `ix_encounter_patient_time (patient_id,occurred_at)`.

## encounter_identifier

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Khóa liên kết | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| encounter_id | Lượt được liên kết | `bigint NOT NULL REFERENCES encounter(id)` |
| issuer_scope | Nơi cấp và phạm vi mã | `text NOT NULL` |
| identifier_type | Loại mã nguồn | `text NOT NULL` |
| raw_value | Mã nguyên dạng | `text NOT NULL` |
| verification_status | Trạng thái đối chiếu | `text NOT NULL CHECK(verification_status IN ('pending','verified','rejected'))` |

Ràng buộc của bảng: `UNIQUE(issuer_scope,identifier_type,raw_value)`

## medication_entry

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Định danh nội bộ | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| encounter_id | Lượt khám | `bigint NOT NULL REFERENCES encounter(id)` |
| medication_name | Thuộc tính medication_name | `text NOT NULL` |
| dose_number | Thuộc tính dose_number | `numeric CHECK(dose_number >= 0)` |
| dose_text | Mô tả liều nguyên văn | `text` |
| ingredient | Hoạt chất ghi nhận | `text` |
| strength | Hàm lượng ghi nhận | `text` |
| dose_unit | Thuộc tính dose_unit | `text` |
| route | Thuộc tính route | `text` |
| frequency | Thuộc tính frequency | `text` |
| medication_status | Trạng thái thuốc, có thể chưa biết | `text CHECK(medication_status IN ('current','planned','stopped'))` |
| medication_category | Loại sản phẩm | `text CHECK(medication_category IN ('prescription','otc','supplement','traditional'))` |
| source_note | Nguồn thông tin do người dùng ghi | `text` |
| observed_at | Thời điểm thông tin thuốc | `timestamptz` |
| started_on | Thuộc tính started_on | `date` |
| ended_on | Thuộc tính ended_on | `date` |
| recorded_by | Thuộc tính recorded_by | `bigint NOT NULL REFERENCES app_user(id)` |
| recorded_at | Thuộc tính recorded_at | `timestamptz NOT NULL DEFAULT now()` |

Ràng buộc của bảng: `CHECK(started_on IS NULL OR ended_on IS NULL OR ended_on >= started_on)`; `CHECK(dose_number IS NULL OR dose_unit IS NOT NULL)`. Trạng thái để NULL khi chưa xác nhận thuốc đang dùng, dự kiến hay đã ngừng.

Chỉ mục bổ sung: `ix_medication_encounter (encounter_id)`.

## observation

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Định danh nội bộ | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| encounter_id | Lượt khám | `bigint NOT NULL REFERENCES encounter(id)` |
| field_id | Trường biểu mẫu | `bigint NOT NULL REFERENCES form_field(id)` |
| event_key | Định danh lần ghi trong lượt | `text NOT NULL DEFAULT 'default'` |

Ràng buộc của bảng: `UNIQUE(encounter_id,field_id,event_key)`

Chỉ mục bổ sung: `ix_observation_encounter (encounter_id)`.

## observation_version

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Định danh nội bộ | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| observation_id | Thuộc tính observation_id | `bigint NOT NULL REFERENCES observation(id)` |
| version_no | Số phiên bản | `integer NOT NULL CHECK(version_no > 0)` |
| value_status | Tình trạng giá trị | `text NOT NULL CHECK(value_status IN ('known','unknown','not_applicable'))` |
| value_text | Giá trị văn bản | `text` |
| value_number | Giá trị số | `numeric` |
| value_date | Giá trị ngày | `date` |
| value_boolean | Giá trị đúng sai | `boolean` |
| reported_name | Tên chỉ số gốc trên phiếu | `text` |
| source_note | Nguồn kết quả được ghi nhận | `text` |
| value_code | Mã lựa chọn | `text` |
| unit | Thuộc tính unit | `text` |
| observed_at | Thuộc tính observed_at | `timestamptz` |
| recorded_by | Thuộc tính recorded_by | `bigint NOT NULL REFERENCES app_user(id)` |
| recorded_at | Thuộc tính recorded_at | `timestamptz NOT NULL DEFAULT now()` |

Ràng buộc của bảng: `UNIQUE(observation_id,version_no)`; `CHECK ((value_status = 'known' AND num_nonnulls(value_text,value_number,value_date,value_boolean,value_code) = 1) OR (value_status <> 'known' AND num_nonnulls(value_text,value_number,value_date,value_boolean,value_code) = 0))`

## mapping_profile

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Định danh nội bộ | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| name | Tên hiển thị | `text NOT NULL` |
| version_no | Số phiên bản | `integer NOT NULL CHECK(version_no > 0)` |
| form_version_id | Phiên bản biểu mẫu | `bigint NOT NULL REFERENCES form_version(id)` |

Ràng buộc của bảng: `UNIQUE(name,version_no)`

## mapping_rule

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Định danh nội bộ | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| profile_id | Cấu hình ánh xạ | `bigint NOT NULL REFERENCES mapping_profile(id)` |
| source_column | Tên cột nguồn | `text NOT NULL` |
| field_id | Trường biểu mẫu | `bigint NOT NULL REFERENCES form_field(id)` |

Ràng buộc của bảng: `UNIQUE(profile_id,source_column)`

## import_batch

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Khóa lần nhập | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| source_name | Nguồn file | `text NOT NULL` |
| file_ref | Tham chiếu tệp được lưu | `text` |
| mapping_profile_id | Cấu hình ánh xạ được chọn | `bigint REFERENCES mapping_profile(id)` |
| zero_requires_review | Thuộc tính zero_requires_review | `boolean NOT NULL DEFAULT true` |
| status | Trạng thái tổng hợp | `text NOT NULL CHECK(status IN ('received','review','applied','failed'))` |
| uploaded_by | Người tải file | `bigint NOT NULL REFERENCES app_user(id)` |
| uploaded_at | Thời điểm tải file | `timestamptz NOT NULL DEFAULT now()` |

Ràng buộc của bảng: không có ràng buộc bổ sung.

## import_item

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Khóa phần dữ liệu | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| batch_id | Lần nhập chứa phần này | `bigint NOT NULL REFERENCES import_batch(id)` |
| source_location | Vị trí nguồn | `text NOT NULL` |
| mapping_rule_id | Thuộc tính mapping_rule_id | `bigint REFERENCES mapping_rule(id)` |
| raw_value | Giá trị nguyên dạng | `text` |
| encounter_id | Lượt khám | `bigint REFERENCES encounter(id)` |
| status | Hợp lệ hoặc chờ hoặc lỗi | `text NOT NULL CHECK(status IN ('pending','valid','review','applied','error'))` |
| message | Lý do và cảnh báo | `text` |

Ràng buộc của bảng: `UNIQUE(batch_id,source_location)`; `CHECK(status NOT IN ('valid','applied') OR (mapping_rule_id IS NOT NULL AND encounter_id IS NOT NULL))`

Chỉ mục bổ sung: `ix_import_item_batch_status (batch_id,status)`.

## import_application

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Khóa áp dụng | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| import_item_id | Phần nguồn | `bigint NOT NULL REFERENCES import_item(id)` |
| observation_version_id | Bản giá trị đã ghi | `bigint NOT NULL REFERENCES observation_version(id)` |
| applied_by | Người xác nhận | `bigint NOT NULL REFERENCES app_user(id)` |
| applied_at | Thời điểm ghi | `timestamptz NOT NULL DEFAULT now()` |

Ràng buộc của bảng: `UNIQUE(import_item_id,observation_version_id)`

## clinic_slot

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Định danh nội bộ | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| starts_at | Thời điểm bắt đầu | `timestamptz NOT NULL` |
| ends_at | Thời điểm kết thúc | `timestamptz NOT NULL` |
| capacity | Sức chứa khung giờ | `integer NOT NULL CHECK(capacity > 0)` |

Ràng buộc của bảng: `CHECK(ends_at > starts_at)`

## appointment

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Khóa lịch | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| patient_id | Người bệnh | `bigint NOT NULL REFERENCES patient(id)` |
| slot_id | Khung giờ khám | `bigint NOT NULL REFERENCES clinic_slot(id)` |
| status | Trạng thái lịch | `text NOT NULL CHECK(status IN ('booked','cancelled','completed'))` |
| created_at | Thời điểm tạo | `timestamptz NOT NULL DEFAULT now()` |

Ràng buộc của bảng: không có ràng buộc bổ sung.

Chỉ mục bổ sung: `ix_appointment_patient (patient_id)`.

## audit_event

| Trường | Ý nghĩa | Kiểu và ràng buộc |
| --- | --- | --- |
| id | Khóa sự kiện | `bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY` |
| actor_id | Người thực hiện nếu có | `bigint REFERENCES app_user(id)` |
| action | Thao tác | `text NOT NULL` |
| target_type | Loại đối tượng | `text NOT NULL` |
| target_id | Đối tượng nếu có | `bigint` |
| occurred_at | Thời điểm | `timestamptz NOT NULL DEFAULT now()` |
| result | Kết quả | `text NOT NULL` |

Ràng buộc của bảng: không có ràng buộc bổ sung.

Chỉ mục bổ sung: `ix_audit_actor_time (actor_id,occurred_at)`.

Khóa chính và UNIQUE tạo chỉ mục duy nhất trong PostgreSQL. Các điều kiện liên bảng sau được thực hiện bằng trigger, không phải CHECK tham chiếu bảng khác:

| Quy tắc | Cơ chế trong schema |
| --- | --- |
| Trường và lượt cùng phiên bản mẫu | observation_field_version; encounter_form_valid |
| Kiểu giá trị và lựa chọn đúng trường | observation_value_valid; CHECK một ô giá trị |
| Lịch sử giá trị không bị ghi đè | observation_version_immutable; observation_identity_locked |
| Dữ liệu nguồn và giá trị áp dụng cùng lượt/trường | import_application_match; import_mapping_valid |
| Nguồn 0 phải chờ rà soát khi chính sách được bật | import_zero_review |
| Không đổi phần nguồn sau khi ghi | import_item_locked |
| Không sửa cấu hình ánh xạ đã dùng | used_mapping_profile; used_mapping_rule |
| Không sửa mẫu đã phát hành hoặc dùng | protect_version; protect_section; protect_field; protect_option |
| Lịch hẹn không vượt sức chứa | appointment_capacity; slot_capacity_valid; khóa hàng khung giờ trong giao dịch |

Ứng dụng chịu trách nhiệm phân quyền, xác minh mã nguồn đúng người bệnh, đọc file, trình bày xem trước, kiểm tra bắt buộc theo thao tác và ghi nhật ký. Các quy tắc chuyển đơn vị, suy diễn lâm sàng và danh mục chưa chốt không được tuyên bố là đã được DDL thực thi. Các phép kiểm thử đã chạy được nêu riêng tại [kết quả kiểm thử](internal/kiem-thu-co-so-du-lieu-MVP.md).
