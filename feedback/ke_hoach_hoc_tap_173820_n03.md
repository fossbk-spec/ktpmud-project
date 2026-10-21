# Góp ý — 173820_n03 (CS-8: Theo dõi tiến độ và lập kế hoạch học tập)

- **Bài nộp:** báo cáo tiến độ tuần 6 + slide — giảng viên đã đưa lên [`submissions/ke_hoach_hoc_tap_173820_n03/`](../submissions/ke_hoach_hoc_tap_173820_n03/) theo template chuẩn
- **Ngày góp ý:** 21/10/2026
- **Kết quả kiểm tra tự động:** ✅ hợp lệ (`scripts/validate_submission.py`)

## Đề tài đã được duyệt

Đề "Hệ thống hỗ trợ theo dõi tiến độ và lập kế hoạch học tập cho sinh viên" đã được thêm vào
[ngân hàng case study](https://fossbk-spec.github.io/ktpmud-book/do_an_mon_hoc) là **CS-8**, slug
`ke_hoach_hoc_tap` (đề ngoài y tế). Trang chi tiết của CS-8 trỏ tới thư mục bài nộp của nhóm.

## Bài nộp và các tuần sau

Bài tuần 6 của nhóm **đã có trong repo** tại [`submissions/ke_hoach_hoc_tap_173820_n03/`](../submissions/ke_hoach_hoc_tap_173820_n03/), đúng
template chuẩn (`submission.json`, `README.md`, `report/`, `slides/`, `src/`):

- [`README.md`](../submissions/ke_hoach_hoc_tap_173820_n03/README.md)
- [`report/BaoCao_Tuan6.docx`](../submissions/ke_hoach_hoc_tap_173820_n03/report/BaoCao_Tuan6.docx)
- [`slides/Slide_Tuan6.pptx`](../submissions/ke_hoach_hoc_tap_173820_n03/slides/Slide_Tuan6.pptx)
- [`submission.json`](../submissions/ke_hoach_hoc_tap_173820_n03/submission.json)

Nhóm kiểm tra lại `submission.json` (MSSV, thành viên) và `README.md`; nếu sai thì sửa qua PR như
bên dưới.

**Từ tuần sau**, nhóm tự nộp bằng Pull Request từ fork theo
[HUONG_DAN_NOP_BAI.md](../HUONG_DAN_NOP_BAI.md):

1. Fork `fossbk-spec/ktpmud-project` (fork cũ thì bấm **Sync fork** trước), tạo nhánh
   `submit/ke_hoach_hoc_tap-173820_n03`.
2. **Thêm file mới** vào đúng thư mục `submissions/ke_hoach_hoc_tap_173820_n03/` (vd `report/BaoCao_Tuan8.docx`, mã nguồn
   trong `src/`), cập nhật `README.md` nếu cần. Không sửa thư mục của nhóm khác.
3. Mở Pull Request vào `main`. Bot bình luận ✅/❌ trong khoảng 1 phút; nếu ❌ thì sửa và push lên
   **cùng nhánh**, không mở PR mới.

---

## Đánh giá của giảng viên

Đối chiếu với chuẩn kỹ thuật của **Chương 1 (SDLC & Agile)**, **Chương 2 (Kỹ thuật Yêu cầu & C4
Model)**, biểu mẫu đánh giá 10 bước và yêu cầu bàn giao của **Sprint 1 (Tuần 2–3)**.

### I. Đánh giá tổng quan theo 10 bước triển khai dự án

| STT | Bước thực hiện | Mức độ hoàn thành | Nhận xét |
|:--|:--|:--|:--|
| 1 | Chọn đề tài & Xác định bài toán | **Tốt** (8,5/10) | Nêu đúng bài toán của sinh viên học tín chỉ: theo dõi môn tiên quyết, tích lũy tín chỉ, tính GPA/CPA. Phạm vi và đối tượng (sinh viên ĐHBK Hà Nội) rõ ràng. Cần làm rõ vai trò Cố vấn học tập / Quản trị viên đào tạo. |
| 2 | Khảo sát thực trạng & Giải pháp cũ | **Khá** (7,0/10) | Nêu được bất cập của việc đối chiếu thủ công qua bảng điểm và file Excel. **Chưa có bảng phân tích đối thủ / khoảng trống (Gap Matrix)** so với các tính năng sẵn có trên cổng thông tin đào tạo (ctt / qldt) để làm nổi bật tính cấp thiết. |
| 3 | Kế hoạch & Quy trình SDLC | **Trung bình – Yếu** (5,0/10) | **Lỗi quy trình:** Timeline ở slide 5 theo Waterfall 15 tuần (tuần 4–6 mới thiết kế, tuần 7–10 mới code), **lệch hoàn toàn** với lộ trình tinh gọn 10–12 tuần của môn (Sprint 1 tuần 2–3 phải xong đặc tả, C4, CSDL và khung API). Chưa có **DoD / DoR**, chưa có **bảng tỷ lệ đóng góp (tổng = 10)**. |
| 4 | Đề xuất giải pháp & C4 (C1) | **Khá** (7,0/10) | Ý tưởng tập trung hóa dữ liệu học tập phù hợp; đã có **C4 mức 1**. Sơ đồ C1 còn đơn giản, chưa thể hiện tương tác với nguồn dữ liệu ngoài (import bảng điểm từ hệ thống đào tạo, dịch vụ xác thực). |
| 5 | Thu thập yêu cầu (SRS & NFR) | **Rất tốt** (9,0/10) | **Điểm sáng nhất:** 24 FR chia 6 phân hệ mạch lạc; NFR-01 → NFR-05 **định lượng chặt chẽ** (NFR-01 kiểm thử 20 bộ dữ liệu chuẩn, NFR-02 phản hồi ≤ 2 giây trên 1.000 bản ghi, NFR-03 kiểm thử khả dụng 4/5 người). Đã có DFD mức 0 và mức 1. |
| 6 | Mô hình hóa chức năng (Use Case & BDD) | **Xuất sắc** (9,5/10) | 12 User Story (US-01 → US-12) kèm tiêu chí nghiệm thu **Gherkin (Given – When – Then)** cho cả kịch bản thành công và lỗi. 5 Use Case (UC-01 → UC-05) đủ tiền/hậu điều kiện, luồng chính và ngoại lệ. |
| 7 | Thiết kế CSDL & C4 Container (C2) | **Kém / Bỏ dở** (2,5/10) | **Lỗi nghiêm trọng:** (1) *Hiểu sai C4 mức 2:* C2 chỉ gồm "Sinh viên" và "Hệ thống…" giao tiếp qua HTTPS/REST — thực chất lặp lại C1, không phân rã container. (2) *Bỏ trống thiết kế CSDL:* mục 3.2 chỉ có tiêu đề "Thiết kế sơ đồ thực thể liên kết (ERD)", không có sơ đồ, Data Dictionary hay DDL. |
| 8 | Xây dựng phần mềm | **Chưa thực hiện** | Chưa có khung **REST API Gateway** và `openapi.yaml`. |
| 9 | Kiểm thử | **Chưa thực hiện** | Tiêu chí BDD đã có (thuận lợi cho kiểm thử tự động) nhưng chưa lập danh mục test case cho thuật toán tính GPA/CPA và kiểm tra môn tiên quyết. |
| 10 | Tài liệu hóa & RTM | **Tốt** (8,5/10) | RTM (mục 2.2.4) truy vết rõ FR → User Story → Use Case → Module. Cần thêm cột ánh xạ tới bảng CSDL và Test Case ID. |

### II. Điểm mạnh

- **User Story và tiêu chí nghiệm thu BDD:** nhóm làm tốt nhất phần Given – When – Then; kịch bản
  bao quát nhập điểm hợp lệ / không hợp lệ, môn tiên quyết thỏa mãn / chưa thỏa mãn, cảnh báo vượt
  giới hạn tín chỉ (US-10).
- **NFR định lượng:** 20 bộ test chuẩn hóa, 1.000 bản ghi, phản hồi ≤ 2 giây — tránh NFR định tính
  chung chung.
- **Đặc tả Use Case chi tiết:** cả 5 ca sử dụng có luồng phụ (Alternative Flows) và ngoại lệ
  (Exceptions) rõ ràng.

### III. Lỗi kỹ thuật cần khắc phục ngay

1. **C4 mức 2 (Container) sai bản chất.** Mục 3.1.2 viết "sơ đồ C2 thể hiện hai thành phần chính là
   Sinh viên và Hệ thống hỗ trợ…". C1 nhìn hệ thống như hộp đen; **C2 phải mở hộp đen** ra các
   container thực thi:
   - **Web Client (SPA):** React / Vue / HTML5-CSS, chạy trên trình duyệt
   - **Backend API:** Node.js / FastAPI / Spring Boot — kiểm tra tiên quyết, tính điểm
   - **Database:** PostgreSQL / MySQL — cây chương trình đào tạo, bảng điểm
2. **Bỏ dở thiết kế CSDL (ERD & schema).** Báo cáo dừng ở tiêu đề mục 3.2; slide 20 cũng chỉ ghi
   chung. Đây là bài toán quan hệ dạng đồ thị/cây (A tiên quyết của B, C song hành với B), cần ít nhất:
   - `Courses` — mã môn, tên môn, số tín chỉ, trọng số
   - `Prerequisites` — `course_id`, `prerequisite_course_id`, loại điều kiện (tiên quyết / học trước / song hành)
   - `StudentGrades` — `student_id`, `course_id`, điểm chữ, điểm số, học kỳ
   - `StudyPlans`, `StudyPlanDetails` — kế hoạch học tập theo học kỳ
3. **Điều chỉnh Timeline từ 15 tuần sang lộ trình Sprint 10–12 tuần.** Hết Sprint 1 phải chốt xong
   tài liệu kiến trúc, CSDL và khung REST API để Sprint tiếp theo vào lập trình Rule Engine tính
   điểm và kiểm tra tiên quyết.

### IV. Kế hoạch hành động bổ sung (Sprint 1)

Sản phẩm bàn giao Sprint 1: **SRS v1.0, UML & schema CSDL, khung REST API Gateway.**

- **Trưởng nhóm / Product Owner / Fullstack**
  - Viết lại C4 mức 2: Web App, API Backend, Database
  - Thiết kế ERD chi tiết (đặc biệt bảng quan hệ môn tiên quyết)
  - Viết Data Dictionary và `database/schema.sql`
  - Dựng khung REST API Gateway (`main.py` / routers) và `openapi.yaml`
  - Bổ sung bảng tỷ lệ đóng góp của 2 thành viên (tổng bằng 10)
- **Tech Lead / Backend / QA**
  - Cập nhật Timeline theo Sprint 1 (tuần 2–3) đến Sprint 4+ (tuần 10–12)
  - Vẽ UML Class Diagram cho các thực thể miền: Course, Grade, Plan, Rule
  - Vẽ Sequence Diagram cho thuật toán kiểm tra điều kiện tiên quyết khi thêm môn vào kế hoạch
  - Lập danh mục test case dựa trên 12 User Story BDD ở mục 2.1.3

Tài liệu và mã nguồn đặt trong thư mục nộp bài: `report/` (SRS, ERD, C4, UML), `src/` (mã nguồn,
`schema.sql`, `openapi.yaml`).

### V. Câu hỏi phản biện — chuẩn bị trả lời khi bảo vệ

| Vai trò | Câu hỏi |
|:--|:--|
| **Trưởng nhóm / Product Owner** | 1. Vì sao mô tả C4 mức 2 hiện tại bị đánh giá là sai bản chất? Nhóm sẽ phân rã hệ thống thành những container độc lập nào? 2. Bảng CSDL lưu quan hệ tiên quyết (prerequisite) và song hành (co-requisite) thiết kế thế nào để tránh đệ quy vô hạn khi kiểm tra điều kiện học phần? |
| **Tech Lead / Backend** | 1. Thuật toán kiểm tra điều kiện học phần (FR-15, FR-16, FR-17) hoạt động theo nguyên lý nào (duyệt đồ thị DAG hay truy vấn đệ quy SQL)? Với điều kiện phức tạp như (A VÀ B) HOẶC C, CSDL và mã nguồn xử lý ra sao? 2. Dựa trên kịch bản BDD của US-10, hiện thực Unit Test thế nào để độ bao phủ mã đạt ≥ 90% trong Sprint 2? |

---

## Phụ lục: Kế hoạch thực hiện gợi ý (MVP 1 tuần + 4 tuần hoàn thiện)

Áp dụng **Vertical Slice Architecture** (cắt lát dọc theo tính năng) thay vì phát triển dàn trải
theo tầng.

### Giai đoạn 1 — MVP trong 7 ngày

Mục tiêu: **một luồng nghiệp vụ cốt lõi** chạy thông suốt Frontend → API → Database → triển khai
thực tế.

**Cắt tỉa phạm vi (quy tắc 1-1-1):** 1 nhóm người dùng chính, 1 bài toán nhức nhối nhất, 1 giải pháp
trực diện nhất. Tuần đầu bỏ hẳn: phân quyền đa cấp, quên mật khẩu, đổi avatar, thông báo email/SMS,
tối ưu giao diện đa nền tảng.

| Ngày | Nhiệm vụ trọng tâm | Sản phẩm đầu ra |
|:--|:--|:--|
| 1 | **Chốt scope & schema tối giản** — chọn 1 Use Case cốt lõi (happy path), vẽ C4 (C1, C2), ERD rút gọn (3–4 bảng) | Spec 1 trang (1-page PRD); ERD & `schema.sql` |
| 2 | **Hạ tầng & repo** — repo Git chung, DB (PostgreSQL / SQLite), Dockerfile, CI chạy lint/test | Repo có GitHub Actions; kết nối DB hoạt động |
| 3 | **Core API** — 2–3 endpoint CRUD cho luồng chính, seed data mẫu | REST API chạy cục bộ; Postman Collection hoặc Swagger UI |
| 4 | **Giao diện cốt lõi** — layout và màn hình tác vụ chính, dùng thư viện UI sẵn có (Tailwind, AntD, shadcn) | Màn hình UI chạy với mock data |
| 5 | **Tích hợp end-to-end** — frontend gọi API thật, xử lý loading và lỗi cơ bản | Luồng chính chạy từ client đến DB |
| 6 | **Triển khai đám mây** — Vercel, Render, Railway hoặc Supabase; kiểm thử thủ công trên môi trường online | URL demo trực tiếp |
| 7 | **Nghiệm thu MVP** — demo, thử với người dùng thật, ghi nhận điểm nghẽn | Biên bản nghiệm thu MVP; backlog ưu tiên 4 tuần tiếp |

### Giai đoạn 2 — 4 Sprint hoàn thiện (1 tuần/Sprint)

1. **Sprint 1 — Nghiệp vụ & ngoại lệ:** JWT, phân vai trò (User / Admin), băm mật khẩu (bcrypt); xử
   lý dữ liệu rỗng, sai định dạng, không có kết quả, mất kết nối; ràng buộc toàn vẹn (constraints,
   khóa ngoại) và validation cả hai đầu.
2. **Sprint 2 — Nghiệp vụ chuyên sâu:** thuật toán lõi (lọc đa tiêu chí, tính điểm/tiến độ…); UX
   (thanh tiến trình, thông báo toast, phân trang); dashboard quản trị tối thiểu.
3. **Sprint 3 — Kiểm thử, hiệu năng, bảo mật:** unit test cho hàm nghiệp vụ lõi (độ bao phủ
   ≥ 80%), integration test API (PyTest / Jest); đánh chỉ mục CSDL, tránh truy vấn N+1, lazy loading;
   rà soát OWASP Top 10 (SQL Injection, XSS, CSRF, rate limiting).
4. **Sprint 4 — Đóng gói & nghiệm thu:** Dockerfile multi-stage, `docker-compose.yml` (web, API, DB,
   cache); logging tập trung, theo dõi lỗi (vd Sentry); tài liệu C4, OpenAPI, hướng dẫn cài đặt –
   vận hành; UAT với giảng viên, gắn tag phát hành v1.0.

### Tech stack khuyến nghị

| Thành phần | Công nghệ đề xuất | Lý do |
|:--|:--|:--|
| Frontend | React (Vite) / Next.js + TailwindCSS | Dựng nhanh, nhiều component sẵn có |
| Backend | Python (FastAPI) hoặc Node.js (Express / NestJS) | Tự sinh Swagger UI, gọn, dễ viết unit test |
| Database | PostgreSQL | Quan hệ chuẩn, JSONB linh hoạt, dễ mở rộng |
| BaaS / Hosting | Supabase (DB + Auth) + Vercel / Render | Giảm thời gian cấu hình server tuần đầu |
| CI/CD | GitHub Actions | Có sẵn trong repo, tự chạy lint/test mỗi khi mở PR |
