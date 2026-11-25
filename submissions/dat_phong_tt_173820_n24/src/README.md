# Hệ thống đặt phòng trực tuyến – bộ code khởi đầu (Django)

## Chạy lần đầu (Windows, PowerShell, đã bật venv)
```
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```
Mở http://127.0.0.1:8000

## Trang chính
| Địa chỉ | Dành cho | Chức năng |
|---|---|---|
| / | Khách | Danh sách cơ sở |
| /h/hoa-sua/ | Khách | Trang cơ sở (link đặt phòng), tìm phòng trống |
| /h/hoa-sua/availability/ | Khách | Kết quả phòng trống (hiện "đang giữ chỗ") |
| /bookings/lookup/ | Khách | Tra cứu đơn bằng mã và số điện thoại |
| /accounts/login/ | Nhân viên | Đăng nhập (letan / letan12345) |
| /manage/bookings/ | Nhân viên | Danh sách đơn, xác nhận thanh toán, check-in/out |
| /admin/ | Quản trị | Khai báo cơ sở, loại phòng, phòng (admin / admin12345) |

## Bản đồ thư mục
- config/: cấu hình dự án (settings.py, urls.py)
- hotels/: Cơ sở, Loại phòng, Phòng (models.py), trang chủ và trang cơ sở
- bookings/: Khách, Đơn, Phòng của đơn; services.py chứa logic tìm phòng trống, giữ chỗ 15 phút
- payments/: Thanh toán (khách báo đã trả, lễ tân xác nhận)
- templates/: giao diện HTML (Bootstrap 5); static/css/custom.css: đổi màu sắc

## Còn thiếu so với báo cáo (làm ở các bước sau)
- Chuyển sang PostgreSQL và thêm ExclusionConstraint chống đặt trùng ở tầng cơ sở dữ liệu.
- Phân quyền theo vai trò và theo cơ sở (hiện chỉ có nhân viên is_staff, thấy mọi cơ sở).
- Hóa đơn PDF, email, báo cáo, giá theo mùa, trang đăng ký cho chủ cơ sở.
- Chạy `python manage.py expire_holds` mỗi phút để giải phóng đơn hết hạn (khi triển khai thật).
