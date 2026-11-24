# BKT Vườn Toán

- Nhóm: nhom05 — Track B (`hoang_mai_toan`)
- Fork code: https://github.com/Zeref52/ktpmud-bkt-vuontoan-starter (starter `bkt-2026-v1`, commit `057a482`)
- Tóm tắt sản phẩm: thêm dạng luyện tập **"Ước lượng rồi tính đúng"** cho học sinh lớp 3 vào Vườn Toán.
  Học sinh nhập số ước lượng trước; ô ước lượng bị khoá rồi mới được nhập đáp số chính xác.
  Server sinh đề (`GET /api/math/generate`, không trả đáp án) và chấm hai tiêu chí tách biệt
  — "ước lượng hợp lý" và "kết quả chính xác" — bằng logic tất định trong `server/math-logic.js`
  (`POST /api/math/score`). Không dùng LLM để sinh đáp án, chỉ dùng tài khoản synthetic `hocsinh01…99`.
- Cài đặt, chạy và kiểm thử từ clean checkout (Node.js 18+):

  ```bash
  git clone https://github.com/Zeref52/ktpmud-bkt-vuontoan-starter.git
  cd ktpmud-bkt-vuontoan-starter
  npm ci
  npm run reset-db
  npm start            # mở http://localhost:3000, đăng nhập hocsinh01 / 123456
  npm test             # chạy toàn bộ test trong tests/ bằng node --test
  ```

  Trang dạng bài: `http://localhost:3000/estimate-exact.html`.
- Tiến độ: `progress/PROGRESS.md` trên fork code.
- Slide/demo: `slides/` (bổ sung trước Freeze 19/11).

> Trạng thái hiện tại (Draft PR, PC-2): các giá trị `final_commit` và `ci_run_url` trong
> `source-ref.json` sẽ được cập nhật sang commit/CI run cuối khi Freeze; `release_tag`
> `bkt-2026-nhom05-rc1` được tạo lúc Freeze 19/11.
