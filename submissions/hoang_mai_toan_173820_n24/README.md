
# Vườn Toán Lớp 3 – Ước lượng trước khi tính đúng

## 1. Thông tin bài nộp

- **Track:** Track B – Vườn Toán Lớp 3: Ước lượng trước khi tính đúng
- **Nhóm:** Nhóm 24
- **Tên thư mục bài nộp:** 'submissions\hoang_mai_toan_24\'

## 2. Thành viên

| Alias | Vai trò |
|---|---|
| Lead-BE | Leader |
| Dev-FE | Member |
| Dev-TEST | Member |

## 3. Giới thiệu sản phẩm

Vườn Toán Lớp 3 là ứng dụng hỗ trợ học sinh lớp 3 rèn luyện kỹ năng ước lượng trước khi thực hiện phép tính chính xác.

Trong phần bài tập ước lượng, học sinh cần đưa ra khoảng giá trị hợp lý cho kết quả, sau đó nhập đáp án chính xác. Hệ thống kiểm tra câu trả lời và phản hồi kết quả để giúp học sinh tự đánh giá khả năng ước lượng của mình.

## 4. Chức năng đã triển khai

- Hiển thị danh sách câu hỏi ước lượng.
- Cho phép học sinh nhập cận dưới và cận trên của khoảng ước lượng.
- Kiểm tra dữ liệu đầu vào, không chấp nhận dữ liệu không hợp lệ.
- Cho phép học sinh nhập kết quả chính xác sau khi hoàn thành khoảng ước lượng hợp lệ.
- Chấm điểm câu trả lời ở phía máy chủ.
- Lưu kết quả bài làm và điểm số vào hệ thống.
- Hiển thị phản hồi sau khi nộp bài.
- Khôi phục kết quả bài làm đã nộp khi tải lại trang.

## 5. Cách tính điểm

Mỗi câu hỏi có tổng điểm tối đa là 5 điểm:

- 3 điểm nếu khoảng ước lượng hợp lý.
- 2 điểm nếu kết quả chính xác đúng.

Việc đánh giá khoảng ước lượng và kết quả chính xác được thực hiện theo quy tắc chấm điểm triển khai ở phía máy chủ.

## 6. Công nghệ sử dụng

- **Backend:** Node.js, Express.
- **Database:** SQLite.
- **Frontend:** HTML, CSS, JavaScript.
- **Kiểm thử:** Node.js Test Runner.

## 7. Cài đặt và chạy chương trình

### 7.1. Yêu cầu môi trường

- Node.js (khuyến nghị Node.js 22).
- npm đi kèm với Node.js.
- Git để tải mã nguồn.

### 7.2. Cài đặt

Mở terminal tại thư mục gốc dự án và chạy:

```bash
npm ci
```

Lệnh trên cài đặt các thư viện theo cấu hình và lockfile của dự án.

### 7.3. Khởi động ứng dụng

Chạy lệnh:

```bash
npm start
```

Ứng dụng được khởi động thông qua file:

```text
server/index.js
```

Sau khi khởi động thành công, mở địa chỉ localhost và cổng được ứng dụng thông báo trong terminal.

### 7.4. Chạy chế độ phát triển

Có thể sử dụng:

```bash
npm run dev
```

Hiện tại, script `dev` cũng khởi động ứng dụng thông qua `server/index.js`.

### 7.5. Chạy kiểm thử

Chạy toàn bộ kiểm thử bằng lệnh:

```bash
npm test
```

Dự án sử dụng Node.js Test Runner thông qua lệnh `node --test`.

### 7.6. Các lệnh khác

| Lệnh | Chức năng |
|---|---|
| `npm run build:css` | Biên dịch CSS bằng script của dự án |
| `npm run reset-db` | Xóa cơ sở dữ liệu SQLite hiện tại để tạo lại khi khởi động ứng dụng |

**Lưu ý:** `npm run reset-db` xóa dữ liệu cơ sở dữ liệu hiện tại. Chỉ sử dụng khi cần thiết và đã chấp nhận mất dữ liệu đang lưu.

## 8. Cấu trúc dự án

Các thư mục và tệp chính:

```text
ktpmud-bkt-vuontoan-starter/
├── server/                 # Mã nguồn phía máy chủ
├── public/                 # Giao diện người dùng
│   └── assets/
│       └── js/             # JavaScript phía frontend
├── data/                   # Dữ liệu mẫu và SQLite
├── tests/                  # Các bài kiểm thử
├── tools/                  # Công cụ hỗ trợ
├── .github/
│   └── workflows/          # Cấu hình CI
├── submissions/
│   └── hoang_mai_toan_24/
│       ├── README.md
│       └── artifacts/      # Tài liệu bàn giao
├── package.json
└── package-lock.json
```

## 9. Tài liệu bàn giao

Các tài liệu của nhóm được lưu trong thư mục:

```text
submissions/hoang_mai_toan_24/artifacts/
```

| Tài liệu | Nội dung |
|---|---|
| `REQUIREMENTS.md` | Yêu cầu và tiêu chí nghiệm thu |
| `DECISIONS.md` | Các quyết định thiết kế và lý do lựa chọn |
| `TEST_REPORT.md` | Báo cáo kiểm thử và kết quả |
| `CONTRIBUTIONS.md` | Phân công vai trò và phạm vi đóng góp |
| `SECURITY_PRIVACY_CHECKLIST.md` | Rà soát bảo mật và quyền riêng tư |
| `AI_USE.md` | Nhật ký sử dụng AI |

## 10. Phạm vi và giới hạn

- Đây là phiên bản MVP phục vụ bài tập Hackathon Track B.
- Dữ liệu sử dụng trong quá trình kiểm thử và minh họa là dữ liệu mẫu.
- Ứng dụng sử dụng SQLite trong môi trường chạy cục bộ.
- Phiên bản này không được triển khai như một hệ thống production.
- Không kết nối cơ sở dữ liệu hoặc dịch vụ sản xuất.
- Chưa thực hiện kiểm thử xâm nhập bảo mật chuyên sâu.

## 11. Kiểm thử và xác nhận

Nhóm đã chạy bộ kiểm thử tự động bằng:

```bash
npm test
```

Kết quả kiểm thử tại thời điểm lập tài liệu:

- Unit tests: 22/22 đạt.
- API tests: 9/9 đạt.
- UI tests: 19/19 đạt.
- Tổng số test được Node.js Test Runner ghi nhận: 52, bao gồm cả 2 nhóm test.

Chi tiết kết quả và phạm vi kiểm thử được trình bày trong `artifacts/TEST_REPORT.md`.

---

**Nhóm 24 – Track B**
**Vườn Toán Lớp 3 – Ước lượng trước khi tính đúng**
