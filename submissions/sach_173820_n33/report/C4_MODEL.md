# C4 Model – PinkBook Manager

## Level 1 – System Context

```mermaid
flowchart LR
  Owner[Chủ cửa hàng / Quản lý]
  Staff[Nhân viên]
  Customer[Khách hàng]
  System[PinkBook Manager]
  Owner -->|Quản trị sách, kho, nhân sự, báo cáo| System
  Staff -->|Tra cứu sách, bán hàng, chấm công| System
  Customer -.->|Thông tin thành viên, tích điểm| System
```

PinkBook Manager là hệ thống trung tâm phục vụ hoạt động quản lý cửa hàng. Chủ cửa hàng và nhân viên là hai nhóm người dùng chính; thông tin khách hàng được lưu trong hệ thống để phục vụ giao dịch và chăm sóc thành viên.

## Level 2 – Container

```mermaid
flowchart TB
  User[Trình duyệt người dùng]
  FE[Frontend React + Vite]
  API[Backend Node.js + Express]
  DB[(PGlite / PostgreSQL)]
  User --> FE
  FE -->|HTTP REST /api/*| API
  API -->|SQL / Transaction| DB
```

- **Frontend:** hiển thị giao diện và thu thập thao tác người dùng.
- **Backend:** cung cấp REST API, xác thực, phân quyền và thực thi nghiệp vụ.
- **Database:** lưu tài khoản, sách, thể loại, kho, khách hàng, hóa đơn, lịch làm và nhật ký.

## Level 3 – Component (Backend)

```mermaid
flowchart TB
  Routes[server/app.js - API routes / middleware]
  Security[server/security.js - Authentication / Authorization]
  Service[server/service.js - Business services]
  DBLayer[server/db.js - Data access / transactions]
  Schema[(server/schema.sql - Database schema)]
  Routes --> Security
  Routes --> Service
  Service --> DBLayer
  DBLayer --> Schema
```

## Ghi chú
Sơ đồ được mô tả theo cấu trúc mã nguồn hiện tại. Khi chốt phiên bản triển khai, nhóm cần đối chiếu lại các component và endpoint thực tế, đồng thời có thể xuất sơ đồ thành hình để đưa vào báo cáo PDF.
