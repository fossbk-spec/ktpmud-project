# SECURITY_PRIVACY_CHECKLIST.md — An toàn và quyền riêng tư

**Dự án:** BKT Vườn Toán Lớp 3 — Track B (`hoang_mai_toan`)  
**Nhóm:** 29  
**Ngày lập:** 17/11/2026  
**Mã nguồn:** https://github.com/TRuong-c/ktpmud-bkt-vuontoan-starter  
**Bằng chứng kiểm thử:** `artifacts/TEST_REPORT.md`; [GitHub Actions](https://github.com/TRuong-c/ktpmud-bkt-vuontoan-starter/actions)

> **Cách đọc:** `[x]` là **đã có bằng chứng ở phạm vi ghi rõ**, không đồng nghĩa đã kiểm thử bảo mật toàn diện. `[ ]` nghĩa là **chưa xác minh hoặc còn việc cần xử lý**. Việc chạy 31/31 test local và có CI màu xanh không tự chứng minh ứng dụng an toàn để triển khai công khai.

## 1. Xác thực, phân quyền và bảo vệ đáp án

- [x] **API trả HTTP 401 khi chưa đăng nhập** ở các trường hợp test đã chạy (theo kết quả Terminal ngày 15/11/2026).
- [x] **Không trả kèm đáp án trong phản hồi GET câu hỏi** ở trường hợp `TC-SEC-01` đã kiểm thử.
- [x] **Đường dẫn/tập dữ liệu không tồn tại trả HTTP 404** ở trường hợp đã kiểm thử.
- [x] **Không gửi trùng bài nộp** đối với tình huống có test hồi quy (`TC-SUB-01/02/03`).
- [ ] **Google OAuth trên môi trường triển khai:** Chưa có minh chứng kiểm thử đăng nhập thật; log test cho thấy `GOOGLE_CLIENT_ID` chưa cấu hình.
- [ ] **Quyền quản trị và `ADMIN_SECRET`:** Chưa kiểm chứng vận hành với secret thật; log test cho thấy `ADMIN_SECRET` chưa cấu hình.
- [ ] **Phân quyền đầy đủ theo từng tài khoản (học sinh/giáo viên/admin):** Chưa có minh chứng rà soát thủ công toàn bộ route, IDOR hoặc trường hợp người dùng truy cập tài nguyên của người khác.

## 2. Kiểm soát đầu vào, điểm số và dữ liệu

- [x] **Từ chối đầu vào không hợp lệ** trong các test quy tắc ước lượng/`parseAnswer`, gồm chuỗi và biểu thức không hợp lệ.
- [x] **Chấm và lưu kết quả qua API/SQLite** trong các ca test được ghi nhận; có kiểm thử tính điểm cho bộ câu hỗn hợp và hành vi nộp lại.
- [x] **Kiểm thử các giá trị biên** (bao gồm một số ranh giới của dạng bài ước lượng) trong bộ 31 test local.
- [ ] **Chống SQL injection và truy cập chéo dữ liệu:** Chưa rà soát trực tiếp tất cả câu SQL, tham số truy vấn, quyền truy cập bản ghi và phân tách quyền sở hữu.
- [ ] **Chống XSS/CSRF, giới hạn kích thước request và rate limit:** Chưa có biên bản kiểm tra độc lập.
- [ ] **Sao lưu, khôi phục và chính sách xóa dữ liệu:** Chưa được xác minh.

## 3. Secrets, cấu hình và môi trường

- [ ] Kiểm tra toàn bộ mã nguồn **và lịch sử commit** để loại trừ API key, mật khẩu, token, file `.env` hay secret hardcode; chưa có log quét secret để xác nhận.
- [ ] Xác minh cấu hình production tách biệt với test/dev (OAuth redirect URI, cookie/session flags, HTTPS, quản trị); chưa có minh chứng triển khai production.
- [ ] Kiểm tra cách lưu và cấp `ADMIN_SECRET`, bảo đảm không ghi trực tiếp secret vào tài liệu/log/CI; chưa có bản rà soát.
- [ ] Kiểm tra `.gitignore` và các artifact trước khi nộp để tránh upload database thật, thông tin cá nhân hoặc tệp cấu hình nhạy cảm.

**Lưu ý:** Repository ứng dụng và hồ sơ nộp đang Public; người ngoài có thể xem/clone/tải. Không đưa credentials, dữ liệu cá nhân thật hay thông tin nhạy cảm vào repository.

## 4. Quyền riêng tư và dữ liệu học sinh

- [x] Có cơ chế nạp `data/seed.json` trong quá trình test (Terminal hiển thị đã nạp dữ liệu mẫu); commit upstream mô tả có dữ liệu **synthetic** cho 99 tài khoản học sinh. Đây là bằng chứng về **nguồn dữ liệu mẫu được mô tả**, không phải kết luận đã kiểm tra mọi bản ghi.
- [ ] Kiểm tra trực tiếp `data/seed.json`, database và các commit để xác nhận **toàn bộ dữ liệu là giả lập**, không chứa tên, email, số điện thoại hoặc hồ sơ học sinh thật.
- [ ] Xác định dữ liệu điểm số/tiến độ được lưu bao lâu, ai được đọc/sửa/xóa, và trình bày chính sách này trong tài liệu sản phẩm.
- [ ] Rà soát log ứng dụng/API tránh ghi token, mật khẩu và dữ liệu học sinh không cần thiết.

## 5. Dependency, CI và tình trạng rủi ro

- [x] **`npm.cmd ci` trên Node.js v22.23.4 thành công**, cài 173 packages; bộ `npm.cmd test` chạy **31/31 Passed, 0 Failed** trên local ngày 15/11/2026.
- [x] Theo ảnh GitHub Actions người dùng cung cấp, trang Actions của nhánh `track-b-main` hiển thị **6 lượt CI thành công**, mới nhất ở commit `522bb7d` ngày 16/11/2026.
- [ ] Chưa đối chiếu log từng workflow để kết luận tất cả job thực thi cùng bộ test bảo mật hoặc quét lỗ hổng.
- [ ] **Rà soát và xử lý cảnh báo npm:** đầu ra `npm.cmd ci` báo **2 vulnerabilities: 1 moderate, 1 high**; chưa có báo cáo chi tiết `npm.cmd audit` và chưa có bằng chứng khắc phục. Không tự kết luận đã an toàn.
- [ ] Theo dõi warning `prebuild-install@7.1.3` deprecated và đánh giá mức độ liên quan thực tế.

## 6. Rủi ro còn mở và hướng xử lý

| Mức ưu tiên | Rủi ro / giới hạn | Tình trạng & hướng xử lý có trách nhiệm |
|---|---|---|
| Cao — cần điều tra | `npm` báo 1 high + 1 moderate | **Chưa giải quyết.** Chạy `npm.cmd audit` để xác định gói, đường phụ thuộc, khả năng khai thác; cập nhật bản vá tương thích rồi chạy lại 31 test/CI. Không dùng `npm audit fix --force` khi chưa đánh giá. |
| Cao khi triển khai | OAuth và `ADMIN_SECRET` không có trong môi trường test | **Chưa chứng minh lỗi production** nhưng cũng chưa kiểm tra production. Cấu hình qua secret manager hoặc biến môi trường, kiểm thử quyền học sinh/giáo viên/admin trước khi triển khai. |
| Cao với dữ liệu thật | Đối tượng là học sinh lớp 3 | **Chưa xác minh toàn bộ.** Chỉ dùng dữ liệu giả khi demo; không upload dữ liệu trẻ em thật, bảo vệ tiến độ/điểm theo đúng quyền. |
| Trung bình | SQLi, XSS, CSRF, IDOR, rate limit | **Chưa có biên bản review.** Bổ sung kiểm thử và rà soát mã nguồn/API trên các tuyến nhạy cảm. |
| Trung bình | Public repository và lịch sử commit | **Chưa quét secret/historical content.** Không đăng credentials và kiểm tra cả lịch sử trước khi public. |

## 7. Threat model ngắn: tính năng ước lượng và lưu điểm

**Tài sản cần bảo vệ:** tài khoản, quyền truy cập giáo viên/admin, đáp án trước khi học sinh nộp, kết quả/tiến độ học sinh và dữ liệu SQLite. **Tác nhân đe dọa:** người dùng chưa đăng nhập, học sinh thử xem đáp án trước, tài khoản không đủ quyền truy cập dữ liệu người khác, hoặc client gửi đầu vào sai/nhịp độ lớn. **Biện pháp đã có bằng chứng ở phạm vi test:** HTTP 401 khi chưa xác thực, GET không tiết lộ đáp án, kiểm tra đầu vào sai và hành vi nộp bài trùng. **Lỗ hổng cần xác minh:** quyền truy cập chéo bản ghi, phân quyền admin, session/CSRF, secret management, rate limit và bảo vệ dữ liệu cá nhân. Các biện pháp chưa test không được đánh dấu là đã hoàn thành.

## 8. Cách tái kiểm tra và bằng chứng

```powershell
node -v
npm.cmd ci
npm.cmd test
npm.cmd audit
```

- `npm.cmd audit` là **bước khuyến nghị tiếp theo**, chưa có bằng chứng đã chạy trong hồ sơ hiện có.
- [Báo cáo local](./TEST_REPORT.md): ảnh Terminal ngày 15/11 ghi `tests 31`, `pass 31`, `fail 0`.
- [Trang CI](https://github.com/TRuong-c/ktpmud-bkt-vuontoan-starter/actions): ảnh ngày 17/11 hiển thị 6 runs xanh.
- [Lịch sử commit](https://github.com/TRuong-c/ktpmud-bkt-vuontoan-starter/commits/track-b-main): đối chiếu mã nguồn và người đẩy thay đổi.

**Kết luận:** Đã có một số kiểm chứng tự động hữu ích cho API, điểm số và truy cập chưa đăng nhập; **không có đủ bằng chứng để xác nhận hoàn toàn an toàn/bảo vệ quyền riêng tư**. Các mục chưa xác minh được ghi rõ để nhóm/giảng viên đánh giá công bằng.
