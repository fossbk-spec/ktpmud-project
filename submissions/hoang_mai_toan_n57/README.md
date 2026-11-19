# N57 — Track B: Ước lượng trước khi tính đúng

Trạng thái: candidate cho Draft PR; tên tag là dự kiến, chưa xác nhận phát hành.

Source: [f3eb5eaa22723fca3da56adbd4bc4652f6a9b174](https://github.com/ndm2006/ktpmud-bkt-vuontoan-starter/tree/f3eb5eaa22723fca3da56adbd4bc4652f6a9b174). [CI đạt](https://github.com/ndm2006/ktpmud-bkt-vuontoan-starter/actions/runs/44567764405).

Nhóm gồm N57-A và N57-B. Ngoại lệ hai thành viên đã được GV chấp thuận theo xác nhận của đại diện nhóm trong chat; không tự suy diễn việc duyệt code cuối. Manifest dùng alias theo yêu cầu BKT về dữ liệu, không chứa họ tên/MSSV.

Clean run (Node 22): git clone https://github.com/ndm2006/ktpmud-bkt-vuontoan-starter.git; cd ktpmud-bkt-vuontoan-starter; git checkout f3eb5eaa22723fca3da56adbd4bc4652f6a9b174; npm ci; npm test; npx playwright install chromium; npm run test:e2e; npm start.

Từ menu Phòng Luyện Tập → chọn 12 khoảng → lưu/khóa → tính chính xác → nộp. Mỗi câu đạt điểm khi cả hai bước đúng. [Demo 7 phút](slides/DEMO.md). [Review cuối](artifacts/FINAL_REVIEW.md).

Chỉ đưa thư mục này vào submissions/hoang_mai_toan_n57 của ktpmud-project. Candidate không thay bước nhóm review, tag/release và xác nhận PC-2.

## Theo dõi hồ sơ bổ sung 19/11

[Báo cáo tiến độ PC-2](https://github.com/ndm2006/ktpmud-bkt-vuontoan-starter/blob/f3eb5eaa22723fca3da56adbd4bc4652f6a9b174/progress/PROGRESS.md) đã bổ sung bảng 2.1–2.5; phần PC-1 giữ nguyên. [Draft PR #52](https://github.com/fossbk-spec/ktpmud-project/pull/52). [Câu hỏi xử lý PC-2 bổ sung muộn](https://github.com/fossbk-spec/ktpmud-project/issues/32#issuecomment-7015415399). Không xác nhận đã nộp đúng hạn 18/11.

Bản f3eb5eaa22723fca3da56adbd4bc4652f6a9b174 chỉ bổ sung AI_USE và tiến độ; code giống candidate d98c33f. CI đúng bản bổ sung đã đạt. Tag thật còn do đại diện nhóm tạo theo lựa chọn đã xác nhận; chuyển Ready for review ngày 20/11 sau khi nhóm kiểm tra.
