# CHECKLIST BẢO MẬT VÀ QUYỀN RIÊNG TƯ

- [x] **Không có Secret / API Key bị lộ:** Mã nguồn không chứa chuỗi mật khẩu, private key hay access token nào.
- [x] **Dữ liệu giả lập (Synthetic Data):** Toàn bộ tài khoản học sinh sử dụng tài khoản mẫu trong `data/` (`hocsinh01`, `hocsinh02`...), không sử dụng thông tin thật của trẻ em.
- [x] **Chống gian lận Client:** Không lưu trữ đáp số và ngưỡng dung sai trong mã nguồn JavaScript phía trình duyệt; toàn bộ việc xác thực kết quả thực hiện tại Server.
- [x] **Input Sanitization:** Dữ liệu học sinh gửi lên qua API được ép kiểu số (`Number.parseInt()`) để chống tấn công Injection.