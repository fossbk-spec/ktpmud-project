# PROGRESS — 28 — Track B

- Starter: ktpmud-bkt-vuontoan-starter · tag bkt-2026-v1
- Fork: <URL fork>

## PC-1 — 11/11/2026

### 1.1. Tiến độ theo acceptance criteria
<!-- Track B: B-01…B-12 theo bảng truy vết trong REQUIREMENTS.md Mục 6. Đối chiếu lại với đề thi Mục 7.3 / 8.3. -->
Tình trạng chung: xong giai đoạn M1 (yêu cầu, ADR, kế hoạch test); giai đoạn M2 (Build) mới bắt đầu, chưa có mã nguồn cho tính năng.

| Mã | Trạng thái (Chưa / Đang / Xong) | Bằng chứng (commit / CI / file) | Ghi chú |
|---|---|---|---|
| B-01 | Chưa | REQUIREMENTS.md FR-7, AC-7; TEST_PLAN.md T-INT-01 | Đã thiết kế; chưa chọn bài học đích khi rà `data/seed.json`; chưa code |
| B-02 | Chưa | REQUIREMENTS.md FR-8, Phụ lục A (12 fixture); T-FIX-01, T-FIX-02 | Đã tính sẵn 12 fixture; chưa đưa vào `data/seed.json` |
| B-03 | Chưa | DECISIONS.md ADR-002, ADR-003; T-UNIT-01…08 | Quy tắc ±20% đã chốt trên giấy; chưa có hàm `computeEstimateBand` |
| B-04 | Chưa | REQUIREMENTS.md FR-4, AC-3; T-API-01, T-API-02 | Cần xác nhận route lấy câu hỏi loại `correct_answer` theo danh sách cột hay sau `SELECT *` |
| B-05 | Chưa | DECISIONS.md ADR-001, ADR-004; T-API-03…05, T-INT-02 | Đã mô tả hệ quả làm mới trang và bỏ trống câu ước lượng; chưa code |
| B-06 | Chưa | DECISIONS.md ADR-005; T-UNIT-09, T-UI-01 | Cần xác nhận cấu trúc `detail` của `POST /api/submissions` |
| B-07 | Chưa | REQUIREMENTS.md NFR-2; T-SEC-01 | Chưa sửa mã nên chưa chạm vùng cấm; sẽ kiểm bằng `git diff --stat` với tag `bkt-2026-v1` |
| B-08 | Chưa | REQUIREMENTS.md FR-9, AC-6; T-UNIT-05…07, T-API-06 | Đã liệt kê đầu vào sai cần xử lý; chưa code |
| B-09 | Chưa | TEST_PLAN.md Mục 1, 2 | Chưa có script `npm test` |
| B-10 | Chưa | TEST_PLAN.md Mục 3 | Chưa có `.github/workflows/ci.yml` |
| B-11 | Chưa | REQUIREMENTS.md NFR-3; T-SEC-02 | Chỉ dùng dữ liệu synthetic; sẽ quét secret/PII ở M3 |
| B-12 | Chưa | REQUIREMENTS.md NFR-4, AC-8; T-UI-02, T-UI-03 | Chưa làm giao diện |

### 1.2. Sửa đổi bắt buộc từ Checkpoint 1
| Mục | Trạng thái | Bằng chứng |
|---|---|---|
| ❗ ADR-004: bổ sung hệ quả với B-05 (làm mới giữa bước 1 và bước 2) và cách chấm khi bỏ trống câu ước lượng nhưng vẫn nộp câu chính xác | Xong | DECISIONS.md ADR-004; ca kiểm thử mới T-API-07, T-UI-04 trong TEST_PLAN.md |
| Nhỏ: README trỏ sai đường dẫn `artifacts/…` | Xong | README.md Mục 6 |

### 1.3. Timeline dự kiến đến khi hoàn thành
| Việc | Vai trò phụ trách | Mốc (CP2 15/11 · M3 · Freeze 19/11 · M4 20/11) | Ngày dự kiến |
|---|---|---|---|
| Đọc mã nguồn, xác nhận 5 điểm ở REQUIREMENTS.md Mục 7, chuyển ADR từ Đề xuất sang Chấp nhận | <vai trò> | CP2 | 12/11 |
| Hàm thuần `computeEstimateBand`, `parseBand`, `isReasonableEstimate`, `classifyFeedback` + unit test | <vai trò> | CP2 | 13/11 |
| Nhánh chấm `estimate` trong `server/api.js`, thêm trường vào `detail`, che đáp án | <vai trò> | CP2 | 14/11 |
| 12 fixture trong `data/seed.json`, gắn vào bài học đích, kiểm tra `reset-db` | <vai trò> | CP2 | 14/11 |
| Giao diện hai bước trong `exercise.js` (bàn phím, `aria-live`) | <vai trò> | CP2 | 15/11 |
| Test API/tích hợp, hồi quy 4 type cũ | <vai trò> | M3 | 16–17/11 |
| `npm test`, workflow CI trên Node 18 và 20 | <vai trò> | M3 | 17/11 |
| Rà bảo mật/quyền riêng tư, `TEST_REPORT.md`, `SECURITY_PRIVACY_CHECKLIST.md`, `AI_USE.md`, `CONTRIBUTIONS.md` | <vai trò> | M3 | 18/11 |
| Slide/demo ≤ 7 phút, đóng băng, gắn tag | <vai trò> | Freeze 19/11 · M4 20/11 | 19–20/11 |

### 1.4. Rủi ro / đang vướng
- Chưa đọc mã nguồn thật; 5 điểm cần xác nhận ở REQUIREMENTS.md Mục 7 có thể làm đổi thiết kế (đặc biệt cấu trúc `detail` và cách tính điểm khi một bộ trộn nhiều type).
- Thứ tự "ước lượng trước" chỉ do giao diện bảo đảm (ADR-004); sẽ ghi rõ giới hạn này trong `TEST_REPORT.md`.
- Thời gian build ngắn (09–15/11) nên ưu tiên vertical slice trước, hoàn thiện sau.
- Chưa biết test tích hợp đăng nhập bằng tài khoản synthetic mà không sửa `auth.js` có khả thi theo cách đã dự kiến không.

### 1.5. Câu hỏi cho GV
- Không có câu hỏi mới ở PC-1.

### 1.6. Phân công (alias hoặc vai trò, KHÔNG ghi họ tên/MSSV)
| Alias / vai trò | Đầu việc chính | Commit/PR tiêu biểu |
|---|---|---|
| <alias/vai trò 1> | | |
| <alias/vai trò 2> | | |
| <alias/vai trò 3> | | |

## PC-2 — 18/11/2026

## 2.1. Đối chiếu timeline PC-1

| Việc (theo bảng 1.3) | Kế hoạch | Thực tế | Lệch & lý do |
|---|---|---|---|
| Đọc mã nguồn, xác nhận 5 điểm ở REQUIREMENTS Mục 7, chuyển ADR từ Đề xuất sang Chấp nhận | 12/11 | 15/11: đã đọc `server/api.js`; xác nhận cấu trúc `detail`, route lấy câu hỏi chọn theo danh sách cột (không có `correct_answer`), cách tính điểm/sao. Còn lại: cách `exercise.js` chọn bộ đề, đăng nhập test | Trễ khoảng 3 ngày; còn 2/5 điểm chưa đóng hết |
| Hàm thuần `computeEstimateBand`, `parseBand`, `isReasonableEstimate`, `classifyFeedback` + unit test | 13/11 | Xong: `server/estimate.js`, `test/estimate.test.js`; `npm test` 12/12 đạt, CI xanh | Không xác định được ngày commit từ log CI (commit có trước CI #1); xem `git log -- server/estimate.js` |
| Nhánh chấm `estimate` trong `server/api.js`, thêm trường vào `detail`, che đáp án | 14/11 | 15–16/11: CI #5 `480a078` (import hàm, 23:47 15/11), CI #6 `73bcd02` (thêm `estimateFeedback`, 00:08 16/11) | Trễ khoảng 1–2 ngày; chưa kiểm bằng `curl` |
| 12 fixture trong `data/seed.json`, gắn vào bài học đích, kiểm tra `reset-db` | 14/11 | 15/11: CI #2 `6a91a61` (script sinh fixture, 22:06), CI #4 `dbdac0c` (question sets, 22:32) | Trễ khoảng 1 ngày; chưa kiểm số lượng và `reset-db` |
| Giao diện hai bước trong `exercise.js` (bàn phím, `aria-live`) | 15/11 | CI #3 `8c44792` (22:07 15/11), CI #7 `ab1bda0` (00:29 16/11), CI #8 `1890660` (00:39 16/11) | Hoàn tất lúc 00:39 ngày 16/11, trễ khoảng 40 phút; chưa thử tay bàn phím/`aria-live` |
| Test API/tích hợp, hồi quy 4 type cũ | 16–17/11 | Chưa thực hiện | Chưa đến hạn |
| `npm test`, workflow CI trên Node 18 và 20 | 17/11 | 15/11: CI #1 `dc72b1e` (22:03); 8/8 lần chạy trên `main` đều xanh | Sớm hơn kế hoạch 2 ngày; cần đối chiếu `ci.yml` có chạy trên cả Node 18 và 20 |
| Rà bảo mật/quyền riêng tư, `TEST_REPORT.md`, `SECURITY_PRIVACY_CHECKLIST.md`, `AI_USE.md`, `CONTRIBUTIONS.md` | 18/11 | Khung các file đã có và đã điền phần có bằng chứng; chưa rà bảo mật | Chưa đến hạn |
| Slide/demo ≤ 7 phút, đóng băng, gắn tag | 19–20/11 | Kịch bản demo đã có; slide và tag chưa làm | Chưa đến hạn |

## 2.2. Tiến độ theo acceptance criteria (cập nhật toàn bộ bảng 1.1)

| Mã | Trạng thái | Bằng chứng | Ghi chú |
|---|---|---|---|
| B-01 | Đang | CI #4 `dbdac0c` (question sets) | Chưa xác nhận bộ estimate xuất hiện trong luồng bài học |
| B-02 | Đang | CI #2 `6a91a61`, CI #4 `dbdac0c` | Chưa kiểm đủ 12 câu và `reset-db` bằng script |
| B-03 | Xong | `server/estimate.js`; `npm test` 12/12 đạt; CI xanh | Quy tắc ±20% đã có test từng giá trị biên và 12 fixture |
| B-04 | Đang | Đã rà mã: route lấy câu hỏi chỉ chọn `id,type,prompt,options_json,points,category` | Chưa có kết quả `curl` / test API |
| B-05 | Đang | CI #5 `480a078`, CI #6 `73bcd02` | Chưa kiểm lưu `attempts`/`progress` và hồi quy bộ cũ |
| B-06 | Đang | CI #6 (`estimateFeedback`), CI #8 (hiển thị phản hồi); T-UNIT-09 đạt | Chưa thử tay 4 thông điệp |
| B-07 | Chưa | — | Chưa chạy `git diff --stat bkt-2026-v1..HEAD` |
| B-08 | Đang | T-UNIT-05…07 đạt (mức hàm) | Chưa có test mức API |
| B-09 | Xong | `npm test`: 12 pass, 0 fail; CI #8 xanh | — |
| B-10 | Xong | `.github/workflows/ci.yml`; CI #1…#8 đều xanh | Cần đối chiếu Node 18 và 20 |
| B-11 | Chưa | — | Chưa quét secret/PII |
| B-12 | Đang | CI #3 `8c44792`, CI #7 `ab1bda0`, CI #8 `1890660` | Chưa thử tay bàn phím, thông báo lỗi, `aria-live` |

## 2.3. Sẵn sàng nộp bài (đề thi Mục 6)

| Deliverable | Có / Chưa | Đường dẫn |
|---|---|---|
| README.md (cài đặt / chạy / test) | Có | `README.md` |
| REQUIREMENTS.md | Có | `artifacts/REQUIREMENTS.md` |
| DECISIONS.md / ADR | Có | `artifacts/DECISIONS.md` |
| Test tự động + CI xanh | Có | `test/`, `.github/workflows/ci.yml`; CI #8 xanh |
| TEST_REPORT.md | Có | `artifacts/TEST_REPORT.md` (đã điền phần unit và CI; các ca API/giao diện cập nhật trước Freeze) |
| SECURITY_PRIVACY_CHECKLIST.md | Chưa | `artifacts/SECURITY_PRIVACY_CHECKLIST.md` (khung, chưa kiểm hết) |
| AI_USE.md | Có | `artifacts/AI_USE.md` (cập nhật tiếp khi có thay đổi) |
| CONTRIBUTIONS.md | Có | `artifacts/CONTRIBUTIONS.md` (theo vai trò, kèm commit) |
| Slide / demo script ≤ 7 phút | Chưa | `slides/DEMO_SCRIPT.md` (có kịch bản, chưa có slide) |
| Draft PR vào `ktpmud-project`, check `validate` xanh | Chưa | Mở trước 11:30 ngày 18/11 |

## 2.4. Việc còn lại đến Freeze (23:59 19/11)

| Việc | Vai trò phụ trách | Hạn |
|---|---|---|
| Thử tay giao diện (T-UI-01…04) và `curl` API (T-API-01…07), ghi kết quả vào TEST_REPORT | QA | 16/11 |
| Test API/tích hợp, hồi quy 4 type cũ; sửa lỗi phát sinh | BE | 17/11 |
| Rà bảo mật/quyền riêng tư (`git diff` vùng cấm, quét secret, dependency) và hoàn tất SECURITY_PRIVACY_CHECKLIST | QA | 18/11 |
| Cập nhật `PROGRESS.md` PC-2, mở Draft PR vào `ktpmud-project`, chờ `validate` xanh, comment issue #18 (9:30–11:30) | Lead | 18/11, trước 11:30 |
| Cập nhật kết quả thật vào TEST_REPORT và AI_USE (CONTRIBUTIONS đã có); làm slide | Docs, Lead | 19/11 |
| Chạy lại `npm ci && npm run reset-db && npm test` từ clean checkout; gắn tag `bkt-2026-28-rc1`, ghi SHA 40 ký tự | Lead | 19/11, trước 23:59 |
| Cập nhật `source-ref.json`, chuyển Draft PR sang Ready for review | Lead | 20/11 |

## 2.5. Rủi ro / câu hỏi cho GV

- Giao diện đã commit nhưng chưa thử tay; nếu lỗi sẽ ảnh hưởng demo. Ưu tiên thử tay ngay.
- Các lần commit hiển thị trên CI đến từ một tài khoản; cần bảo đảm mọi thành viên có đóng góp ghi nhận được (commit/PR/review) và giải thích được phần của mình.
- Chưa xác nhận bộ estimate xuất hiện đúng bài học và luồng học hiện có (B-01).
- Route thống kê giáo viên tính câu `estimate` là sai vì so sánh chuỗi chính xác; không sửa do ngoài phạm vi (ghi trong TEST_REPORT).

## Kết quả cuối — Freeze 19/11/2026
- Tag: bkt-2026-28-rc1 · SHA: 
- Trạng thái cuối từng mã AC: (cập nhật bảng 2.2 hoặc ghi "như 2.2 trừ: …")
- Những việc trong timeline chưa hoàn thành và lý do:
