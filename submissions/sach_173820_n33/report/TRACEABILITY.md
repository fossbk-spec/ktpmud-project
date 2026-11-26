# Ma trận truy vết yêu cầu – PinkBook Manager

| Mã yêu cầu | Phân hệ | Thành phần mã nguồn chính | Kiểm thử tham chiếu |
|---|---|---|---|
| FR-01 Đăng nhập/đăng xuất | Xác thực | `frontend/src/app.jsx`, `server/app.js`, `server/security.js` | TC-01, TC-02 |
| FR-02 Phân quyền | Tài khoản | `server/security.js`, `server/service.js` | TC-03 |
| FR-03 Quản lý sách | Danh mục sách | `frontend/src/book_workspace.jsx`, `server/service.js` | TC-04, TC-05 |
| FR-04 Quản lý thể loại | Danh mục | `frontend/src/book_workspace.jsx`, `server/service.js` | TC-05 |
| FR-05 Quản lý giá | Giá bán | `frontend/src/book_workspace.jsx`, `server/service.js` | TC-03 |
| FR-06 Quản lý kho | Kho sách | `server/service.js`, `server/schema.sql` | TC-06, TC-08 |
| FR-07 Bán hàng | POS | `frontend/src/sales_workspace.jsx`, `server/service.js` | TC-06, TC-07 |
| FR-08 Quản lý khách hàng | Khách hàng | `frontend/src/quan_li_khach_hang.jsx`, `server/service.js` | TC-09 |
| FR-09 Tích điểm | Khách thành viên | `frontend/src/sales_workspace.jsx`, `server/service.js` | TC-07 |
| FR-10 Quản lý nhân viên | Nhân sự | `frontend/src/app.jsx`, `frontend/src/staff_workspace.jsx`, `server/service.js` | Kiểm thử phân quyền và tài khoản |
| FR-11 Chấm công | Lịch làm | `frontend/src/staff_workspace.jsx`, `server/service.js` | Kiểm thử xếp ca/ghi giờ |
| FR-12 Thống kê | Báo cáo | `frontend/src/thong_ke.jsx` | TC-10 |
| FR-13 Audit/backup | Dữ liệu | `server/service.js`, `server/backup.js`, `scripts/backup.js`, `scripts/restore.js` | Kiểm thử audit và backup/restore |

## Cách sử dụng ma trận
- Mỗi yêu cầu chức năng cần được đối chiếu với ít nhất một component/API và một ca kiểm thử.
- Những ca kiểm thử chưa có mã hoặc chưa có log cần được nhóm bổ sung trước nghiệm thu.
- Khi mã nguồn thay đổi, cập nhật lại ma trận để bảo đảm yêu cầu, mã nguồn và kiểm thử không bị lệch nhau.
