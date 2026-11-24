# Checklist bảo mật, quyền riêng tư và audit — đối chiếu tại Freeze

**Phạm vi:** review và test code synthetic ở mã nguồn `4be2751` đã có trong tag `bkt-2026-173820_n27-rc1` tại SHA `7af8d47`; đối chiếu QA tại PR #10; chưa phải kiểm định toàn bộ môi trường hoặc xác nhận của GV/TA. Người tổng hợp: Lead (SV1). [Nguồn test audit](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/7af8d47fd410b96dcdb4b7caccd48580ce07cf4a/tests/test_audit.py) · [Quyết định audit](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/7af8d47fd410b96dcdb4b7caccd48580ce07cf4a/DECISIONS.md) · [Báo cáo test](TEST_REPORT.md).

| Mục cần kiểm | Bằng chứng / trạng thái | Giới hạn và việc tiếp theo |
|---|---|---|
| Dữ liệu demo/test | Bộ ca trong repo mô tả dữ liệu synthetic; mục đích học tập. | Không nhập dữ liệu bệnh nhân thật; tiếp tục rà file trước nộp. |
| Schema audit | Writer chỉ dựng bốn khóa `Timestamp`, `User_UUID`, `Action_Type`, `Status`; test đọc và kiểm schema. | Không suy ra mọi file audit đã có trên máy người dùng đều sạch. |
| UUID | UUID giả lập theo phiên/temporary call, nằm ngoài patient input; có test context và khôi phục phiên. | Không dùng UUID này làm định danh bệnh nhân. |
| SUCCESS / INVALID_INPUT | Có test đường input hợp lệ, input sai và status tương ứng khi ghi audit thành công. | Không khẳng định record tồn tại nếu ghi thất bại. |
| INTERNAL_ERROR | Lỗi validator/rule bất ngờ thử ghi `INTERNAL_ERROR` rồi báo `RuntimeError`; nếu audit lỗi ưu tiên `AuditError`. Có test synthetic. | Đây là quyết định nhóm, không khẳng định thầy đã xác nhận riêng status này. |
| Fail-closed và lỗi kép | Có test inject lỗi mkdir/open/write/short write/flush/close; ưu tiên lỗi audit, không trả kết quả thành công. | Lỗi hệ điều hành, quyền và file system thực tế có thể khác test giả lập. |
| Không lộ input qua lỗi/log | Các test canary kiểm tra message, exception chain/traceback, stdout/stderr, log và audit trong các đường được test. | Kết luận: **chưa phát hiện lộ dữ liệu trong phạm vi test**, không bảo đảm mọi thư viện/môi trường. |
| Đường dẫn audit | Mặc định ngoài repo trong thư mục người dùng; `DR_MAY_DAY_AUDIT_PATH` chấp nhận đường dẫn tuyệt đối ngoài repo. | Thành viên tự quản lý file và quyền truy cập; không commit log hoặc payload. |
| JSONL có dòng hỏng | Ghi tiếp tách dòng nếu thiếu newline; công cụ đọc bỏ qua dòng sai/khóa trùng, báo vị trí và mã thoát 3 nếu đọc một phần. | Không sửa hoặc chứng thực phần dữ liệu cũ; không bảo đảm an toàn ghi đồng thời hay khôi phục sau mất điện. |
| Secret / PII | Test canary và review dữ liệu synthetic chưa phát hiện dữ liệu bệnh nhân thật trong phạm vi rà. Chưa có bằng chứng kiểm toán độc lập toàn bộ repo/lịch sử tại SHA freeze. | Rà mã, file cấu hình, output và lịch sử ở SHA cuối; họ tên/MSSV trong hồ sơ là metadata nhóm công bố có chủ đích, không là input bệnh nhân. |
| Bằng chứng tại tag | [TEST_REPORT.md](TEST_REPORT.md) có CI 490 passed/3 skipped và hai lượt benchmark; [QA execution review](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/7af8d47fd410b96dcdb4b7caccd48580ce07cf4a/docs/qa/EXECUTION_REVIEW.md) ghi giới hạn. | SHA/tag và CI đã ghim; peer technical review cá nhân chưa có record đủ cho CHK-039/042/060. |

**Cảnh báo:** educational/synthetic — not for clinical use.
