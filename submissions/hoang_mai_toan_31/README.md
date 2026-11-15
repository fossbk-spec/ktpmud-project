# BKT Vườn Toán — Nhóm 31

## 1. Thông tin dự án

- **Nhóm:** 31
- **Track:** B — Vườn Toán Lớp 3
- **Repository mã nguồn:** https://github.com/tranlam592006-beep/ktpmud-bkt-vuontoan-starter
- **Nhánh phát triển:** `develop`

## 2. Tóm tắt sản phẩm

Phát triển website Vườn Toán Lớp 3 dựa trên starter của cuộc thi Hack Marathon 2026.

Nhóm bổ sung dạng bài tập **ước lượng kết quả phép tính** gồm 12 câu hỏi, tích hợp vào giao diện website.

Mỗi câu hỏi gồm hai giai đoạn:

1. Học sinh nhập kết quả ước lượng trong thời gian giới hạn 15 giây.
2. Học sinh nhập kết quả chính xác để hoàn thành câu hỏi.

Hệ thống chấm đúng khi cả kết quả ước lượng và kết quả chính xác đều đạt yêu cầu. Ngưỡng sai số ước lượng là ±20%.

## 3. Hướng dẫn chạy dự án

Yêu cầu Node.js 22 và npm.

```bash
git clone https://github.com/tranlam592006-beep/ktpmud-bkt-vuontoan-starter.git
cd ktpmud-bkt-vuontoan-starter
git switch develop
npm ci
npm start
```

Mở trình duyệt tại `http://localhost:3000`.

## 4. Kiểm thử và CI

Dự án sử dụng GitHub Actions để kiểm tra quá trình cài đặt dependencies, cú pháp JavaScript và chạy các bài test đã khai báo (nếu có).

Kết quả CI được liên kết trong `source-ref.json`.

## 5. Tài liệu

Các tài liệu mô tả yêu cầu, thiết kế, tiến độ và kiểm thử được lưu trong thư mục `artifacts/`.