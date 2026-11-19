
# DECISIONS.md

# Quyết định thiết kế và kiến trúc – Vườn Toán N24

## 1. Thông tin chung

| Thuộc tính | Nội dung |
|---|---|
| Dự án | Vườn Toán – Track B |
| Nhóm | N24 |
| Phiên bản | 1.0 |
| Phạm vi | Bổ sung dạng luyện tập ước lượng kết quả trước khi tính chính xác |
| Nền tảng | Node.js, Express, SQLite, HTML, CSS, JavaScript |
| Phiên bản starter | `bkt-2026-v1` |

## 2. Mục tiêu thiết kế

Nhóm bổ sung dạng bài tập **Ước lượng kết quả trước khi tính đúng** cho các phép nhân và chia.

Người học cần thực hiện hai bước:

1. Nhập khoảng ước lượng gồm cận dưới và cận trên.
2. Nhập kết quả tính chính xác.

Hệ thống kiểm tra hai phần độc lập, tính điểm và đưa ra phản hồi tương ứng.

Các nguyên tắc thiết kế:

- Logic đúng/sai và chấm điểm phải tất định bằng code.
- Không sử dụng LLM làm nguồn đáp án hoặc công cụ quyết định đúng/sai.
- Không làm thay đổi cách hoạt động của các dạng câu hỏi cũ.
- Tận dụng kiến trúc và cơ sở dữ liệu của starter.
- Có thể kiểm thử các quy tắc chấm điểm bằng automated tests.

---

## 3. Danh sách quyết định kiến trúc

| Mã ADR | Quyết định | Trạng thái |
|---|---|---|
| ADR-00 | Bổ sung type câu hỏi `estimate` | Accepted |
| ADR-01 | Đặt bài luyện tập riêng trong luồng bài học hiện có | Accepted |
| ADR-02 | Cấu hình trước khoảng ước lượng được chấp nhận cho từng câu | Accepted |
| ADR-03 | Mã hóa đáp án theo định dạng `exact|min-max` | Accepted |
| ADR-04 | Chia điểm độc lập giữa phần ước lượng và phần tính chính xác | Accepted |
| ADR-05 | Tách logic chấm ước lượng thành module riêng | Accepted |
| ADR-06 | Kiểm tra dữ liệu đầu vào trước khi chấm | Accepted |
| ADR-07 | Hỗ trợ thao tác bàn phím và điều hướng giữa các trường | Accepted |
| ADR-08 | Sử dụng bộ câu hỏi được cấu hình sẵn, có đáp án cố định | Accepted |
| ADR-09 | Chỉ chấp nhận số nguyên không âm cho các trường trả lời | Accepted |
| ADR-10 | Hỗ trợ khôi phục trạng thái bài làm và kết quả đã nộp | Accepted |
| ADR-11 | Chấm điểm và lưu kết quả ở phía máy chủ | Accepted |
| ADR-12 | Sử dụng automated tests để kiểm tra logic, API và giao diện | Accepted |
| ADR-13 | Tích hợp kiểm thử tự động bằng GitHub Actions | Accepted |

---

## 4. Chi tiết các quyết định (ADRs)

### ADR-00: Bổ sung type câu hỏi `estimate`

**Bối cảnh**

Starter hiện có các dạng câu hỏi như `multiple-choice`, `input`, `compare` và `paint`. Cách chấm mặc định của các dạng cũ dựa trên việc so sánh câu trả lời với đáp án đã lưu.

Dạng luyện tập ước lượng cần kiểm tra đồng thời một khoảng ước lượng và một kết quả tính chính xác. Vì vậy, cách so sánh chuỗi thông thường không đáp ứng đầy đủ yêu cầu.

**Quyết định**

Bổ sung type mới có tên `estimate`.

Các câu hỏi thuộc type này được xử lý bằng logic chấm riêng. Các type cũ tiếp tục sử dụng cách chấm hiện có.

**Lý do lựa chọn**

- Phân biệt rõ nghiệp vụ của dạng bài ước lượng với các dạng câu hỏi cũ.
- Không làm thay đổi logic chấm của những dạng bài đã có.
- Dễ mở rộng và kiểm thử độc lập.
- Phù hợp với phương án thêm type mới được gợi ý trong đề bài.

**Phạm vi ảnh hưởng**

- Dữ liệu câu hỏi.
- Module xử lý câu hỏi.
- API nộp bài.
- Giao diện làm bài.
- Automated tests.

---

### ADR-01: Đặt bài luyện tập riêng trong luồng bài học hiện có

**Bối cảnh**

Nhóm cần bổ sung bài luyện tập ước lượng nhưng không muốn thay thế hoặc làm ảnh hưởng các bài tập cũ.

**Quyết định**

Bổ sung một hoạt động luyện tập ước lượng riêng trong luồng bài học hiện có, tại bài học số 10.

Người học có thể truy cập hoạt động này từ giao diện chương trình học thông qua mục luyện tập ước lượng.

**Lý do lựa chọn**

- Tận dụng cấu trúc giao diện hiện tại.
- Không phải xây dựng một hệ thống học tập riêng.
- Giữ được sự phân biệt giữa hoạt động luyện tập mới và các bài tập cũ.
- Hạn chế phạm vi thay đổi mã nguồn.

---

### ADR-02: Cấu hình trước khoảng ước lượng được chấp nhận cho từng câu

**Bối cảnh**

Đề bài yêu cầu quy tắc tạo và chấm ước lượng phải rõ ràng, tất định và có thể kiểm thử.

Không có một quy tắc chấm khoảng ước lượng chung được quy định sẵn trong phần yêu cầu mà nhóm sử dụng. Nhóm cần tự thiết kế cách xác định một khoảng được xem là hợp lý.

**Quyết định**

Nhóm lựa chọn cấu hình trước đáp án chính xác và khoảng ước lượng được chấp nhận cho từng câu hỏi.

Mỗi câu có:
- Đáp án chính xác.
- Giới hạn dưới được chấp nhận.
- Giới hạn trên được chấp nhận.

Khi chấm bài, hệ thống kiểm tra khoảng học sinh nhập theo các điều kiện:

- Cận dưới nhỏ hơn cận trên.
- Cận dưới không nhỏ hơn giới hạn dưới đã cấu hình.
- Cận dưới không lớn hơn đáp án chính xác.
- Cận trên không nhỏ hơn đáp án chính xác.
- Cận trên không vượt quá giới hạn trên đã cấu hình.

Có thể biểu diễn quy tắc như sau:

`minAllowed <= L <= exact <= U <= maxAllowed`

Trong đó:
- `L`: cận dưới học sinh nhập.
- `U`: cận trên học sinh nhập.
- `exact`: đáp án chính xác.
- `minAllowed`: giới hạn dưới được chấp nhận.
- `maxAllowed`: giới hạn trên được chấp nhận.

Đồng thời, yêu cầu `L < U` phải được thỏa mãn.

**Lý do lựa chọn**

- Tiêu chí chấm của từng câu được xác định rõ ràng.
- Cùng một dữ liệu đầu vào luôn cho cùng một kết quả.
- Không cần sử dụng LLM để đánh giá câu trả lời.
- Dễ kiểm thử các trường hợp đúng, sai và sát biên.
- Cho phép kiểm soát khoảng chấp nhận phù hợp với từng phép tính thay vì áp dụng một tỷ lệ chung cho mọi câu.

**Lưu ý**

Khoảng được chấp nhận phải có căn cứ hợp lý đối với nội dung toán học của từng câu. Việc cấu hình trước không có nghĩa là lựa chọn giới hạn tùy ý.

---

### ADR-03: Mã hóa đáp án theo định dạng `exact|min-max`

**Bối cảnh**

Hệ thống cần lưu đồng thời đáp án chính xác và khoảng ước lượng được chấp nhận.

Nhóm cần một cách biểu diễn đơn giản, có thể sử dụng với cấu trúc dữ liệu câu hỏi hiện tại.

**Quyết định**

Sử dụng trường `correct_answer` với định dạng:

`exact|min-max`

Ví dụ:

`100|80-120`

Trong đó:
- `100` là đáp án chính xác.
- `80` là giới hạn dưới.
- `120` là giới hạn trên.

Module `server/estimate.js` phân tích chuỗi này thành các giá trị số để phục vụ việc chấm điểm.

**Lý do lựa chọn**

- Tận dụng trường dữ liệu `correct_answer` hiện có.
- Không cần bổ sung cột riêng trong database.
- Dễ cấu hình dữ liệu câu hỏi.
- Có thể kiểm tra định dạng và tính hợp lệ trước khi chấm.

**Ràng buộc dữ liệu**

- Đáp án phải đúng định dạng.
- Các giá trị phải là số hợp lệ.
- Đáp án chính xác phải là số nguyên không âm.
- Giới hạn dưới không âm.
- Giới hạn trên không âm.
- Giới hạn dưới không được lớn hơn đáp án chính xác.
- Đáp án chính xác không được lớn hơn giới hạn trên.

---

### ADR-04: Chia điểm độc lập giữa phần ước lượng và phần tính chính xác

**Bối cảnh**

Dạng bài mới có hai yêu cầu khác nhau:
- Ước lượng hợp lý.
- Tính chính xác kết quả.

Nếu chỉ chấm toàn bộ câu hỏi đúng hoặc sai, hệ thống không thể phản ánh phần kiến thức người học đã thực hiện đúng.

**Quyết định**

Mỗi câu hỏi ước lượng có tổng điểm 5 điểm.

Điểm được chia thành:
- 60% cho phần ước lượng.
- 40% cho phần tính chính xác.

Với câu hỏi 5 điểm:
- Ước lượng đúng: 3 điểm.
- Tính chính xác đúng: 2 điểm.
- Đúng cả hai: 5 điểm.
- Sai cả hai: 0 điểm.

Công thức triển khai:

`estimatePoints = Math.round(points * 0.6)`

`exactPoints = points - estimatePoints`

Tổng điểm nhận được là tổng điểm của hai phần đúng.

**Lý do lựa chọn**

- Đánh giá riêng khả năng ước lượng và tính toán.
- Khuyến khích người học suy nghĩ về độ lớn của kết quả trước khi tính.
- Không loại bỏ toàn bộ điểm khi người học chỉ sai một trong hai bước.
- Quy tắc đơn giản, nhất quán và có thể kiểm thử.

---

### ADR-05: Tách logic chấm ước lượng thành module riêng

**Bối cảnh**

Logic chấm dạng `estimate` phức tạp hơn cách so sánh chuỗi của các dạng câu hỏi cũ.

Nếu đặt toàn bộ logic vào API, mã nguồn sẽ khó đọc, khó kiểm thử và khó bảo trì.

**Quyết định**

Tách logic xử lý ước lượng vào module:

`server/estimate.js`

Module đảm nhiệm các chức năng:
- Phân tích giá trị số.
- Phân tích đáp án đã lưu.
- Kiểm tra khoảng ước lượng.
- Phân loại phản hồi.
- Tính điểm cho câu hỏi ước lượng.

API trong `server/api.js` gọi module này khi xử lý câu hỏi có type `estimate`.

**Lý do lựa chọn**

- Tách biệt nghiệp vụ chấm điểm với xử lý HTTP.
- Có thể kiểm thử logic chấm độc lập.
- Dễ đọc, bảo trì và mở rộng.
- Giảm nguy cơ ảnh hưởng đến logic của các dạng câu hỏi cũ.

---

### ADR-06: Kiểm tra dữ liệu đầu vào trước khi chấm

**Bối cảnh**

Người học có thể nhập dữ liệu không hợp lệ như bỏ trống, nhập chữ, số âm, số thập phân hoặc nhập cận dưới lớn hơn cận trên.

Nếu không kiểm tra dữ liệu, hệ thống có thể chấm sai hoặc xử lý kết quả không nhất quán.

**Quyết định**

Kiểm tra dữ liệu đầu vào trước khi chuyển sang bước tiếp theo.

Các trường trả lời phải đáp ứng quy tắc dữ liệu của dạng bài:
- Có giá trị.
- Là số hợp lệ.
- Là số nguyên.
- Không âm.
- Với khoảng ước lượng, cận dưới phải nhỏ hơn cận trên.

Nếu dữ liệu không hợp lệ, giao diện hiển thị thông báo để người học sửa lại và không chuyển tiếp như một câu trả lời hợp lệ.

**Lý do lựa chọn**

- Ngăn dữ liệu sai định dạng.
- Giúp người học nhận biết và sửa lỗi.
- Đảm bảo dữ liệu gửi lên máy chủ phù hợp với quy tắc chấm.
- Hạn chế các trường hợp biên gây lỗi.

---

### ADR-07: Hỗ trợ thao tác bàn phím và điều hướng giữa các trường

**Bối cảnh**

Bài tập có nhiều trường nhập liệu. Người học cần thao tác thuận tiện bằng bàn phím, không phụ thuộc hoàn toàn vào chuột.

**Quyết định**

Hỗ trợ điều hướng bàn phím theo thứ tự:

`L → U → X`

Trong đó:
- `L`: cận dưới.
- `U`: cận trên.
- `X`: kết quả tính chính xác.

Phím Enter tại trường L chuyển đến U.

Phím Enter tại trường U chuyển đến X.

Phím Enter tại trường X không tự động nộp bài.

Các trường có thể được điều hướng bằng Tab và Shift+Tab. Giao diện cần thể hiện rõ trạng thái focus để người học nhận biết vị trí đang thao tác.

**Lý do lựa chọn**

- Tăng khả năng sử dụng bằng bàn phím.
- Giúp thao tác nhập liệu có trình tự.
- Tránh việc nhấn Enter vô tình nộp bài khi người học chưa hoàn thành.

---

### ADR-08: Sử dụng bộ câu hỏi được cấu hình sẵn, có đáp án cố định

**Bối cảnh**

Đề bài yêu cầu logic đúng/sai và đáp án phải tất định bằng code, không sử dụng LLM làm nguồn đáp án.

**Quyết định**

Nhóm sử dụng bộ câu hỏi được cấu hình trước trong dữ liệu seed.

Mỗi câu hỏi có:
- Nội dung câu hỏi.
- Phép tính tương ứng.
- Đáp án chính xác.
- Khoảng ước lượng được chấp nhận.
- Điểm số.

Bộ câu hỏi của phiên bản hiện tại gồm 12 câu hỏi nhân và chia được cấu hình sẵn.

**Lý do lựa chọn**

- Đáp án và tiêu chí chấm được kiểm soát trước.
- Kết quả chấm không phụ thuộc vào dịch vụ bên ngoài.
- Dễ kiểm thử với dữ liệu cố định.
- Phù hợp với phạm vi MVP của dự án.

---

### ADR-09: Chỉ chấp nhận số nguyên không âm cho các trường trả lời

**Bối cảnh**

Các câu hỏi trong bộ luyện tập hiện tại sử dụng kết quả và khoảng ước lượng dạng số nguyên không âm.

Dữ liệu không đúng kiểu có thể làm sai lệch quá trình chấm.

**Quyết định**

Các trường nhập cận dưới, cận trên và kết quả chính xác chỉ chấp nhận số nguyên không âm.

Không chấp nhận:
- Chữ hoặc ký tự không phải số.
- Số âm.
- Số thập phân.
- Giá trị để trống.

Đối với khoảng ước lượng, cận dưới phải nhỏ hơn cận trên.

Máy chủ cũng kiểm tra kiểu và giá trị dữ liệu trước khi xác định kết quả.

**Lý do lựa chọn**

- Phù hợp với bộ câu hỏi hiện tại.
- Đơn giản hóa quy tắc chấm.
- Tránh các trường hợp dữ liệu không hợp lệ.
- Đảm bảo tính nhất quán giữa giao diện và máy chủ.

---

### ADR-10: Hỗ trợ khôi phục trạng thái bài làm và kết quả đã nộp

**Bối cảnh**

Người học có thể tải lại trang hoặc quay lại bài tập sau khi đã thực hiện một phần hoặc đã nộp bài.

Nếu không có cơ chế khôi phục, người học có thể mất trạng thái làm bài hoặc không xem lại được kết quả đã nộp.

**Quyết định**

Bổ sung cơ chế khôi phục trạng thái bài làm và kết quả đã nộp.

Giao diện ưu tiên khôi phục bản nháp nếu có. Khi không có bản nháp, hệ thống có thể truy vấn kết quả đã nộp gần nhất từ máy chủ.

API cung cấp dữ liệu kết quả gần nhất theo bộ câu hỏi và người dùng đã xác thực.

Kết quả đã nộp được lưu ở phía máy chủ và có thể được hiển thị lại khi người học tải lại trang.

**Lý do lựa chọn**

- Hạn chế mất tiến trình học tập.
- Cho phép người học xem lại kết quả sau khi tải lại trang.
- Giữ kết quả đã nộp gắn với tài khoản người học.
- Tận dụng cơ chế lưu bài làm hiện có.

---

### ADR-11: Chấm điểm và lưu kết quả ở phía máy chủ

**Bối cảnh**

Nếu chỉ chấm điểm trên giao diện, người dùng có thể can thiệp vào dữ liệu hoặc kết quả trả về từ trình duyệt.

Đề bài yêu cầu logic đúng/sai phải tất định và được triển khai bằng code.

**Quyết định**

Máy chủ chịu trách nhiệm chấm điểm và lưu kết quả.

Khi nhận yêu cầu nộp bài tại `POST /api/submissions`:

1. Kiểm tra bộ câu hỏi.
2. Lấy danh sách câu hỏi và đáp án từ database.
3. Xác định type của từng câu.
4. Với câu hỏi `estimate`, gọi logic trong `server/estimate.js`.
5. Tính điểm từng câu và tổng điểm.
6. Lưu kết quả bài làm vào database.
7. Trả kết quả chấm cho giao diện.

Các câu hỏi thuộc type cũ tiếp tục sử dụng logic chấm hiện có.

**Lý do lựa chọn**

- Không phụ thuộc vào kết quả tự tính từ trình duyệt.
- Giữ đáp án chuẩn và logic chấm ở phía máy chủ.
- Đảm bảo cùng một câu trả lời luôn được xử lý theo cùng quy tắc.
- Tận dụng cơ chế lưu bài làm hiện có.

---

### ADR-12: Sử dụng automated tests để kiểm tra logic, API và giao diện

**Bối cảnh**

Các quy tắc chấm ước lượng có nhiều trường hợp cần kiểm tra, đặc biệt là trường hợp sát giới hạn, dữ liệu không hợp lệ và cách tính điểm từng phần.

Chỉ kiểm tra thủ công không đủ để đảm bảo các thay đổi sau này không làm sai logic.

**Quyết định**

Sử dụng Node.js built-in test runner để chạy automated tests.

Các nhóm kiểm thử gồm:

- Unit tests: kiểm tra logic phân tích đáp án, xác định khoảng hợp lý, tính điểm và phản hồi.
- API tests: kiểm tra quá trình nộp bài, chấm điểm và xử lý dữ liệu.
- UI tests: kiểm tra hiển thị, nhập liệu, điều hướng và khôi phục trạng thái bài làm.

Các trường hợp cần kiểm thử:
- Câu trả lời đúng.
- Câu trả lời sai.
- Đúng phần ước lượng nhưng sai kết quả chính xác.
- Sai phần ước lượng nhưng đúng kết quả chính xác.
- Đúng cả hai phần.
- Khoảng ước lượng nằm sát giới hạn.
- Khoảng không chứa đáp án chính xác.
- Cận dưới lớn hơn hoặc bằng cận trên.
- Dữ liệu trống, không phải số, số âm hoặc số thập phân.
- Khôi phục trạng thái sau khi tải lại trang.

**Lý do lựa chọn**

- Kiểm tra được từng quy tắc nghiệp vụ.
- Phát hiện lỗi khi thay đổi mã nguồn.
- Có thể chạy lại nhanh trên môi trường phát triển và CI.
- Giúp chứng minh tính tất định của logic chấm.

---

### ADR-13: Tích hợp kiểm thử tự động bằng GitHub Actions

**Bối cảnh**

Việc kiểm thử chỉ trên máy cá nhân có thể bỏ sót lỗi do môi trường hoặc thay đổi mã nguồn giữa các thành viên.

Nhóm cần cơ chế tự động chạy test khi có thay đổi trên repository.

**Quyết định**

Sử dụng GitHub Actions để tự động kiểm thử khi có:
- Push lên nhánh `main`.
- Pull Request.

Workflow thực hiện:
1. Thiết lập môi trường Node.js.
2. Cài đặt dependencies bằng `npm ci`.
3. Chạy automated tests bằng `npm test`.

Workflow được cấu hình để kiểm thử trên các phiên bản Node.js 18, 20 và 22.

**Lý do lựa chọn**

- Phát hiện lỗi sớm sau mỗi thay đổi.
- Kiểm tra mã nguồn trong môi trường CI độc lập.
- Giảm phụ thuộc vào thao tác kiểm thử thủ công.
- Hỗ trợ kiểm soát chất lượng trước khi hợp nhất thay đổi.

---

## 5. Tổng kết

Nhóm N24 lựa chọn mở rộng starter bằng một type câu hỏi mới `estimate`, thay vì thay đổi toàn bộ cơ chế làm bài hiện có.

Quyết định quan trọng nhất là cấu hình trước đáp án chính xác và khoảng ước lượng được chấp nhận cho từng câu hỏi. Máy chủ sử dụng thuật toán xác định để kiểm tra khoảng học sinh nhập và tính điểm độc lập cho hai bước ước lượng và tính chính xác.

Cách thiết kế này hướng đến các mục tiêu:

- Logic chấm rõ ràng và tất định.
- Không sử dụng LLM làm nguồn đáp án.
- Không làm thay đổi cách chấm của các dạng câu hỏi cũ.
- Dễ kiểm thử, bảo trì và mở rộng.
- Tận dụng kiến trúc và cơ chế lưu trữ của starter.