# Đối chiếu dữ liệu thiết kế 3.2 với repo demo-web-3

Rà ngày 18/11/2026. Nguồn đối chiếu là `suytim_clone_demo`, nhánh `demo-web-3`, commit `0138b2c8cef1376a0125b0fae4d793f75b8f6bc8`; tài liệu chính: `docs/demo-web/data-profile.md`, `field-catalog-and-mapping.md`, `review-20261030-data.md`, `revision-data-contract.md`, `review-20261030-integration.md` và `src/gateway/forms/catalog.json`. Đích là cấu hình 61 trường và schema của PR thiết kế 3.2. Đây là rà thiết kế, không xác nhận dữ liệu bệnh viện hoặc tính đúng đắn lâm sàng.

## Kết quả đối chiếu mã trường

| Tập mã | Số lượng | Ý nghĩa |
| --- | ---: | --- |
| Trường trong cấu hình MVP 3.2 | 61 | Trường biểu mẫu, chưa gồm cột hành chính trong bảng `patient` và bảng thuốc riêng. |
| Trường `implementation_status=supported` của catalog demo | 86 | Mã được bản demo đánh dấu hỗ trợ; không đồng nghĩa đã được xác nhận lâm sàng. |
| Cùng mã và được demo hỗ trợ | 44 | Cần tiếp tục đối chiếu kiểu, đơn vị và cấu trúc, không chỉ tên. |
| Demo hỗ trợ, cấu hình MVP không có cùng mã | 42 | Có cả trường hành chính `tuoi`, `gioi_tinh`, trường tổng hợp và trường con được tách ra; không mặc nhiên là 42 lỗ hổng. |
| Cấu hình MVP có mã mà demo không đánh dấu hỗ trợ | 17 | Có trường gộp/tách khác nhau, các trường lấy từ file mẫu và các mục cần xác minh thêm. |

Con số 88 trong `review-20261030-integration.md` là số **định nghĩa có widget** ở thời điểm tài liệu đó được lập; số 86 ở trên đếm trực tiếp mã `supported` trong catalog tại commit đã nêu. Không dùng hai số này thay cho số trường bắt buộc của MVP. TL06 có 206 dòng nguồn; các trường bổ sung sau này không làm tăng số dòng TL06 gốc.

## Các khác biệt ảnh hưởng tới dữ liệu

| Chủ đề | Thiết kế 3.2 hiện tại | Bản demo và nhận xét | Hướng xử lý cho 3.2 |
| --- | --- | --- | --- |
| Huyết áp | `huyet_ap_tam_thu`, `huyet_ap_tam_truong` là hai trường số chung. | Demo tách huyết áp nằm/ngồi và đứng, tâm thu/tâm trương, tư thế, thời điểm và nguồn. | Giữ khả năng lưu nhiều lần đo theo `event_key` và `observed_at`, nhưng cần trường tư thế hoặc nhóm đo rõ ràng. Hai số chung không đủ mô tả cả đo nằm/ngồi và đo đứng trong cùng lượt. Trước khi nạp dữ liệu, chốt đơn vị và cách gắn các thành phần cùng một lần đo. |
| Siêu âm tim | Cấu hình 61 trường chưa có LVEF và báo cáo siêu âm. | Demo có LVEF, báo cáo chữ, thời điểm và nguồn. | Đưa vào danh sách bổ sung ưu tiên nếu MVP biểu mẫu cần lưu kết quả khám suy tim; chưa tự suy kiểu hình hoặc chẩn đoán. |
| Xét nghiệm | Có `ntprobnp`, `creatinin`, `natri`, `kali`, `clo` dạng số. `observation_version` có `unit` và `observed_at`. | Demo tách định danh BNP/NT-proBNP, creatinin/eGFR và các điện giải, yêu cầu giữ tên xét nghiệm gốc, đơn vị, thời điểm, nguồn. | Xác định riêng mã xét nghiệm và đơn vị từng kết quả; không gộp BNP với NT-proBNP, không tính eGFR từ creatinin. Kiểm tra giao diện/nhập file có giữ tên và nguồn gốc xét nghiệm, không chỉ cột số. |
| Thuốc | `medication_entry` lưu tên, liều số/đơn vị, đường dùng, tần suất và ngày bắt đầu/kết thúc. | Demo còn lưu hoạt chất, hàm lượng, liều gốc, trạng thái đang dùng/dự kiến/đã ngừng, loại thuốc và nguồn. | Bổ sung sau khi chốt bộ trường thuốc; hiện không thể coi mọi dòng thuốc là thuốc đang dùng. Danh sách thuốc nhập từ file vẫn chờ cấu trúc nguồn được xác nhận. |
| Bệnh kèm | MVP có cờ nhị phân bệnh mạch vành, đái tháo đường và bệnh thận mạn. | Demo tách cờ bệnh mạch vành đã biết khỏi phần mô tả và can thiệp; hai mục còn lại có ghi chú nguồn liên quan HbA1c/eGFR. | Cờ Có/Không/Chưa biết phải độc lập với chỉ số xét nghiệm. Bệnh mạch vành cần chỗ lưu mô tả nếu bác sĩ ghi nhận. Không suy bệnh từ xét nghiệm. |
| Dấu hiệu và thông tin lão khoa | Nhiều mã như ran phổi, phù, tĩnh mạch cổ, tiền sử sảng đang ở trạng thái cần xác nhận trong bảng truy vết TL06. | Demo đánh dấu hỗ trợ một số ô nhập tương ứng. | Rà với bác sĩ theo mức cần cho biểu mẫu giai đoạn đầu. Có widget trong demo chưa đủ căn cứ đổi tất cả sang “thuộc MVP”; giữ dấu vết những mục chưa chọn. |
| Hành chính và tuổi | `patient` lưu ngày sinh hoặc năm sinh; giới tính ở hồ sơ. Tuổi được dự tính từ ngày sinh và ngày khám. | Demo có `tuoi` ở lượt và `gioi_tinh` trong catalog. File mẫu chỉ có năm sinh; không có mã lượt rõ. | Không nhân đôi giới tính trong biểu mẫu chỉ để khớp mã demo. Với năm sinh, không tự tạo ngày sinh hay tính tuổi chính xác. Cần hiển thị/ghi nguồn của tuổi nếu bác sĩ nhập tuổi riêng. |
| File mẫu và giá trị 0 | Bảng truy vết liệt kê 42 cột; `import_batch.zero_requires_review` mặc định bật. | Phân tích demo cho thấy mã nghiên cứu lặp, thiếu mã lượt rõ; một số đơn vị chưa rõ. Tài liệu demo cũ xem 0 là dữ liệu có thể hợp lệ. | Giữ quyết định dự án: số 0 **đến từ file** phải chờ bác sĩ kiểm tra/nhập lại; số 0 do bác sĩ xác nhận có thể hợp lệ tùy trường. Không dùng mã nghiên cứu lặp để tự tạo người bệnh/lượt khám. |

## Việc cần chốt trước khi mở rộng cấu hình

1. Ưu tiên xác nhận nhóm đo huyết áp, LVEF, danh sách xét nghiệm và thuốc; đây là các khác biệt có thể làm mất ngữ cảnh nếu chỉ nhập số hoặc văn bản rời.
2. Giữ 61 trường hiện tại như **tập khởi tạo**, không diễn đạt là toàn bộ dữ liệu suy tim. Trường được duyệt thêm qua phiên bản biểu mẫu mới; lượt cũ giữ phiên bản cũ.
3. Khi thêm trường, cập nhật đồng thời cấu hình JSON, seed, bảng truy vết nguồn, từ điển dữ liệu và kiểm thử. Một trường có sẵn trong demo chưa tự động được coi là yêu cầu MVP.
4. Kiểm tra lại các mã trong bảng truy vết TL06 hiện ghi “Chưa ánh xạ” nhưng bản demo đã có cấu trúc con để ghi nhận. Ghi rõ từng mã được chọn, để sau hay còn chờ xác nhận.

Các tài liệu demo không chứng minh tương thích với file xuất HIS thực hoặc việc triển khai bốn module AI. Phần nhập file cần tiếp tục đối chiếu định danh, lượt khám, kiểu, đơn vị và nguồn trước khi áp dụng giá trị.
