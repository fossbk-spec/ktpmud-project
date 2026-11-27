
# CONTRIBUTIONS.md
# BÁO CÁO ĐÓNG GÓP – NHÓM N24

## 1. Thông tin chung

| Thuộc tính | Nội dung |
|---|---|
| Dự án | Vườn Toán Lớp 3 |
| Track | B – Phát triển tính năng bài tập ước lượng |
| Mã nhóm | N24 |
| Số thành viên | 3 |
| Repository | https://github.com/Son250825/ktpmud-bkt-vuontoan-starter |

## 2. Phân công vai trò

Nhóm phân chia phạm vi công việc theo ba vai trò chính:

| Alias | Vai trò | Phạm vi phụ trách |
|---|---|---|
| Lead-BE | Backend Developer | Nghiệp vụ chấm điểm, API, xử lý dữ liệu và kết quả bài làm |
| Dev-FE | Frontend Developer | Giao diện bài tập, tương tác người dùng, điều hướng và hiển thị kết quả |
| Dev-TEST | Testing & Documentation | Kiểm thử, CI, báo cáo kết quả và tài liệu dự án |

## 3. Nội dung công việc và bằng chứng

### 3.1. Lead-BE – Backend

**Phạm vi công việc:**

- Phân tích yêu cầu nghiệp vụ của dạng bài tập ước lượng.
- Xây dựng logic kiểm tra tính hợp lệ của khoảng ước lượng.
- Xây dựng chức năng chấm điểm cho câu hỏi ước lượng.
- Phân biệt kết quả đúng/sai của phần ước lượng và phần đáp án chính xác.
- Tích hợp logic chấm điểm vào API nộp bài.
- Xử lý lưu trữ và truy xuất kết quả bài làm.
- Đảm bảo các dạng câu hỏi cũ tiếp tục sử dụng cơ chế chấm điểm hiện có.

**Các file liên quan:**

- `server/estimate.js`
- `server/api.js`
- `server/db.js`
- `data/seed.json`

**Commit bằng chứng:**

- `a19d3f8` – Complete estimate exercise feature and tests.
- `6b9bd26` – Fix restore estimate exercise after refresh.

### 3.2. Dev-FE – Frontend

**Phạm vi công việc:**

- Tích hợp lối truy cập bài tập ước lượng từ giao diện học tập.
- Xây dựng giao diện làm bài tập ước lượng.
- Xử lý các trường nhập khoảng ước lượng và đáp án chính xác.
- Xây dựng luồng điều hướng giữa các trường nhập liệu.
- Kiểm tra dữ liệu đầu vào và hiển thị thông báo khi dữ liệu không hợp lệ.
- Hiển thị phản hồi và kết quả chấm điểm cho người học.
- Xử lý khôi phục trạng thái bài làm hoặc kết quả đã nộp khi tải lại trang.

**Các file liên quan:**

- `public/exercise.html`
- `public/assets/js/pages/exercise.js`
- `public/assets/js/components/curriculum-view.js`

**Commit bằng chứng:**

- `a19d3f8` – Complete estimate exercise feature and tests.
- `6b9bd26` – Fix restore estimate exercise after refresh.

### 3.3. Dev-TEST – Testing & Documentation

**Phạm vi công việc:**

- Xây dựng và bổ sung kiểm thử cho chức năng bài tập ước lượng.
- Kiểm tra logic chấm điểm với các trường hợp thông thường, trường hợp biên và dữ liệu không hợp lệ.
- Kiểm thử API nộp bài và truy xuất kết quả.
- Kiểm thử giao diện và khả năng khôi phục trạng thái sau khi tải lại trang.
- Kiểm tra kết quả chạy toàn bộ bộ kiểm thử bằng lệnh `npm test`.
- Xây dựng cấu hình CI để tự động chạy kiểm thử khi có Pull Request hoặc push lên nhánh chính.
- Tổng hợp kết quả kiểm thử và hoàn thiện tài liệu dự án.

**Các file liên quan:**

- `tests/`
- `.github/workflows/ci.yml`
- `submissions/hoang_mai_toan_173820_n24/artifacts/TEST_REPORT.md`
- `submissions/hoang_mai_toan_173820_n24/artifacts/REQUIREMENTS.md`
- `submissions/hoang_mai_toan_173820_n24/artifacts/DECISIONS.md`
- `submissions/hoang_mai_toan_173820_n24/artifacts/SECURITY_PRIVACY_CHECKLIST.md`
- `submissions/hoang_mai_toan_173820_n24/artifacts/AI_USE.md`

**Commit bằng chứng:**

- `a19d3f8` – Complete estimate exercise feature and tests.
- `534d9c4` – Update test report and rename submission folder.
- `7c9849d` – Resolve REQUIREMENTS.md merge conflict.
- `58d89cf` – Them file REQUIREMENTS.md.
- `6b9bd26` – Fix restore estimate exercise after refresh.

## 4. Bằng chứng tích hợp và kiểm thử

### 4.1. Pull Request

| Nội dung | Thông tin |
|---|---|
| Pull Request | #1 – Complete estimate exercise feature and tests |
| Nhánh nguồn | `feature/track-b-estimate` |
| Nhánh đích | `main` |
| Người tạo Pull Request | `Son250825` |
| Người thực hiện merge | `Son250825` |
| Commit trong Pull Request | `a19d3f8`, `7c9849d` |
| Số file thay đổi | 28 |
| Trạng thái | Merged |

Pull Request được sử dụng để tích hợp tính năng bài tập ước lượng vào nhánh chính của dự án.

### 4.2. Kết quả kiểm thử

- Pull Request có 3 checks passed.
- GitHub Actions được cấu hình để chạy kiểm thử tự động.
- Bộ kiểm thử gồm Unit Tests, API Tests và UI Tests.
- Kết quả chạy gần nhất: 52/52 tests passed, không có test thất bại.

### 4.3. Ghi nhận lịch sử Git

Các commit được liệt kê trong tài liệu được ghi nhận dưới tài khoản Git `Son250825`.

Các commit là bằng chứng về những thay đổi được thực hiện trong repository. Việc phân loại commit theo Backend, Frontend và Testing thể hiện phạm vi kỹ thuật của các thay đổi, không đồng nghĩa với việc mỗi alias có một lịch sử commit riêng.

## 5. Cross-review

Nhóm xác định các phạm vi cần kiểm tra chéo như sau:

| Alias | Phạm vi kiểm tra |
|---|---|
| Lead-BE | Nghiệp vụ Backend, API và xử lý kết quả |
| Dev-FE | Giao diện, luồng làm bài và tương tác người dùng |
| Dev-TEST | Bộ kiểm thử, CI và tài liệu dự án |

Pull Request #1 hiện chưa ghi nhận review thủ công và không có bình luận review.

Ba checks passed là kết quả kiểm tra tự động của hệ thống, không được tính là ba lượt review của thành viên.

Do đó, nhóm không ghi nhận hoạt động cross-review chính thức trên Pull Request này.

## 6. Chuẩn bị bảo vệ dự án

| Alias | Nội dung phụ trách trình bày |
|---|---|
| Lead-BE | Kiến trúc xử lý phía máy chủ, logic chấm điểm, API và lưu kết quả |
| Dev-FE | Giao diện bài tập, luồng làm bài, kiểm tra dữ liệu và hiển thị phản hồi |
| Dev-TEST | Cấu trúc kiểm thử, các trường hợp kiểm thử, kết quả chạy test và CI |

Các alias cần nắm được luồng hoạt động tổng thể của sản phẩm để có thể giải thích và trả lời câu hỏi khi bảo vệ.

## 7. Sử dụng công cụ hỗ trợ

Trong quá trình thực hiện dự án, nhóm có sử dụng ChatGPT để hỗ trợ:

- Giải thích cấu trúc repository và mã nguồn có sẵn.
- Phân tích yêu cầu và đề xuất phương án triển khai.
- Hỗ trợ tìm nguyên nhân lỗi trong quá trình phát triển.
- Đề xuất các trường hợp kiểm thử.
- Hỗ trợ rà soát và hoàn thiện tài liệu.

Các nội dung do công cụ AI đề xuất được kiểm tra lại thông qua việc đọc mã nguồn, chạy thử chương trình và thực hiện kiểm thử trước khi sử dụng.

Chi tiết về việc sử dụng AI được trình bày trong `AI_USE.md`.
