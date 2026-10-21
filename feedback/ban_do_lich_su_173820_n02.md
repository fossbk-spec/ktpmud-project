# Góp ý — 173820_n02 (CS-7: Website Bản đồ Lịch sử Việt Nam)

- **Bài nộp:** báo cáo quá trình tuần 6 + slide — giảng viên đã đưa lên [`submissions/ban_do_lich_su_173820_n02/`](../submissions/ban_do_lich_su_173820_n02/) theo template chuẩn
- **Ngày góp ý:** 21/10/2026
- **Kết quả kiểm tra tự động:** ✅ hợp lệ (`scripts/validate_submission.py`)

## Đề tài đã được duyệt

Đề "Thiết kế & Xây dựng Website Bản đồ Lịch sử Việt Nam" đã được thêm vào
[ngân hàng case study](https://fossbk-spec.github.io/ktpmud-book/do_an_mon_hoc) là **CS-7**, slug
`ban_do_lich_su` (đề ngoài y tế). Trang chi tiết của CS-7 trỏ tới thư mục bài nộp của nhóm.

## Bài nộp và các tuần sau

Bài tuần 6 của nhóm **đã có trong repo** tại [`submissions/ban_do_lich_su_173820_n02/`](../submissions/ban_do_lich_su_173820_n02/), đúng
template chuẩn (`submission.json`, `README.md`, `report/`, `slides/`, `src/`):

- [`README.md`](../submissions/ban_do_lich_su_173820_n02/README.md)
- [`report/BaoCao_Tuan6.docx`](../submissions/ban_do_lich_su_173820_n02/report/BaoCao_Tuan6.docx)
- [`slides/Slide_Tuan6.pptx`](../submissions/ban_do_lich_su_173820_n02/slides/Slide_Tuan6.pptx)
- [`submission.json`](../submissions/ban_do_lich_su_173820_n02/submission.json)

Nhóm kiểm tra lại `submission.json` (MSSV, thành viên) và `README.md`; nếu sai thì sửa qua PR như
bên dưới.

**Từ tuần sau**, nhóm tự nộp bằng Pull Request từ fork theo
[HUONG_DAN_NOP_BAI.md](../HUONG_DAN_NOP_BAI.md):

1. Fork `fossbk-spec/ktpmud-project` (fork cũ thì bấm **Sync fork** trước), tạo nhánh
   `submit/ban_do_lich_su-173820_n02`.
2. **Thêm file mới** vào đúng thư mục `submissions/ban_do_lich_su_173820_n02/` (vd `report/BaoCao_Tuan8.docx`, mã nguồn
   trong `src/`), cập nhật `README.md` nếu cần. Không sửa thư mục của nhóm khác.
3. Mở Pull Request vào `main`. Bot bình luận ✅/❌ trong khoảng 1 phút; nếu ❌ thì sửa và push lên
   **cùng nhánh**, không mở PR mới.

---

## Đánh giá của giảng viên

Đối chiếu với chuẩn kỹ thuật của **Chương 1 (SDLC & Agile)**, **Chương 2 (Kỹ thuật Yêu cầu & C4
Model)**, biểu mẫu đánh giá 10 bước và yêu cầu giao nộp của **Sprint 1 (Tuần 2–3)**.

### I. Đánh giá tổng quan theo 10 bước triển khai dự án

| STT | Bước thực hiện | Mức độ hoàn thành | Nhận xét |
|:--|:--|:--|:--|
| 1 | Chọn đề tài & Bài toán | **Tốt** (8,5/10) | Xác định rõ bối cảnh và "nỗi đau" thực tế: lịch sử bị phân mảnh, khó liên kết không gian địa lý với thời gian. Đã phân loại 4 nhóm người dùng (học sinh, giáo viên, người yêu lịch sử, quản trị viên). Cần làm rõ ai là Customer (người bảo trợ/nghiệm thu) và ai là End-user. |
| 2 | Khảo sát thực trạng & Giải pháp cũ | **Khá** (7,5/10) | Nêu được hạn chế của tài liệu truyền thống và các website rời rạc. **Chưa có bảng phân tích đối thủ / khoảng trống (Gap Analysis / Benchmark Matrix)** so với các nền tảng bản đồ số lịch sử hiện có. |
| 3 | Kế hoạch & Quy trình SDLC | **Trung bình** (6,0/10) | Mới có slide Timeline chung. **Chưa xác lập mô hình SDLC cụ thể (Agile/Scrum hay Waterfall)**, chưa chia nhịp Sprint, thiếu **Definition of Done / Definition of Ready**, **chưa có bảng tỷ lệ đóng góp (tổng = 10)** theo biểu mẫu. |
| 4 | Đề xuất giải pháp & C4 (C1) | **Trung bình** (6,0/10) | Bản đồ tương tác + timeline là đúng hướng; đã có DFD mức ngữ cảnh. **Thiếu hoàn toàn C4 mức 1 (System Context)** để xác định ranh giới hệ thống và các dịch vụ ngoài (OSM Tile Server, SMTP, Cloud Storage). |
| 5 | Thu thập yêu cầu (SRS & NFR) | **Khá – Tốt** (8,0/10) | **Điểm sáng:** NFR phân loại theo **ISO/IEC 25010** với chỉ số định lượng (LCP ≤ 2,5 giây, tìm kiếm/lọc ≤ 1 giây cho 95% yêu cầu, 100 người dùng đồng thời, WCAG 2.1 AA). Đã có DFD mức 1. **Hạn chế:** mục 7.6 SRS mới là khung mục lục IEEE 830, chưa thành tài liệu hoàn chỉnh. |
| 6 | Mô hình hóa chức năng (Use Case/BDD) | **Khá** (7,5/10) | Use Case và đặc tả UC-01, UC-02, UC-03 tốt, có luồng chính và ngoại lệ, kèm Activity Diagram. **Chưa có User Story chuẩn INVEST** và **chưa có kịch bản BDD (Given – When – Then)**. |
| 7 | Thiết kế CSDL & C4 Container (C2) | **Yếu / Chưa đạt** (3,0/10) | Thiếu sản phẩm cốt lõi của Sprint 1: **chưa có ERD, Data Dictionary, `schema.sql`**; **chưa có C4 mức 2** (Web Client, Backend API, Database PostgreSQL/PostGIS hay MySQL, lưu trữ dữ liệu không gian GeoJSON). |
| 8 | Xây dựng phần mềm | **Chưa thực hiện** | Chưa có khung **REST API Gateway** và đặc tả API (OpenAPI/Swagger YAML). |
| 9 | Kiểm thử | **Chưa thực hiện** | Đã định vị vai trò Tester nhưng chưa có chiến lược kiểm thử đơn vị hoặc kế hoạch đo độ bao phủ mã. |
| 10 | Tài liệu hóa & RTM | **Khá** (7,0/10) | RTM liên kết BR → FR → DFD → Use Case → NFR (phủ 35/35 FR). Cần bổ sung cột ánh xạ tới bảng CSDL / API endpoint và Test Case ID khi bước vào giai đoạn code. |

### II. Điểm mạnh

- **Định lượng hóa NFR:** dùng con số có căn cứ (Google Core Web Vitals, WCAG 2.1, OWASP Top 10)
  thay vì câu chữ chung chung.
- **Đặc tả Use Case và Activity Diagram chi tiết:** ba ca sử dụng trọng tâm (tra cứu bản đồ, xem chi
  tiết sự kiện, quản lý sự kiện) có đủ bước, rẽ nhánh và ngoại lệ (mất kết nối bản đồ nền, file
  GeoJSON sai định dạng).
- **Phân rã chức năng mạch lạc:** biểu đồ phân rã 5 khối trong báo cáo và phân loại MoSCoW
  (20 Must, 10 Should, 5 Could) trong slide.

### III. Lỗi kỹ thuật cần khắc phục ngay

1. **Slide và báo cáo không khớp số yêu cầu chức năng.** Slide trang 11 liệt kê 35 FR (FR-01 →
   FR-35, 6 phân hệ A–F); báo cáo mục 2.2 chỉ có 13 FR (FR-01 → FR-13); RTM mục 7.5 lại tham chiếu
   35 FR. **Đồng bộ FR-01 → FR-35 trên toàn bộ tài liệu.**
2. **Thiếu C4 Model (C1 & C2)** — nhóm đang nhầm DFD với biểu đồ kiến trúc phần mềm:
   - **C1 – System Context:** website tương tác với người dùng (trình duyệt), ban quản trị, dịch vụ
     bản đồ nền (OpenStreetMap Tile Server), dịch vụ gửi thư (SMTP).
   - **C2 – Container:** Single Page App (React/Vue + Leaflet), API (FastAPI/NodeJS/Django),
     Database (PostgreSQL + PostGIS hoặc MySQL), File Storage (ảnh tư liệu).
3. **Thiếu thiết kế CSDL (ERD & Data Dictionary).** Dữ liệu không gian là xương sống của hệ thống;
   cần làm rõ:
   - `Events` (sự kiện): tọa độ tâm, kiểu hình học (Point, Polygon, LineString), niên đại bắt đầu –
     kết thúc
   - `Eras` / `Dynasties` (thời kỳ / triều đại): phân cấp dòng thời gian
   - `HistoricalFigures` (nhân vật) và bảng liên kết `Event_Figures` (nhiều – nhiều)
   - `Locations` (địa danh qua các thời kỳ)
4. **Thiếu User Story (INVEST) và kịch bản BDD:** chuyển các FR dạng văn xuôi thành User Story kèm
   tiêu chí nghiệm thu Given – When – Then cho các tính năng MVP.

### IV. Kế hoạch hành động bổ sung (Sprint 1)

Sản phẩm bàn giao Sprint 1: **SRS v1.0, UML & schema CSDL, khung REST API Gateway.**

- **BA / Product Owner**
  - Đồng bộ danh mục FR-01 → FR-35 trong báo cáo Word
  - Viết User Story (INVEST) và kịch bản BDD cho 3 Use Case chính
  - Hoàn thiện `docs/SRS_v1.0.md` chuẩn IEEE 830 (thay vì chỉ dàn ý)
  - Lập bảng tỷ lệ đóng góp của các thành viên (tổng bằng 10)
- **Backend / System Architect**
  - Vẽ C4 mức 1 (System Context) và mức 2 (Container)
  - Thiết kế ERD và Data Dictionary
  - Viết `database/schema.sql` (hỗ trợ tọa độ/GeoJSON)
  - Dựng khung REST API Gateway (`main.py` / router) và `openapi.yaml`
- **Frontend / Tester / QA**
  - Vẽ UML Class Diagram cho các thực thể miền
  - Thiết kế wireframe/mockup giao diện bản đồ tích hợp timeline
  - Khởi tạo khung frontend (Leaflet.js / OpenStreetMap)
  - Lập danh sách test case (unit test & functional test) tương ứng RTM

Tài liệu và mã nguồn trên đặt trong thư mục nộp bài: `report/` (SRS, ERD, C4), `src/` (mã nguồn,
`schema.sql`, `openapi.yaml`).

### V. Câu hỏi phản biện — chuẩn bị trả lời khi bảo vệ

| Vai trò | Câu hỏi |
|:--|:--|
| **BA / Product Owner** | 1. Vì sao có sai lệch giữa 13 FR ở mục 2.2 và 35 FR ở RTM? Phân hệ nào thuộc phạm vi MVP bắt buộc hoàn thành trong 10 tuần? 2. Viết một kịch bản BDD (Given – When – Then) cho trường hợp: người dùng lọc sự kiện theo triều đại nhưng không có dữ liệu. |
| **Backend / System Architect** | 1. Dữ liệu tọa độ không gian (marker, vùng biên giới, tuyến hành quân GeoJSON) lưu bằng kiểu dữ liệu gì? Đánh chỉ mục không gian (spatial index) thế nào để truy vấn ≤ 1 giây? 2. Dùng C4 mức 2 giải thích cách API Gateway xử lý yêu cầu tải bản đồ nền và dữ liệu sự kiện từ CSDL. |
| **Frontend / Tester / QA** | 1. Làm thế nào đảm bảo NFR-01 (LCP ≤ 2,5 giây) khi trang bản đồ có nhiều marker và file GeoJSON lớn? Áp dụng kỹ thuật nào (lazy loading, vector tiles, marker clustering)? 2. Tổ chức kiểm thử tự động (unit / integration test) trên GitHub Actions CI như thế nào? |

### Nguồn dữ liệu tham khảo

- https://github.com/hoanglong8/My_ebook
- https://nghiencuulichsu.com/
- https://github.com/David-LeK/vietnamese-historical-events
- https://huggingface.co/datasets/minhxthanh/Vietnam-History-200K-Vi

Kiểm tra giấy phép sử dụng của từng nguồn trước khi đưa dữ liệu vào hệ thống, và ghi nguồn trong
`README.md`.
