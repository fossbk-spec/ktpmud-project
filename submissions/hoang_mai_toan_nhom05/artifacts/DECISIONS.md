# DECISIONS — nhom05 — Track B

Các ADR ngắn. Trạng thái: **Accepted** = đã làm trong code; **Proposed** = đã chốt, đang triển khai.

## ADR-01 — Tách logic sinh đề/chấm thành module thuần `server/math-logic.js`
- Trạng thái: Accepted (commit `02cee8f`)
- Bối cảnh: `docs/architecture-reference.md` §4 cho biết luồng chấm hiện tại là so sánh chuỗi chính xác
  (`given === correct_answer`), không có khái niệm "gần đúng". Dạng bài ước lượng cần chấm theo khoảng.
- Quyết định: viết module thuần (không phụ thuộc Express/SQLite) gồm `calculate`, `generateMathProblem(rng)`,
  `scoreMathAnswer`. Route trong `server/api.js` chỉ gọi module này.
- Lý do: unit test được độc lập, tất định (inject `rng`), không đụng hành vi 4 `type` câu hỏi hiện có.
- Hệ quả: không tái sử dụng `POST /api/submissions`; cần tự lo phần lưu kết quả (xem ADR-04).

## ADR-02 — Quy tắc chấm ước lượng
- Trạng thái: Accepted ở server và spec v2.0 (17/11); UI đang chuyển sang dùng kết quả chấm của server (Proposed)
- Bối cảnh: đề thi không khoá ngưỡng sai số, nên theo `architecture-reference.md` §7 nhóm phải tự định nghĩa
  rõ ràng, tất định. Hiện có 3 phiên bản lệch nhau: spec (làm tròn từng số hạng, ±10/±50), server
  (làm tròn kết quả đến hàng chục, ±5), UI (lệch ≤ 20%).
- Quyết định: dùng **một** quy tắc duy nhất ở server:
  `expectedEstimate = Math.round(R / 10) * 10` với `R` là kết quả đúng; ước lượng `E` đạt khi
  `|E − expectedEstimate| ≤ 5`. Kết quả chính xác đạt khi `ket_qua_dung === R`.
- Lý do: tất định, dễ giải thích cho học sinh lớp 3 ("làm tròn đến hàng chục"), dễ viết test biên.
- Hệ quả: `docs/ESTIMATION_FEATURE_SPEC.md` đã viết lại thành v2.0; 12 câu synthetic trong `server/fixtures/estimate-fixtures.json` có sẵn mẫu biên +5 (đạt) / +6 (không đạt); UI phải bỏ logic chấm riêng (lệch ≤ 20%).
- Trường hợp đặc biệt: `R < 5` thì ước lượng chuẩn là 0, khoảng đạt 0–5 (đầu vào không âm).

## ADR-03 — Giữ đáp án ở server, client chỉ nhận đề
- Trạng thái: Accepted ở API (commit `d24a19e`); UI đang chuyển sang gọi API (Proposed)
- Quyết định: `GET /api/math/generate` trả `questionId` (UUID) cùng `a, b, operator, prompt`; đáp án lưu ở server
  gắn với `userId`, TTL 30 phút, mỗi đề chấm một lần.
- Lý do: B-04 và NFR-03 — không để lộ đáp án qua DevTools.
- Hệ quả: component `estimate-exact.js` phải bỏ danh sách câu cố định và hàm `answerOf` ở client.

## ADR-04 — Lưu kết quả chấm để không mất khi refresh
- Trạng thái: Proposed
- Bối cảnh: hiện đề chỉ lưu trong `Map` bộ nhớ; restart server mất trạng thái; B-05 yêu cầu lưu kết quả.
- Quyết định dự kiến: ghi kết quả mỗi lần chấm (userId, questionId, a, b, operator, uoc_luong, ket_qua_dung,
  điểm, thời điểm) vào SQLite; trang dạng bài đọc lại lịch sử gần nhất khi tải.
- Câu hỏi mở: thêm bảng mới hay dùng bảng `attempts` hiện có — đã hỏi GV (PROGRESS 1.5 Q1).
- Ràng buộc: không sửa `server/auth.js`, session, tài khoản mẫu (B-07).

## ADR-05 — Test bằng `node --test`, CI GitHub Actions
- Trạng thái: Accepted (commit `df5a25c`, `b71c1f7`, `6e03914`)
- Quyết định: dùng test runner có sẵn của Node 18+ (`"test": "node --test"`), không thêm dependency test.
  CI chạy trên `push` và `pull_request`.
- Hệ quả: CI đã đổi sang `npm ci` (17/11), cài đặt đúng theo `package-lock.json`.
