# CONTRIBUTIONS.md — Đóng góp của nhóm 29

**Dự án:** BKT Vườn Toán Lớp 3 — Track B (`hoang_mai_toan`)  
**Nhóm:** 29 (`nhom29`)  
**Ngày tổng hợp:** 17/11/2026  
**Mã nguồn:** https://github.com/TRuong-c/ktpmud-bkt-vuontoan-starter  
**Nhánh phát triển:** `track-b-main`

## 1. Danh sách thành viên

Các mã sinh viên dưới đây được ghi theo `submission.json` nhóm đã soạn; thứ tự không hàm ý vai trò hay tỷ lệ đóng góp.

| STT | MSSV | Vai trò/công việc cá nhân có thể kết luận từ bằng chứng hiện có |
|---:|---|---|
| 1 | `202414422` | Chưa có bằng chứng nối MSSV với một tài khoản GitHub hoặc commit cụ thể. |
| 2 | `202414241` | Chưa có bằng chứng nối MSSV với một tài khoản GitHub hoặc commit cụ thể. |
| 3 | `202414434` | Chưa có bằng chứng nối MSSV với một tài khoản GitHub hoặc commit cụ thể. |

**Nguyên tắc ghi nhận:** Không tự suy ra người viết code, tester hoặc reviewer từ thứ tự MSSV; không gán phần trăm đóng góp khi chưa có bằng chứng. Việc một người push/merge hộ không đồng nghĩa người đó là tác giả của toàn bộ thay đổi.

## 2. Công việc đã thực hiện và bằng chứng truy vết

| Hạng mục | Kết quả hoặc hoạt động có bằng chứng | Minh chứng |
|---|---|---|
| Phân tích yêu cầu và thiết kế | Repository nhóm có `REQUIREMENTS.md`, `DECISIONS.md`, `TEST_PLAN.md`; cập nhật nhiều tài liệu trong giai đoạn M1–M2. | [Cây mã nguồn `track-b-main`](https://github.com/TRuong-c/ktpmud-bkt-vuontoan-starter/tree/track-b-main), [lịch sử commit](https://github.com/TRuong-c/ktpmud-bkt-vuontoan-starter/commits/track-b-main) |
| Phát triển tính năng | Commit mang mô tả *Add estimate exercises and teacher management*, do tài khoản `totienmanh456-cmd` đẩy lên ở lịch sử CI; tích hợp luồng bài tập ước lượng. Không suy diễn tác giả của mọi dòng code. | [Commit `d893023`](https://github.com/TRuong-c/ktpmud-bkt-vuontoan-starter/commit/d893023), [CI](https://github.com/TRuong-c/ktpmud-bkt-vuontoan-starter/actions) |
| Tích hợp nhánh | Có merge vào `track-b-main` được ghi nhận trong danh sách GitHub Actions ngày 16/11, bởi `totienmanh456-cmd`. | [Commit `522bb7d`](https://github.com/TRuong-c/ktpmud-bkt-vuontoan-starter/commit/522bb7d), [CI](https://github.com/TRuong-c/ktpmud-bkt-vuontoan-starter/actions) |
| Ghi chép và báo cáo | Các commit cập nhật `TEST_REPORT.md` và tạo `AI_USE.md` hiển thị trên CI ngày 15/11, do tài khoản `TRuong-c` đẩy lên. | [Commit `3240c89`](https://github.com/TRuong-c/ktpmud-bkt-vuontoan-starter/commit/3240c89), [commit `0306a96`](https://github.com/TRuong-c/ktpmud-bkt-vuontoan-starter/commit/0306a96) |
| Kiểm thử tự động local | 15/11/2026: đã chạy `npm.cmd ci` và `npm.cmd test` trên Windows/Node v22.23.4; **31 passed, 0 failed, 0 skipped** trong 6,02 giây. | `artifacts/TEST_REPORT.md`; ảnh Terminal đã được cung cấp trong quá trình chuẩn bị hồ sơ |
| Tích hợp liên tục (CI) | Trang Actions của nhánh `track-b-main` trong ảnh ngày 17/11 hiển thị **6/6 workflow runs thành công**, mới nhất là commit `522bb7d` ngày 16/11. Chưa khẳng định một lượt CI riêng gắn với từng MSSV. | [GitHub Actions](https://github.com/TRuong-c/ktpmud-bkt-vuontoan-starter/actions) |
| Khởi động ứng dụng | Trưởng nhóm xác nhận ứng dụng web khởi động và sử dụng được trên máy local. Chưa có bảng kiểm thủ công chi tiết của mọi thao tác/role. | Thông tin nhóm cung cấp trong quá trình chuẩn bị CP2; xem giới hạn tại `artifacts/TEST_REPORT.md` |

## 3. Phân chia trách nhiệm theo hoạt động (không gán nhầm danh tính)

Trong quá trình triển khai, nhóm thực hiện các **mảng việc** sau:

1. **Yêu cầu / nghiệp vụ / thiết kế:** rà soát phạm vi nhân–chia và dạng bài ước lượng; duy trì `REQUIREMENTS.md`, `DECISIONS.md` và `TEST_PLAN.md`.
2. **Lập trình / tích hợp:** phát triển luồng ước lượng, API, lưu SQLite, giao diện và bảo toàn chức năng cũ; các commit mã nguồn có thể kiểm tra trong repository.
3. **Kiểm thử / tài liệu / bàn giao:** chạy bộ test, quan sát CI, sửa `TEST_REPORT.md`, `AI_USE.md` và lập hồ sơ nộp tại `ktpmud-project`.

**Giới hạn truy vết cá nhân:** Đã xác minh các tài khoản GitHub `TRuong-c` và `totienmanh456-cmd` xuất hiện trong lịch sử CI ở những thao tác nêu trên, nhưng chưa có thông tin đáng tin cậy để ghép các tài khoản đó với ba MSSV hoặc chia tỷ lệ đóng góp. Vì vậy, báo cáo không ghi tỷ lệ phần trăm hoặc “độc lập review bởi từng MSSV” chưa được chứng minh. Nội dung này minh bạch hơn so với việc tự tạo phân công.

## 4. Tài liệu, mã nguồn và quy trình phối hợp

- **Mã nguồn:** [TRuong-c/ktpmud-bkt-vuontoan-starter — `track-b-main`](https://github.com/TRuong-c/ktpmud-bkt-vuontoan-starter/tree/track-b-main).
- **Lịch sử thay đổi:** [Commits](https://github.com/TRuong-c/ktpmud-bkt-vuontoan-starter/commits/track-b-main).
- **Kết quả CI:** [GitHub Actions](https://github.com/TRuong-c/ktpmud-bkt-vuontoan-starter/actions).
- **Báo cáo kiểm thử:** `artifacts/TEST_REPORT.md`.
- **Minh bạch AI:** `artifacts/AI_USE.md`; tài liệu có ghi nhận sử dụng AI hỗ trợ soạn thảo/rà soát và những sai lệch đã được hiệu chỉnh.
- **Checkpoint 1:** [PR #1 trên starter của thầy](https://github.com/fossbk-spec/ktpmud-bkt-vuontoan-starter/pull/1).

## 5. Tính trung thực của báo cáo

Bản này ghi nhận **công việc và kết quả đã có dấu vết**, không xem tên tài khoản commit là bằng chứng tuyệt đối của tác giả, không tự tạo số giờ làm, tỷ lệ đóng góp hay lượt kiểm thử riêng của từng sinh viên. Danh tính và mức đóng góp cá nhân cần được xác nhận bởi chính các thành viên nếu giảng viên yêu cầu đánh giá riêng.
