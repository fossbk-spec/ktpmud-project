
# AI_USE — NHÓM N24 — TRACK B

**Dự án:** Vườn Toán Lớp 3
**Nhóm:** N24
**Track:** B – Phát triển tính năng
**Ngày cập nhật:** 19/11/2026

## 1. Công cụ và model

| Công cụ | Model / phiên bản |
|---|---|
| ChatGPT | GPT-6 (theo thông tin model hiển thị trong phiên sử dụng) |

## 2. Mục đích sử dụng

AI được sử dụng như công cụ hỗ trợ trong quá trình tìm hiểu, phát triển, kiểm thử và hoàn thiện tài liệu dự án.

Các tác vụ được AI hỗ trợ:

- Giải thích cấu trúc dự án và mã nguồn starter.
- Hỗ trợ phân tích yêu cầu chức năng "Ước lượng trước khi tính đúng".
- Đề xuất cách tổ chức logic kiểm tra dữ liệu và chấm điểm.
- Hỗ trợ đọc hiểu, rà soát và tìm nguyên nhân lỗi trong mã nguồn.
- Gợi ý các trường hợp kiểm thử và tình huống biên.
- Hỗ trợ đọc hiểu Git, GitHub, quy trình commit, branch, pull request và nộp bài.
- Hỗ trợ soạn thảo, rà soát và chuẩn hóa tài liệu bàn giao.

AI chỉ đóng vai trò hỗ trợ. Quyết định cuối cùng về thiết kế, mã nguồn, kiểm thử và nội dung bàn giao thuộc về nhóm.

## 3. Phạm vi sử dụng

Các file/module và commit liên quan đến quá trình AI hỗ trợ:

| File / module | Phạm vi AI hỗ trợ | Commit liên quan |
|---|---|---|
| `server/estimate.js` | Giải thích và rà soát logic kiểm tra khoảng ước lượng, đáp án chính xác và chấm điểm | `a19d3f8` |
| `server/api.js` | Hỗ trợ đọc hiểu và phân tích tích hợp chức năng ước lượng vào API | `a19d3f8`, `6b9bd26` |
| `server/db.js` | Hỗ trợ đọc hiểu phần truy xuất và lưu trữ dữ liệu | `a19d3f8` |
| `data/seed.json` | Hỗ trợ kiểm tra cấu trúc dữ liệu câu hỏi mẫu | `a19d3f8` |
| `public/exercise.html` | Giải thích cấu trúc giao diện bài tập | `a19d3f8` |
| `public/assets/js/pages/exercise.js` | Hỗ trợ phân tích tương tác, kiểm tra dữ liệu nhập và khôi phục trạng thái bài làm | `a19d3f8`, `6b9bd26` |
| `public/assets/js/components/curriculum-view.js` | Hỗ trợ đọc hiểu và rà soát giao diện điều hướng bài học | `a19d3f8` |
| `tests/` | Gợi ý trường hợp kiểm thử và hỗ trợ rà soát test | `a19d3f8`, `6b9bd26` |
| `.github/workflows/ci.yml` | Giải thích cấu hình kiểm thử tự động trên GitHub Actions | `a19d3f8` |
| `artifacts/` | Hỗ trợ soạn thảo, rà soát tài liệu yêu cầu, quyết định thiết kế, báo cáo kiểm thử, đóng góp thành viên, bảo mật và AI-use | `534d9c4`, `7c9849d`, `58d89cf`, `6b9bd26` |

Các commit trên là những mốc thay đổi có liên quan trong lịch sử repository, không có nghĩa mỗi commit chỉ chứa nội dung do AI tạo ra.

AI cũng được sử dụng để giải thích thao tác Git/GitHub và hỗ trợ quy trình hoàn thiện sản phẩm.

## 4. Kiểm chứng đầu ra AI

Nhóm không mặc định chấp nhận mọi đề xuất của AI. Các nội dung được sử dụng phải được đối chiếu và kiểm tra trước khi tích hợp.

Các phương pháp kiểm chứng:

- Đối chiếu đề xuất với yêu cầu và phạm vi của Track B.
- Kiểm tra mã nguồn thực tế sau khi chỉnh sửa.
- Đối chiếu hành vi chức năng với các tiêu chí chấp nhận.
- Chạy bộ kiểm thử bằng lệnh `npm.cmd test`.
- Rà soát thay đổi để tránh ảnh hưởng các thành phần nằm ngoài phạm vi được phép sửa theo B-07.
- Kiểm tra kết quả CI trên GitHub Actions.

**Kết quả kiểm thử tại thời điểm lập tài liệu:**

| Nhóm kiểm thử | Kết quả |
|---|---:|
| Unit tests | 22/22 đạt |
| API tests | 9/9 đạt |
| UI tests | 19/19 đạt |
| Tổng kết Node.js Test Runner | 52 passed, 0 failed |

Kết quả trên phản ánh lần chạy kiểm thử trên máy phát triển ngày 19/11/2026. CI trên GitHub Actions cũng đã có kết quả thành công.

## 5. Quyết định của nhóm

| Nội dung AI hỗ trợ | Quyết định | Lý do |
|---|---|---|
| Giải thích cấu trúc và mã nguồn | Giữ và đối chiếu | Giúp hiểu dự án trước khi chỉnh sửa |
| Phân tích yêu cầu chức năng | Chọn lọc và điều chỉnh | Phải phù hợp với đề bài và phạm vi Track B |
| Đề xuất logic kiểm tra, chấm điểm | Kiểm tra và điều chỉnh | Bảo đảm nhất quán với quyết định thiết kế |
| Gợi ý kiểm thử | Bổ sung và rà soát | Phải phù hợp với hành vi thực tế của chương trình |
| Hỗ trợ sửa lỗi | Chỉ tích hợp sau khi kiểm tra | Tránh phát sinh lỗi mới hoặc ảnh hưởng chức năng cũ |
| Soạn thảo tài liệu | Chỉnh sửa và đối chiếu | Bảo đảm nội dung phản ánh đúng sản phẩm của nhóm |

Những đề xuất không phù hợp với yêu cầu, phạm vi hoặc kết quả kiểm thử được chỉnh sửa hoặc loại bỏ.

Nhóm chịu trách nhiệm đối với toàn bộ nội dung được đưa vào repository và sản phẩm bàn giao, kể cả nội dung có sự hỗ trợ của AI.

## 6. Người chịu trách nhiệm review và chấp thuận

| Mã thành viên | Vai trò | Phạm vi review và chấp thuận |
|---|---|---|
| Lead-BE | Leader / Backend | Nội dung liên quan đến backend, logic kiểm tra và chấm điểm, API và lưu trữ dữ liệu |
| Dev-FE | Frontend | Nội dung liên quan đến giao diện, tương tác người dùng và luồng làm bài |
| Dev-TEST | Testing & Documentation | Nội dung liên quan đến kiểm thử, kết quả test, CI và tài liệu bàn giao |

Việc phân công thể hiện trách nhiệm review theo phạm vi kỹ thuật của từng vai trò. Đây không phải bằng chứng xác nhận từng thành viên đã thực hiện review độc lập nếu không có lịch sử review hoặc bằng chứng tương ứng.

Nhóm chịu trách nhiệm cuối cùng đối với các nội dung được tích hợp vào repository và sản phẩm bàn giao.

## 7. Quyền riêng tư và bảo mật

Nhóm tuân thủ các nguyên tắc sau:

- Không đưa mật khẩu, API key, access token, cookie hoặc thông tin xác thực vào nội dung gửi AI.
- Không đưa thông tin cá nhân thật của học sinh, giáo viên hoặc thành viên nhóm vào nội dung gửi AI.
- Không sử dụng dữ liệu bệnh nhân, học sinh hoặc giáo viên thật trong quá trình phát triển và kiểm thử.
- Không commit token, API key, cookie, mật khẩu thật hoặc file `.env` vào repository.
- Không kết nối starter với hệ thống production, Railway hoặc cơ sở dữ liệu thật.
- Không công khai lịch sử prompt riêng tư; chỉ ghi nhận thông tin cần thiết để truy vết quyết định kỹ thuật.

## 8. Tuân thủ chính sách sử dụng AI và công cụ

Nhóm tuân thủ các phạm vi được ban tổ chức cho phép:

- Sử dụng AI để giải thích code, gợi ý test, refactor, viết tài liệu và hỗ trợ debug.
- Sử dụng thư viện mã nguồn mở có giấy phép tương thích và được khai báo theo yêu cầu.
- Tham khảo tài liệu công khai, tài liệu học phần KTPMUD và README của starter.
- Trao đổi câu hỏi làm rõ trên kênh chung của lớp.

Nhóm không thực hiện các hành vi bị ban tổ chức nghiêm cấm:

- Không sử dụng AI trong phần vấn đáp trực tiếp, kể cả khi được yêu cầu sửa lỗi tại chỗ.
- Không tìm kiếm, chia sẻ hoặc cố tình suy đoán nội dung test ẩn.
- Không sao chép code của nhóm khác hoặc thuê người ngoài thực hiện bài.
- Không tự ý sửa hoặc suy diễn quy tắc nghiệp vụ ngoài contract đã được khóa.

## 9. Giới hạn quyền tự động của AI và agent

AI chỉ đóng vai trò hỗ trợ phân tích, đề xuất và giải thích. Nhóm không giao cho AI hoặc agent quyền tự quyết định và xác nhận kết quả bàn giao.

Các nguyên tắc áp dụng:

- Không để agent tự merge pull request.
- Không để agent tự phát hành sản phẩm.
- Không để agent tự xác nhận bài làm đã đáp ứng đầy đủ yêu cầu.
- Các thay đổi do AI đề xuất phải được kiểm tra trước khi tích hợp.
- Việc commit, merge, phát hành và xác nhận sản phẩm thuộc trách nhiệm của nhóm.

## 10. Kết luận

AI đã hỗ trợ nhóm trong quá trình tìm hiểu starter, phân tích yêu cầu, phát triển chức năng, kiểm thử, xử lý lỗi và hoàn thiện tài liệu.

Nhóm sử dụng AI trong phạm vi được ban tổ chức cho phép, tuân thủ các giới hạn về dữ liệu, bảo mật, kiểm thử và trách nhiệm của thành viên.

AI không thay thế việc kiểm tra mã nguồn, chạy kiểm thử, review hoặc trách nhiệm của nhóm đối với sản phẩm cuối cùng.

Nhóm N24 chịu trách nhiệm về tính chính xác, tính phù hợp và chất lượng của toàn bộ nội dung được sử dụng trong sản phẩm bàn giao.
