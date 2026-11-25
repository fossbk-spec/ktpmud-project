# KIỂM TRA BẢO MẬT VÀ QUYỀN RIÊNG TƯ — SECURITY_PRIVACY_CHECKLIST

**Đề tài:** Vườn Toán Lớp 3: "Ước lượng trước khi tính đúng"
**Nhóm thực hiện:** Nhóm 28

Trạng thái tại Checkpoint 2 (cập nhật 16/11/2026). "Đạt" chỉ ghi khi có bằng chứng (rà mã, kết quả test hoặc lệnh); mục chưa có bằng chứng ghi "Chưa kiểm" và sẽ hoàn tất trước Freeze (19/11).

## 1. Phạm vi và tài sản cần bảo vệ

Phạm vi thay đổi của nhóm: hàm thuần `server/estimate.js`, nhánh chấm `estimate` trong route `POST /api/submissions` (`server/api.js`), giao diện hai bước (`estimate-step.js`, `exercise.html`, `exercise.js`), dữ liệu `data/seed.json`, test, CI. Không đụng `server/auth.js`, session, tài khoản mẫu, deployment, route `/api/auth|teacher|admin/*` (B-07).

| Tài sản | Vì sao cần bảo vệ |
|---|---|
| Đáp án đúng và dải chấp nhận của câu `estimate` | Lộ đáp án trước khi nộp làm mất ý nghĩa bài luyện (B-04) |
| Kết quả và tiến độ học sinh (`attempts`, `progress`, sao) | Chỉ ghi qua server sau khi chấm (B-05) |
| Tài khoản synthetic và mật khẩu mẫu | Không dùng dữ liệu thật, không deploy thật (B-11) |
| Mã nguồn, lịch sử Git, nhật ký AI | Không chứa secret/PII |

## 2. Rủi ro chính và biện pháp

| # | Rủi ro | Biện pháp trong thiết kế/mã | Bằng chứng | Mức còn lại |
|---|---|---|---|---|
| R1 | Lộ đáp án/dải qua API lấy câu hỏi | Dải lưu trong `correct_answer`; route chỉ chọn cột `id,type,prompt,options_json,points,category` | Rà `server/api.js`, route `GET /question-sets/:setId/questions` | Thấp (cần xác nhận bằng test T-API-01, T-API-02) |
| R2 | Học sinh bỏ qua bước ước lượng bằng cách gọi API trực tiếp | Server chấm câu `estimate` độc lập; bỏ trống/sai bị chấm sai, không né được điểm ước lượng | ADR-004, hàm `isReasonableEstimate` (T-UNIT-05…07 đạt) | Trung bình: thứ tự "ước lượng trước" chỉ do giao diện giữ (đã nêu trong giới hạn) |
| R3 | Đầu vào độc hại/bất thường ở ô ước lượng | `parseEstimateInput` chỉ nhận số nguyên không âm tối đa 9 chữ số; còn lại chấm sai, không ném lỗi | `server/estimate.js`; T-UNIT-05…07 đạt (12/12) | Thấp ở mức hàm; xem R6 cho mức route |
| R4 | SQL injection | Mã mới không thêm truy vấn; route dùng câu lệnh có tham số `?` | Rà `server/api.js` | Thấp |
| R5 | XSS từ nội dung câu hỏi/phản hồi | `estimate-step.js` dựng giao diện bằng `textContent`, không dùng `innerHTML` | Rà `public/assets/js/pages/estimate-step.js` | Thấp cho phần nhóm viết; cần rà phần tích hợp trong `exercise.js` |
| R6 | Lỗi 5xx do thân yêu cầu bất thường (ví dụ `answers` là `null`) | Mã gốc chỉ có giá trị mặc định cho `answers` khi thiếu (undefined); `answers: null` có thể gây lỗi khi truy cập `answers[q.id]` | Rà `server/api.js` (route `POST /submissions`) | Trung bình: cần thử bằng T-API-06 và cân nhắc thêm kiểm tra kiểu cho `answers` |
| R7 | Lộ secret/PII trong repo hoặc nhật ký | Chỉ dùng tài khoản/dữ liệu synthetic; không `.env` trong repo; log AI không chứa secret | Cần quét bằng `node tools/collect-evidence.js` (mục 7) | Chưa kiểm |
| R8 | Chuỗi cung ứng (dependency mới, CI) | Mã mới không dùng thư viện ngoài (`node:test`, `assert`); CI chỉ chạy `npm ci` và `npm test`, không dùng secret | `server/estimate.js`, `.github/workflows/ci.yml` (mẫu của nhóm) | Cần đối chiếu `package.json` và `ci.yml` thật |
| R9 | Sửa nhầm vùng cấm (xác thực, session, deploy) | Phạm vi sửa giới hạn như Mục 1; kiểm bằng `git diff` so với tag `bkt-2026-v1` | Chưa chạy | Chưa kiểm |
| R10 | Thống kê giáo viên tính sai câu `estimate` | Không sửa vì thuộc `/api/teacher/*` ngoài phạm vi; ghi vào giới hạn đã biết | TEST_REPORT.md Mục 4 | Chấp nhận, ảnh hưởng độ chính xác báo cáo chứ không ảnh hưởng bảo mật |

## 3. Quyền riêng tư

- **Dữ liệu cá nhân:** nhóm không thu thập thêm dữ liệu cá nhân. Fixture mới chỉ gồm phép tính, đáp án và dải (sinh bằng `tools/gen-estimate-seed.js`).
- **Dữ liệu học sinh:** kết quả làm bài vẫn lưu bằng cơ chế sẵn có (`attempts`, `answers_json`, `progress`); không thêm bảng, không thêm trường định danh.
- **Tài khoản:** chỉ dùng tài khoản synthetic của starter (`hocsinh01…`, `giaovien01`). Mật khẩu mẫu `123456` chỉ phục vụ test/demo, README đã ghi rõ không dùng khi triển khai thật.
- **Nhật ký sử dụng AI (`AI_USE.md`):** không chứa secret hay dữ liệu cá nhân.

## 4. Checklist

| # | Hạng mục | Cách kiểm | Trạng thái | Bằng chứng |
|---|---|---|---|---|
| 1 | Không commit secret/token/cookie/`.env` | `node tools/collect-evidence.js` (mục 7) hoặc `gitleaks` | Chưa kiểm | — |
| 2 | Chỉ dùng dữ liệu và tài khoản synthetic | Rà `data/seed.json`, fixture mới | Chưa kiểm | Fixture mới do script sinh, chỉ gồm phép tính và đáp án |
| 3 | Không dùng dữ liệu thật, không kết nối production | Rà cấu hình, README | Chưa kiểm | — |
| 4 | Không sửa `server/auth.js`, session, tài khoản mẫu, deployment, route `/api/auth|teacher|admin/*` (B-07) | `git diff --stat bkt-2026-v1..HEAD` | Chưa kiểm | Phạm vi dự kiến ở Mục 1 |
| 5 | API lấy câu hỏi không lộ đáp án/dải (B-04) | Rà mã; test T-API-01, T-API-02 | Đạt (rà mã) | Route chỉ chọn các cột `id,type,prompt,options_json,points,category`; kết quả `curl` sẽ bổ sung |
| 6 | Đầu vào người dùng được kiểm tra, không gây lỗi 5xx (B-08) | T-UNIT-05…07, T-API-06 | Đạt một phần | Mức hàm đạt (12/12 test); mức route chưa chạy (xem R6) |
| 7 | Không có lời gọi LLM/dịch vụ ngoài lúc chạy trong mã mới | `git grep -nEi "openai|anthropic|llm|fetch\(" -- server/estimate.js` | Đạt cho `server/estimate.js` | Hàm thuần, không gọi dịch vụ ngoài; `api.js` chỉ gọi hàm này |
| 8 | Không thêm dependency mới, hoặc có license tương thích và được khai báo | So `package.json` với bản gốc (`collect-evidence.js` mục 4) | Chưa kiểm | Mã mới dùng `node:test` và `assert` có sẵn |
| 9 | CI không dùng secret | Xem `.github/workflows/ci.yml` | Chưa kiểm | CI #1…#8 xanh; cần đối chiếu nội dung file |
| 10 | `AI_USE.md` và log không chứa secret/PII | Đọc lại trước khi nộp | Chưa kiểm | — |
| 11 | Mật khẩu mẫu chỉ cho tài khoản synthetic, không dùng khi triển khai thật | README ghi rõ; nhóm không deploy | Đạt | README, mục tài khoản mẫu |
| 12 | Giao diện dùng được bằng bàn phím, lỗi báo rõ (B-12) | T-UI-02, T-UI-03 | Chưa kiểm | Giao diện đã commit (CI #3, #7, #8); chưa thử tay |
| 13 | Giao diện không dùng `innerHTML` với dữ liệu người dùng | Rà `estimate-step.js` và phần tích hợp `exercise.js` | Đạt một phần | `estimate-step.js` dùng `textContent`; chưa rà `exercise.js` |

## 5. Khuyến nghị trước Freeze

1. Chạy `node tools/collect-evidence.js` và điền kết quả cho mục 1, 4, 8, 9.
2. Thử `curl` gửi `answers: null`, `answers: "abc"`, thiếu `setId` vào `POST /api/submissions` (T-API-06). Nếu có lỗi 5xx, thêm kiểm tra kiểu ngay đầu route, ví dụ trả 400 khi `answers` không phải đối tượng; đây là thay đổi nhỏ nằm trong route `/submissions` thuộc phạm vi của nhóm.
3. Rà `exercise.js` xem có chỗ nào gán dữ liệu người dùng bằng `innerHTML` không.
4. Cập nhật cột "Trạng thái" và "Bằng chứng" theo kết quả thật, rồi viết kết luận cuối.

## 6. Kết luận (Checkpoint 2)

Tại Checkpoint 2, phần mã do nhóm viết không gọi dịch vụ ngoài, không thêm dependency, không thêm truy vấn SQL mới và không lộ đáp án ở API lấy câu hỏi (theo rà mã). Còn các mục chưa có bằng chứng chạy: quét secret, đối chiếu vùng cấm bằng `git diff`, kiểm tra tay giao diện và thử đầu vào bất thường ở mức route. Các mục này sẽ hoàn tất và ghi kết quả thật trước Freeze (19/11).
