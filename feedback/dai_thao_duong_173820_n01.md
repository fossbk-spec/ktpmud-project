# Góp ý — 173820_n01 (CS-5: Đái tháo đường type 2)

- **Bài nộp:** báo cáo quá trình tuần 6 + slide — **chưa mở PR**
- **Ngày góp ý:** 21/10/2026
- **Kết quả kiểm tra tự động:** ✅ thư mục bài nộp giảng viên chuẩn bị sẵn đã qua `scripts/validate_submission.py`

## Đề tài đã được duyệt

Đề "Hỗ trợ người chăm sóc theo dõi điều trị ngoại trú đái tháo đường type 2" đã được thêm vào
[ngân hàng case study](https://fossbk-spec.github.io/ktpmud-book/do_an_mon_hoc) là **CS-5**, slug
`dai_thao_duong`. Trang chi tiết của CS-5 trỏ tới thư mục bài nộp của nhóm, nên link chỉ mở được
sau khi PR của nhóm được merge.

## Cách nộp

Làm theo từng bước tại [HUONG_DAN_NOP_BAI.md](../HUONG_DAN_NOP_BAI.md) (ví dụ trong hướng dẫn
chính là nhóm N01):

1. Đại diện nhóm fork `fossbk-spec/ktpmud-project`, tạo nhánh `submit/dai_thao_duong-173820_n01`.
2. Đưa thư mục `submissions/dai_thao_duong_173820_n01/` giảng viên gửi kèm vào fork. Thư mục đã có:
   - `submission.json` — CS-5, mã nhóm `173820_n01`, MSSV 202413994, 202414357, 202414408
   - `README.md` — tóm tắt nội dung tuần 6
   - `report/BaoCao_Tuan6.docx`, `slides/Slide_Tuan6.pptx`
   - `src/` — để trống
3. Mở Pull Request vào `main`. Bot bình luận ✅/❌ trong khoảng 1 phút; nếu ❌ thì sửa và push lên
   **cùng nhánh**, không mở PR mới.

## Cần cập nhật

1. **Kiểm tra `submission.json`** — đúng MSSV, đủ thành viên.
2. **Chốt ngôn ngữ/framework backend.** Bảng C2 trong báo cáo ghi "ngôn ngữ cần chốt"; ghi rõ lựa
   chọn và lý do trong báo cáo tuần sau.
3. **Mã nguồn và cách chạy lại.** Từ Sprint tuần 8, đưa mã nguồn vào `src/` và điền mục "Cách chạy
   lại" trong `README.md` (cài đặt, lệnh chạy, nạp dữ liệu synthetic mẫu).
4. **Các tuần sau nộp bằng PR mới**, thêm file mới (vd `report/BaoCao_Tuan8.docx`). Bài đã merge
   không sửa được qua PR thường.
5. **Quy tắc file:** tên không dấu, không khoảng trắng, không họ tên; mỗi file < 10MB; không commit
   khoá API, token, `.env`.
