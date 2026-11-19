# Kiểm thử cơ sở dữ liệu MVP

## Môi trường và cách chạy

Đã dùng PostgreSQL 16.15 trên Windows với một cluster và CSDL thử riêng, không dùng CSDL demo. Từ thư mục `submissions/suy_tim_nhom27`, trên một CSDL PostgreSQL **mới, trống**, chạy:

```sh
psql -v ON_ERROR_STOP=1 -d TEN_CSDL_THU -f database/mvp/schema.sql
psql -v ON_ERROR_STOP=1 -d TEN_CSDL_THU -f database/mvp/seed-form-v1.sql
psql -v ON_ERROR_STOP=1 -d TEN_CSDL_THU -f database/mvp/tests/schema.sql
psql -v ON_ERROR_STOP=1 -d TEN_CSDL_THU -f database/mvp/tests/constraints.sql
```

Các file test SQL tự ROLLBACK dữ liệu giả lập. File `database/mvp/tests/concurrency.py` tạo dữ liệu giả lập và commit trong CSDL thử: chỉ chạy ở CSDL dùng riêng cho kiểm thử; cài `PSQL`, `PGDATABASE`, `PGPORT` và sửa tham số người dùng/địa chỉ trong script khi cần.

## Kết quả thực tế

| Kiểm tra | Kết quả trên PostgreSQL thử |
| --- | --- |
| Tạo schema từ CSDL trống | Thành công; 25 bảng, chỉ mục và trigger được tạo. |
| Nạp seed biểu mẫu | Bản đầu: 61 trường; lần đối chiếu demo ngày 18/11: 66 trường. |
| PK, FK, UNIQUE, NOT NULL, CHECK | Các trường hợp kiểm tra trong hai file SQL đều qua, gồm mã hồ sơ và mã lượt trùng, khóa chính trùng, khóa ngoại không có, tên bắt buộc thiếu và số phiên bản không hợp lệ. |
| Giá trị | Đã thử trạng thái chưa biết, số 0 do người dùng nhập, giá trị sai kiểu/lựa chọn sai và hai giá trị cùng lúc. |
| Quan hệ và phiên bản | Đã thử trường sai phiên bản, sửa mẫu đã phát hành, đổi bệnh nhân hoặc mẫu sau khi có dữ liệu, và hai kết quả cùng loại ở hai lần với đơn vị/thời điểm. |
| Thuốc | Đã thêm hai dòng thuốc giả lập vào cùng lượt; chưa kiểm thử danh mục, chuyển đổi liều hoặc an toàn thuốc. |
| Nhập file | Đã thử không áp dụng giá trị nguồn 0 ở trạng thái hợp lệ; nguồn được đưa vào trạng thái cần rà soát; từ chối ghi sai lượt của bệnh nhân khác, sai cột nguồn; khóa thay đổi phần nguồn đã áp dụng. Chưa kiểm thử thay đổi cấu hình ánh xạ sau khi xác nhận, hay chạy luồng nhập file hoàn chỉnh. |
| Lịch | Đã từ chối lịch thứ hai vượt sức chứa. Chạy hai tiến trình đồng thời: một lịch thành công, một lịch bị từ chối. |
| Phiên bản đồng thời | Hai tiến trình tạo cùng số phiên bản: một thành công, một bị UNIQUE từ chối. |
| Chạy lại schema trên CSDL đã có bảng | Bị từ chối tại `app_user already exists` như thiết kế; phải tạo CSDL thử trống mới để chạy lại. Seed cũng không phải script cập nhật dữ liệu đã có. |

Kiểm thử dùng dữ liệu giả lập. Kết quả không xác nhận an toàn lâm sàng, toàn bộ phụ thuộc hàm hoặc tất cả tình huống cạnh tranh. Chưa kiểm thử khôi phục dữ liệu, tải file thực tế hoặc tích hợp với web. Schema khởi tạo **không phải migration** từ demo và chưa có quy trình chuyển dữ liệu cũ.

## Đợt chốt danh mục hiện tại

Đã chạy lại schema sau khi bỏ field_id/source_column lặp khỏi import_item trên CSDL thử sạch schema_32_final_01 (PostgreSQL 16.15). Schema, seed, hai file SQL test và hai ca đồng thời đều chạy thành công. Đã chạy thêm ca tạo phiên bản mẫu mới, thêm trường và ghi dữ liệu mới, xác minh lượt cũ giữ nguyên mẫu và giá trị. Cấu hình ánh xạ đã được dùng được chặn sửa/xóa, phải tạo phiên bản mới; ca sửa quy tắc đã dùng bị từ chối như mong đợi.

## Rà lại theo repo demo-web-3 ngày 18/11/2026

Trên PostgreSQL portable 16.15, tạo CSDL thử riêng `schema32_review_20261118_c` từ trống. Chạy lần lượt `schema-MVP.sql`, `seed-bieu-mau-suy-tim-v1.sql`, `test-schema-MVP.sql` và `test-rang-buoc-nang-cao.sql`: cả bốn tệp chạy thành công. Truy vấn `SELECT count(*) FROM form_field` trả 66. Đã bổ sung ca kiểm tra thuốc có hoạt chất, hàm lượng, liều và trạng thái hợp lệ; từ chối liều số thiếu đơn vị và trạng thái ngoài danh mục; lưu tên xét nghiệm gốc và nguồn trên bản kết quả. Hai tệp test dùng `ROLLBACK`. Chưa chạy lại hai ca đồng thời sau lần mở rộng này; ràng buộc lịch và phiên bản không được sửa.
