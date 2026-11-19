# Cơ sở dữ liệu

Hai bộ SQL trong thư mục này phục vụ hai giai đoạn khác nhau. Không chạy chung vào một cơ sở dữ liệu.

| Vị trí | Mục đích | Cách dùng |
|---|---|---|
| [`mvp/`](mvp/) | Thiết kế dữ liệu MVP cho nhóm chức năng 1, 2, 6 | Tạo **CSDL PostgreSQL mới** từ `mvp/schema.sql`, sau đó nạp `mvp/seed-form-v1.sql`. Tài liệu, ERD và từ điển ở [thiết kế dữ liệu](../docs/thiet-ke-du-lieu.md). |
| [`schema.sql`](schema.sql), [`seed.sql`](seed.sql) | Bộ SQL của bản bàn giao tuần 3 | Vẫn được `compose.yaml` và `tests/test_gateway.py` dùng. Gateway tuần 3 hiện lưu dữ liệu trong RAM. |

Các tệp kiểm thử MVP nằm trong [`mvp/tests/`](mvp/tests/). Hướng dẫn và kết quả kiểm thử đã thực hiện nằm trong [tài liệu kiểm thử nội bộ](../docs/internal/kiem-thu-co-so-du-lieu-MVP.md). Bộ SQL MVP tạo cơ sở dữ liệu mới, **chưa có migration** để chuyển dữ liệu từ bản demo hoặc bộ SQL tuần 3.
