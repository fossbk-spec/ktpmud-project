# BÁO CÁO KIỂM THỬ — TEST_REPORT

**Đề tài:** Vườn Toán Lớp 3: "Ước lượng trước khi tính đúng"
**Nhóm thực hiện:** Nhóm 28

Trạng thái tại Checkpoint 2 (cập nhật 16/11/2026). Chỉ ghi "Đạt" cho ca đã chạy thật; ca chưa chạy ghi "Chưa chạy" và sẽ cập nhật trước Freeze (19/11).

## 1. Môi trường

| Mục | Giá trị |
|---|---|
| Hệ điều hành / máy | Môi trường phát triển cục bộ (Node.js runtime) |
| Node.js (cục bộ) | v18.x / v20.x |
| Node.js (CI) | Theo `.github/workflows/ci.yml` (phiên bản 18 và 20) |
| Commit kiểm thử | `a8e45c2` (CI #12, nhánh `main`); SHA đầy đủ: `a8e45c28a3ef0c2a38923422472db6c62e993c0b` |
| Lệnh | `npm ci` → `npm run reset-db` → `npm test` |
| CI run | CI #12, xanh, ~21 giây; URL: `https://github.com/nmhoaaa066/ktpmud-bkt-vuontoan-starter/actions/runs/43835667202` |

## 2. Tóm tắt kết quả

| Tầng | Số ca | Đạt | Không đạt | Chưa chạy |
|---|---|---|---|---|
| Unit (`test/estimate.test.js`) | 12 | 12 | 0 | 0 |
| API / tích hợp (T-API, T-INT, T-FIX) | 11 | 0 | 0 | 11 |
| Thủ công (T-SEC, T-UI) | 6 | 0 | 0 | 6 |

Ghi chú: nhóm đã chạy `npm test` cục bộ: 12 test, 12 đạt, 0 lỗi, 0 bỏ qua. CI trên nhánh `main`: các lần chạy đều xanh, mới nhất là CI #12 ở commit `a8e45c2`.

## 3. Chi tiết theo ca (đối chiếu TEST_PLAN.md)

| ID | Nội dung | Kết quả | Bằng chứng |
|---|---|---|---|
| T-UNIT-01…09 | Dải, biên, đầu vào sai, tất định, 4 tổ hợp phản hồi | Đạt (cục bộ) | `npm test`: 12 pass, 0 fail (9 ca T-UNIT và 3 ca bổ sung: biên số học, mọi đáp án 0..2000, `exactOf`); CI #12 xanh |
| T-API-01, 02 | API lấy câu hỏi không lộ đáp án/dải | Chưa chạy | Đã rà mã: route chỉ chọn các cột `id,type,prompt,options_json,points,category`, không có `correct_answer`; chưa có kết quả `curl` |
| T-API-03, 04 | Nộp đúng toàn bộ / estimate đúng, exact sai | Chưa chạy | — |
| T-API-05 | Hồi quy bộ `phieu-bai-9-10` | Chưa chạy | — |
| T-API-06, 07 | Đầu vào lạ; bỏ trống câu ước lượng | Chưa chạy | Ở mức hàm: T-UNIT-05…07 đạt |
| T-INT-01, 02 | Bộ estimate trong luồng học; kết quả còn sau khi khởi động lại | Chưa chạy | — |
| T-FIX-01, 02 | `reset-db` tái lập; ≥ 12 câu estimate | Chưa chạy | Fixture đã được commit; chưa kiểm số lượng và `reset-db` |
| T-SEC-01, 02 | Không sửa vùng cấm; không secret/PII | Chưa chạy | Kiểm tra thông tin bảo mật dự án |
| T-UI-01…04 | 4 thông điệp; bàn phím; thông báo lỗi; làm mới giữa hai bước | Chưa chạy | Giao diện đã được commit; chưa thử tay |

## 4. Giới hạn đã biết

1. Thứ tự "ước lượng trước" do giao diện bảo đảm; server nhận một lượt nộp nên không ép được thứ tự (DECISIONS ADR-004). Nộp trực tiếp qua API khi bỏ trống câu ước lượng thì câu đó bị chấm sai (đã có trong thiết kế; kiểm bằng T-API-07).
2. Dải ±20% khá rộng nên một số ước lượng lệch vẫn được xem là hợp lý; nhập đúng đáp án chính xác vào ô ước lượng cũng hợp lý (ADR-003).
3. Làm mới trang giữa hai bước thì mục đó quay về bước 1, không có bản ghi `attempts` nửa chừng.
4. Sau khi nộp, `detail` trả `correctAnswer` của câu `estimate` là chuỗi dải (ví dụ `231-345`); chấp nhận được vì đã nộp bài.
5. Route thống kê giáo viên `/api/teacher/analytics` so sánh chuỗi chính xác, nên các câu `estimate` bị tính là sai trong mục "dạng hay sai nhất". Không sửa vì thuộc nhóm route `/api/teacher/*` ngoài phạm vi (B-07).
6. Tại Checkpoint 2, các ca API, tích hợp, bảo mật và giao diện chưa chạy; kết quả sẽ được cập nhật trước Freeze.
