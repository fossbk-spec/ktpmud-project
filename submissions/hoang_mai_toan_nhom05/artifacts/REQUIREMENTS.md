# REQUIREMENTS — nhom05 — Track B: "Ước lượng trước khi tính đúng"

Nguồn đối chiếu: đề thi chính thức Hack Marathon 2026 (Mục 8) và `docs/architecture-reference.md`
trong starter `bkt-2026-v1`. Đặc tả chi tiết của nhóm: `docs/ESTIMATION_FEATURE_SPEC.md` trên fork code.

## 1. Phạm vi
- Thêm **một** dạng luyện tập mới trên các phép tính lớp 3 đã có: học sinh đưa ra số ước lượng
  trước, sau đó mới nhập kết quả chính xác.
- Đáp án và kết quả đúng/sai do code tất định ở server quyết định; không dùng LLM.
- Không viết lại hệ thống; không sửa `server/auth.js`, session, tài khoản mẫu, deployment.

Ngoài phạm vi (đề thi 8.4): nội dung SGK mới, thay auth, kết nối production, dữ liệu thật, LLM sinh
đáp án runtime, deploy public.

## 2. Người dùng và luồng chính
- Tác nhân: học sinh lớp 3 (tài khoản synthetic `hocsinh01…99`).
- Luồng:
  1. Từ trang Đấu Trường Trò Chơi / luồng học, học sinh mở dạng bài "Ước lượng rồi tính đúng".
  2. Client gọi `GET /api/math/generate` → nhận `questionId`, `a`, `b`, `operator`, `prompt` (không có đáp án).
  3. Học sinh nhập số ước lượng → bấm xác nhận → ô ước lượng bị khoá.
  4. Học sinh nhập kết quả chính xác → client gửi `POST /api/math/score` với `questionId`, `uoc_luong`, `ket_qua_dung`.
  5. Server chấm, trả phản hồi tách hai phần: ước lượng (đạt/chưa đạt) và tính đúng (đúng/chưa đúng), kèm điểm.

## 3. Yêu cầu chức năng
| ID | Yêu cầu |
|---|---|
| FR-01 | Server sinh đề với toán hạng nguyên dương; phép trừ có kết quả dương; phép chia luôn chia hết |
| FR-02 | API sinh đề không trả `expectedResult` / `expectedEstimate` |
| FR-03 | Server chấm ước lượng và kết quả chính xác bằng hàm thuần `scoreMathAnswer` |
| FR-04 | Mỗi đề chỉ được chấm một lần, chỉ bởi tài khoản đã nhận đề |
| FR-05 | Đầu vào không phải số nguyên không âm bị từ chối với HTTP 400 và thông báo dễ hiểu |
| FR-06 | Kết quả chấm được lưu ở server và xem lại được sau khi refresh |

## 4. Acceptance criteria (đề thi 8.3) và cách nghiệm thu
| ID | Tiêu chí | Cách kiểm chứng |
|---|---|---|
| B-01 | Dạng bài mới truy cập được từ luồng học hiện có | Từ `game.html` có link mở `estimate-exact.html`; kiểm tra thủ công + ảnh chụp trong TEST_REPORT |
| B-02 | ≥ 12 fixture/câu hỏi synthetic tái lập được | `server/fixtures/estimate-fixtures.json` (12 câu EST-01…12) + `generateMathProblem(rng)` với seed; test đếm ≥ 12 và chạy 36 mẫu chấm |
| B-03 | Quy tắc tạo và chấm ước lượng rõ, tất định, test được | Quy tắc ghi trong DECISIONS.md (ADR-02); unit test trong `tests/math-logic.test.js` |
| B-04 | API không trả đáp án trước khi nộp | Test response `GET /api/math/generate` không có trường đáp án |
| B-05 | Server chấm và lưu kết quả; refresh không mất trạng thái | Test/thủ công: chấm → refresh → kết quả vẫn hiển thị |
| B-06 | Feedback phân biệt "ước lượng hợp lý" và "kết quả chính xác" | Test `danh_gia` trả hai phần độc lập; UI hiển thị hai dòng |
| B-07 | Không sửa auth/session/tài khoản mẫu/deployment | `git diff bkt-2026-v1 -- server/auth.js data/seed.json Dockerfile DEPLOY.md` rỗng |
| B-08 | Test tự động cho normal, boundary, invalid, scoring | `npm test`; danh sách test trong TEST_REPORT.md |
| B-09 | Có `npm test`, đạt từ clean checkout | `npm ci && npm test` trên clone mới |
| B-10 | CI chạy `npm ci` và `npm test` trên Pull Request | `.github/workflows/ci.yml`, link run trong `source-ref.json` |
| B-11 | Không PII/secret; chỉ alias/tài khoản synthetic | SECURITY_PRIVACY_CHECKLIST.md |
| B-12 | Dùng được bằng bàn phím, thông báo lỗi dễ hiểu | `docs/MANUAL_TEST_CHECKLIST.md` MT-11…MT-13 |

## 5. Yêu cầu phi chức năng
- NFR-01: Sinh đề và chấm điểm phản hồi ≤ 300 ms trên máy dev.
- NFR-02: Chữ ≥ 20px, nút ≥ 44×44px, có `:focus-visible`.
- NFR-03: Không đưa đáp án hoặc dung sai xuống client trước khi nộp.

## 6. Trạng thái
Trạng thái chi tiết từng AC xem `progress/PROGRESS.md` trên fork code (bảng 1.1, cập nhật ở 2.2).
