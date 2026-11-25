# Vườn Toán Lớp 3 — Dạng bài "Ước lượng trước khi tính đúng"

**Nhóm thực hiện:** Nhóm 28 — KTPMUD Hack Marathon 2026, Track B (`hoang_mai_toan`)

> Sản phẩm phục vụ học tập, mở rộng từ starter `ktpmud-bkt-vuontoan-starter` (tag `bkt-2026-v1`). Toàn bộ dữ liệu và tài khoản là synthetic; không kết nối ứng dụng hay CSDL thật.

## 1. Giới thiệu

Nhóm bổ sung vào Vườn Toán Lớp 3 một dạng luyện tập mới: học sinh **ước lượng kết quả phép nhân/chia trước**, rồi mới tính chính xác. Server chấm tất định (không dùng LLM), phân biệt "ước lượng hợp lý" với "kết quả chính xác" và lưu kết quả bằng cơ chế sẵn có (`attempts`, `progress`).

- **Hai bước trong một mục.** Câu `estimate` (id `est-NN`) rồi câu `input` sẵn có (id `est-NN-exact`); giao diện chỉ mở bước 2 sau khi bước 1 hợp lệ. Cả hai được chấm trong một lượt `POST /api/submissions`.
- **Quy tắc chấm.** Với đáp án chính xác `E`, ước lượng `x` hợp lý khi `ceil(E × 0,8) ≤ x ≤ floor(E × 1,2)` (±20%, tính bằng số nguyên). Ví dụ `48 × 6 = 288` → dải 231–345; `50 × 6 = 300` là hợp lý.
- **Mã hoá.** Dải lưu trong `correct_answer` của câu `estimate` dạng `"lo-hi"`, không đổi schema; API lấy câu hỏi không trả đáp án hay dải.
- **Phản hồi bốn tổ hợp** (ước lượng hợp lý hay không × chính xác đúng hay sai), do server phân loại.
- **Fixture.** 12 câu synthetic (8 nhân, 4 chia) sinh bằng `tools/gen-estimate-seed.js`.

## 2. Cách chạy

Yêu cầu: **Node.js 18+**.

```bash
npm ci
npm run reset-db     # tạo lại data/vuon-toan.db từ data/seed.json (gồm fixture estimate)
npm start            # mở http://localhost:3000
npm test             # chạy test tự động (node --test)
```

CI (`.github/workflows/ci.yml`) chạy `npm ci` và `npm test` trên Node 18 và 20 cho mỗi Pull Request.

### Tài khoản mẫu (synthetic)

| Vai trò | Tên đăng nhập | Mật khẩu | Ghi chú |
|---|---|---|---|
| Học sinh | `hocsinh01` … `hocsinh99` | `123456` | 99 tài khoản giả lập lớp 3A2, dùng cho test/demo |
| Giáo viên | `giaovien01` | `123456` | Vào Góc Giáo Viên |

## 3. Phạm vi thay đổi so với starter

- **Thêm/sửa:** `server/estimate.js` (logic thuần), nhánh chấm `estimate` trong `server/api.js`, giao diện hai bước (`public/assets/js/pages/estimate-step.js` và `exercise.js`), `data/seed.json` (fixture), `test/`, `tools/gen-estimate-seed.js`, `.github/workflows/ci.yml`.
- **Không đổi:** `server/auth.js`, session, tài khoản mẫu, deployment, các route `/api/auth|teacher|admin/*`, hành vi của 4 type hiện có (`multiple-choice`, `input`, `compare`, `paint`).

## 4. Cấu trúc thư mục (phần liên quan)

```
├─ public/
│  └─ assets/js/pages/   exercise.js (sửa), estimate-step.js (mới)
├─ server/
│  ├─ index.js           Điểm vào: API /api/* + phục vụ giao diện
│  ├─ db.js              Tạo bảng + nạp dữ liệu mẫu vào SQLite
│  ├─ auth.js            Đăng nhập (không sửa)
│  ├─ api.js             API (sửa nhánh chấm estimate)
│  └─ estimate.js        Logic ước lượng (mới)
├─ data/seed.json        Dữ liệu gốc + fixture estimate
├─ test/                 Test tự động
├─ tools/                gen-estimate-seed.js (sinh fixture)
└─ artifacts/            REQUIREMENTS.md, DECISIONS.md, TEST_PLAN.md, AI_USE.md, ...
```

## 5. API liên quan

| Method | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/api/lessons`, `/api/me/progress` | Bài học kèm tiến độ |
| GET | `/api/question-sets/:id/questions` | Câu hỏi — **không kèm đáp án** (kể cả dải của câu `estimate`) |
| POST | `/api/submissions` | Nộp bài; server chấm, lưu điểm, cộng sao; trả thêm `estimateFeedback` cho câu `estimate` |

## 6. Tài liệu

| Tài liệu | Nội dung |
|---|---|
## Danh mục tài liệu

| Tài liệu | Nội dung |
|---|---|
| [`artifacts/REQUIREMENTS.md`](./artifacts/REQUIREMENTS.md) | Yêu cầu, tiêu chí chấp nhận, truy vết B-01…B-12, fixture |
| [`artifacts/DECISIONS.md`](./artifacts/DECISIONS.md) | 5 quyết định thiết kế (ADR) |
| [`artifacts/TEST_REPORT.md`](./artifacts/TEST_REPORT.md) | Báo cáo kết quả kiểm thử (PC-2) |
| [`artifacts/SECURITY_PRIVACY_CHECKLIST.md`](./artifacts/SECURITY_PRIVACY_CHECKLIST.md) | Danh mục kiểm tra bảo mật và quyền riêng tư |
| [`artifacts/AI_USE.md`](./artifacts/AI_USE.md) | Nhật ký sử dụng AI |
| [`artifacts/CONTRIBUTIONS.md`](./artifacts/CONTRIBUTIONS.md) | Báo cáo đóng góp của các thành viên |

## 7. Giới hạn đã biết

Thứ tự "ước lượng trước" do giao diện đảm bảo; server nhận một lượt nộp nên không tự ép được thứ tự (xem ADR-004). Không có bước nào lưu giữa chừng: làm mới trang giữa hai bước thì mục đó quay về bước 1.
