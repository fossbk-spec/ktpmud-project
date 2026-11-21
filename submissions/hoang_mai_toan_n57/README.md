# N57 — Track B: Ước lượng trước khi tính đúng

Trạng thái: đã kiểm tra tag freeze.

Source: [dcbf0219c8318814c9358f7d4c543955b2496050](https://github.com/ndm2006/ktpmud-bkt-vuontoan-starter/tree/dcbf0219c8318814c9358f7d4c543955b2496050). [CI đạt](https://github.com/ndm2006/ktpmud-bkt-vuontoan-starter/actions/runs/44569431684).

Nhóm gồm N57-A và N57-B. Ngoại lệ hai thành viên đã được GV chấp thuận theo xác nhận của đại diện nhóm trong chat; không tự suy diễn việc duyệt code cuối. Manifest dùng alias theo yêu cầu BKT về dữ liệu, không chứa họ tên/MSSV.

Clean run (Node 22): git clone https://github.com/ndm2006/ktpmud-bkt-vuontoan-starter.git; cd ktpmud-bkt-vuontoan-starter; git checkout dcbf0219c8318814c9358f7d4c543955b2496050; npm ci; npm test; npx playwright install chromium; npm run test:e2e; npm start.

Từ menu Phòng Luyện Tập → chọn 12 khoảng → lưu/khóa → tính chính xác → nộp. Mỗi câu đạt điểm khi cả hai bước đúng. [Demo 7 phút](slides/DEMO.md). [Review cuối](artifacts/FINAL_REVIEW.md).

Chỉ đưa thư mục này vào submissions/hoang_mai_toan_n57 của ktpmud-project. Tag freeze đã công bố; hồ sơ không thay việc nhóm giải thích đóng góp và demo/viva.

## Freeze đã công bố — 19/11/2026

- Tag thật: [bkt-2026-N57-rc1](https://github.com/ndm2006/ktpmud-bkt-vuontoan-starter/tree/bkt-2026-N57-rc1).
- SHA freeze: dcbf0219c8318814c9358f7d4c543955b2496050.
- [CI đúng SHA đã đạt](https://github.com/ndm2006/ktpmud-bkt-vuontoan-starter/actions/runs/44569431684).
- [Tiến độ PC-2 và kết quả freeze](https://github.com/ndm2006/ktpmud-bkt-vuontoan-starter/blob/dcbf0219c8318814c9358f7d4c543955b2496050/progress/PROGRESS.md).
- [Biên bản kiểm tra freeze](artifacts/FREEZE_RECORD.md) · [Hướng dẫn nộp cuối/demo](HANDOFF_AFTER_FREEZE.md).

Draft PR: https://github.com/fossbk-spec/ktpmud-project/pull/52. Hồ sơ bổ sung muộn sau PC-2; câu hỏi đã gửi tại https://github.com/fossbk-spec/ktpmud-project/issues/32#issuecomment-7015415399. Không xác nhận đã nộp đúng hạn 18/11.

## Hoàn tất thủ tục nộp cuối — 21/11/2026

Đối chiếu source-ref, tag remote và CI đúng SHA: khớp. Không có phản hồi yêu cầu sửa từ GV tại thời điểm rà soát. Theo yêu cầu đại diện nhóm, hoàn tất hồ sơ và chuyển cùng PR #52 sang Ready for review sau khi validate của bản cuối đạt. Thao tác này thực hiện ngày 21/11, sau ngày nộp 20/11; không ghi nhận là đúng hạn. Thời điểm chuyển trạng thái xem timeline của PR. Source và tag freeze ngày 19/11 giữ nguyên.

Nhóm tự thực hiện demo/viva; GV quyết định ghi nhận nộp bổ sung, review nội dung và merge. Xem HANDOFF_AFTER_FREEZE.md để chuẩn bị trình bày.
