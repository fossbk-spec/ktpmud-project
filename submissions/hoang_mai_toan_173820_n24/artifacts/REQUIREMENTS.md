
# REQUIREMENTS — Track B: Vườn Toán Lớp 3

- **Nhóm:** N24
- **Phiên bản:** 1.0
- **Trạng thái:** Bản hoàn thiện chuẩn bị nộp
- **Đặc tả gốc:** `docs/architecture-reference.md`
- **Starter:** `fossbk-spec/ktpmud-bkt-vuontoan-starter`, tag `bkt-2026-v1`
- **Commit starter được ghim:** `aca3ea934fadc02251c761443405546c7bc02fc7`

Dự án sử dụng dữ liệu synthetic, không kết nối hệ thống production và không sử dụng dữ liệu học sinh thật.

---

## 1. Phạm vi dự án

### 1.1. Trong phạm vi

Mở rộng ứng dụng Vườn Toán bằng dạng bài tập **ước lượng kết quả trước khi tính đúng**.

Dạng bài tập cho phép học sinh:

1. Đọc câu hỏi phép nhân hoặc phép chia.
2. Nhập một khoảng ước lượng hợp lý cho kết quả.
3. Nộp ước lượng trước khi nhập kết quả chính xác.
4. Nhập kết quả tính chính xác.
5. Nhận phản hồi và điểm cho từng phần.

Bộ câu hỏi sử dụng dữ liệu synthetic, gồm 12 câu hỏi thuộc nội dung nhân và chia trong phạm vi chương trình đã chọn.

Việc chấm điểm được thực hiện bằng quy tắc xác định trong code, không phụ thuộc vào mô hình AI hoặc đánh giá chủ quan.

### 1.2. Ngoài phạm vi

- Thay đổi nội dung hoặc cách chấm của các dạng bài tập cũ.
- Viết lại toàn bộ hệ thống.
- Thay đổi authentication, authorization hoặc session.
- Kết nối cơ sở dữ liệu hay ứng dụng production thật.
- Sử dụng dữ liệu cá nhân thật của học sinh hoặc giáo viên.
- Sử dụng LLM để sinh hoặc chấm đáp án trong lúc chạy.
- Triển khai ứng dụng công khai.

---

## 2. Đối chiếu kiến trúc hệ thống ban đầu

Căn cứ `docs/architecture-reference.md` của starter:

| Hiện trạng của starter | Yêu cầu khi mở rộng |
|---|---|
| Backend sử dụng Node.js và Express | Tiếp tục sử dụng kiến trúc backend hiện có |
| Cơ sở dữ liệu SQLite | Tận dụng cấu trúc dữ liệu hiện có, chỉ mở rộng khi cần thiết |
| Frontend sử dụng HTML, CSS và JavaScript | Tích hợp dạng bài mới vào luồng học tập hiện có |
| Các dạng bài cũ có cơ chế chấm điểm riêng | Không làm thay đổi hành vi của các dạng bài cũ |
| API nộp bài xử lý kết quả và tiến độ học tập | Mở rộng xử lý dạng bài ước lượng, bảo đảm kết quả được lưu |
| Hệ thống authentication và session đã có | Giữ nguyên cơ chế đăng nhập và phân quyền |

### 2.1. Nguyên tắc mở rộng

- Chỉ bổ sung chức năng cần thiết cho dạng bài ước lượng.
- Không viết lại các thành phần nền tảng của starter.
- Không thay đổi ý nghĩa và cách chấm điểm của các dạng bài cũ.
- Không chỉnh sửa `server/auth.js` và các nhóm API authentication, teacher, admin.
- Bảo đảm các chức năng cũ vẫn hoạt động sau khi bổ sung chức năng mới.

---

## 3. Quy tắc nghiệp vụ

### 3.1. Dữ liệu câu hỏi

Mỗi câu hỏi có các thông tin cần thiết để hiển thị và chấm bài, bao gồm:

- Mã câu hỏi.
- Loại câu hỏi.
- Nội dung câu hỏi.
- Điểm tối đa.
- Đáp án chính xác.
- Khoảng đáp án được chấp nhận cho phần ước lượng.

Bộ câu hỏi gồm 12 câu hỏi synthetic về phép nhân và phép chia theo phạm vi đã lựa chọn.

### 3.2. Định dạng đáp án

Đáp án được lưu theo định dạng:

`exact|min-max`

Trong đó:

- `exact`: kết quả chính xác.
- `min`: cận dưới của khoảng đáp án hợp lý.
- `max`: cận trên của khoảng đáp án hợp lý.

Ví dụ:

`14|11-17`

Nghĩa là kết quả chính xác là 14; khoảng ước lượng được chấp nhận là từ 11 đến 17.

### 3.3. Quy tắc kiểm tra ước lượng

Một khoảng ước lượng được xem là hợp lý khi:

- Cận dưới nhỏ hơn cận trên.
- Cả hai giá trị đều là số nguyên không âm.
- Khoảng học sinh nhập có chứa đáp án chính xác.
- Các giá trị nằm trong giới hạn đáp án được quy định cho câu hỏi.

Có thể biểu diễn điều kiện kiểm tra như sau:

`Min ≤ L ≤ E ≤ U ≤ Max`

Trong đó:

- `E`: đáp án chính xác.
- `L`: cận dưới học sinh nhập.
- `U`: cận trên học sinh nhập.
- `Min`, `Max`: giới hạn của khoảng đáp án được chấp nhận.

### 3.4. Quy tắc tính điểm

Mỗi câu hỏi có tối đa 5 điểm:

- 3 điểm nếu khoảng ước lượng hợp lý.
- 2 điểm nếu kết quả tính chính xác đúng.

Hai phần được đánh giá độc lập. Vì vậy, học sinh có thể được điểm phần ước lượng dù tính sai kết quả chính xác, hoặc được điểm phần tính chính xác dù ước lượng chưa hợp lý.

### 3.5. Kiểm tra dữ liệu đầu vào

Hệ thống cần kiểm tra:

- Không bỏ trống các trường bắt buộc.
- Chỉ chấp nhận giá trị số nguyên không âm.
- Cận dưới phải nhỏ hơn cận trên.
- Khoảng nhập phải thỏa mãn điều kiện nghiệp vụ.
- Không chấp nhận dữ liệu sai định dạng hoặc không hợp lệ.

Dữ liệu không hợp lệ phải được xử lý an toàn và trả về thông báo phù hợp.

---

## 4. Acceptance Criteria và truy vết

| Mã | Tiêu chí chấp nhận | Yêu cầu đối với hệ thống | Thành phần liên quan |
|---|---|---|---|
| **B-01** | Tích hợp vào luồng học hiện có | Học sinh truy cập được bài tập ước lượng từ giao diện học tập hiện có, không phải một trang demo độc lập | `public/assets/js/components/curriculum-view.js`, frontend |
| **B-02** | Có đủ dữ liệu câu hỏi | Có ít nhất 12 câu hỏi synthetic phục vụ dạng bài ước lượng | `data/seed.json`, dữ liệu câu hỏi |
| **B-03** | Quy tắc chấm điểm rõ ràng | Quy tắc kiểm tra khoảng ước lượng và kết quả chính xác phải xác định, nhất quán và kiểm thử được | Logic xử lý ước lượng, `DECISIONS.md` |
| **B-04** | Không để lộ đáp án trước khi nộp | API lấy câu hỏi không cung cấp đáp án chính xác cho học sinh trước khi nộp bài | `server/api.js`, logic trả dữ liệu câu hỏi |
| **B-05** | Lưu kết quả và khôi phục trạng thái | Kết quả được lưu phía server; trạng thái bài làm và kết quả đã nộp được khôi phục khi tải lại trang | `server/api.js`, `server/db.js`, `public/assets/js/pages/exercise.js` |
| **B-06** | Phản hồi rõ ràng | Phân biệt kết quả ước lượng và kết quả tính chính xác; hiển thị phản hồi tương ứng với từng phần | Frontend bài tập ước lượng |
| **B-07** | Bảo toàn hệ thống gốc | Không thay đổi cơ chế authentication, session, tài khoản mẫu và deployment của starter | `server/auth.js`, các API auth/teacher/admin |
| **B-08** | Kiểm thử chức năng | Có kiểm thử cho trường hợp hợp lệ, không hợp lệ, trường hợp biên và các tình huống chấm điểm | `tests/` |
| **B-09** | Chạy kiểm thử tự động | Có lệnh `npm test`; kiểm thử có thể chạy từ môi trường cài đặt theo hướng dẫn | `package.json` |
| **B-10** | Tích hợp CI | GitHub Actions chạy cài đặt phụ thuộc và kiểm thử khi có Pull Request hoặc push lên nhánh main | `.github/workflows/ci.yml` |
| **B-11** | Bảo vệ dữ liệu và quyền riêng tư | Chỉ sử dụng dữ liệu synthetic; không đưa thông tin cá nhân hoặc bí mật vào mã nguồn và tài liệu | `data/seed.json`, `README.md`, `SECURITY_PRIVACY_CHECKLIST.md` |
| **B-12** | Khả năng sử dụng và truy cập | Giao diện hỗ trợ thao tác bằng bàn phím, có chỉ báo focus và thông báo lỗi dễ hiểu | Frontend, CSS và `TEST_REPORT.md` |

---

## 5. Kế hoạch kiểm thử

| Nhóm kiểm thử | Nội dung | Kết quả mong đợi |
|---|---|---|
| Kiểm thử dữ liệu câu hỏi | Kiểm tra số lượng và cấu trúc câu hỏi | Có đủ dữ liệu và dữ liệu đúng định dạng |
| Kiểm thử ước lượng | Nhập khoảng hợp lý và không hợp lý | Hệ thống phân loại đúng |
| Kiểm thử kết quả chính xác | Nhập đúng và sai kết quả | Hệ thống chấm đúng phần tính chính xác |
| Kiểm thử dữ liệu không hợp lệ | Bỏ trống, nhập sai định dạng hoặc giá trị không hợp lệ | Hệ thống từ chối dữ liệu và thông báo phù hợp |
| Kiểm thử API | Kiểm tra phản hồi, quyền truy cập và dữ liệu trả về | API xử lý đúng, không để lộ đáp án trước khi nộp |
| Kiểm thử lưu trạng thái | Tải lại trang khi đang làm và sau khi nộp | Trạng thái phù hợp được khôi phục |
| Kiểm thử hồi quy | Kiểm tra các dạng bài cũ | Chức năng cũ không bị ảnh hưởng |
| Kiểm thử giao diện | Kiểm tra thao tác chuột và bàn phím | Giao diện hoạt động đúng và dễ sử dụng |

Kết quả thực tế, môi trường kiểm thử, số lượng test và giới hạn kiểm thử được trình bày trong `TEST_REPORT.md`.

---

## 6. Điều kiện hoàn thành

Dự án được xem là đáp ứng yêu cầu khi:

1. Chức năng ước lượng được tích hợp vào luồng học tập hiện có.
2. Có đủ bộ câu hỏi synthetic theo phạm vi đã xác định.
3. Quy tắc kiểm tra và tính điểm được triển khai nhất quán.
4. Đáp án không bị trả về trước thời điểm được phép.
5. Kết quả được lưu và trạng thái bài làm được khôi phục phù hợp.
6. Các dạng bài cũ vẫn hoạt động bình thường.
7. Các bài kiểm thử tự động chạy thành công.
8. CI thực hiện kiểm thử trên Pull Request.
9. README có hướng dẫn cài đặt, chạy và kiểm thử.
10. Có đầy đủ tài liệu thiết kế, kiểm thử, bảo mật, sử dụng AI và đóng góp của thành viên.

---

## 7. Tài liệu liên quan

| Tài liệu | Nội dung |
|---|---|
| `README.md` | Giới thiệu dự án và hướng dẫn cài đặt, chạy, kiểm thử |
| `DECISIONS.md` | Các quyết định thiết kế và lý do lựa chọn |
| `TEST_REPORT.md` | Môi trường, kết quả kiểm thử và giới hạn |
| `SECURITY_PRIVACY_CHECKLIST.md` | Kiểm tra bảo mật và quyền riêng tư |
| `AI_USE.md` | Khai báo và mô tả việc sử dụng AI |
| `CONTRIBUTIONS.md` | Phân công và đóng góp của thành viên |

---

## 8. Cơ sở kiến trúc và đặc tả gốc

### 8.1. Starter và tài liệu chuẩn

- Repository gốc: `fossbk-spec/ktpmud-bkt-vuontoan-starter`.
- Tag starter: `bkt-2026-v1`.
- Commit starter được ghim: `aca3ea934fadc02251c761443405546c7bc02fc7`.
- Công nghệ: Node.js, Express, SQLite, JavaScript, HTML và CSS.
- Tài liệu kiến trúc chính thức: `docs/architecture-reference.md`.

Tài liệu kiến trúc mô tả hệ thống ban đầu và các thành phần hiện có, không phải lời giải được thiết kế sẵn cho chức năng mới.

### 8.2. Nguyên tắc tương thích

Chức năng mới phải mở rộng hệ thống hiện tại, không làm thay đổi hành vi của các dạng câu hỏi cũ.

Các thành phần authentication, session, tài khoản mẫu và deployment nằm ngoài phạm vi thay đổi của nhóm.

### 8.3. Căn cứ thiết kế chấm điểm

Hệ thống ban đầu sử dụng cơ chế so sánh đáp án chính xác. Cơ chế này không đáp ứng trực tiếp yêu cầu chấm một khoảng ước lượng.

Vì vậy, chức năng mới cần có logic xử lý riêng cho phần ước lượng, đồng thời giữ nguyên cơ chế chấm của các dạng bài cũ.

Các quyết định về cách tổ chức logic, cách lưu dữ liệu và cách tích hợp vào luồng nộp bài được giải thích trong `DECISIONS.md`.
