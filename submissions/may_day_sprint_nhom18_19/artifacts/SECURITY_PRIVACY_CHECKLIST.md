# DANH MỤC TỰ KIỂM TRA BẢO MẬT & QUYỀN RIÊNG TƯ (SECURITY & PRIVACY CHECKLIST)

- **Dự án:** Track A — Dr May Day: Rule Engine Sprint
- **Mã đề:** `KTPMUD-BKT-2026-PILOT`
- **Nhóm thực hiện:** Nhóm 18 + 19
- **Mốc hoàn thành:** Giai đoạn M2/M3 (15/11/2026)
- **Căn cứ đánh giá:** Mục 5.1, 5.2, 5.3 và Rubric Mục 9.1 (Security, privacy, data/AI boundary — 8 điểm)

---

## 1. NGUYÊN TẮC BẢO MẬT DỮ LIỆU & QUYỀN RIÊNG TƯ (ZERO PII / ZERO PHI)

| STT | Hạng mục kiểm tra | Tiêu chuẩn bắt buộc | Kết quả tự đánh giá | Minh chứng & Cơ chế kiểm soát |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **Không sử dụng dữ liệu bệnh nhân thực tế** | Tuyệt đối không chứa PII (Thông tin định danh cá nhân) hoặc PHI (Thông tin sức khỏe cá nhân). | **ĐẠT (100%)** | 100% dữ liệu trong `tests/` và `scripts/` là dữ liệu giả lập (synthetic fixtures). Không có tên, ngày sinh, địa chỉ hay số điện thoại. |
| **2** | **Rà soát rò rỉ dữ liệu trong Audit Trail** | Nhật ký kiểm toán không được ghi nhận các thông số sinh lý thô của bệnh nhân. | **ĐẠT (100%)** | Module `rule_engine/audit.py` chứa phương thức `has_raw_clinical_data()` tự động chặn và kiểm tra danh sách cấm các khóa lâm sàng thô (`tuoi`, `huyet_ap_tam_thu`, triệu chứng). Kiểm chứng qua `tests/test_audit.py`. |
| **3** | **Trường giải thích `ly_do` sạch** | Chuỗi giải thích không chứa thông tin định danh hay dữ liệu thô. | **ĐẠT (100%)** | Trường `ly_do` chỉ diễn giải quy tắc logic phần mềm kích hoạt (ví dụ: *"Thoả mãn kịch bản R01-PV"*), không nhúng dữ liệu cá nhân. |
| **4** | **Phân quyền và bảo mật danh tính người thao tác** | Chỉ sử dụng mã định danh giả định (User UUID). | **ĐẠT (100%)** | Audit log chỉ lưu `user_uuid` theo chuẩn UUIDv4 ẩn danh, không lưu username hay thông tin nhân sự. |

---

## 2. QUẢN LÝ BÍ MẬT & MÃ NGUỒN (SECRET MANAGEMENT)

| STT | Hạng mục kiểm tra | Tiêu chuẩn bắt buộc | Kết quả tự đánh giá | Minh chứng & Cơ chế kiểm soát |
| :---: | :--- | :--- | :---: | :--- |
| **5** | **Không commit khóa bí mật (Secrets/API Keys)** | Không commit token, password, API key hay file `.env` vào kho mã nguồn Git. | **ĐẠT (100%)** | Đã cấu hình file `.gitignore` chặn toàn bộ file môi trường `.env`, cache và khóa bí mật. Đã rà soát commit log bằng lệnh `git log -p`. |
| **6** | **Không kết nối môi trường Production** | Không gọi ra ngoài internet, không kết nối cơ sở dữ liệu thật của bệnh viện. | **ĐẠT (100%)** | Rule engine hoạt động hoàn toàn trong bộ nhớ (In-memory Pure Python), không có cấu hình socket/mạng hay connection string ra bên ngoài. |
| **7** | **Bảo vệ ranh giới nhánh mã nguồn (Branch Protection)** | Kiểm soát luồng commit qua Pull Request và CI tự động. | **ĐẠT (100%)** | Cấu hình GitHub Actions `.github/workflows/test.yml` chạy tự động trên mỗi PR để kiểm tra chất lượng code trước khi merge. |

---

## 3. RANH GIỚI SỬ DỤNG AI & ĐẢM BẢO CHẤT LƯỢNG (AI BOUNDARY & COMPLIANCE)

| STT | Hạng mục kiểm tra | Tiêu chuẩn bắt buộc | Kết quả tự đánh giá | Minh chứng & Cơ chế kiểm soát |
| :---: | :--- | :--- | :---: | :--- |
| **8** | **Không dùng AI/ML tại thời điểm chạy (Runtime)** | Logic phân loại rule engine phải tất định 100% bằng code, không phụ thuộc mô hình học máy. | **ĐẠT (100%)** | Toàn bộ quyết định phân loại được hiện thực bằng cấu trúc rẽ nhánh tất định trong `rule_engine/classifier.py`. |
| **9** | **Minh bạch sử dụng công cụ hỗ trợ AI** | Ghi nhận đầy đủ lịch sử sử dụng AI, công cụ, prompt và phạm vi kiểm chứng con người. | **ĐẠT (100%)** | File `artifacts/AI_USE.md` được ghi nhận chi tiết theo từng ngày (07/11, 10/11, 15/11), tuân thủ Mục 5.3 đề thi. |
| **10** | **Không vi phạm ranh giới khuyến nghị y khoa** | Không tự động kê đơn hay khuyến nghị phác đồ cấp cứu trong phần mềm. | **ĐẠT (100%)** | Hệ thống chỉ trả về kết quả phân loại mức độ nguy cơ (`SOC_PHAN_VE`, `PHAN_VE`, `THEO_DOI`), không đưa ra y lệnh điều trị. |

---

## 4. KẾT LUẬN TỰ ĐÁNH GIÁ (SIGN-OFF)
- **Tình trạng:** ĐẠT TOÀN DIỆN 10/10 TIÊU CHÍ (100% COMPLIANT).
- **Rủi ro còn lại:** Không phát hiện rủi ro về rò rỉ dữ liệu hay vi phạm bí mật thông tin.
- **Xác nhận bởi nhóm:** Nhóm 18 + 19.
