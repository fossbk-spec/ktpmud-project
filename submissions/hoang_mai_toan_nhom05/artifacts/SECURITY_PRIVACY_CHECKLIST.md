# CHECKLIST BẢO MẬT VÀ QUYỀN RIÊNG TƯ — nhom05 — Track B

Trạng thái tại commit `6e03914` + commit PC-1 (16/11/2026). `[x]` = đã đạt, `[ ]` = chưa đạt / đang làm.

- [x] **Không có secret / API key bị lộ:** repo không chứa mật khẩu thật, private key, access token hay file `.env`.
- [x] **Dữ liệu synthetic:** chỉ dùng tài khoản mẫu `hocsinh01…hocsinh99` có sẵn trong starter; không dùng dữ liệu học sinh/giáo viên thật.
- [x] **Không sửa auth/session/tài khoản mẫu/deployment (B-07):** `git diff bkt-2026-v1 -- server/auth.js data/seed.json Dockerfile DEPLOY.md` rỗng; route mới đều dùng `requireAuth` có sẵn.
- [x] **API sinh đề không trả đáp án:** `GET /api/math/generate` chỉ trả `questionId, a, b, operator, prompt`; đáp án giữ ở server, gắn `userId`, TTL 30 phút, chấm một lần.
- [x] **Kiểm tra đầu vào ở server:** `uoc_luong`, `ket_qua_dung` phải là số nguyên an toàn không âm (`Number.isSafeInteger`); sai kiểu trả HTTP 400 kèm thông báo.
- [ ] **Không tính đáp án ở client:** component `estimate-exact.js` hiện vẫn có danh sách câu cố định và tự tính đáp án (`answerOf`) → đang chuyển sang gọi `/api/math/*` (DECISIONS ADR-03).
- [ ] **Không có PII trong repo:** `docs/AI_USAGE.md` từng ghi họ tên thành viên (commit `b71c1f7`); bản hiện tại đã thay bằng alias, lịch sử commit cũ vẫn còn (đã hỏi GV cách xử lý, không force-push).
- [x] **Không log dữ liệu cá nhân:** route mới không ghi log nội dung bài làm hay thông tin tài khoản.
- [x] **Không dùng LLM ở runtime:** đáp án và chấm điểm hoàn toàn bằng code tất định.
