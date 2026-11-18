# DECISIONS.md

Các quyết định thiết kế của nhóm cho Track B

## ADR-001: Thêm loại câu hỏi mới `estimate`, giữ nguyên 4 loại cũ

Vấn đề: hiện tại server chấm bằng so sánh chuỗi chính xác (`given === correct_answer` sau khi trim và viết thường). Không có cách nào biểu diễn "đúng nếu nằm trong một khoảng".

Các cách đã cân nhắc:
- A. Thêm loại mới `estimate` với nhánh chấm riêng.
- B. Sửa loại `input` để nhận cả khoảng.
- C. Thêm cột mới vào bảng `questions` để lưu khoảng.

Chọn A.

Vì sao: tài liệu chuẩn (mục 7) nói chỉ thêm, không đổi hành vi 4 loại cũ. B sẽ làm đổi cách chấm của các bộ câu hỏi đang có. C phải sửa schema trong `server/db.js` và seed, trong khi khoảng chấp nhận hoàn toàn tính được từ đáp án đúng nên không cần lưu thêm.

Đánh đổi: phải thêm nhánh `estimate` trong `server/api.js` và trong `exercise.js`. Nhánh cũ giữ nguyên và có test hồi quy (T-17).

## ADR-002: Khoảng chấp nhận là ±20% quanh đáp án đúng

Vấn đề: đề không khóa ngưỡng sai số, nên nhóm em cần nghiên cứu và đưa ra ngưỡng cho hợp lý, hơi phức tạp. Quy tắc cần đủ đơn giản để nói trong một câu với học sinh lớp 3.

Các cách đã cân nhắc:
- A. Ước lượng đúng nếu nằm trong khoảng từ 80% đến 120% đáp án đúng.
- B. Chỉ chấp nhận đúng kết quả khi làm tròn chục (ví dụ `38 × 6` thì chỉ nhận `40 × 6 = 240`).
- C. Học sinh nhập một khoảng ("200 đến 250"), server kiểm tra khoảng đó có chứa đáp án và không quá rộng.

Chọn A. Với đáp án đúng là `n`, tính bằng số nguyên:
- thấp nhất `lo = ⌊(4n + 4) / 5⌋`
- cao nhất `hi = ⌊6n / 5⌋`

Ước lượng hợp lý khi `lo ≤ ước lượng ≤ hi`. Dùng số nguyên để tránh sai số làm tròn của số thực.

Vì sao: B quá hẹp, nhiều cách ước lượng hợp lý khác (làm tròn lên, chọn số tròn dễ nhân) sẽ bị chấm sai. C cần thêm quy tắc "khoảng rộng tối đa" và giao diện hai ô nhập, phức tạp hơn nhiều mà không thêm giá trị sư phạm rõ ràng. A dễ test ở bốn điểm biên (`lo−1`, `lo`, `hi`, `hi+1`).

Kiểm chứng: nhóm đã chạy thử công thức trên 12 câu dự kiến (bảng trong `TEST_PLAN.md`). Tất cả đáp án là số nguyên, ước lượng ví dụ đều nằm trong khoảng, sai số từ 1,4% đến 7,1%.

Đánh đổi: với đáp án rất nhỏ khoảng sẽ hẹp, nên các câu hỏi chọn đáp án đủ lớn (từ 49 trở lên). Hằng số 20% đặt ở một chỗ trong code để dễ đổi. Khoảng này tính ở server từ `correct_answer`, không lưu thêm và không trả về trước khi nộp.
## ADR-003: Một câu có hai đáp án, lưu hai khóa trong `answers`

Vấn đề: `POST /api/submissions` nhận `answers` là một object `{ idCâuHỏi: chuỗi }`, mỗi câu một giá trị. Dạng bài mới cần hai giá trị cho mỗi câu và cần đảm bảo luồng "ước lượng trước rồi mới tính đúng" (R3).

Các cách đã cân nhắc:
- A. Giữ nguyên hình dạng `answers` gửi trong một lần `POST /api/submissions`: `answers["est-1"]` là kết quả đúng, `answers["est-1__est"]` là ước lượng; thứ tự chốt bước 1 trước khi mở bước 2 do giao diện giữ.
- B. Gộp hai giá trị vào một chuỗi, ví dụ `"240|228"`.
- C. Đổi `answers` thành object lồng nhau.
- D. Lưu ước lượng phía server trước khi mở bước 2 (thêm API hoặc bảng lưu nháp từng bước).

Chọn A.

Vì sao: không đổi hình dạng dữ liệu mà client cũ đang dùng, mọi giá trị vẫn là chuỗi, và không phải viết bộ tách chuỗi dễ lỗi như B. `answers_json` trong bảng `attempts` tự lưu cả hai giá trị nên không cần sửa schema hay thêm bảng/API lưu nháp như D.

Đánh đổi và giải trình giới hạn:
- Tên khóa `__est` là quy ước của nhóm, phải ghi rõ trong README để người sau không nhầm.
- Vì cả `est-1__est` và `est-1` gửi chung trong một lần `POST /api/submissions`, thứ tự "chốt ước lượng rồi mới tính" (R3) chỉ được đảm bảo ở giao diện (JavaScript khóa ô bước 2 cho đến khi chốt bước 1) và nếu gọi API trực tiếp thì bỏ qua được. Nhóm chọn chấp nhận giới hạn này (phương án a) vì ứng dụng phục vụ học sinh lớp 3 luyện tập trên trình duyệt, giữ cách nộp một lần giúp không phải sửa schema `server/db.js` và giữ nguyên kiến trúc API hiện có.
- Xử lý khi refresh giữa bước 1 và bước 2 (B-05): nếu chưa nộp bài mà tải lại trang, dữ liệu chưa lên server nên sẽ mất nếu chỉ giữ trong biến JS. Để khắc phục, khi học sinh bấm chốt ước lượng ở bước 1, `exercise.js` lưu giá trị đã chốt vào `sessionStorage` theo mã bộ đề và câu hỏi; nếu refresh giữa hai bước, giao diện tự đọc lại từ `sessionStorage`, giữ nguyên ước lượng đã khóa và mở sẵn bước 2. Khi nộp bài xong (đã lưu vào bảng `attempts` và `progress`), `sessionStorage` của bộ đề sẽ được xóa.

## ADR-004: Một câu tính đúng khi cả ước lượng và kết quả đều đúng

Trạng thái: đề xuất, cả nhóm xác nhận trước khi bắt đầu code.

Vấn đề: cần quyết định khi nào câu `estimate` được tính đúng, để `correct_count` và `score_percent` có nghĩa giống các loại câu khác.

Các cách đã cân nhắc:
- A. Câu đúng khi cả ước lượng hợp lý và kết quả đúng.
- B. Chỉ tính kết quả đúng; ước lượng chỉ để hiển thị phản hồi.
- C. Chia đôi điểm: nửa cho ước lượng, nửa cho kết quả đúng.

Chọn A.

Vì sao: mục tiêu của dạng bài là ước lượng trước khi tính, nên ước lượng phải ảnh hưởng đến điểm. Nếu theo B thì ước lượng chỉ là phần trang trí. C đòi chia điểm ra nửa và xử lý số lẻ, thêm chỗ dễ sai.

Đánh đổi: học sinh ước lượng tốt nhưng tính sai vẫn bị tính sai cả câu. Phản hồi hiển thị riêng 4 trường hợp (R5) để học sinh biết mình sai ở bước nào.
## ADR-005: Giao diện 2 bước đặt ở trang làm bài chung `lesson.html`, lối vào từ phiếu Bài 10

Trạng thái: đã cài đặt (cần cả nhóm xác nhận, vì khác dự kiến ban đầu "UI trong `exercise.js`" ở `Requirements.md`).

Vấn đề: khi đọc mã nguồn thật thì thấy `exercise.js` không phải trình render câu hỏi theo `type`. Nó là phiếu tĩnh viết cứng cho đúng bộ `phieu-bai-9-10`: DOM có sẵn trong `exercise.html` (`slot-1-1`, `math-input-1`...) và `setId` cũng viết cứng. Trình render theo `type` thật sự là `pages/lesson.js` (`lesson.html?lesson=<id>&set=<setId>`), nơi mọi bộ đề giáo viên tạo được mở. Thêm vào đó, thẻ "Bài 10" ở trang chủ mở `questionSets[0]` của bài. Với bài 10 đó là `phieu-bai-9-10`, đi thẳng tới `exercise.html`, nên bộ đề mới gắn vào `bai-10` sẽ không tự hiện ra.

Các cách đã cân nhắc:
- A. Viết thêm phần 2 bước vào `exercise.html`/`exercise.js`, cạnh phiếu cũ.
- B. Render type `estimate` trong trình render chung `lesson.js` (qua component riêng `components/estimate-question.js`). Phiếu Bài 10 (`exercise.html`) hiện danh sách "các phiếu khác của bài này", lấy từ `/api/lessons`.
- C. Sửa `index.js` để thẻ Bài 10 mở thẳng bộ đề mới.

Chọn B.

Vì sao: B mở rộng đúng điểm mở rộng có sẵn của hệ thống (render theo `type`), nên bộ đề `estimate` nào sau này cũng làm được ở `lesson.html`, không chỉ một phiếu viết cứng. Lối vào vẫn nằm trong luồng học bình thường (B-01): Trang chủ → thẻ Bài 10 → phiếu Bài 10 → "Phiếu luyện tập: Ước lượng trước khi tính đúng". A trộn hai bộ đề trên một trang, có hai nút nộp, và phải nhân đôi logic render. C đổi hành vi thẻ Bài 10 đang có và làm mất lối vào phiếu cũ.

Đánh đổi: thêm một bước bấm từ phiếu Bài 10. `exercise.js` chỉ thêm khối lối vào, không đổi logic phiếu cũ.

Lưu ý về khóa bài: `bai-10` có `unlockAfter: "bai-9"` (mọi bài trong seed nối tiếp nhau), nên bài **không** mở từ đầu cho mọi học sinh. Trong seed, chỉ `hocsinh01` đã hoàn thành `bai-9`, vì vậy demo/test dùng `hocsinh01` (test T-30 kiểm tra điều này). Nhóm giữ nguyên quy tắc khóa bài vì nó là hành vi có sẵn.

## ADR-006: Chi tiết cài đặt quy tắc chấm

Trạng thái: đã cài đặt.

- Logic thuần nằm ở `server/estimate.js`, gồm hằng `ESTIMATE_TOLERANCE_PERCENT = 20` (một chỗ duy nhất). Có thêm một tầng điều phối theo `type` ở `server/grading.js`. `POST /api/submissions` chỉ đổi đúng chỗ chấm từng câu để gọi `gradeQuestion`. Nhánh 4 type cũ được chuyển nguyên văn sang `grading.js` và có test hồi quy T-17 (cả unit lẫn qua API).
- Công thức tổng quát với p% là `lo = ⌈n·(100−p)/100⌉`, `hi = ⌊n·(100+p)/100⌋`, tính bằng số nguyên. Với p = 20 nó trùng đúng công thức ADR-002; test kiểm tra mọi n từ 0 đến 5000.
- Đầu vào không hợp lệ (R6) **không** làm request lỗi 400. Câu đó bị tính sai, và `detail` trả về `valid: false` để giao diện giải thích. Lý do: giữ đúng hành vi của các type cũ (nộp gì cũng được chấm). Giao diện chặn và báo lỗi định dạng ngay dưới ô nhập trước khi nộp (B-12).
- Ước lượng bằng đúng đáp án vẫn nằm trong khoảng nên được tính hợp lý. Quy tắc "ước lượng trước" được bảo đảm bằng thứ tự giao diện (ADR-003), không bằng cách phạt ước lượng quá chính xác.
- Sau khi nộp, `detail` của câu `estimate` có `outcome` (một trong 4 mã), `feedback` (câu phản hồi tiếng Việt), `acceptRange` và kết quả từng bước. Khoảng chấp nhận chỉ xuất hiện sau khi nộp (B-04, test T-31).
- Sao thưởng và tiến độ dùng chung cơ chế cũ theo `lesson_id`. Vì `phieu-uoc-luong` và `phieu-bai-9-10` cùng gắn `bai-10`, `best_score` của bài 10 là điểm cao nhất giữa hai phiếu.
