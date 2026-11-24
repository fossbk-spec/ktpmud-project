# TEST_REPORT — Vườn Toán Lớp 3

## 1. Phạm vi và môi trường

Báo cáo ghi nhận kết quả CI đã chạy trên fork mã nguồn:
- Repository: https://github.com/daohailinh10-code/ktpmud-bkt-vuontoan-starter
- Branch: `submit/hoang_mai_toan-173820_33`
- Commit được kiểm tra: `be5da68e3e6d4d776aa96a30cf6bfe6ee1675df5`
- Workflow: `tests`
- CI run: https://github.com/daohailinh10-code/ktpmud-bkt-vuontoan-starter/actions/runs/44049080430
- Môi trường CI: Ubuntu 26.04, Node.js 20.20.2, npm 10.8.2.

## 2. Lệnh đã chạy

Workflow thực hiện thành công:
1. `npm ci`
2. `npm test` (chạy `node --test`).

## 3. Kết quả

**Kết quả: 5 passed, 0 failed.**

| Nhóm kiểm thử | Kết quả |
|---|---|
| 12 fixture và khoảng sai số 10% | PASS |
| Kiểm tra hai cận và giá trị ngoài khoảng của F01 | PASS |
| Chấm điểm 50/50 với đủ bốn tổ hợp | PASS |
| Từ chối dữ liệu thiếu, sai kiểu hoặc âm | PASS |
| Phân tích JSON đáp án gồm lower, upper, exact | PASS |

## 4. Giới hạn của kết quả

Kết quả trên chứng minh bộ kiểm thử tự động hiện có chạy thành công tại commit nêu trên. Kết quả này **không tự chứng minh** toàn bộ kiểm thử tích hợp frontend/API/database, kiểm thử trình duyệt, kiểm thử hồi quy đầy đủ bốn loại câu hỏi cũ hoặc kiểm thử bảo mật đã hoàn tất. Các mục đó cần được kiểm thử riêng trước khi ghi nhận hoàn thành.

## 5. Kết luận

CI run nêu trên hoàn tất thành công; `npm ci` và `npm test` đều có trạng thái thành công, với 5 test pass và 0 test fail. Nếu mã nguồn thay đổi sau commit này, cần chạy lại CI và cập nhật SHA/link kết quả tương ứng.
