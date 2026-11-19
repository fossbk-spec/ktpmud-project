# Phụ lục: truy vết nguồn và đối chiếu dữ liệu

Tài liệu làm việc hỗ trợ thiết kế dữ liệu. Các bảng chi tiết giữ nguyên dấu vết nguồn và quyết định tại thời điểm rà; xem trang chính để biết phạm vi MVP hiện hành.

## Truy vết trường nguồn suy tim và dữ liệu mẫu

Nguồn TL06: DATA_DICTIONARY_SUY_TIM_AI_CDSS- sửa (2).xlsx, sheet Trường dữ liệu. Mỗi dòng được rà độc lập; tên, loại và lựa chọn giữ theo nguồn. Cột đích là mã cấu hình biểu mẫu hoặc vị trí hành chính. “Cần xác nhận” không có nghĩa trường không cần thiết.

| Dòng nguồn | Mã gốc | Nhãn / ý nghĩa | Kiểu và cấu trúc nguồn | Cấp / nhóm | Đích | Trạng thái | Lý do |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TL06!2 / STT 1 | tuoi | Tuổi | Số nguyên; 0–120 tuổi | Tính toán / lượt khám | Tính theo ngày sinh và ngày khám nếu đủ dữ liệu | Cần xác nhận | Chưa chốt cách xử lý chỉ có năm sinh hoặc tuổi nguồn. |
| TL06!3 / STT 2 | gioi_tinh | Giới tính | Một lựa chọn; Nam; Nữ | Bệnh nhân / hành chính | patient.sex | Thuộc MVP | Trường hành chính; chưa biết được để trống. |
| TL06!4 / STT 3 | chieu_cao | Chiều cao | Số thực; cm | Lượt khám / Thể trạng | observation: chieu_cao | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!5 / STT 4 | can_nang | Cân nặng | Số thực; kg | Lượt khám / Thể trạng | observation: can_nang | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!6 / STT 5 | bmi | BMI | Số thực; kg/m²; có thể tính từ chiều cao và cân nặng | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!7 / STT 6 | kho_tho_khi_gang_suc | Khó thở khi gắng sức | Nhị phân; Có; Không | Lượt khám / Triệu chứng | observation: kho_tho_khi_gang_suc | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!8 / STT 7 | kho_tho_khi_nam | Khó thở khi nằm | Nhị phân; Có; Không | Lượt khám / Triệu chứng | observation: kho_tho_khi_nam | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!9 / STT 8 | kho_tho_kich_phat_ve_dem | Khó thở kịch phát về đêm | Nhị phân; Có; Không | Lượt khám / Triệu chứng | observation: kho_tho_kich_phat_ve_dem | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!10 / STT 9 | met_moi | Mệt mỏi | Nhị phân; Có; Không | Lượt khám / Triệu chứng | observation: met_moi | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!11 / STT 10 | giam_kha_nang_gang_suc | Giảm khả năng gắng sức | Nhị phân; Có; Không | Lượt khám / Triệu chứng | observation: giam_kha_nang_gang_suc | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!12 / STT 11 | phu_hai_chi_duoi | Phù hai chi dưới | Nhị phân; Có; Không | Lượt khám / Triệu chứng | observation: phu_hai_chi_duoi | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!13 / STT 12 | tang_can_nhanh | Tăng cân nhanh | Nhị phân; Có; Không | Lượt khám / Triệu chứng | observation: tang_can_nhanh | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!14 / STT 13 | dau_nguc | Đau ngực | Nhị phân; Có; Không | Lượt khám / Triệu chứng | observation: dau_nguc | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!15 / STT 14 | hoi_hop | Hồi hộp | Nhị phân; Có; Không | Lượt khám / Triệu chứng | observation: hoi_hop | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!16 / STT 15 | ngat | Ngất | Nhị phân; Có; Không | Lượt khám / Triệu chứng | observation: ngat | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!17 / STT 16 | lu_lan_sang | Lú lẫn hoặc sảng | Nhị phân; Có; Không | Lượt khám / Triệu chứng | observation: lu_lan_sang | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!18 / STT 17 | te_nga | Té ngã | Nhị phân; Có; Không | Lượt khám / Triệu chứng | observation: te_nga | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!19 / STT 18 | chan_an | Chán ăn | Nhị phân; Có; Không | Lượt khám / Triệu chứng | observation: chan_an | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!20 / STT 19 | mat_ngu | Mất ngủ | Nhị phân; Có; Không | Lượt khám / Triệu chứng | observation: mat_ngu | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!21 / STT 20 | giam_van_dong | Giảm vận động | Nhị phân; Có; Không | Lượt khám / Triệu chứng | observation: giam_van_dong | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!22 / STT 21 | giam_kha_nang_tu_cham_soc | Giảm khả năng tự chăm sóc | Nhị phân; Có; Không | Lượt khám / Triệu chứng | observation: giam_kha_nang_tu_cham_soc | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!23 / STT 22 | suy_giam_chuc_nang_khong_giai_thich | Suy giảm chức năng không giải thích được | Nhị phân; Có; Không | Lượt khám / Triệu chứng | observation: suy_giam_chuc_nang_khong_giai_thich | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!24 / STT 23 | ha_t_the_nam_ngoi | Huyết áp khi nằm/ngồi | Số đo / nhị phân; mmHg; tâm thu/tâm trương | Lâm sàng / nguồn hoặc AI | observation: huyet_ap_tam_thu, huyet_ap_tam_truong, huyet_ap_tu_the (nam/ngoi) | Cần xác nhận | Đã có cấu trúc ghi nhận một phần; đơn vị, thời điểm, nguồn và ánh xạ file cần bác sĩ xác nhận. |
| TL06!25 / STT 24 | ha_t_the_dung | Huyết áp khi đứng | Số đo / nhị phân; mmHg; tâm thu/tâm trương | Lâm sàng / nguồn hoặc AI | observation: huyet_ap_tam_thu, huyet_ap_tam_truong, huyet_ap_tu_the (dung) | Cần xác nhận | Đã có cấu trúc ghi nhận một phần; đơn vị, thời điểm, nguồn và ánh xạ file cần bác sĩ xác nhận. |
| TL06!26 / STT 25 | mach | Mạch | Số đo / nhị phân; lần/phút | Lượt khám / Dấu hiệu sinh tồn | observation: mach | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!27 / STT 26 | nhip_tho | Nhịp thở | Số đo / nhị phân; lần/phút | Lượt khám / Dấu hiệu sinh tồn | observation: nhip_tho | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!28 / STT 27 | spo2 | SpO₂ | Số đo / nhị phân; % | Lượt khám / Dấu hiệu sinh tồn | observation: spo2 | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!29 / STT 28 | tinh_mach_co_noi | Tĩnh mạch cổ nổi | Số đo / nhị phân; Có; Không | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!30 / STT 29 | phan_hoi_gan_tinh_mach_co | Phản hồi gan–tĩnh mạch cổ dương tính | Số đo / nhị phân; Có; Không | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!31 / STT 30 | tieng_tim_t3 | Tiếng tim T3 | Số đo / nhị phân; Có; Không | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!32 / STT 31 | ran_am_phoi | Ran ẩm ở phổi | Số đo / nhị phân; Có; Không | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!33 / STT 32 | phu_ngoai_bien | Phù ngoại biên | Số đo / nhị phân; Có; Không | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!34 / STT 33 | gan_to | Gan to | Số đo / nhị phân; Có; Không | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!35 / STT 34 | co_truong | Cổ trướng | Số đo / nhị phân; Có; Không | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!36 / STT 35 | giam_tuoi_mau_ngoai_vi | Dấu hiệu giảm tưới máu ngoại vi | Số đo / nhị phân; Có; Không | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!37 / STT 36 | frailty | Frailty | Định tính/điểm; Theo thang đo được sử dụng tại cơ sở | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!38 / STT 38 | chuc_nang_nhan_thuc | Chức năng nhận thức | Định tính/điểm; Theo thang đo | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!39 / STT 39 | tien_su_sang | Tiền sử sảng | Định tính/điểm; Có; Không | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!40 / STT 40 | nguy_co_te_nga | Nguy cơ té ngã | Định tính/điểm; Theo công cụ đánh giá | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!41 / STT 41 | tinh_trang_dinh_duong | Tình trạng dinh dưỡng | Định tính/điểm; Theo công cụ đánh giá | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!42 / STT 42 | sarcopenia | Sarcopenia | Định tính/điểm; Có; Không; Chưa đánh giá | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!43 / STT 43 | tu_su_dung_thuoc | Khả năng tự sử dụng thuốc | Định tính/điểm; Tự sử dụng được; Cần hỗ trợ; Không tự sử dụng | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!44 / STT 45 | benh_mach_vanh_nhoi_mau_co_tim | Bệnh mạch vành/nhồi máu cơ tim | Nhị phân; Có; Không, HẸP NHƯ THẾ NÀO, CÓ CAN THIỆP GÌ?? (VĂN BẢN) | Lượt khám / Tiền sử và bệnh đồng mắc | observation: benh_mach_vanh_nhoi_mau_co_tim | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!45 / STT 46 | dai_thao_duong | Đái tháo đường | Nhị phân; Có; Không (Hba1c ???) | Lượt khám / Tiền sử và bệnh đồng mắc | observation: dai_thao_duong | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!46 / STT 47 | beo_phi | Béo phì | Nhị phân; Có; Không | Lượt khám / Tiền sử và bệnh đồng mắc | observation: beo_phi | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!47 / STT 48 | benh_than_man | Bệnh thận mạn | Nhị phân; Có; Không (mức lọc cầu thận ?) | Lượt khám / Tiền sử và bệnh đồng mắc | observation: benh_than_man | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!48 / STT 49 | tien_su_hoa_tri_thuoc_doc_tim | Tiền sử hóa trị hoặc sử dụng thuốc độc với tim | Nhị phân; Có; Không | Lượt khám / Tiền sử và bệnh đồng mắc | observation: tien_su_hoa_tri_thuoc_doc_tim | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!49 / STT 50 | tien_su_benh_co_tim_cau_truc | Tiền sử bệnh cơ tim hoặc bệnh tim cấu trúc | Nhị phân; Có; Không | Lượt khám / Tiền sử và bệnh đồng mắc | observation: tien_su_benh_co_tim_cau_truc | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!50 / STT 52 | tang_huyet_ap_nguyen_nhan | Tăng huyết áp | Nhị phân; Có; Không; Chưa xác định | Lượt khám / Tiền sử và bệnh đồng mắc | observation: tang_huyet_ap_nguyen_nhan | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!51 / STT 53 | benh_van_tim | Bệnh van tim | Nhị phân; Có; Không; Chưa xác định | Lượt khám / Tiền sử và bệnh đồng mắc | observation: benh_van_tim | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!52 / STT 54 | rung_nhi_roi_loan_nhip | Rung nhĩ hoặc rối loạn nhịp khác | Nhị phân; Có; Không; Chưa xác định | Lượt khám / Tiền sử và bệnh đồng mắc | observation: rung_nhi_roi_loan_nhip | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!53 / STT 55 | benh_co_tim | Bệnh cơ tim | Nhị phân; Có; Không; Chưa xác định | Lượt khám / Tiền sử và bệnh đồng mắc | observation: benh_co_tim | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!54 / STT 56 | amyloidosis_tim | Amyloidosis tim | Nhị phân; Có; Không; Chưa xác định | Lượt khám / Tiền sử và bệnh đồng mắc | observation: amyloidosis_tim | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!55 / STT 57 | viem_co_tim | Viêm cơ tim | Nhị phân; Có; Không; Chưa xác định | Lượt khám / Tiền sử và bệnh đồng mắc | observation: viem_co_tim | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!56 / STT 58 | thuoc_doc_chat | Thuốc hoặc độc chất | Nhị phân; Có; Không; Chưa xác định | Lượt khám / Tiền sử và bệnh đồng mắc | observation: thuoc_doc_chat | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!57 / STT 59 | takotsubo | Takotsubo | Nhị phân; Có; Không; Chưa xác định | Lượt khám / Tiền sử và bệnh đồng mắc | observation: takotsubo | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!58 / STT 60 | benh_noi_tiet_chuyen_hoa | Bệnh nội tiết–chuyển hóa | Nhị phân; Có; Không; Chưa xác định | Lượt khám / Tiền sử và bệnh đồng mắc | observation: benh_noi_tiet_chuyen_hoa | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!59 / STT 61 | suy_tim_cung_luong_cao | Suy tim cung lượng cao | Nhị phân; Có; Không; Chưa xác định | Lượt khám / Tiền sử và bệnh đồng mắc | observation: suy_tim_cung_luong_cao | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!60 / STT 64 | copd | COPD | Nhị phân; Có; Không | Lượt khám / Tiền sử và bệnh đồng mắc | observation: copd | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!61 / STT 65 | thieu_mau | Thiếu máu | Nhị phân; Có; Không | Lượt khám / Tiền sử và bệnh đồng mắc | observation: thieu_mau | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!62 / STT 66 | benh_gan | Bệnh gan | Nhị phân; Có; Không | Lượt khám / Tiền sử và bệnh đồng mắc | observation: benh_gan | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!63 / STT 67 | roi_loan_tuyen_giap | Rối loạn tuyến giáp | Nhị phân; Có; Không | Lượt khám / Tiền sử và bệnh đồng mắc | observation: roi_loan_tuyen_giap | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!64 / STT 68 | sa_sut_tri_tue | Sa sút trí tuệ | Nhị phân; Có; Không | Lượt khám / Tiền sử và bệnh đồng mắc | observation: sa_sut_tri_tue | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!65 / STT 69 | tram_cam | Trầm cảm | Nhị phân; Có; Không | Lượt khám / Tiền sử và bệnh đồng mắc | observation: tram_cam | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!66 / STT 70 | benh_mach_mau_nao | Bệnh mạch máu não | Nhị phân; Có; Không | Lượt khám / Tiền sử và bệnh đồng mắc | observation: benh_mach_mau_nao | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!67 / STT 71 | ung_thu | Ung thư | Nhị phân; Có; Không | Lượt khám / Tiền sử và bệnh đồng mắc | observation: ung_thu | Thuộc MVP | Trường lâm sàng cơ bản có kiểu rõ; nhập tay hoặc sau đối chiếu file. |
| TL06!68 / STT 72 | danh_sach_thuoc | Danh sách thuốc hiện tại | Danh sách có cấu trúc; Tên thuốc; hoạt chất; liều; đường dùng; tần suất; thời điểm | Lâm sàng / nguồn hoặc AI | medication_entry: ten, hoat chat, lieu, trang thai, nguon | Cần xác nhận | Đã có cấu trúc ghi nhận một phần; đơn vị, thời điểm, nguồn và ánh xạ file cần bác sĩ xác nhận. |
| TL06!69 / STT 73 | da_thuoc | Tình trạng đa thuốc | Số nguyên/phân loại; Số thuốc đồng thời; có/không đa thuốc | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!70 / STT 74 | ecg_12_chuyen_dao | ECG 12 chuyển đạo | Kết quả/tệp; Kết quả đọc ECG và/hoặc tệp ECG | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!71 / STT 75 | bnp_ntprobnp | BNP/NT-proBNP | Số thực; Giá trị + đơn vị + thời điểm | Lâm sàng / nguồn hoặc AI | observation: bnp hoac ntprobnp, don vi/thoi diem/nguon | Cần xác nhận | Đã có cấu trúc ghi nhận một phần; đơn vị, thời điểm, nguồn và ánh xạ file cần bác sĩ xác nhận. |
| TL06!72 / STT 76 | troponin | Troponin | Số thực; Giá trị + đơn vị + thời điểm | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!73 / STT 77 | sieu_am_tim_ef | Siêu âm tim và EF | Số thực/tệp; EF (%) + kết quả siêu âm + thời điểm | Lâm sàng / nguồn hoặc AI | observation: lvef, sieu_am_tim_bao_cao, thoi diem/nguon | Cần xác nhận | Đã có cấu trúc ghi nhận một phần; đơn vị, thời điểm, nguồn và ánh xạ file cần bác sĩ xác nhận. |
| TL06!74 / STT 78 | xquang_tim_phoi | X-quang tim phổi | Kết quả/tệp; Báo cáo hình ảnh và/hoặc tệp | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!75 / STT 79 | creatinin_egfr | Creatinin/eGFR | Số thực; Giá trị + đơn vị + thời điểm | Lâm sàng / nguồn hoặc AI | observation: creatinin hoac egfr, don vi/thoi diem/nguon | Cần xác nhận | Đã có cấu trúc ghi nhận một phần; đơn vị, thời điểm, nguồn và ánh xạ file cần bác sĩ xác nhận. |
| TL06!76 / STT 80 | dien_giai | Điện giải đồ | Số thực/cấu trúc; Na; K; các điện giải khác + đơn vị + thời điểm | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!77 / STT 81 | thay_doi_trieu_chung | Thay đổi triệu chứng | Định tính; Cải thiện; Không đổi; Nặng lên | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!78 / STT 82 | thay_doi_can_nang | Thay đổi cân nặng | Số thực; kg + khoảng thời gian | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!79 / STT 83 | thay_doi_nyha | Thay đổi NYHA | Định tính; I; II; III; IV | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!80 / STT 84 | thay_doi_bnp_ntprobnp | Thay đổi BNP/NT-proBNP và EF | Số thực; Giá trị hiện tại/trước đây + thời điểm | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!81 / STT 85 | so_lan_cap_cuu_nhap_vien | Số lần cấp cứu/nhập viện | Số nguyên; Số lần + khoảng thời gian | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!82 / STT 86 | nhu_cau_tang_lieu_loi_tieu | Nhu cầu tăng liều lợi tiểu | Nhị phân; Có; Không | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!83 / STT 87 | nguoi_cham_soc | Người chăm sóc | Định tính; Có/Không; quan hệ nếu cần | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!84 / STT 88 | kha_nang_chi_tra | Khả năng chi trả | Định tính; Đủ; Hạn chế; Không đủ | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!85 / STT 89 | kha_nang_tai_kham | Khả năng tái khám | Định tính; Có; Hạn chế; Không | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!86 / STT 90 | kha_nang_mua_su_dung_thuoc | Khả năng mua và sử dụng thuốc | Định tính; Tốt; Hạn chế; Không | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!87 / STT 91 | khoang_cach_co_so_y_te | Khoảng cách đến cơ sở y tế | Số thực/định tính; km hoặc gần/trung bình/xa | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!88 / STT 92 | ho_tro_gia_dinh | Mức độ hỗ trợ của gia đình | Định tính; Tốt; Trung bình; Ít/Không | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!89 / STT 93 | xac_suat_suy_tim | Ước tính khả năng mắc suy tim | Phân loại/xác suất; Không phù hợp; Có nguy cơ – Stage A; Pre-HF – Stage B; Nghi ngờ suy tim; Suy tim có triệu chứng – Stage C; Suy tim tiến triển – Stage D; Chưa đủ dữ liệu để kết luận | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!90 / STT 94 | kieu_hinh_ef | Phân loại kiểu hình | Một lựa chọn; Suy tim với EF giảm; Suy tim với EF bảo tồn; Suy tim với EF cải thiện; Chưa phân loại do thiếu EF | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!91 / STT 95 | benh_canh_suy_tim | Phân loại bệnh cảnh | Một lựa chọn; Suy tim mới khởi phát; Suy tim cấp hoặc mạn tính; Worsening HF; Decompensated HF; Suy tim cải thiện/thuyên giảm; Suy tim tiến triển/kháng trị | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!92 / STT 96 | xep_hang_nguyen_nhan | Xếp hạng nguyên nhân suy tim có khả năng nhất | Xếp hạng; Danh sách nguyên nhân theo thứ tự ưu tiên | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!93 / STT 97 | canh_bao_gia_suy_tim | Cảnh báo khả năng mắc bệnh giả suy tim | Đa lựa chọn; Quá tải dịch do bệnh thận; COPD/bệnh phổi khác; Thiếu máu; Béo phì; Giảm thể lực; Suy dinh dưỡng/sarcopenia; Bệnh tuyến giáp | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!94 / STT 98 | frailty_dung_nap_dieu_tri | Phân loại frailty và khả năng dung nạp điều trị | Phân loại; Kết quả đánh giá | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!95 / STT 99 | du_bao_nhap_vien_tai_nhap_vien | Dự báo nguy cơ nhập viện/tái nhập viện | Xác suất/phân loại; Nguy cơ hoặc xác suất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!96 / STT 100 | du_bao_tu_vong | Dự báo nguy cơ tử vong | Xác suất/phân loại; Nguy cơ hoặc xác suất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!97 / STT 101 | du_bao_te_nga | Dự báo nguy cơ té ngã | Xác suất/phân loại; Nguy cơ hoặc xác suất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!98 / STT 102 | du_bao_sang | Dự báo nguy cơ sảng | Xác suất/phân loại; Nguy cơ hoặc xác suất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!99 / STT 103 | du_bao_suy_giam_chuc_nang | Dự báo nguy cơ suy giảm chức năng | Xác suất/phân loại; Nguy cơ hoặc xác suất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!100 / STT 104 | du_bao_mat_tu_cham_soc | Dự báo nguy cơ mất khả năng tự chăm sóc | Xác suất/phân loại; Nguy cơ hoặc xác suất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!101 / STT 105 | canh_bao_cap_cuu | Cảnh báo cấp cứu | Đa lựa chọn; Phù phổi cấp; Sốc tim; Tụt huyết áp; Giảm SpO₂; Rối loạn nhịp nguy hiểm; Hội chứng vành cấp; Thiểu niệu hoặc giảm tưới máu | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!102 / STT 106 | giai_doan_suy_tim_ai | Giai đoạn suy tim từ AI Diagnosis | Kết quả AI; Stage A–D | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!103 / STT 107 | kieu_hinh_nghi_ngo_ai | Kiểu hình nghi ngờ | Kết quả AI; EF giảm; EF bảo tồn; EF cải thiện; Chưa phân loại | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!104 / STT 108 | benh_canh_ai | Bệnh cảnh | Kết quả AI; Cấp; Mạn; Worsening; Decompensated | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!105 / STT 109 | nguyen_nhan_nghi_ngo_ai | Nguyên nhân nghi ngờ | Kết quả AI; Danh sách nguyên nhân | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!106 / STT 110 | benh_gia_suy_tim_can_loai_tru | Bệnh giả suy tim cần loại trừ | Kết quả AI; Danh sách | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!107 / STT 111 | trieu_chung_dau_hieu | Triệu chứng và dấu hiệu lâm sàng | Thông tin lâm sàng/định tính; Theo hồ sơ và đánh giá thực tế | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!108 / STT 112 | frailty_hop_tac_xet_nghiem | Frailty, nhận thức và khả năng hợp tác thực hiện xét nghiệm | Thông tin lâm sàng/định tính; Theo hồ sơ và đánh giá thực tế | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!109 / STT 113 | xet_nghiem_da_co | Kết quả xét nghiệm đã có và thời điểm thực hiện | Thông tin lâm sàng/định tính; Theo hồ sơ và đánh giá thực tế | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!110 / STT 114 | chuc_nang_than_gan_dien_giai | Chức năng thận, gan và tình trạng điện giải | Thông tin lâm sàng/định tính; Theo hồ sơ và đánh giá thực tế | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!111 / STT 115 | benh_dong_mac_lab | Bệnh đồng mắc | Thông tin lâm sàng/định tính; Theo hồ sơ và đánh giá thực tế | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!112 / STT 116 | thuoc_dang_su_dung_lab | Thuốc đang sử dụng | Thông tin lâm sàng/định tính; Theo hồ sơ và đánh giá thực tế | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!113 / STT 117 | di_ung_thuoc_can_quang | Dị ứng thuốc cản quang | Thông tin lâm sàng/định tính; Theo hồ sơ và đánh giá thực tế | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!114 / STT 118 | thiet_bi_cay_ghep | Thiết bị cấy ghép và chống chỉ định MRI | Thông tin lâm sàng/định tính; Theo hồ sơ và đánh giá thực tế | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!115 / STT 119 | kha_nang_gang_suc_tham_do | Khả năng chịu đựng nghiệm pháp gắng sức hoặc thăm dò xâm lấn | Thông tin lâm sàng/định tính; Theo hồ sơ và đánh giá thực tế | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!116 / STT 120 | muc_tieu_kha_nang_xet_nghiem | Mục tiêu điều trị, khả năng chi trả và khả năng thực hiện xét nghiệm | Thông tin lâm sàng/định tính; Theo hồ sơ và đánh giá thực tế | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!117 / STT 121 | goi_y_bnp_ntprobnp | BNP hoặc NT-proBNP | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất ???? | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!118 / STT 122 | goi_y_ecg | ECG 12 chuyển đạo | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!119 / STT 123 | goi_y_sieu_am_tim | Siêu âm tim | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!120 / STT 124 | goi_y_xquang_tim_phoi | X-quang tim phổi | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!121 / STT 125 | goi_y_cong_thuc_mau | Công thức máu | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!122 / STT 126 | goi_y_ure_creatinin_egfr | Urê, creatinin, eGFR | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!123 / STT 127 | goi_y_kali_natri | Kali, natri | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!124 / STT 128 | goi_y_chuc_nang_gan | Chức năng gan | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!125 / STT 129 | goi_y_duong_huyet_hba1c | Đường huyết/HbA1c | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!126 / STT 130 | goi_y_tsh | TSH | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!127 / STT 131 | goi_y_ferritin_tsat | Ferritin và TSAT | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!128 / STT 132 | goi_y_uacr | UACR | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!129 / STT 133 | goi_y_danh_gia_mach_vanh | Đánh giá bệnh mạch vành | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!130 / STT 134 | goi_y_doppler_van_tim | Siêu âm Doppler bệnh van tim | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!131 / STT 135 | goi_y_holter_ecg | Holter ECG | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!132 / STT 136 | goi_y_mri_tim | MRI tim | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!133 / STT 137 | goi_y_xet_nghiem_amyloidosis | Xét nghiệm amyloidosis | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!134 / STT 138 | goi_y_danh_gia_benh_co_tim | Đánh giá bệnh cơ tim | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!135 / STT 139 | goi_y_suy_tim_cung_luong_cao | Xét nghiệm nguyên nhân suy tim cung lượng cao | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!136 / STT 140 | goi_y_danh_gia_benh_than | Đánh giá bệnh thận | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!137 / STT 141 | goi_y_danh_gia_benh_phoi | Đánh giá bệnh phổi | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!138 / STT 142 | goi_y_danh_gia_thieu_mau | Đánh giá thiếu máu | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!139 / STT 143 | goi_y_dinh_duong | Đánh giá suy dinh dưỡng | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!140 / STT 144 | goi_y_tuyen_giap | Đánh giá tuyến giáp | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!141 / STT 145 | goi_y_gang_suc_tham_do_huyet_dong | Nghiệm pháp gắng sức hoặc thăm dò huyết động khi cần | Khuyến nghị xét nghiệm; Đề xuất/Không đề xuất | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!142 / STT 146 | phan_loai_ket_qua_xet_nghiem | Phân loại kết quả | Một lựa chọn; Phù hợp với suy tim; Chưa đủ bằng chứng; Nghi ngờ bệnh giả suy tim; Cần xét nghiệm bổ sung; Cần hội chẩn chuyên khoa | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!143 / STT 147 | muc_uu_tien_xet_nghiem | Xếp mức ưu tiên | Một lựa chọn; Cấp cứu; Trong 24 giờ; Trong đợt khám hiện tại; Theo dõi định kỳ | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!144 / STT 148 | danh_gia_loi_ich_nguy_co_xet_nghiem | Đánh giá lợi ích–nguy cơ của xét nghiệm | Định tính; Đặc biệt ở người frailty hoặc nhiều bệnh đồng mắc | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!145 / STT 149 | canh_bao_khong_chi_dinh_xam_lan_theo_tuoi | Cảnh báo chỉ định xét nghiệm xâm lấn | Cảnh báo; Không đề xuất chỉ dựa trên tuổi; căn cứ lợi ích, frailty, mục tiêu điều trị và mong muốn người bệnh | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!146 / STT 150 | stage_suy_tim | Giai đoạn suy tim A–D | Định tính/số đo/cấu trúc; A; B; C; D | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!147 / STT 151 | ef_treatment | Kiểu hình EF | Định tính/số đo/cấu trúc; EF giảm; EF bảo tồn; EF cải thiện | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!148 / STT 152 | nguyen_nhan_treatment | Nguyên nhân suy tim | Định tính/số đo/cấu trúc; Danh sách nguyên nhân | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!149 / STT 153 | nyha | NYHA | Định tính/số đo/cấu trúc; I; II; III; IV | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!150 / STT 154 | worsening_decompensated | Tình trạng worsening hoặc decompensated | Định tính/số đo/cấu trúc; Có/Không; loại | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!151 / STT 155 | sung_huyet_tuoi_mau | Dấu hiệu sung huyết và tưới máu | Định tính/số đo/cấu trúc; Mô tả/định tính | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!152 / STT 156 | ha_treatment | Huyết áp | Định tính/số đo/cấu trúc; mmHg | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!153 / STT 157 | mach_treatment | Mạch | Định tính/số đo/cấu trúc; lần/phút | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!154 / STT 158 | spo2_treatment | SpO₂ | Định tính/số đo/cấu trúc; % | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!155 / STT 159 | ef_hien_tai | EF hiện tại và EF trước đây | Định tính/số đo/cấu trúc; % + thời điểm | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!156 / STT 160 | bnp_treatment | BNP/NT-proBNP | Định tính/số đo/cấu trúc; Giá trị + đơn vị + thời điểm | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!157 / STT 161 | creatinin_egfr_treatment | Creatinin/eGFR | Định tính/số đo/cấu trúc; Giá trị + đơn vị + thời điểm | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!158 / STT 162 | kali_natri_gan | Kali, natri và chức năng gan | Định tính/số đo/cấu trúc; Giá trị + đơn vị | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!159 / STT 163 | thuoc_lieu_tuan_thu | Thuốc đang sử dụng, liều và mức độ tuân thủ | Định tính/số đo/cấu trúc; Danh sách có cấu trúc | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!160 / STT 164 | khong_dung_nap_thuoc | Tiền sử không dung nạp thuốc | Định tính/số đo/cấu trúc; Danh sách/mô tả | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!161 / STT 165 | benh_dong_mac_treatment | Bệnh đồng mắc | Định tính/số đo/cấu trúc; Danh sách | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!162 / STT 166 | frailty_treatment | Frailty | Định tính/số đo/cấu trúc; Điểm/phân loại | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!163 / STT 167 | nhan_thuc_treatment | Chức năng nhận thức | Định tính/số đo/cấu trúc; Điểm/phân loại | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!164 / STT 168 | adl_iadl_treatment | ADL/IADL | Định tính/số đo/cấu trúc; Điểm/phân loại | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!165 / STT 169 | nguy_co_te_nga_hha | Nguy cơ té ngã và hạ huyết áp tư thế | Định tính/số đo/cấu trúc; Phân loại/điểm | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!166 / STT 170 | dinh_duong_sarcopenia | Tình trạng dinh dưỡng và sarcopenia | Định tính/số đo/cấu trúc; Phân loại/điểm | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!167 / STT 171 | tu_quan_ly_thuoc | Khả năng tự quản lý thuốc hoặc hỗ trợ người chăm sóc | Định tính/số đo/cấu trúc; Định tính | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!168 / STT 172 | muc_tieu_dieu_tri | Mục tiêu điều trị | Định tính/số đo/cấu trúc; Kéo dài thời gian sống; Giảm nhập viện; Giảm triệu chứng; Duy trì chức năng; Nâng cao chất lượng sống; Chăm sóc giảm nhẹ | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!169 / STT 173 | dieu_tri_stage_a | Điều trị Stage A | Khuyến nghị; Kiểm soát THA, ĐTĐ, béo phì, bệnh mạch vành, bệnh thận mạn; xem xét SGLT2i/GLP-1RA/finerenone khi đúng chỉ định; dinh dưỡng, vận động và phòng ngừa suy giảm chức năng | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!170 / STT 174 | dieu_tri_stage_b | Điều trị Stage B | Khuyến nghị; Điều trị nguyên nhân/bệnh tim cấu trúc; xem xét thuốc tác động hệ renin–angiotensin và chẹn beta khi có chỉ định; theo dõi EF, biomarker, triệu chứng và chức năng | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!171 / STT 175 | dieu_tri_stage_c | Điều trị Stage C | Khuyến nghị; Lựa chọn thuốc theo EF; EF giảm: đánh giá ARNI/ACEI/ARB, chẹn beta, MRA, SGLT2i; lợi tiểu khi sung huyết; điều trị bệnh đồng mắc/nguyên nhân; đánh giá ICD/CRT/van/tái thông | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!172 / STT 176 | ca_the_hoa_nguoi_cao_tuoi | Cá thể hóa theo người cao tuổi | Khuyến nghị; Liều khởi đầu phù hợp; tăng liều từng bước; không giảm/từ chối chỉ dựa tuổi; điều chỉnh eGFR/HA/nhịp tim/frailty; đơn giản hóa phác đồ; phối hợp người chăm sóc | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!173 / STT 177 | xu_tri_worsening_hf | Xử trí Worsening HF | Khuyến nghị; Xác định nguyên nhân; điều chỉnh ngoại trú khi an toàn; cảnh báo khám khẩn khi cần | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!174 / STT 178 | xu_tri_decompensated_hf | Xử trí Decompensated HF | Khuyến nghị; Tăng cường lợi tiểu; đánh giá IV; hỗ trợ huyết động/lọc máu/hỗ trợ tuần hoàn; cảnh báo nhập viện/chăm sóc tích cực | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!175 / STT 179 | dieu_tri_stage_d | Điều trị Stage D | Khuyến nghị; Hội chẩn chuyên khoa; đánh giá can thiệp nâng cao; chăm sóc giảm nhẹ khi phù hợp; thảo luận mục tiêu với người bệnh/gia đình | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!176 / STT 180 | ke_hoach_theo_doi | Kế hoạch theo dõi | Khuyến nghị; Huyết áp tư thế; cân nặng; triệu chứng sung huyết; chức năng thận/điện giải; frailty/nhận thức/ADL-IADL; nguy cơ té ngã; tuân thủ | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!177 / STT 181 | don_thuoc_moi | Đơn thuốc mới và toàn bộ thuốc đang sử dụng | Định tính/số đo/cấu trúc; Danh sách có cấu trúc | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!178 / STT 182 | thuoc_otc_tpcn_yhct | Thuốc không kê đơn, thực phẩm chức năng và thuốc y học cổ truyền | Định tính/số đo/cấu trúc; Danh sách | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!179 / STT 183 | so_luong_thuoc_dong_thoi | Số lượng thuốc sử dụng đồng thời | Định tính/số đo/cấu trúc; Số nguyên | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!180 / STT 184 | di_ung_phan_ung_co_hai | Dị ứng và phản ứng có hại | Định tính/số đo/cấu trúc; Danh sách/cờ cảnh báo | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!181 / STT 185 | creatinin_egfr_medsafety | Creatinin/eGFR | Định tính/số đo/cấu trúc; Số thực | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!182 / STT 186 | kali_natri_dien_giai_medsafety | Kali, natri và các điện giải khác | Định tính/số đo/cấu trúc; Số thực/cấu trúc | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!183 / STT 187 | chuc_nang_gan_medsafety | Chức năng gan | Định tính/số đo/cấu trúc; Số thực/phân loại | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!184 / STT 188 | ha_nam_ngoi_dung | Huyết áp khi nằm/ngồi và khi đứng | Định tính/số đo/cấu trúc; mmHg | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!185 / STT 189 | nhip_tim_ecg | Nhịp tim và ECG | Định tính/số đo/cấu trúc; Số đo + kết quả | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!186 / STT 190 | frailty_medsafety | Frailty | Định tính/số đo/cấu trúc; Điểm/phân loại | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!187 / STT 191 | nhan_thuc_tien_su_sang | Nhận thức và tiền sử sảng | Định tính/số đo/cấu trúc; Điểm/phân loại | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!188 / STT 192 | tien_su_te_nga_ngat | Tiền sử té ngã hoặc ngất | Định tính/số đo/cấu trúc; Có; Không | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!189 / STT 193 | kha_nang_nuot_tu_dung_thuoc | Khả năng nuốt và tự sử dụng thuốc | Định tính/số đo/cấu trúc; Định tính | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!190 / STT 194 | dinh_duong_can_nang_sarcopenia | Tình trạng dinh dưỡng, cân nặng và sarcopenia | Định tính/số đo/cấu trúc; Cấu trúc | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!191 / STT 195 | ho_tro_nguoi_cham_soc_medsafety | Khả năng hỗ trợ của người chăm sóc | Định tính/số đo/cấu trúc; Định tính | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!192 / STT 196 | chi_tra_tai_kham_medsafety | Khả năng chi trả và tái khám | Định tính/số đo/cấu trúc; Định tính | Lâm sàng / nguồn hoặc AI | Chưa ánh xạ | Cần xác nhận | Cần tách nghĩa, xác nhận kiểu, đơn vị hoặc xác định phạm vi trước khi nạp. |
| TL06!193 / STT 197 | phat_hien_da_thuoc | Phát hiện đa thuốc và trùng lặp điều trị | Cảnh báo; Đa thuốc; trùng lặp điều trị | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!194 / STT 198 | tuong_tac_thuoc_thuoc | Tương tác thuốc–thuốc | Cảnh báo; Danh sách tương tác + mức độ | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!195 / STT 199 | tuong_tac_thuoc_benh | Tương tác thuốc–bệnh | Cảnh báo; Danh sách + mức độ | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!196 / STT 200 | chong_chi_dinh | Chống chỉ định | Cảnh báo; Danh sách + mức độ | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!197 / STT 201 | sai_lieu | Sai liều | Cảnh báo; Thuốc/liều hiện tại + khuyến nghị | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!198 / STT 202 | thuoc_khong_con_chi_dinh | Thuốc không còn chỉ định rõ ràng | Cảnh báo; Danh sách | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!199 / STT 203 | khuyen_nghi_chinh_lieu | Khuyến nghị chỉnh liều | Khuyến nghị; Theo eGFR; chức năng gan; huyết áp; nhịp tim; cân nặng; frailty | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!200 / STT 204 | canh_bao_nguy_co | Cảnh báo nguy cơ | Đa lựa chọn; Tăng kali máu; Suy thận cấp; Hạ natri máu; Hạ huyết áp tư thế; Nhịp chậm; Block nhĩ thất; Kéo dài QT; Té ngã; Sảng; Mất nước; Hạ đường huyết | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!201 / STT 205 | thuoc_lam_nang_suy_tim | Cảnh báo thuốc làm nặng suy tim | Cảnh báo; NSAID; Thiazolidinedione; Thuốc gây giữ nước; Thuốc ảnh hưởng bất lợi đến co bóp tim trong bối cảnh không phù hợp | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!202 / STT 206 | thuoc_suy_tim_dac_hieu | Cảnh báo đặc hiệu với thuốc suy tim | Cảnh báo; ACEI/ARNI; RAAS inhibitor/MRA/finerenone; SGLT2 inhibitor; Chẹn beta; Digoxin; Lợi tiểu | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!203 / STT 207 | don_gian_hoa_phac_do | Đề xuất đơn giản hóa phác đồ | Khuyến nghị; Giảm số lần dùng thuốc/ngày; lịch dùng thuốc rõ ràng; hướng dẫn người chăm sóc; dạng thuốc phù hợp khả năng nuốt | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!204 / STT 208 | giam_ngung_thuoc | Đề xuất xem xét giảm/ngừng thuốc | Khuyến nghị; Thuốc không còn lợi ích hoặc nguy cơ vượt lợi ích | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!205 / STT 209 | ke_hoach_xet_nghiem_theo_doi | Kế hoạch xét nghiệm và thời điểm theo dõi | Kế hoạch; Xét nghiệm + thời điểm | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!206 / STT 210 | phan_tang_canh_bao | Phân tầng cảnh báo | Một lựa chọn; Nghiêm trọng – xử trí ngay; Quan trọng – cần bác sĩ xác nhận; Theo dõi – giám sát định kỳ | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |
| TL06!207 / STT 211 | xac_nhan_bac_si | Xác nhận quyết định của bác sĩ | Nhị phân + văn bản; Đồng ý; Không đồng ý; Lý do/ghi nhận | Đầu ra AI / kết luận | — | Giai đoạn sau | Chức năng hỗ trợ AI ngoài phạm vi MVP. |

---

## Truy vết cột file mẫu

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

---

## Đối chiếu bổ sung nguồn TL04 và TL05

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

---

## Đối chiếu dữ liệu thiết kế 3.2 với repo demo-web-3

Rà ngày 18/11/2026. Nguồn đối chiếu là `suytim_clone_demo`, nhánh `demo-web-3`, commit `0138b2c8cef1376a0125b0fae4d793f75b8f6bc8`; tài liệu chính: `docs/demo-web/data-profile.md`, `field-catalog-and-mapping.md`, `review-20261030-data.md`, `revision-data-contract.md`, `review-20261030-integration.md` và `src/gateway/forms/catalog.json`. Đích là cấu hình 61 trường và schema của PR thiết kế 3.2. Đây là rà thiết kế, không xác nhận dữ liệu bệnh viện hoặc tính đúng đắn lâm sàng.

### Kết quả đối chiếu mã trường

| Tập mã | Số lượng | Ý nghĩa |
| --- | ---: | --- |
| Trường trong cấu hình MVP 3.2 | 61 | Trường biểu mẫu, chưa gồm cột hành chính trong bảng `patient` và bảng thuốc riêng. |
| Trường `implementation_status=supported` của catalog demo | 86 | Mã được bản demo đánh dấu hỗ trợ; không đồng nghĩa đã được xác nhận lâm sàng. |
| Cùng mã và được demo hỗ trợ | 44 | Cần tiếp tục đối chiếu kiểu, đơn vị và cấu trúc, không chỉ tên. |
| Demo hỗ trợ, cấu hình MVP không có cùng mã | 42 | Có cả trường hành chính `tuoi`, `gioi_tinh`, trường tổng hợp và trường con được tách ra; không mặc nhiên là 42 lỗ hổng. |
| Cấu hình MVP có mã mà demo không đánh dấu hỗ trợ | 17 | Có trường gộp/tách khác nhau, các trường lấy từ file mẫu và các mục cần xác minh thêm. |

Con số 88 trong `review-20261030-integration.md` là số **định nghĩa có widget** ở thời điểm tài liệu đó được lập; số 86 ở trên đếm trực tiếp mã `supported` trong catalog tại commit đã nêu. Không dùng hai số này thay cho số trường bắt buộc của MVP. TL06 có 206 dòng nguồn; các trường bổ sung sau này không làm tăng số dòng TL06 gốc.

### Các khác biệt ảnh hưởng tới dữ liệu

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

### Việc cần chốt trước khi mở rộng cấu hình

1. Ưu tiên xác nhận nhóm đo huyết áp, LVEF, danh sách xét nghiệm và thuốc; đây là các khác biệt có thể làm mất ngữ cảnh nếu chỉ nhập số hoặc văn bản rời.
2. Giữ 61 trường hiện tại như **tập khởi tạo**, không diễn đạt là toàn bộ dữ liệu suy tim. Trường được duyệt thêm qua phiên bản biểu mẫu mới; lượt cũ giữ phiên bản cũ.
3. Khi thêm trường, cập nhật đồng thời cấu hình JSON, seed, bảng truy vết nguồn, từ điển dữ liệu và kiểm thử. Một trường có sẵn trong demo chưa tự động được coi là yêu cầu MVP.
4. Kiểm tra lại các mã trong bảng truy vết TL06 hiện ghi “Chưa ánh xạ” nhưng bản demo đã có cấu trúc con để ghi nhận. Ghi rõ từng mã được chọn, để sau hay còn chờ xác nhận.

Các tài liệu demo không chứng minh tương thích với file xuất HIS thực hoặc việc triển khai bốn module AI. Phần nhập file cần tiếp tục đối chiếu định danh, lượt khám, kiểu, đơn vị và nguồn trước khi áp dụng giá trị.

### Kết quả sau khi nhóm chốt

Thiết kế 3.2 đã bổ sung 5 trường biểu mẫu, nâng tập khởi tạo từ 61 lên 66: tư thế đo huyết áp, LVEF, báo cáo siêu âm, BNP và eGFR. `observation_version` bổ sung tên chỉ số gốc và ghi chú nguồn; `medication_entry` bổ sung hoạt chất, hàm lượng, liều nguyên văn, trạng thái, loại và nguồn. Các mục lâm sàng còn lại tiếp tục theo bảng truy vết và phiên bản biểu mẫu sau. Phân tích 86/61 ở đầu tài liệu là ảnh chụp **trước** lần cập nhật này.

---
