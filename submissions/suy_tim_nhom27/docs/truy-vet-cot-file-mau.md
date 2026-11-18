# Truy vết cột file mẫu

Chỉ liệt kê tên 42 cột; không sao chép dữ liệu người bệnh. File mẫu: 20261019_Du_lieu_AI_CDSS_da_ma_hoa_20 (1).xlsx, sheet Sheet3. Ý nghĩa dựa trên tên cột, không thay thế xác nhận từ bệnh viện.

| Vị trí | Tên gốc / ý nghĩa | Kiểu, đơn vị hoặc lựa chọn | Cấp / nhóm / đích | Trạng thái | Lý do |
| --- | --- | --- | --- | --- | --- |
| Sheet3!1 | MaNghienCuu — MaNghienCuu | Cần xác nhận kiểu, đơn vị và danh mục | patient_identifier.raw_value; chỉ liên kết sau đối chiếu và xác định phạm vi mã | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!2 | GioiTinh — GioiTinh | Cần xác nhận kiểu, đơn vị và danh mục | patient.sex; đối chiếu danh mục | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!3 | NamSinh — NamSinh | Cần xác nhận kiểu, đơn vị và danh mục | patient.birth_year; không tự suy ngày sinh | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!4 | NgayVaoVien — NgayVaoVien | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!5 | NgayRaVien — NgayRaVien | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!6 | KhoaRa — KhoaRa | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!7 | MaICD_VaoKhoa — Mã ICD vào khoa theo nguồn | Văn bản; cần xác nhận định dạng | observation: ma_icd_vao_khoa; cần bác sĩ kiểm tra | Thuộc MVP | Đã chọn trường lưu; cần xác nhận ánh xạ và quy tắc 0 |
| Sheet3!8 | TenICD_VaoKhoa — Tên ICD vào khoa theo nguồn | Văn bản; cần xác nhận định dạng | observation: ten_icd_vao_khoa; cần bác sĩ kiểm tra | Thuộc MVP | Đã chọn trường lưu; cần xác nhận ánh xạ và quy tắc 0 |
| Sheet3!9 | DanhSachMaICD_Phu — Mã bệnh kèm theo ICD | Văn bản; cần xác nhận định dạng | observation: ma_icd_phu; cần bác sĩ kiểm tra | Thuộc MVP | Đã chọn trường lưu; cần xác nhận ánh xạ và quy tắc 0 |
| Sheet3!10 | TienSuBanThan — Tiền sử bản thân | Văn bản; cần xác nhận định dạng | observation: tien_su_ban_than; cần bác sĩ kiểm tra | Thuộc MVP | Đã chọn trường lưu; cần xác nhận ánh xạ và quy tắc 0 |
| Sheet3!11 | DiUng — Thông tin dị ứng | Văn bản; cần xác nhận định dạng | observation: di_ung; cần bác sĩ kiểm tra | Thuộc MVP | Đã chọn trường lưu; cần xác nhận ánh xạ và quy tắc 0 |
| Sheet3!12 | MaTuy — MaTuy | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!13 | NgayMaTuy — NgayMaTuy | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!14 | RuouBia — RuouBia | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!15 | ThuocLa — ThuocLa | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!16 | ThuocLao — ThuocLao | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!17 | TienSuKhac — Tiền sử khác | Văn bản; cần xác nhận định dạng | observation: tien_su_khac; cần bác sĩ kiểm tra | Thuộc MVP | Đã chọn trường lưu; cần xác nhận ánh xạ và quy tắc 0 |
| Sheet3!18 | Mach — Mach | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!19 | NhipTho — NhipTho | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!20 | NhietDo — Nhiệt độ | Số; đơn vị theo cột nguồn hoặc cần xác nhận | observation: nhiet_do; đơn vị và ngày đo lưu theo kết quả | Thuộc MVP | Đã chọn trường lưu; cần xác nhận ánh xạ và quy tắc 0 |
| Sheet3!21 | CanNang — CanNang | Cần xác nhận kiểu, đơn vị và danh mục | observation: can_nang (kg); kiểm tra đơn vị | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!22 | HuyetApCao — Huyết áp tâm thu | Số; đơn vị theo cột nguồn hoặc cần xác nhận | observation: huyet_ap_tam_thu; đơn vị và ngày đo lưu theo kết quả | Thuộc MVP | Đã chọn trường lưu; cần xác nhận ánh xạ và quy tắc 0 |
| Sheet3!23 | HuyetApThap — Huyết áp tâm trương | Số; đơn vị theo cột nguồn hoặc cần xác nhận | observation: huyet_ap_tam_truong; đơn vị và ngày đo lưu theo kết quả | Thuộc MVP | Đã chọn trường lưu; cần xác nhận ánh xạ và quy tắc 0 |
| Sheet3!24 | ChieuCao — ChieuCao | Cần xác nhận kiểu, đơn vị và danh mục | observation: chieu_cao (cm); kiểm tra đơn vị | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!25 | BMI — BMI | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!26 | NTproBNP_KetQua — NT-proBNP | Số; đơn vị theo cột nguồn hoặc cần xác nhận | observation: ntprobnp; đơn vị và ngày đo lưu theo kết quả | Thuộc MVP | Đã chọn trường lưu; cần xác nhận ánh xạ và quy tắc 0 |
| Sheet3!27 | NTproBNP_DonVi — NTproBNP_DonVi | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!28 | NTproBNP_Ngay — NTproBNP_Ngay | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!29 | Troponin_TenDichVu — Troponin_TenDichVu | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!30 | Troponin_KetQua — Troponin | Số; đơn vị theo cột nguồn hoặc cần xác nhận | observation: troponin; đơn vị và ngày đo lưu theo kết quả | Thuộc MVP | Đã chọn trường lưu; cần xác nhận ánh xạ và quy tắc 0 |
| Sheet3!31 | Troponin_DonVi — Troponin_DonVi | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!32 | Troponin_Ngay — Troponin_Ngay | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!33 | Creatinin_KetQua — Creatinin | Số; đơn vị theo cột nguồn hoặc cần xác nhận | observation: creatinin; đơn vị và ngày đo lưu theo kết quả | Thuộc MVP | Đã chọn trường lưu; cần xác nhận ánh xạ và quy tắc 0 |
| Sheet3!34 | Creatinin_DonVi — Creatinin_DonVi | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!35 | Creatinin_Ngay — Creatinin_Ngay | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!36 | Natri_KetQua — Natri | Số; đơn vị theo cột nguồn hoặc cần xác nhận | observation: natri; đơn vị và ngày đo lưu theo kết quả | Thuộc MVP | Đã chọn trường lưu; cần xác nhận ánh xạ và quy tắc 0 |
| Sheet3!37 | Natri_DonVi — Natri_DonVi | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!38 | Kali_KetQua — Kali | Số; đơn vị theo cột nguồn hoặc cần xác nhận | observation: kali; đơn vị và ngày đo lưu theo kết quả | Thuộc MVP | Đã chọn trường lưu; cần xác nhận ánh xạ và quy tắc 0 |
| Sheet3!39 | Kali_DonVi — Kali_DonVi | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!40 | Clo_KetQua — Clo | Số; đơn vị theo cột nguồn hoặc cần xác nhận | observation: clo; đơn vị và ngày đo lưu theo kết quả | Thuộc MVP | Đã chọn trường lưu; cần xác nhận ánh xạ và quy tắc 0 |
| Sheet3!41 | Clo_DonVi — Clo_DonVi | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
| Sheet3!42 | DienGiai_Ngay — DienGiai_Ngay | Cần xác nhận kiểu, đơn vị và danh mục | Cần xác định ánh xạ và xác thực cùng bác sĩ | Cần xác nhận | Chưa đủ căn cứ ánh xạ trực tiếp hoặc xác nhận kiểu |
