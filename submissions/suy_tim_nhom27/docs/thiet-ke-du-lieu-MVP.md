# 5.3 Thiết kế dữ liệu cho MVP

**Phạm vi duyệt công việc 3.2:** lược đồ quan hệ 25 bảng, danh mục khởi tạo 61 trường lâm sàng và các trường hành chính. Các biến còn lại được quản lý trong bảng truy vết và bổ sung qua phiên bản biểu mẫu sau. Phạm vi gồm quản lý hồ sơ và lượt khám, tiếp nhận file, tài khoản và quản trị; các chức năng AI và cổng bệnh nhân thuộc hướng mở rộng.

## Các nhóm dữ liệu

| Nhóm | Bảng đề xuất | Mục đích |
| --- | --- | --- |
| Tài khoản | app_user, app_role, user_role, permission, role_permission | Xác thực và phân quyền |
| Hồ sơ | patient, patient_identifier, encounter, encounter_identifier | Quản lý người bệnh, định danh nguồn và các lượt khám |
| Biểu mẫu | form_template, form_version, form_section, form_field, field_option | Thiết kế phiên bản mẫu và các trường |
| Dữ liệu khám | observation, observation_version, medication_entry | Giá trị theo lượt, trường, thời điểm; các bản sửa đổi và nhiều thuốc |
| Nhập file | mapping_profile, mapping_rule, import_batch, import_item, import_application | Ánh xạ, tiếp nhận, đối chiếu và kết quả ghi |
| Lịch khám | clinic_slot, appointment | Khung giờ và lịch hẹn |
| Nhật ký | audit_event | Ghi nhận thao tác |

Hồ sơ có nhiều lượt khám; mỗi lượt gắn một phiên bản mẫu. Một mẫu có nhiều phiên bản; phiên bản có nhiều nhóm, mỗi nhóm chứa các trường. Bản ghi khám gắn với lượt và trường, và có thể có nhiều phiên bản giá trị. File được tiếp nhận thành lần nhập, gồm nhiều phần dữ liệu để kiểm tra và đối chiếu. Khung giờ có thể có nhiều lịch hẹn.

## 3NF và những điều kiện cần tiếp tục kiểm tra

Thiết kế tách tài khoản và vai trò, biểu mẫu và phiên bản, trường và lựa chọn, bản ghi và phiên bản giá trị. Mỗi trường biểu mẫu xác định phiên bản thông qua nhóm trường để giảm dữ liệu lặp. Phân tích chuẩn hóa dưới đây xác định khóa, phụ thuộc hàm và giả định của lược đồ trong phạm vi hiện tại; không dùng số lượng trường để kết luận 3NF.

Trigger kiểm tra trường thuộc mẫu của lượt, kiểu và lựa chọn, kết quả nhập đúng lượt/trường, bảo vệ mẫu đã phát hành, giữ nguồn 0 ở trạng thái cần kiểm tra, và khóa khung giờ khi nhận lịch. Mặc định kiểm tra 0 được bật cho lần nhập; quyền thay đổi thiết lập và việc bác sĩ xác nhận phải được ứng dụng quản lý. Không coi điều này thay thế xác nhận định danh người bệnh: bước đối chiếu mã nguồn và quyết định của bác sĩ vẫn do ứng dụng thực hiện. Chưa kiểm chứng đầy đủ mọi đường cập nhật dữ liệu liên bảng hoặc các giao dịch đồng thời. Tính bắt buộc theo từng thao tác, chuẩn hóa đơn vị và xử lý lâm sàng chưa được DDL kiểm chứng.

## Chỉ mục và ràng buộc

DDL có khóa chính và khóa ngoại, ràng buộc duy nhất, kiểm tra và chỉ mục. Đã tạo 25 bảng trên PostgreSQL thử riêng, nạp 61 trường và chạy các ca mô tả tại [kết quả kiểm thử](kiem-thu-co-so-du-lieu-MVP.md).

## Lưu ý triển khai

DDL dự kiến dùng cho PostgreSQL trên cơ sở dữ liệu trống, chưa là migration cho bản demo cũ và chưa có quy trình chuyển dữ liệu. Các mô tả trạng thái, dữ liệu nhập và quy tắc lâm sàng phải được nhóm xác nhận; không dùng dữ liệu bệnh nhân thật trong bộ tài liệu.

Sao lưu/khôi phục thuộc quy trình vận hành PostgreSQL và kho tệp, không cần tạo một bản sao các bảng nghiệp vụ trong schema. Kiểm thử khôi phục không nằm trong các kết quả SQL đã nêu ở đợt này.

## Sơ đồ chi tiết

### Hồ sơ bệnh nhân và lượt khám

![ERD-ho-so-benh-nhan-va-luot-kham](architecture/ERD-ho-so-benh-nhan-va-luot-kham.png)

[Sửa sơ đồ trong draw.io](architecture/ERD-ho-so-benh-nhan-va-luot-kham.drawio)

### Biểu mẫu và trường dữ liệu

![ERD-bieu-mau-va-truong-du-lieu](architecture/ERD-bieu-mau-va-truong-du-lieu.png)

[Sửa sơ đồ trong draw.io](architecture/ERD-bieu-mau-va-truong-du-lieu.drawio)

### Tiếp nhận file và ánh xạ

![ERD-tiep-nhan-file-va-anh-xa](architecture/ERD-tiep-nhan-file-va-anh-xa.png)

[Sửa sơ đồ trong draw.io](architecture/ERD-tiep-nhan-file-va-anh-xa.drawio)

### Tài khoản, lịch khám và nhật ký

![ERD-tai-khoan-lich-kham-va-nhat-ky](architecture/ERD-tai-khoan-lich-kham-va-nhat-ky.png)

[Sửa sơ đồ trong draw.io](architecture/ERD-tai-khoan-lich-kham-va-nhat-ky.drawio)


[Từ điển dữ liệu](tu-dien-du-lieu-MVP.md) · [Kịch bản tạo bảng](../database/schema-MVP.sql)

[Phân tích khóa và chuẩn hóa 3NF](kiem-tra-chuan-hoa-3NF-MVP.md)

## Biểu mẫu và truy vết nguồn

- [Cấu hình biểu mẫu JSON](cau-hinh-bieu-mau-suy-tim-v1.json) và [seed nạp biểu mẫu](../database/seed-bieu-mau-suy-tim-v1.sql): 61 trường lâm sàng, cận lâm sàng và thông tin theo nguồn; trường hành chính được lưu riêng. Các trường đều cho phép chưa biết; nội dung, đơn vị và lựa chọn cần được bác sĩ rà soát.
- [Truy vết 206 biến TL06](truy-vet-truong-nguon-suy-tim.md): 47 dòng thuộc MVP (bao gồm giới tính lưu ở hồ sơ), 65 dòng đầu ra dự kiến cho giai đoạn sau và 94 dòng cần xác nhận. Không hiểu các biến chưa xác nhận là đã loại bỏ.
- [Truy vết 42 cột file mẫu](truy-vet-cot-file-mau.md): tên cột và hướng ánh xạ, không chứa dữ liệu người bệnh.
- [95 mục đối chiếu TL04–TL05](truy-vet-nguon-TL04-TL05.md): kế thừa lần rà trước; kiểu và đích cần đối chiếu lại theo schema mới.
- [Đối chiếu dữ liệu với repo demo-web-3](doi-chieu-du-lieu-voi-demo-web-3.md): so sánh mã trường, cấu trúc huyết áp, xét nghiệm, thuốc và các điểm cần xác nhận trước khi mở rộng biểu mẫu.
- [Kiểm thử và cách chạy](kiem-thu-co-so-du-lieu-MVP.md).

Nhóm tài liệu TL01–TL03 đã dùng làm căn cứ phạm vi lâm sàng nhưng chưa có bảng truy vết đầy đủ từng thông tin sang trường biểu mẫu. Các cột nguồn chưa rõ, đơn vị chưa chốt, trường dữ liệu tính toán, thuốc và dữ liệu nhiều lựa chọn cần tiếp tục xác nhận trước khi coi danh mục trường hoàn chỉnh.

Ảnh PNG ghi kiểu, PK/FK và bảng bội số dưới mỗi hình; file draw.io ghi nhãn bội số trên liên kết. Các bảng liên kết có ký hiệu PK/FK trên từng cột của khóa ghép.

## Căn cứ thiết kế

Đối chiếu sáu nguồn nhóm cung cấp: hướng dẫn suy tim của Bộ Y tế; tài liệu suy tim người cao tuổi; tài liệu SUY TIM; schema tối thiểu năm bệnh; bảng biến bác sĩ AI-CDSS; từ điển dữ liệu suy tim. Các nguồn chuyên môn làm căn cứ chọn trường biểu mẫu và không tự tạo yêu cầu kết nối trực tiếp bệnh viện. Tham khảo [bài giảng kỹ thuật yêu cầu và thiết kế hệ thống](https://fossbk-spec.github.io/ktpmud-book/ch02_yeu_cau_thiet_ke_c4).

## Thêm trường dữ liệu sau khi chốt 3.2

1. Chọn biến từ bảng truy vết; xác định nhãn, mã ổn định, nhóm, kiểu, đơn vị, lựa chọn, quy tắc và nguồn.
2. Tạo phiên bản nháp mới của mẫu, sao chép các nhóm/trường/lựa chọn cần giữ với ID mới; giữ mã logic của trường cũ. Thêm trường mới vào bản nháp.
3. Kiểm tra và phát hành bản mới. Lượt mới dùng bản mới; lượt cũ giữ form_version_id cũ. Không tự chuyển dữ liệu giữa mẫu.
4. Cập nhật cấu hình JSON, seed phiên bản mới, bảng truy vết và kiểm thử. Khi trường chỉ dùng các kiểu hiện có, không cần thêm cột SQL.
5. Kiểu nghiệp vụ mới hoặc cấu trúc mới (ví dụ bảng thuốc chuyên biệt hơn) có thể cần migration riêng. Không sửa schema rồi chạy lại trên CSDL có dữ liệu.

Đã chạy ca thêm trường ở bản mới, ghi giá trị cho lượt mới và xác minh mẫu/giá trị lượt cũ còn nguyên. Cách này cho phép chốt nền dữ liệu trước khi hoàn thiện toàn bộ danh mục lâm sàng. Không gọi danh mục 61 trường là đầy đủ toàn bộ dữ liệu suy tim.
