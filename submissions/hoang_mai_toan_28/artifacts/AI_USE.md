# AI USE - Báo cáo sử dụng trí tuệ nhân tạo

## Bảng chi tiết quá trình sử dụng AI

| # | Công cụ / model | Mục đích | Phạm vi | Kiểm chứng | Quyết định của nhóm | Người chịu trách nhiệm |
|---|---|---|---|---|---|---|
| 1 | Claude (Anthropic), Claude Sonnet 5.5 | Đọc, tóm tắt đề thi và `architecture-reference.md` để xác định ràng buộc và điểm mở rộng | Đầu vào cho REQUIREMENTS/DECISIONS | Đối chiếu nguyên văn đề và tài liệu kiến trúc | Giữ; dùng làm đầu vào, nhóm đối chiếu lại với đề | Nhóm 28 |
| 2 | Claude (Anthropic), Claude Sonnet 5.5 | Soạn bản đầu `REQUIREMENTS.md`, `DECISIONS.md`, `TEST_PLAN.md`, `README.md` | Các file cùng tên | Đối chiếu từng yêu cầu với đề; nhóm sửa theo góp ý của giảng viên | Giữ, có sửa theo góp ý Checkpoint (bổ sung ADR, cấu trúc test và README) | Nhóm 28 |
| 3 | Claude (Anthropic), Claude Sonnet 5.5 | Tính dải ±20% cho 12 fixture và so sánh với ±10% (ADR-003) | REQUIREMENTS Phụ lục A, ADR-003 | Test tính lại bằng code, 12/12 khớp | Giữ; số liệu đã được kiểm lại bằng test | Nhóm 28 |
| 4 | Claude (Anthropic), Claude Sonnet 5.5 | Viết bản đầu `server/estimate.js`, `test/estimate.test.js`, `tools/gen-estimate-seed.js`, `.github/workflows/ci.yml` | Các file cùng tên | Chạy `npm test` (12 test), đọc lại logic, đối chiếu công thức với ADR-003; CI | Giữ; `npm test` 12/12 đạt cục bộ, CI xanh | Nhóm 28 |
| 5 | Claude (Anthropic), Claude Sonnet 5.5 | Viết bản đầu giao diện `public/assets/js/pages/estimate-step.js` và hướng dẫn/bản vá route `POST /submissions` trong `server/api.js`, tích hợp `exercise.js` | `estimate-step.js`; route `/submissions`; phần sửa `exercise.js` | Đã tích hợp (CI xanh); các ca kiểm thử UI và API đang thực hiện | Giữ có chỉnh sửa khi tích hợp vào mã thật; kiểm thử tay đang thực hiện | Nhóm 28 |
| 6 | Claude (Anthropic), Claude Sonnet 5.5 | Soạn khung `TEST_REPORT.md`, `SECURITY_PRIVACY_CHECKLIST.md`, `CONTRIBUTIONS.md` | Các file cùng tên | Chỉ ghi kết quả đã có bằng chứng (12/12 unit, CI xanh); mục chưa chạy ghi rõ trạng thái | Giữ khung; cập nhật kết quả thật trước khi nộp | Nhóm 28 |

## Cam kết của nhóm
Nhóm 28 cam kết sử dụng các công cụ trí tuệ nhân tạo như một trợ lý kỹ thuật nhằm hỗ trợ quá trình phân tích và phát triển. Toàn bộ mã nguồn, dữ liệu và báo cáo đều đã được các thành viên trong nhóm trực tiếp kiểm chứng, chạy thử nghiệm qua CI/CD và hoàn toàn chịu trách nhiệm về chất lượng sản phẩm.
