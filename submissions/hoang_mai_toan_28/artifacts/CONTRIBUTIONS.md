# ĐÓNG GÓP CỦA THÀNH VIÊN — CONTRIBUTIONS

**Đề tài:** Vườn Toán Lớp 3: "Ước lượng trước khi tính đúng"
**Nhóm thực hiện:** Nhóm 28

Dùng vai trò, không ghi họ tên/MSSV. Mã commit lấy từ lịch sử CI trên nhánh `main`. Trạng thái tại Checkpoint 2 (cập nhật 16/11/2026).

## 1. Phân công theo đầu việc

| Đầu việc | Vai trò phụ trách | Commit / PR | Người review |
|---|---|---|---|
| Phân tích yêu cầu, `REQUIREMENTS.md` | Docs | Lịch sử `artifacts/REQUIREMENTS.md` | Chưa ghi nhận review |
| Thiết kế, `DECISIONS.md` (ADR) | Lead | Lịch sử `artifacts/DECISIONS.md` (sửa ADR-003, ADR-004 theo góp ý giảng viên) | Chưa ghi nhận review |
| Logic ước lượng `server/estimate.js` và unit test | BE | `server/estimate.js`, `test/estimate.test.js` (có trước CI #1) | Chưa ghi nhận review |
| Nhánh chấm `estimate` trong `server/api.js` | BE | CI #5 `480a078`, CI #6 `73bcd02` | Chưa ghi nhận review |
| Fixture 12 câu trong `data/seed.json` | BE | CI #2 `6a91a61` (script sinh), CI #4 `dbdac0c` (question sets) | Chưa ghi nhận review |
| Giao diện hai bước (`estimate-step.js`, `exercise.html`, `exercise.js`) | FE | CI #3 `8c44792`, CI #7 `ab1bda0`, CI #8 `1890660` | Chưa ghi nhận review |
| Test API/tích hợp, hồi quy | QA | Chưa thực hiện (kế hoạch 16–17/11) | — |
| CI, `npm test` | QA | CI #1 `dc72b1e` | Chưa ghi nhận review |
| `TEST_REPORT.md`, `SECURITY_PRIVACY_CHECKLIST.md` | QA | Khung đã có, đang cập nhật kết quả | — |
| `AI_USE.md`, `README.md` | Docs | `README.md`, `artifacts/AI_USE.md` trong repo | Chưa ghi nhận review |
| Slide, demo | Lead | Kịch bản demo đã có (`slides/DEMO_SCRIPT.md`); slide chưa làm | — |

## 2. Tóm tắt theo vai trò

| Vai trò | Phần chịu trách nhiệm giải thích khi vấn đáp | Ghi chú |
|---|---|---|
| Lead | Quyết định thiết kế (5 ADR), phạm vi, demo | Chịu trách nhiệm tag Freeze và Draft PR |
| BE | `server/estimate.js`, nhánh chấm trong `server/api.js`, fixture | Trả lời được vì sao ±20%, vì sao mã hoá dải trong `correct_answer` |
| FE | `estimate-step.js`, tích hợp `exercise.js` | Trả lời được cách chặn nộp khi chưa ước lượng và hành vi khi làm mới trang |
| QA | Test, CI, báo cáo kiểm thử và bảo mật | Chịu trách nhiệm các ca T-API, T-UI, T-SEC |
| Docs | `REQUIREMENTS.md`, `README.md`, `AI_USE.md` | Truy vết B-01…B-12 |
