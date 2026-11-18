# DANH MỤC KIỂM TRA BẢO MẬT VÀ QUYỀN RIÊNG TƯ (SECURITY & PRIVACY CHECKLIST)
- **Nhóm thực hiện:** Nhóm 56 (`nhom56` — Track B)

## 1. Bảo mật dữ liệu và Quyền riêng tư học sinh (B-11)
- [x] **Không chứa dữ liệu định danh cá nhân (No PII):** Toàn bộ tài khoản học sinh trong CSDL (`hocsinh01` đến `hocsinh99`) và tài liệu báo cáo chỉ sử dụng tài khoản giả lập (synthetic) và mã định danh (alias `N56-Member-01..03`). Không thu thập tên thật, ngày sinh, trường lớp thật hay số điện thoại của trẻ em.
- [x] **Không lộ khóa bí mật (No Secrets in Repo):** Không có API key, token, mật khẩu thật hay file `.env` chứa thông tin nhạy cảm nào được commit lên Git.

## 2. Chống gian lận và Bảo vệ ranh giới miền bài toán (B-04, B-05)
- [x] **Chống lộ đáp án trước khi nộp (B-04):**
  - Khi gửi đề bài xuống Client hoặc khi trả kết quả tại `POST /api/estimate-check`, Server đã lọc bỏ hoàn toàn các trường nhạy cảm (`E_min`, `E_max`, `E_center`, `answer`, `thuong`, `so_du`).
  - Học sinh mở trình duyệt DevTools (F12 -> Network) không thể biết được khoảng ước lượng hay đáp án đúng.
- [x] **Chấm điểm và cưỡng bức máy trạng thái tại Server (B-05):**
  - Toàn bộ logic tính điểm và chuyển trạng thái (`ESTIMATING` -> `CALCULATING` -> `COMPLETED`) nằm tại Backend và lưu trực tiếp vào SQLite.
  - Chặn đứng hành vi gọi API nộp kết quả tính chính xác khi chưa hoàn thành bước ước lượng (`400 Bad Request`).
  - Giới hạn cứng tối đa 2 lần thử ước lượng (`so_lan_thu_uoc_luong <= 2`) tại CSDL để chống tấn công vét cạn (brute-force) dò khoảng chấp nhận.

## 3. An toàn mã nguồn và Tương thích hệ thống (B-07)
- [x] **Giữ nguyên cơ chế xác thực gốc (B-07):** Tuyệt đối không chỉnh sửa `server/auth.js`, cấu hình session hay luồng đăng nhập sẵn có của hệ thống.
- [x] **Chống SQL Injection & Dữ liệu đầu vào bất hợp lệ (B-08, B-12):** Mọi truy vấn SQLite đều sử dụng Parameterized Queries (`?`); dữ liệu đầu vào (`uoc_luong`, `thuong`, `so_du`) được ép kiểu và kiểm tra số nguyên hợp lệ ở cả Client và Server.
