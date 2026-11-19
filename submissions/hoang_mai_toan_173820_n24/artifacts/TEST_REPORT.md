
# TEST REPORT – VƯỜN TOÁN LỚP 3

- **Nhóm:** 24
- **Track:** B
- **Dự án:** Vườn Toán Lớp 3
- **Chức năng:** Bài tập ước lượng phép nhân và phép chia
- **Repository:** https://github.com/Son250825/ktpmud-bkt-vuontoan-starter
- **Commit được kiểm thử:** `6b9bd260e448fccc18118b9e2acfcba6dec0bc43`

---

## 1. Môi trường kiểm thử

| Thành phần | Phiên bản / Thông tin |
|---|---|
| Hệ điều hành | Windows |
| Node.js | v22.23.5 |
| npm | 10.9.9 |
| Test runner | Node.js built-in test runner (`node --test`) |
| Cơ sở dữ liệu | SQLite |
| Commit | `6b9bd260e448fccc18118b9e2acfcba6dec0bc43` |

### Lệnh kiểm thử

Cài đặt dependencies:

```bash
npm ci
```

Chạy toàn bộ kiểm thử:

```bash
npm test
```

Trên PowerShell Windows, có thể sử dụng:

```powershell
npm.cmd ci
npm.cmd test
```

CI được cấu hình chạy kiểm thử trên các phiên bản Node.js 18, 20 và 22.

---

## 2. Tổng hợp kết quả kiểm thử

Bộ kiểm thử gồm ba nhóm chính:

| Nhóm kiểm thử | Số test con | Kết quả |
|---|---:|---|
| Unit test | 22 | 22 đạt |
| API test | 9 | 9 đạt |
| UI test | 19 | 19 đạt |
| **Tổng** | **50** | **50 đạt** |

Kết quả thực tế từ Node.js Test Runner:

| Chỉ số | Kết quả |
|---|---:|
| Tổng số test được runner ghi nhận | 52 |
| Passed | 52 |
| Failed | 0 |
| Cancelled | 0 |
| Skipped | 0 |
| Todo | 0 |
| Thời gian chạy | 8589.365 ms |

**Giải thích cách thống kê:** 50 là số test con thực hiện các trường hợp kiểm thử cụ thể. Test runner ghi nhận thêm 2 test cha bao quanh nhóm API và UI, nên tổng số hiển thị là 52.

**Kết luận:** Toàn bộ 52 test được Node.js Test Runner ghi nhận đều đạt trên commit được kiểm thử.

---

## 3. Danh sách kiểm thử chi tiết

### 3.1. Unit test – `tests/estimate.test.js`

Có 22 test, mã định danh từ `EST-01` đến `EST-22`.

Các nội dung kiểm thử:

- EST-01 đến EST-04: Kiểm tra bốn tổ hợp kết quả ước lượng và tính toán, tương ứng với các mức điểm.
- EST-05 đến EST-09: Kiểm tra cận dưới, cận trên và các trường hợp biên của khoảng ước lượng.
- EST-10 đến EST-15: Kiểm tra dữ liệu thiếu, dữ liệu rỗng, dữ liệu không phải số và định dạng số.
- EST-16 đến EST-19: Kiểm tra phân tích đáp án lưu trữ và từ chối các khoảng không hợp lệ.
- EST-20: Kiểm tra phản hồi khác nhau cho bốn tổ hợp kết quả.
- EST-21: Kiểm tra tính tất định của kết quả chấm điểm khi chạy lặp.
- EST-22: Kiểm tra đầy đủ 12 câu hỏi ước lượng trong dữ liệu seed.

**Kết quả:** 22/22 test đạt.

### 3.2. API test – `tests/estimate-api.test.js`

Có 9 test con, được đánh số từ 1 đến 9 trong tên test tại source code.

| STT | Nội dung kiểm thử |
|---:|---|
| 1 | Không đăng nhập thì không được lấy câu hỏi |
| 2 | Không đăng nhập thì không được nộp bài |
| 3 | Đăng nhập thành công bằng tài khoản học sinh |
| 4 | GET câu hỏi không làm lộ đáp án đúng |
| 5 | Nộp đáp án hợp lệ được server chấm điểm |
| 6 | Không thể tự gửi điểm cao khi đáp án sai hoặc bỏ trống |
| 7 | Bộ câu hỏi không tồn tại phải bị từ chối |
| 8 | Kết quả nộp bài được lưu trong database |
| 9 | Tiến độ học tập được cập nhật sau khi nộp bài |

**Kết quả:** 9/9 test đạt.

### 3.3. UI test – `tests/estimate-ui.test.js`

Có 19 test, mã định danh từ `UI-01` đến `UI-19`.

| Mã test | Nội dung kiểm thử |
|---|---|
| UI-01 | Tải và hiển thị danh sách câu hỏi |
| UI-02 | Hiển thị đủ ba ô nhập |
| UI-03 | Nhập hai cận hợp lệ thì mở ô kết quả |
| UI-04 | Cận dưới bằng cận trên không mở ô kết quả |
| UI-05 | Cận dưới lớn hơn cận trên không hợp lệ |
| UI-06 | Nhập chữ vào cận dưới phải báo lỗi |
| UI-07 | Nhập số âm vào cận trên phải báo lỗi |
| UI-08 | Nhập số thập phân không được chấp nhận |
| UI-09 | Nhập số vượt giới hạn an toàn phải bị từ chối |
| UI-10 | Nhấn Enter ở cận dưới chuyển sang cận trên |
| UI-11 | Nhấn Enter ở cận trên hợp lệ chuyển sang kết quả |
| UI-12 | Câu trả lời được lưu khi nhập |
| UI-13 | Chuyển câu giữ lại câu trả lời cũ |
| UI-14 | Thanh tiến độ cập nhật khi hoàn thành câu |
| UI-15 | Tải lại có thể khôi phục bản nháp |
| UI-16 | Không cho nộp khi dữ liệu sai |
| UI-17 | Câu bỏ trống phải hiển thị lựa chọn |
| UI-18 | Nộp bài thành công hiển thị màn hình kết quả |
| UI-19 | API lỗi thì bản nháp không bị xóa |

**Kết quả:** 19/19 test đạt.

---

## 4. Kiểm thử thủ công

Giao diện được kiểm tra thủ công với các thao tác:

| Nội dung | Kết quả |
|---|---|
| Dùng phím Tab để di chuyển qua các thành phần tương tác | Đạt |
| Kiểm tra dấu hiệu hiển thị vị trí đang được focus | Đạt |
| Nhấn Enter tại ô cận dưới để chuyển đến ô cận trên | Đạt |
| Nhấn Enter tại ô cận trên hợp lệ để chuyển đến ô kết quả | Đạt |
| Nhấn Enter tại ô cuối không tự động nộp bài | Đạt |
| Kiểm tra thông báo khi dữ liệu không hợp lệ | Đạt |
| Tải lại trang và kiểm tra khả năng khôi phục trạng thái | Đạt |

---

## 5. Rà soát bảo mật và quyền riêng tư

Các nội dung dưới đây được rà soát thông qua kiểm thử API và kiểm tra mã nguồn:

| Nội dung rà soát | Cách kiểm tra |
|---|---|
| API yêu cầu đăng nhập | Kiểm thử API khi chưa đăng nhập |
| Không để lộ đáp án đúng trước khi nộp | Kiểm tra dữ liệu API trả về |
| Điểm được tính ở phía máy chủ | Kiểm thử API nộp đáp án |
| Không thể tự gửi điểm cao khi đáp án sai hoặc bỏ trống | Kiểm thử API với dữ liệu không hợp lệ |
| Dữ liệu mẫu sử dụng dữ liệu giả lập | Rà soát `data/seed.json` |
| Không đưa thông tin bí mật vào mã nguồn đã rà soát | Kiểm tra các tệp trong repository |

Phạm vi rà soát trên không thay thế cho một cuộc kiểm thử xâm nhập bảo mật chuyên sâu.

---

## 6. Kiểm thử tích hợp liên tục (CI)

Workflow CI được cấu hình tại:

`.github/workflows/ci.yml`

Các nội dung chính:

- Kích hoạt khi có Pull Request.
- Kích hoạt khi push lên nhánh `main`.
- Chạy trên các phiên bản Node.js 18, 20 và 22.
- Cài đặt dependencies bằng `npm ci`.
- Chạy kiểm thử bằng `npm test`.

Workflow CI đã chạy thành công trên commit được kiểm thử.

---

## 7. Giới hạn kiểm thử

- Kiểm thử tập trung vào chức năng bài tập ước lượng và phần tích hợp liên quan.
- Dữ liệu sử dụng trong kiểm thử là dữ liệu mẫu, không đại diện cho dữ liệu người dùng thực tế.
- Kiểm thử tự động không thay thế hoàn toàn việc đánh giá trải nghiệm người dùng trên nhiều thiết bị và trình duyệt.
- Chưa thực hiện kiểm thử xâm nhập bảo mật chuyên sâu.
- Kết quả kiểm thử chức năng không được sử dụng thay thế cho phép đo hiệu năng chuyên biệt.

---

## 8. Kết luận

Bộ kiểm thử gồm 22 unit test, 9 API test và 19 UI test. Toàn bộ 50 test con đều đạt; Node.js Test Runner ghi nhận tổng cộng 52 test, trong đó 52 đạt và không có test thất bại.

Các kiểm thử tập trung vào tính đúng đắn của quy tắc ước lượng, kiểm tra dữ liệu đầu vào, chấm điểm phía máy chủ, xác thực người dùng, lưu kết quả, cập nhật tiến độ và khả năng khôi phục trạng thái bài làm.

Kết quả kiểm thử xác nhận chức năng bài tập ước lượng hoạt động đúng theo các trường hợp đã được kiểm thử trên commit nêu tại đầu báo cáo.
