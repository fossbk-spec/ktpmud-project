# SECURITY & PRIVACY CHECKLIST — Zero PII Compliance

> Nhóm: 11 · Track A: Dr May Day Rule Engine Sprint
> Tiêu chuẩn đối chiếu: Mục 5.2 của đề thi Hackathon BKT-1 (Track A)

---

## 1. Nguyên tắc Zero PII (Personally Identifiable Information)

| Hạng mục kiểm tra | Trạng thái | Bằng chứng kiểm chứng |
|---|---|---|
| **Không nhận trường định danh** | **TUÂN THỦ** | Hàm `classify()` chỉ xử lý đúng 9 trường lâm sàng giả lập theo Data Dictionary trong `docs/decision-table.md`. Các trường lạ (như họ tên, CCCD, SĐT, địa chỉ) bị bỏ qua hoàn toàn (được kiểm chứng qua test `test_ac22_pii_field_ignored`). |
| **Không lưu trữ PII vào Log / Audit** | **TUÂN THỦ** | Hàm `classify_with_audit()` chỉ lưu 4 trường kỹ thuật: `Timestamp, User_UUID, Action_Type, Status`. Tuyệt đối không ghi nhận dữ liệu lâm sàng hay kết quả chẩn đoán vào log (kiểm chứng qua test `test_ac25_audit_zero_pii`). |
| **Bảo mật mã định danh User_UUID** | **TUÂN THỦ** | `User_UUID` được xác thực nghiêm ngặt theo chuẩn RFC 4122. Nếu không hợp lệ sẽ ném `ValueError` ngay và không sinh bản ghi log nào (kiểm chứng qua test `test_ac45_audit_uuid_validation`). |

---

## 2. Kiểm tra mã nguồn và kho lưu trữ (Repo Hygiene)

| Hạng mục kiểm tra | Trạng thái | Bằng chứng kiểm chứng |
|---|---|---|
| **Không có API Key / Secrets** | **ĐẠT** | Không sử dụng hay commit bất kỳ API token, mật khẩu hay chứng thực bí mật nào trong repo. |
| **Không có file môi trường `.env`** | **ĐẠT** | Đã được khai báo trong `.gitignore`, không có file cấu hình nhạy cảm được commit. |
| **Không có dữ liệu bệnh nhân thật** | **ĐẠT** | 100% dữ liệu thử nghiệm trong unit test và benchmark là dữ liệu tổng hợp (Synthetic Data). |
| **Không có PII của thành viên nhóm** | **ĐẠT** | Tài liệu `PROGRESS.md` và mã nguồn chỉ sử dụng mã nhóm (`Nhóm 11`), alias hoặc vai trò (`Thành viên 1/2/3`), không lộ họ tên, CCCD hay số điện thoại. |

---

## 3. Kết luận
Dự án tuân thủ đầy đủ và nghiêm ngặt mọi tiêu chí về an toàn thông tin và bảo vệ quyền riêng tư theo yêu cầu của hội đồng chấm thi.
