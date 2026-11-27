
# DEMO SCRIPT — NHÓM 24 — TRACK B

**Sản phẩm:** Vườn Toán Lớp 3 – Ước lượng trước khi tính đúng
**Thời lượng:** Tối đa 7 phút

## 1. Mục tiêu demo

Trình bày và chứng minh các nội dung:

- Chức năng ước lượng trước khi tính đúng đã được tích hợp.
- Học sinh phải nhập khoảng ước lượng hợp lệ trước khi nhập kết quả chính xác.
- Hệ thống kiểm tra dữ liệu và chấm điểm ở phía máy chủ.
- Kết quả bài làm được lưu và có thể khôi phục sau khi tải lại trang.
- Các thay đổi có kiểm thử và không nằm ngoài phạm vi Track B.

## 2. Kịch bản demo

| Thời gian | Nội dung | Người trình bày | Minh chứng |
|---|---|---|---|
| 0:00–0:40 | Giới thiệu bài toán, mục tiêu và phạm vi sản phẩm | Người trình bày chính | Giao diện tổng quan |
| 0:40–1:30 | Giải thích thiết kế dạng câu hỏi `estimate`, khả năng tương thích với dạng câu hỏi cũ | Người trình bày chính | `DECISIONS.md`, mã nguồn liên quan |
| 1:30–3:00 | Demo quy trình làm bài: nhập cận dưới, cận trên và kết quả chính xác | Người trình bày chính | Giao diện bài tập |
| 3:00–4:00 | Demo dữ liệu không hợp lệ và cách hệ thống phản hồi | Người trình bày chính | Giao diện và thông báo lỗi |
| 4:00–5:00 | Giải thích logic chấm điểm: 3 điểm cho ước lượng hợp lý, 2 điểm cho kết quả chính xác | Người trình bày chính | `server/estimate.js` |
| 5:00–6:10 | Trình bày API, lưu kết quả, khôi phục kết quả và kiểm thử | Người trình bày chính | `server/api.js`, `tests/`, `TEST_REPORT.md` |
| 6:10–7:00 | Tổng kết, giới hạn hiện tại và hướng hoàn thiện | Người trình bày chính | Slide tổng kết |

Nếu có nhiều thành viên cùng tham gia trình bày, có thể phân chia các phần theo phạm vi vai trò trong `CONTRIBUTIONS.md`. Việc phân chia trình bày không thay thế bằng chứng đóng góp thực tế.

## 3. Nội dung vấn đáp cần chuẩn bị

1. Vì sao nhóm bổ sung dạng câu hỏi `estimate` thay vì sửa các dạng câu hỏi cũ?
2. Vì sao học sinh phải nhập khoảng ước lượng trước kết quả chính xác?
3. Điều kiện nào được sử dụng để xác định một khoảng ước lượng hợp lý? Các giới hạn được triển khai ở đâu?
4. Cách tính điểm ước lượng và điểm kết quả chính xác?
5. Hệ thống xử lý dữ liệu đầu vào không hợp lệ như thế nào?
6. Vì sao tách logic chấm điểm vào `server/estimate.js`?
7. Vì sao việc chấm điểm được thực hiện ở phía máy chủ? Đáp án được xử lý như thế nào?
8. Kết quả bài làm được lưu ở đâu và được khôi phục như thế nào?
9. Nhóm đã kiểm thử những trường hợp nào? Kết quả kiểm thử ra sao?
10. Nhóm bảo đảm tuân thủ yêu cầu B-07 như thế nào?

**Lưu ý khi trả lời:** Các con số, giới hạn và điều kiện chấm điểm phải khớp với mã nguồn thực tế. Không tự đưa ra quy tắc chưa được triển khai.

## 4. Chuẩn bị trước demo

- [ ] Kiểm tra ứng dụng khởi động thành công.
- [ ] Kiểm tra tài khoản đăng nhập thử nghiệm.
- [ ] Kiểm tra bộ câu hỏi ước lượng.
- [ ] Chuẩn bị câu hỏi và đáp án mẫu.
- [ ] Kiểm tra luồng nhập khoảng ước lượng và kết quả chính xác.
- [ ] Thử nhập dữ liệu không hợp lệ.
- [ ] Kiểm tra chức năng nộp bài và lưu kết quả.
- [ ] Tải lại trang để kiểm tra khả năng khôi phục kết quả.
- [ ] Chuẩn bị các file mã nguồn và tài liệu cần trình bày.
- [ ] Chạy lại bộ kiểm thử trước demo.
- [ ] Chuẩn bị ảnh chụp màn hình dự phòng.

## 5. Phương án dự phòng

- Lỗi đăng nhập hoặc tải câu hỏi: kiểm tra server, API và dữ liệu mẫu.
- Lỗi nộp bài: kiểm tra kết nối, phản hồi API và log server.
- Lỗi khôi phục kết quả: kiểm tra dữ liệu lưu và API truy xuất kết quả.
- Demo trực tiếp gặp sự cố: sử dụng ảnh chụp màn hình và trình bày mã nguồn đã chuẩn bị.
- Không đủ thời gian: ưu tiên demo luồng làm bài, logic chấm điểm và kết quả kiểm thử.

## 6. Giới hạn và lưu ý

- Demo sử dụng môi trường chạy thử nghiệm và dữ liệu mẫu.
- Không sử dụng dữ liệu học sinh, giáo viên thực tế.
- Không kết nối hệ thống production hoặc cơ sở dữ liệu thực tế.
- Không thay đổi các thành phần nằm ngoài phạm vi được phép theo B-07.
- Không sử dụng AI trong phần vấn đáp trực tiếp.

---

**Nhóm 24 — Track B**
**Vườn Toán Lớp 3 – Ước lượng trước khi tính đúng**
