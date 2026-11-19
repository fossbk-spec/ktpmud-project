# NHẬT KÝ SỬ DỤNG TRÍ TUỆ NHÂN TẠO (AI-USE LOG)
- **Nhóm thực hiện:** Nhóm 56 (`nhom56` — Track B)
- **Chính sách tuân thủ:** `ai-allowed` (Khai báo minh bạch, kiểm chứng độc lập, không dùng AI làm nguồn đáp án trong runtime).

## 1. Nguyên tắc sử dụng AI của Nhóm 56
1. **Không dùng LLM trong Runtime (B-03):** Hệ thống Vườn Toán Lớp 3 của nhóm tuyệt đối không gọi bất kỳ API AI/LLM nào để sinh đề hay chấm điểm. 100% logic toán học là hàm tất định (deterministic) chạy tại `server/`.
2. **Kiểm chứng thủ công và Tự động:** Mọi đoạn mã hoặc tài liệu có sự hỗ trợ gợi ý từ công cụ AI đều được các thành viên trong nhóm đọc hiểu, tính toán lại bằng tay trên bộ 12 fixtures và kiểm chứng qua bộ test tự động (`npm test`).

## 2. Bảng truy vết sử dụng AI chi tiết

| Thời gian | Thành viên | Công cụ AI | Mục đích sử dụng (Tóm tắt Prompt) | Cách nhóm kiểm chứng & Chỉnh sửa |
|---|---|---|---|---|
| Giai đoạn M1 (Phân tích) | `N56-Member-02` | Gemini / ChatGPT | Tham khảo cách diễn đạt quy tắc làm tròn số và tìm bội số tương thích cho phép chia có dư phù hợp chương trình Toán lớp 3. | Nhóm tự chốt công thức toán học tất định `Math.floor(a / (10 * b) + 0.5) * (10 * b)`, tự lập bảng 12 fixtures (`B-F01` -> `B-F12`) và tính tay lại từng khoảng `[E_min, E_max]`. |
| Giai đoạn Thiết kế | `N56-Member-01` | Gemini | Gợi ý cú pháp kiểm tra cột tồn tại trong SQLite (`PRAGMA table_info`) để viết hàm auto-migration an toàn không làm hỏng dữ liệu cũ. | Kiểm tra trực tiếp trên file CSDL SQLite của starter repo, đảm bảo chạy lại nhiều lần không báo lỗi trùng cột và 4 dạng bài cũ vẫn hoạt động. |
| Giai đoạn Kiểm thử (PC-2) | `N56-Member-03` | Gemini | Hỗ trợ rà soát các ca kiểm thử giá trị biên (Boundary Value Analysis) và viết khung script kiểm thử tự động cho `npm test`. | Tự thiết lập các giá trị biên cụ thể (`139, 140, 160, 161` cho câu `48 x 3` và `17, 18, 22, 23` cho câu `87 : 4`), chạy thực tế trên máy và CI để xác nhận kết quả. |
| Giai đoạn Đóng gói | Cả nhóm | Gemini | Rà soát cấu trúc thư mục nộp bài `submissions/hoang_mai_toan_56/` và đối chiếu danh sách 12 tiêu chí B-01..B-12. | Đối chiếu từng file với hướng dẫn của môn học, kiểm tra trạng thái bot validate trên Pull Request. |

## 3. Cam kết trách nhiệm
Tất cả thành viên Nhóm 56 cam kết nắm vững toàn bộ kiến trúc, thuật toán ước lượng, cấu trúc bảng SQLite và luồng code để trực tiếp giải thích, bảo vệ trong buổi vấn đáp (Viva) mà không phụ thuộc vào AI.
