# Đối chiếu bổ sung nguồn TL04 và TL05

Các dòng dưới đây lấy từ lần rà hai nguồn schema tối thiểu và bảng biến bác sĩ; ánh xạ của bản trước được giữ như gợi ý lịch sử, chưa coi là đã khớp schema hiện tại.

| Vị trí nguồn | Mã / tên gốc | Ý nghĩa nguồn | Kiểu / đơn vị | Đích trên mô hình hiện tại | Trạng thái | Lý do |
| --- | --- | --- | --- | --- | --- | --- |
| TL04 Bảng 1 R2 | MA_BN | MA_BN | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Mã người tại nguồn; khác ID nội bộ và mã BN của sản phẩm. |
| TL04 Bảng 1 R3 | MA_LK | MA_LK | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Mã lượt nguồn, duy nhất đúng namespace/phạm vi. |
| TL04 Bảng 1 R4 | NGAY_SINH | NGAY_SINH | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Lưu độ chính xác; tuổi theo ngày khám, không dùng năm hiện tại trừ năm sinh làm tuổi chính xác. |
| TL04 Bảng 1 R5 | GIOI_TINH | GIOI_TINH | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Chuẩn hóa lựa chọn có phiên bản; chưa biết không tự là Nam/Nữ. |
| TL04 Bảng 1 R6 | NGAY_VAO | NGAY_VAO | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giữ thời điểm tiếp nhận nguồn, khác thời điểm tạo bản ghi. |
| TL04 Bảng 1 R7 | NGAY_RA | NGAY_RA | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Chỉ có khi được cung cấp hoặc nghiệp vụ hoàn tất xác định. |
| TL04 Bảng 1 R8 | MA_BENH_CHINH | MA_BENH_CHINH | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Vai trò chính, theo lượt; không là định danh hành chính. |
| TL04 Bảng 1 R9 | MA_BENH_KEM_THEO | MA_BENH_KEM_THEO | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Nhiều mã vai trò kèm, có phiên bản/coding system. |
| TL04 Bảng 1 R10 | DI_UNG_THUOC | DI_UNG_THUOC | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Phân biệt trạng thái đánh giá, dị ứng/ADR/không dung nạp. |
| TL04 Bảng 1 R11 | DANH_SACH_THUOC_DANG_DUNG | DANH_SACH_THUOC_DANG_DUNG | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Nhiều thuốc có thành phần/liều/cách dùng/thời gian. |
| TL04 Bảng 2 R2 | TRIEU_CHUNG_SUY_TIM | TRIEU_CHUNG_SUY_TIM | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Các triệu chứng tách mã, giữ cùng nguồn/đánh giá khi đúng. |
| TL04 Bảng 2 R3 | DAU_HIEU_THUC_THE | DAU_HIEU_THUC_THE | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giữ hiện diện/mức độ/ngữ cảnh, không chỉ một chuỗi tổng. |
| TL04 Bảng 2 R4 | HUYET_AP | HUYET_AP | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Cùng sự kiện đo; tư thế và thời điểm. |
| TL04 Bảng 2 R5 | TAN_SO_TIM | TAN_SO_TIM | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giữ loại/phương pháp; chỉ đồng nhất với mạch khi dữ liệu nguồn cho phép. |
| TL04 Bảng 2 R6 | SPO2 | SPO2 | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | %, ngữ cảnh oxy khi có. |
| TL04 Bảng 2 R7 | NT_PROBNP_BNP | NT_PROBNP_BNP | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Phải xác định loại chỉ số, không một mã số chung. |
| TL04 Bảng 2 R8 | LVEF | LVEF | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | %, liên kết báo cáo/thời điểm. |
| TL04 Bảng 2 R9 | KET_LUAN_SIEU_AM_TIM | KET_LUAN_SIEU_AM_TIM | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Báo cáo khác EF số. |
| TL04 Bảng 2 R10 | KET_LUAN_DIEN_TIM | KET_LUAN_DIEN_TIM | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Có thể liên kết các thành phần đo ECG riêng. |
| TL04 Bảng 3 R2 | NT_PROBNP_BNP | NT_PROBNP_BNP | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Phải xác định loại chỉ số, không một mã số chung. |
| TL04 Bảng 3 R3 | CREATININ | CREATININ | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giữ đơn vị, không gộp với eGFR. |
| TL04 Bảng 3 R4 | EGFR | EGFR | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giữ đơn vị/phương pháp nếu biết, không tự tính khi thiếu hợp đồng. |
| TL04 Bảng 3 R5 | NATRI | NATRI | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Mã chỉ số/đơn vị riêng. |
| TL04 Bảng 3 R6 | KALI | KALI | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Mã chỉ số/đơn vị riêng. |
| TL04 Bảng 3 R7 | CONG_THUC_MAU | CONG_THUC_MAU | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Các thành phần thực có, có báo cáo và đơn vị riêng. |
| TL04 Bảng 3 R8 | KET_QUA_SIEU_AM_TIM | KET_QUA_SIEU_AM_TIM | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Không tạo bộ EF song song. |
| TL04 Bảng 3 R9 | KET_QUA_XQUANG_NGUC | KET_QUA_XQUANG_NGUC | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Tệp/kết luận/nguồn và thời điểm. |
| TL04 Bảng 4 R2 | LOAI_SUY_TIM | LOAI_SUY_TIM | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Phân loại có nguồn xác nhận, không suy chỉ từ EF. |
| TL04 Bảng 4 R3 | TINH_TRANG_SUNG_HUYET | TINH_TRANG_SUNG_HUYET | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Đánh giá có/không/chưa xác định cùng căn cứ. |
| TL04 Bảng 4 R4 | HUYET_AP_HIEN_TAI | HUYET_AP_HIEN_TAI | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Chọn đúng lần đo cho lần đánh giá; không tạo một HA hiện tại độc lập. |
| TL04 Bảng 4 R5 | TAN_SO_TIM_HIEN_TAI | TAN_SO_TIM_HIEN_TAI | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giữ loại số đo và thời điểm. |
| TL04 Bảng 4 R6 | EGFR | EGFR | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giữ đơn vị/phương pháp nếu biết, không tự tính khi thiếu hợp đồng. |
| TL04 Bảng 4 R7 | KALI | KALI | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Mã chỉ số/đơn vị riêng. |
| TL04 Bảng 4 R8 | THUOC_SUY_TIM_DANG_DUNG | THUOC_SUY_TIM_DANG_DUNG | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Lọc tập thuốc đã ghi/đối chiếu; không sao chép danh sách riêng. |
| TL04 Bảng 4 R9 | BENH_DONG_MAC | BENH_DONG_MAC | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Cờ tiền sử và ICD phân biệt; không tự mã hóa từ cờ. |
| TL04 Bảng 5 R2 | DI_UNG_THUOC | DI_UNG_THUOC | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Phân biệt trạng thái đánh giá, dị ứng/ADR/không dung nạp. |
| TL04 Bảng 5 R3 | DANH_SACH_THUOC_DANG_DUNG | DANH_SACH_THUOC_DANG_DUNG | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Nhiều thuốc có thành phần/liều/cách dùng/thời gian. |
| TL04 Bảng 5 R4 | KALI | KALI | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Mã chỉ số/đơn vị riêng. |
| TL04 Bảng 5 R5 | CREATININ_EGFR | CREATININ_EGFR | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Hai chỉ số có đơn vị/phương pháp riêng. |
| TL04 Bảng 5 R6 | HUYET_AP | HUYET_AP | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Cùng sự kiện đo; tư thế và thời điểm. |
| TL04 Bảng 5 R7 | TAN_SO_TIM | TAN_SO_TIM | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giữ loại/phương pháp; chỉ đồng nhất với mạch khi dữ liệu nguồn cho phép. |
| TL04 Bảng 5 R8 | KET_QUA_DIEN_TIM | KET_QUA_DIEN_TIM | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | QRS/QTc/nhịp và báo cáo chỉ khi nguồn cung cấp. |
| TL05 Tổng quan & Schema Chung R7 | MA_BN | Mã định danh bệnh nhân | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Mã người tại nguồn; khác ID nội bộ và mã BN của sản phẩm. |
| TL05 Tổng quan & Schema Chung R8 | MA_LK | Mã lượt khám / Bệnh án | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Mã lượt nguồn, duy nhất đúng namespace/phạm vi. |
| TL05 Tổng quan & Schema Chung R9 | HO_TEN | Họ và tên người bệnh | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giữ tên giả lập/khử định danh theo nguồn demo, không tự điền danh tính thật. |
| TL05 Tổng quan & Schema Chung R10 | NGAY_SINH | Ngày tháng năm sinh | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Lưu độ chính xác; tuổi theo ngày khám, không dùng năm hiện tại trừ năm sinh làm tuổi chính xác. |
| TL05 Tổng quan & Schema Chung R11 | TUOI | Tuổi bệnh nhân | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Tính theo ngày khám khi có ngày sinh đủ, hoặc giữ tuổi được cung cấp và mốc. |
| TL05 Tổng quan & Schema Chung R12 | GIOI_TINH | Giới tính sinh học | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Chuẩn hóa lựa chọn có phiên bản; chưa biết không tự là Nam/Nữ. |
| TL05 Tổng quan & Schema Chung R13 | SO_BHYT | Mã số thẻ BHYT | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Chuỗi, giữ số 0 đầu; không tự phát triển tính quyền lợi BHYT. |
| TL05 Tổng quan & Schema Chung R14 | KHOA_PHONG | Khoa / Phòng khám tiếp nhận | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Danh mục khoa/phòng; không phải vai trò truy cập. |
| TL05 Tổng quan & Schema Chung R15 | THOI_GIAN_KHAM | Thời điểm bác sĩ mở hồ sơ | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | TL05 mô tả mở hồ sơ; chưa tự là giờ khám thực tế hay ngày tạo file. |
| TL05 Tổng quan & Schema Chung R16 | BAC_SI_KHAM | Mã & Tên Bác sĩ điều trị | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giữ mã/tên bác sĩ nguồn; không bắt bác sĩ nguồn đã có tài khoản sản phẩm, không tạo quyền tự động. |
| TL05 Tổng quan & Schema Chung R19 | CHIEU_CAO | Chiều cao cơ thể | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | cm; khoảng tầm soát trong nguồn chưa là giới hạn cứng mọi người. |
| TL05 Tổng quan & Schema Chung R20 | CAN_NANG | Cân nặng hiện tại | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | kg, theo thời điểm; không thêm kết nối thiết bị. |
| TL05 Tổng quan & Schema Chung R21 | BMI | Chỉ số khối cơ thể | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Có thể tính có công thức/đầu vào; giữ giá trị nguồn nếu được cung cấp. |
| TL05 Tổng quan & Schema Chung R22 | HA_TAM_THU | Huyết áp tâm thu (Systolic) | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | mmHg, cùng sự kiện tâm trương/ngữ cảnh. |
| TL05 Tổng quan & Schema Chung R23 | HA_TAM_TRUONG | Huyết áp tâm trương (Diastolic) | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | mmHg, không ghép sai lần đo. |
| TL05 Tổng quan & Schema Chung R24 | TAN_SO_TIM | Tần số tim (Nhịp tim) | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giữ loại/phương pháp; chỉ đồng nhất với mạch khi dữ liệu nguồn cho phép. |
| TL05 Tổng quan & Schema Chung R25 | SPO2 | Độ bão hòa Oxy máu động mạch | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | %, ngữ cảnh oxy khi có. |
| TL05 Tổng quan & Schema Chung R26 | TIEN_SU_DI_UNG | Danh mục dị ứng thuốc / ADR | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Không tự chặn theo nhãn nguồn; phản ứng và mức độ theo dữ liệu có. |
| TL05 Tổng quan & Schema Chung R27 | DANH_MUC_THUOC_DANG_DUNG | Toàn bộ thuốc bệnh nhân đang dùng | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Tái dùng danh sách chung, có độ đầy đủ. |
| TL05 Tổng quan & Schema Chung R28 | BENH_DONG_MAC_ICD10 | Mảng mã bệnh mạn tính đi kèm | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Nhiều mã có hệ mã/phiên bản và vai trò. |
| TL05 1. Suy tim (HF) R6 | KHO_THO_NANG | Khó thở khi gắng sức / nằm / kịch phát đêm | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Nguồn gộp nhiều loại khó thở; giữ mức tổng, không suy đủ ba triệu chứng riêng. |
| TL05 1. Suy tim (HF) R7 | PHU_CHI_DUOI | Phù mềm hai chân / cổ chân | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Có thể kèm mức độ; không đổi mức độ thành nhị phân rồi mất chi tiết. |
| TL05 1. Suy tim (HF) R8 | TINH_MACH_CO_NOI | Tĩnh mạch cổ nổi ở tư thế 45 độ | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Tư thế khám nếu nguồn có. |
| TL05 1. Suy tim (HF) R9 | RAN_AM_PHOI | Ran ẩm / ran nổ hai phế trường | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giữ nguồn và thời điểm. |
| TL05 1. Suy tim (HF) R10 | BIEN_THIEN_CAN_NANG_7NGAY | Tăng cân đột ngột trong 3-7 ngày | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | kg và khoảng thời gian thực biết, không mặc định mọi thay đổi là bảy ngày. |
| TL05 1. Suy tim (HF) R11 | TRIEU_CHUNG_KHONG_DIEN_HINH | Biểu hiện sảng, té ngã, chán ăn ở người già | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giữ lựa chọn nhóm nguồn; không tự suy các biểu hiện chưa ghi. |
| TL05 1. Suy tim (HF) R12 | DANH_GIA_SUY_YEU_FRAILTY | Mức độ suy yếu Lão khoa (Clinical Frailty Scale) | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Nếu là CFS thì giữ công cụ/phiên bản; không tự biến điểm thành lệnh giảm liều. |
| TL05 1. Suy tim (HF) R13 | DxAI_XAC_SUAT_SUY_TIM | Xác suất chẩn đoán Suy tim mạn / Đợt cấp | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Chỉ có số khi có mô hình và khoảng/biến cố được xác định; không lấy mã Stage làm xác suất. |
| TL05 1. Suy tim (HF) R14 | DxAI_PHAN_LOAI_STAGE | Phân loại giai đoạn Suy tim theo ACC/AHA | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Tách Stage khỏi likelihood; giữ đầu vào/phương pháp. |
| TL05 1. Suy tim (HF) R15 | DxAI_CANH_BAO_GIA_SUY_TIM | Cảnh báo chẩn đoán phân biệt với COPD/Phù do thuốc | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Danh sách/văn bản có căn cứ, không tự là chẩn đoán chính thức. |
| TL05 1. Suy tim (HF) R18 | NT_PROBNP | Nồng độ NT-proBNP huyết thanh | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giá trị/đơn vị/thời điểm, không lấy ghi chú ngưỡng chưa rà làm CHECK. |
| TL05 1. Suy tim (HF) R19 | BNP | Nồng độ BNP huyết thanh | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Mã khác NT-proBNP. |
| TL05 1. Suy tim (HF) R20 | EF_SIEU_AM_TIM | Phân suất tống máu thất trái (LVEF) | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | EF số khác kiểu hình. |
| TL05 1. Suy tim (HF) R21 | E_OVER_A_RATIO | Tỷ lệ E/A và E/e' trên siêu âm tim Doppler | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Nhãn nguồn gộp E/A và E/e′; phải tách đúng thành phần khi nhập. |
| TL05 1. Suy tim (HF) R22 | CREATININE_MAU | Nồng độ Creatinine huyết thanh | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giữ đơn vị nguồn và phép đổi được kiểm; mã LOINC chưa tự được xác nhận. |
| TL05 1. Suy tim (HF) R23 | EGFR_CKD_EPI | Mức lọc cầu thận ước tính (eGFR) | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | CKD-EPI cần phiên bản/công thức cụ thể nếu tính; kết quả nguồn giữ phương pháp khi có. |
| TL05 1. Suy tim (HF) R24 | KALI_MAU | Nồng độ Kali huyết thanh (Serum Potassium) | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giá trị bất thường vẫn lưu nếu hợp lệ; chưa tự quyết định thuốc. |
| TL05 1. Suy tim (HF) R25 | ECG_12_CHUYEN_DAO | Điện tâm đồ 12 chuyển đạo | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | QRS/QTc/nhịp theo nguồn có. |
| TL05 1. Suy tim (HF) R26 | XQUANG_NGUC_THANG | X-quang ngực thẳng (Bóng tim, Tăng áp phổi) | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Kết luận có nguồn, không tự đọc ảnh. |
| TL05 1. Suy tim (HF) R27 | LabAI_GOI_Y_CHI_DINH | Danh mục Cận lâm sàng AI đề xuất | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Các mục gợi ý có ưu tiên/lý do; mã dịch vụ phải đối chiếu. |
| TL05 1. Suy tim (HF) R28 | LabAI_KHOA_TRUNG_LAP | Cảnh báo và tự động khóa chỉ định trùng lặp | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Chuyển thành cảnh báo đề xuất trong phạm vi hiện tại; không tự khóa theo 48–72 giờ. |
| TL05 1. Suy tim (HF) R31 | TxAI_KIỂU_HÌNH_SUY_TIM | Xác định kiểu hình suy tim chính xác | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giữ phân loại và căn cứ; không ép chỉ định thuốc tự động. |
| TL05 1. Suy tim (HF) R32 | ARNI_SACUBITRIL_VALSARTAN | Thuốc ARNI (Sacubitril/Valsartan) | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Thành phần/hàm lượng/liều/cách dùng riêng; không là đơn chính thức. |
| TL05 1. Suy tim (HF) R33 | CHET_BETA_GIAO_CAM | Thuốc Chẹn Beta (Bisoprolol/Carvedilol/Succinate) | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giữ thuốc cụ thể và điều kiện áp dụng. |
| TL05 1. Suy tim (HF) R34 | KHANG_MRA_SPIRONOLACTONE | Thuốc Kháng MRA (Spironolactone) | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Không đưa liều khởi đầu trong bảng thành mặc định cho mọi ca. |
| TL05 1. Suy tim (HF) R35 | SGLT2_INHIBITOR | Thuốc ức chế SGLT2 (Dapagliflozin/Empagliflozin) | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giữ lựa chọn/điều kiện, không tự kê. |
| TL05 1. Suy tim (HF) R36 | LOI_TIEU_QUAI_FUROSEMIDE | Thuốc lợi tiểu quai (Furosemide) | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Thuốc/đường/liều/thời gian và căn cứ riêng. |
| TL05 1. Suy tim (HF) R37 | TxAI_KE_HOACH_DO_LIEU | Lịch trình tăng liều từng bước (Titration Plan) | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Gợi ý mốc/điều kiện, không tự tạo lịch hay tăng liều. |
| TL05 1. Suy tim (HF) R40 | DDI_CANH_BAO_NSAID | Cảnh báo ĐỎ: Chống chỉ định dùng NSAIDs | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Cảnh báo có căn cứ; không tự triển khai chặn tuyệt đối từ một dòng nguồn. |
| TL05 1. Suy tim (HF) R41 | DDI_CANH_BAO_TANG_KALI | Cảnh báo VÀNG: Tăng Kali máu (ARNI + MRA) | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Tham chiếu thuốc/K/điều kiện và phiên bản quy tắc. |
| TL05 1. Suy tim (HF) R42 | DDI_CANH_BAO_CHAM_NHIP | Cảnh báo nhịp chậm do Chẹn beta + Digoxin/Ivabradine | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Cảnh báo, bác sĩ quyết định chỉnh/ngừng thuốc. |
| TL05 1. Suy tim (HF) R43 | DDI_NGO_DOC_DIGOXIN | Cảnh báo nguy cơ ngộ độc Digoxin khi suy thận | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Không tự đặt liều theo một ngưỡng eGFR chung. |
| TL05 1. Suy tim (HF) R44 | DDI_HA_HA_TU_THE_TE_NGA | Cảnh báo hạ HA tư thế & Nguy cơ té ngã ban đêm | Cần đối chiếu bản gốc | Chưa ánh xạ | Cần xác nhận | Giữ bộ đo tư thế/thuốc/ngữ cảnh, không tự áp một giờ uống cho mọi người. |
