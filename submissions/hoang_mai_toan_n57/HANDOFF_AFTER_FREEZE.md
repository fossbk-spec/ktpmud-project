# N57 — bàn giao sau freeze

Mốc source freeze: tag `bkt-2026-N57-rc1` trên fork code. Không force-push/xóa hoặc di chuyển tag này.

## Ngày 20/11 — nộp cuối

1. Mở https://github.com/fossbk-spec/ktpmud-project/pull/52.
2. Đọc `README.md`, `source-ref.json` và `artifacts/FREEZE_RECORD.md` trong `submissions/hoang_mai_toan_n57/`; đối chiếu SHA, tag và URL CI.
3. Chọn tab **Checks**, bảo đảm `validate` xanh trên commit hồ sơ mới nhất. Check xanh xác nhận cấu trúc, không thay việc review nội dung.
4. Đọc phản hồi giảng viên ở PR #52 và câu hỏi bổ sung muộn tại https://github.com/fossbk-spec/ktpmud-project/issues/32#issuecomment-7015415399. Nếu có yêu cầu sửa, thực hiện có lưu vết; không tự đổi tag đã freeze.
5. Trong PR #52, bấm **Ready for review** để nộp cuối. Giữ cùng PR, không mở PR mới, không tự merge. Đây là thao tác nhóm xác nhận hồ sơ cuối.

## Ngày 21/11 — demo và viva

- Hai thành viên tự đọc REQUIREMENTS, DECISIONS/ADR-002, TEST_REPORT và AI_USE; giải thích được phần AI hỗ trợ và các quyết định của nhóm.
- Diễn tập theo slides/DEMO.md, demo ≤7 phút và viva ≤8 phút.
- Chạy bằng Node 22; dùng tài khoản mẫu, dữ liệu synthetic. Trình bày luồng chọn đủ 12 khoảng → khóa → nhập kết quả → nộp → refresh; phân biệt đúng ước lượng, đúng phép tính và điểm cả hai bước.
- Nêu đúng giới hạn: số đang gõ chưa nộp không tự lưu; chưa nghiên cứu học sinh thật hoặc chứng nhận screen reader; PC-2 bổ sung sau hạn.

## Việc Codex không thể thay nhóm hoặc giảng viên

- Tham dự, trình bày và trả lời vấn đáp.
- Chứng thực đóng góp cá nhân, mức hiểu code, ngoại lệ nhóm hoặc việc nghiệm thu của GV.
- Quyết định có chấp nhận bổ sung PC-2 muộn hay không.
- Approve/merge bài vào kho môn học bằng quyền của giảng viên.
