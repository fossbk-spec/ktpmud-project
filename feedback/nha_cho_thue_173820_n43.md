# Góp ý — 173820_n43 (CS-6: Quản lý nhà cho thuê)

- **Bài nộp:** báo cáo quá trình tuần 6 + slide — **chưa mở PR**
- **Ngày góp ý:** 21/10/2026
- **Kết quả kiểm tra tự động:** ✅ thư mục bài nộp giảng viên chuẩn bị sẵn đã qua `scripts/validate_submission.py`

## Đề tài đã được duyệt

Đề "Xây dựng phần mềm quản lý nhà cho thuê" đã được thêm vào
[ngân hàng case study](https://fossbk-spec.github.io/ktpmud-book/do_an_mon_hoc) là **CS-6**, slug
`nha_cho_thue` (đề ngoài y tế). Trang chi tiết của CS-6 trỏ tới thư mục bài nộp của nhóm, nên link
chỉ mở được sau khi PR của nhóm được merge.

## Cách nộp

Làm theo từng bước tại [HUONG_DAN_NOP_BAI.md](../HUONG_DAN_NOP_BAI.md), thay ví dụ N01 bằng thông
tin của nhóm:

1. Đại diện nhóm fork `fossbk-spec/ktpmud-project`, tạo nhánh `submit/nha_cho_thue-173820_n43`.
2. Đưa thư mục `submissions/nha_cho_thue_173820_n43/` giảng viên gửi kèm vào fork. Thư mục đã có:
   - `submission.json` — CS-6, mã nhóm `173820_n43`, MSSV 202414266, 202414351
   - `README.md` — tóm tắt nội dung tuần 6, phạm vi chức năng
   - `report/BaoCao_Tuan6.docx`, `slides/Slide_Tuan6.pptx`
   - `src/` — để trống
3. Mở Pull Request vào `main`. Bot bình luận ✅/❌ trong khoảng 1 phút; nếu ❌ thì sửa và push lên
   **cùng nhánh**, không mở PR mới.

## Cần cập nhật

1. **Chương 2 (công nghệ, cơ sở lý thuyết) còn trống**, và mục 1.7 để trống Frontend / Backend /
   Database. Chốt công nghệ, ghi lựa chọn và lý do.
2. **Bổ sung đặc tả theo chuẩn môn học** (xem [chương 2 của sách](https://fossbk-spec.github.io/ktpmud-book/ch02_yeu_cau_thiet_ke_c4)):
   user story + tiêu chí nghiệm thu, ma trận truy vết yêu cầu (RTM), kiến trúc C4 (ít nhất C1–C2),
   thiết kế dữ liệu (ERD).
3. **Trang bìa** còn ghi "9/2026"; cập nhật mục lục (*Update Field*) sau khi bổ sung nội dung.
4. **Dữ liệu người thuê:** hệ thống lưu họ tên, số điện thoại người thuê — khi demo và kiểm thử chỉ
   dùng dữ liệu giả lập, không dùng thông tin người thuê thật của nhà cho thuê đã khảo sát.
5. **Mã nguồn và cách chạy lại:** khi bắt đầu xây dựng, đưa mã nguồn vào `src/` và điền mục "Cách
   chạy lại" trong `README.md`.
6. **Các tuần sau nộp bằng PR mới**, thêm file mới (vd `report/BaoCao_Tuan8.docx`). Bài đã merge
   không sửa được qua PR thường. Tên file không dấu, không khoảng trắng, không họ tên; mỗi file
   < 10MB.
