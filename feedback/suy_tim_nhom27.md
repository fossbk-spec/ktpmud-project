# Góp ý — nhom27 (CS-2: AI-CDSS Suy tim)

- **Bài nộp:** PR #2 `docs: add nhom27 heart failure SRS submission` (nhánh `submit/suy_tim-nhom27`, mở và đóng ngày 23/09/2026)
- **Ngày góp ý:** 21/10/2026
- **Kết quả kiểm tra tự động:** ✅ hợp lệ khi chạy lại `scripts/validate_submission.py` (cả kiểm tra thư mục và kiểm tra phạm vi PR)

## Trạng thái

PR #2 đã bị đóng khoảng 1 phút sau khi mở và chưa được merge, nên bài của nhóm **chưa nằm
trong `main`**. Lần chạy CI hôm đó báo lỗi trước khi chạy bất kỳ bước nào — đây là lỗi phía hạ
tầng repo, không phải do bài của nhóm. Nhóm hãy **mở lại PR #2** (hoặc mở PR mới từ cùng nhánh)
để giảng viên review.

## Nhận xét nhanh về bài nộp

- Cấu trúc thư mục, `submission.json` (dùng MSSV) và `README.md` đúng quy ước.
- `report/SRS_v1.0.md` đầy đủ các mục chính: phạm vi MVP, FR/NFR theo ISO 25010, backlog INVEST,
  BDD, Use Case, DFD, RTM. Nguyên tắc Zero PII/PHI và dữ liệu synthetic được nêu rõ (BR-04,
  NFR-08, FR-26).
- `submission.json` chưa có trường `submitted_at` (không bắt buộc) — nên bổ sung ngày nộp.
- `README.md` mục "Cách chạy lại" còn để trống — cần bổ sung khi có mã nguồn.

## Câu hỏi của nhóm (mục 12 của SRS) — chờ giảng viên trả lời

1. Mức hoàn thiện bắt buộc của bốn module trong MVP.
2. Rule Engine có đủ đáp ứng yêu cầu AI của CS-2 hay bắt buộc có mô hình ML.
