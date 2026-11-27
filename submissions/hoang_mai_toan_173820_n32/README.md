# BKT Vườn Toán

- Nhóm: 173820_n32 · Track B
- Tóm tắt sản phẩm: Thêm dạng bài "Ước lượng trước khi tính đúng" vào Vườn Toán Lớp 3. Học sinh nhập và chốt một ước lượng cho phép nhân/chia, sau đó mới tính kết quả đúng. Server chấm cả hai bước bằng code tất định: ước lượng hợp lý khi nằm trong ±20% đáp án, tính bằng số nguyên. Phản hồi phân biệt 4 trường hợp. Có 12 câu synthetic gắn vào Bài 10.
- Mã nguồn: https://github.com/thangduongworkemail-bot/ktpmud-bkt-vuontoan-starter. Commit được chấm ghi ở `final_commit` trong `source-ref.json`; sau Freeze là tag `bkt-2026-173820_n32-rc1`.
- Cài đặt, chạy và kiểm thử từ clean checkout (Node.js 18–22):
  ```bash
  git clone https://github.com/thangduongworkemail-bot/ktpmud-bkt-vuontoan-starter.git
  cd ktpmud-bkt-vuontoan-starter
  git checkout <final_commit trong source-ref.json>
  npm ci
  npm test            # 34 test tự động (node:test), dùng CSDL tạm
  npm run reset-db    # tạo lại CSDL từ data/seed.json
  npm start           # http://localhost:3000, đăng nhập hocsinh01 / 123456
  ```
  Đường vào dạng bài mới: Trang chủ → thẻ Bài 10 → "Phiếu luyện tập: Ước lượng trước khi tính đúng". Bài 10 chỉ mở khi đã xong Bài 9; trong dữ liệu mẫu chỉ `hocsinh01` đã xong.
- Tài liệu: `artifacts/` (REQUIREMENTS, DECISIONS, TEST_REPORT, SECURITY_PRIVACY_CHECKLIST, AI_USE, CONTRIBUTIONS).
- Slide/demo: `slides/`
