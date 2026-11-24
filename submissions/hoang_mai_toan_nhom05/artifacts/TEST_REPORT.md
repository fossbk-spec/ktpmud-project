# TEST REPORT — nhom05 — Track B

## 1. Môi trường
| Mục | Giá trị |
|---|---|
| Commit kiểm thử | `6e03914` trên `main` của fork code (sẽ cập nhật theo commit Freeze) |
| Node.js | 18 (CI GitHub Actions, `ubuntu-latest`); 22 (chạy lại cục bộ 16/11/2026) |
| Test runner | `node --test` (built-in), không thêm dependency |
| Lệnh | `npm ci && npm test` từ clean clone |
| CI run | https://github.com/Zeref52/ktpmud-bkt-vuontoan-starter/actions/runs/43052984615 — success |

## 2. Kết quả
| Chỉ tiêu | Kết quả |
|---|---|
| Tổng test | 11 |
| Passed | 11 |
| Failed | 0 |
| Thời gian | ~0,15 s |

Hai run CI trước (`43051530014`, `42819983516`) **fail** do `tests/estimation.test.js` dùng cú pháp không phải
`node:test`; đã sửa ở commit `6e03914`, run `43052984615` xanh.

## 3. Danh sách test
### `tests/math-logic.test.js` (test code thật trong `server/math-logic.js`)
| ID | Nhóm | Nội dung | Kết quả |
|---|---|---|---|
| UT-01 | normal | `calculate` cộng/trừ/nhân/chia đúng | Pass |
| UT-02 | invalid | Chia cho 0 bị từ chối | Pass |
| UT-03 | invalid | Phép trừ cho kết quả 0 hoặc âm bị từ chối | Pass |
| UT-04 | invalid | Phép chia có dư bị từ chối | Pass |
| UT-05 | normal | Generator sinh 1.000 đề với `rng` cố định: toán hạng/kết quả nguyên dương, chia hết | Pass |
| UT-06 | scoring | Ước lượng trong sai số + đáp án đúng → 2/2 điểm, `danh_gia` đúng | Pass |
| UT-07 | scoring | Ước lượng sai + đáp án sai → 0 điểm | Pass |
| UT-08 | invalid | `uoc_luong` âm, thập phân, thiếu `ket_qua_dung` → bị từ chối | Pass |

### `tests/estimation.test.js`
| ID | Nội dung | Kết quả | Ghi chú |
|---|---|---|---|
| ET-01..03 | Kiểm tra hàm `checkEstimationLogic` định nghĩa ngay trong file test | Pass | **Không test code sản phẩm**; sẽ thay bằng test biên cho `scoreMathAnswer` |

## 4. Độ phủ theo acceptance criteria
| AC | Đã có test | Còn thiếu |
|---|---|---|
| B-03 | UT-06, UT-07 | Test biên `|E − round10(R)|` = 5 (đạt) và = 6 (không đạt) |
| B-04 | — | Test response `GET /api/math/generate` không chứa đáp án |
| B-05 | — | Test lưu và đọc lại kết quả |
| B-06 | UT-06, UT-07 | Trường hợp lệch: ước lượng đạt nhưng tính sai và ngược lại |
| B-08 | normal, invalid, scoring | boundary, API |

## 5. Kiểm thử thủ công
Checklist 15 mục `MT-01…MT-15` trong `docs/MANUAL_TEST_CHECKLIST.md` của fork code; kết quả và ảnh chụp sẽ bổ sung ở commit Freeze.

## 6. Giới hạn
- Chưa có test tích hợp cho route `/api/math/*` (cần đăng nhập session).
- Chưa kiểm thử UI tự động; luồng bàn phím (B-12) mới kiểm tra thủ công một phần.
- Báo cáo này phản ánh trạng thái ngày 16/11/2026 và sẽ được cập nhật ở commit Freeze.
