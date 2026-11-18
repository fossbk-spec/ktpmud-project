# DANH MỤC KIỂM TRA BẢO MẬT & QUYỀN RIÊNG TƯ (SECURITY & PRIVACY CHECKLIST) — NHÓM 62

* **Mã nhóm:** Nhóm 62 (`Nhom_62`)
* **Track:** Track A — Dr May Day: Rule Engine Sprint
* **Repository:** `https://github.com/thaihop06/ktpmud-bkt-ruleengine-starter`
* **Phạm vi áp dụng:** Module `rule_engine/classifier.py`, bộ kiểm thử `tests/test_classifier.py`, dữ liệu mẫu và toàn bộ tài liệu kho lưu trữ.

---

## 1. Kiểm soát Dữ liệu Định danh Cá nhân (Zero PII & Whitelist Sanitization)

- [x] **Lọc trắng đầu vào (Whitelist Sanitization):** Hàm `classify()` chỉ trích xuất đúng 9 trường lâm sàng hợp lệ (`tuoi`, `huyet_ap_tam_thu`, `huyet_ap_tam_thu_nen`, và 6 cờ triệu chứng boolean); mọi trường lạ mang thông tin định danh cá nhân (`ho_ten`, `cccd`, `so_dien_thoai`, `dia_chi`, `email`) đều bị loại bỏ ngay từ bước đầu.
- [x] **Tuân thủ nguyên tắc "Không hạ mức" (No-Downgrade Policy):** Khi dữ liệu đầu vào chứa kèm trường PII lạ nhưng các trường lâm sàng đã thỏa quy tắc phản vệ, hệ thống vẫn giữ nguyên mức phân loại `PHAN_VE` / `SOC_PHAN_VE` thay vì từ chối sai lệch (đã kiểm chứng tại `TC11`, `TC52` và ghi nhận trong `docs/adr/ADR-001-rule-based-engine.md`).
- [x] **Không lưu trữ dữ liệu bệnh nhân thật:** 100% bộ dữ liệu kiểm thử (`tests/test_classifier.py`) và kịch bản trình diễn (`demo.py`) đều sử dụng dữ liệu giả lập (synthetic), không chứa hồ sơ y tế thực tế.

## 2. An toàn Đầu ra & Giới hạn Phạm vi Y khoa

- [x] **Chống rò rỉ chỉ số thô qua thông báo giải thích (`ly_do`):** Chuỗi `ly_do` sử dụng mẫu câu chuẩn hóa từ `REASON_MESSAGES`, tuyệt đối không chèn giá trị số đo thô (`tuoi`, `huyet_ap_tam_thu`, `huyet_ap_tam_thu_nen`) hay trường PII vào kết quả trả về (kiểm chứng tại `TC49`, `TC52`).
- [x] **Không đưa ra khuyến nghị điều trị / kê đơn:** Nội dung `ly_do` chỉ nêu tiêu chí kích hoạt quy tắc phân loại, không chứa từ khóa can thiệp y khoa hoặc liều lượng thuốc (`adrenalin`, `epinephrine`, `tiêm`, `mg`, `ml`) (kiểm chứng tại `TC50`).
- [x] **Tuyên bố miễn trừ trách nhiệm rõ ràng:** File `README.md` ghi rõ cảnh báo `educational/synthetic — not for clinical use` (kiểm chứng tại `TC63`).

## 3. Nhật ký Kiểm toán Tối thiểu (Minimal Audit Trail)

- [x] **Giới hạn đúng 4 trường chuẩn:** Mỗi bản ghi kiểm toán chỉ lưu cấu trúc `[Timestamp, User_UUID, Action_Type, Status]`, không lưu kèm payload đầu vào hay kết quả chỉ số lâm sàng (kiểm chứng tại `TC56`, `TC57`, `TC58`).
- [x] **Kiểm soát định dạng `User_UUID`:** Tham số `user_uuid` được kiểm tra tính hợp lệ theo chuẩn `uuid.UUID`; nếu không truyền hoặc truyền sai định dạng sẽ tự động gán về UUID hệ thống mặc định (`DEFAULT_OPERATOR_UUID`) để tránh lỗi thực thi hoặc chèn chuỗi độc hại.
- [x] **Ghi nhận đầy đủ trạng thái ngoại lệ:** Mọi lượt gọi đầu vào không hợp lệ đều được ghi nhận trạng thái `INVALID_INPUT` phục vụ truy vết vận hành (kiểm chứng tại `TC02`, `TC59`).

## 4. Kiểm tra Biên Đầu vào & Chống Lỗi Thực thi

- [x] **Kiểm tra chặt chẽ kiểu dữ liệu (Strict Type Checking):** Từ chối các giá trị dễ gây nhầm lẫn kiểu trong Python như `bool` (`True`/`False`) truyền vào trường số (`tuoi`, `huyet_ap_tam_thu`) hoặc chuỗi/số (`"true"`, `1`, `0`) truyền vào trường boolean (`TC05`, `TC07`, `TC08`).
- [x] **Chống tràn số & giá trị đặc biệt (`NaN`, `Inf`, `OverflowError`):** Chỉ gọi `math.isnan()` / `math.isinf()` sau khi xác nhận `isinstance(tuoi, float)`, ngăn chặn hoàn toàn lỗi `OverflowError` khi nhận số nguyên cực lớn như `10**400` (`TC10`).
- [x] **Bảo toàn tính bất biến đầu vào (Immutability):** Hàm `classify()` không làm thay đổi (mutate) dictionary dữ liệu gốc của bên gọi sau khi thực thi (`TC53`).

## 5. An toàn Kho lưu trữ & Quản lý Bí mật (Repository Security)

- [x] **Không chứa Secret / Credential:** Kho lưu trữ không lưu khóa API, mật khẩu, token cá nhân hay biến môi trường nhạy cảm (`TC64`).
- [x] **Ẩn danh hóa thông tin thành viên:** Toàn bộ tài liệu, commit và bình luận nộp bài chỉ sử dụng GitHub alias (`thaihop06`, `huyvanle04112006`), không ghi họ tên thật hay MSSV theo quy định bảo mật của môn học.