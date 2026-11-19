# N57 — Track B: Ước lượng trước khi tính đúng

Trạng thái: candidate cho Draft PR; tên tag là dự kiến, chưa xác nhận phát hành.

Source: [d98c33feb787395d3701d2235a354da428cfd20b](https://github.com/ndm2006/ktpmud-bkt-vuontoan-starter/tree/d98c33feb787395d3701d2235a354da428cfd20b). [CI đạt](https://github.com/ndm2006/ktpmud-bkt-vuontoan-starter/actions/runs/44129408084).

Nhóm gồm N57-A và N57-B. Ngoại lệ hai thành viên đã được GV chấp thuận theo xác nhận của đại diện nhóm trong chat; không tự suy diễn việc duyệt code cuối. Manifest dùng alias theo yêu cầu BKT về dữ liệu, không chứa họ tên/MSSV.

Clean run (Node 22): git clone https://github.com/ndm2006/ktpmud-bkt-vuontoan-starter.git; cd ktpmud-bkt-vuontoan-starter; git checkout d98c33feb787395d3701d2235a354da428cfd20b; npm ci; npm test; npx playwright install chromium; npm run test:e2e; npm start.

Từ menu Phòng Luyện Tập → chọn 12 khoảng → lưu/khóa → tính chính xác → nộp. Mỗi câu đạt điểm khi cả hai bước đúng. [Demo 7 phút](slides/DEMO.md). [Review cuối](artifacts/FINAL_REVIEW.md).

Chỉ đưa thư mục này vào submissions/hoang_mai_toan_n57 của ktpmud-project. Candidate không thay bước nhóm review, tag/release và xác nhận PC-2.
