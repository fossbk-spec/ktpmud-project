# KỊCH BẢN THUYẾT TRÌNH & DEMO VẤN ĐÁP (DƯỚI 7 PHÚT)
## KTPMUD Hack Marathon 2026 — Track A: Dr May Day (Rule Engine Sprint)

- **Mã đề:** `KTPMUD-BKT-2026-PILOT`
- **Nhóm thực hiện:** Nhóm 18 + 19
- **Thành viên & MSSV:**
  1. `202414288` (Nhóm trưởng / Kiến trúc & Điều phối)
  2. `202414324` (Kỹ sư Backend 1 / Core Rule Engine)
  3. `202414276` (Kỹ sư Backend 2 / Audit Trail & Benchmark)
  4. `202414384` (Kỹ sư QA / Kiểm thử & CI/CD)
- **Thời lượng tối đa:** 07 phút (Phần trình bày: 05 phút | Demo trực tiếp & Hỏi đáp: 02 phút)

---

## 1. PHÂN BỔ THỜI GIAN & PHÂN CÔNG THUYẾT TRÌNH

| Phút | Nội dung | Người trình bày | Mục tiêu & Minh chứng |
|---|---|---|---|
| **0:00 – 1:00** | Giới thiệu bài toán, kiến trúc 2 tầng (ADR-01) & SSoT | Thành viên 1 (`202414288`) | Giới thiệu bài toán phân loại sốc phản vệ tất định; kiến trúc Layered Pipeline vs Table-driven; cam kết hợp đồng kỹ thuật (SE contract), Zero PII/PHI. |
| **1:00 – 2:30** | Logic Rule Engine, xử lý biên & Missing Data (A-01 -> A-05) | Thành viên 2 (`202414324`) | Giải thích logic Tầng 1 (`SOC_PHAN_VE`) và Tầng 2 (`R01`, `R02`, `R03`); thứ tự ưu tiên $R01 > R02 > R03$; xử lý thiếu HATT theo Issue #15. |
| **2:30 – 4:00** | Audit Trail Zero PII & Đo lường Benchmark p95 (A-06, A-10) | Thành viên 3 (`202414276`) | Minh chứng ghi nhật ký kiểm toán đúng chuẩn 4 trường bắt buộc `[Timestamp, User_UUID, Action_Type, Status]`, không rò rỉ dữ liệu lâm sàng; kết quả benchmark 1.000 ca đạt p95 = 0.0018 ms (< 100 ms). |
| **4:00 – 5:30** | Demo kiểm thử tự động 29 tests & CI/CD (A-07, A-08, A-09) | Thành viên 4 (`202414384`) | Chạy lệnh `pytest -v` và `python scripts/benchmark.py` trực tiếp; show workflow GitHub Actions xanh và Draft PR #38 hợp lệ. |
| **5:30 – 7:00** | Tổng kết & Trả lời câu hỏi phản biện của Giảng viên | Cả nhóm | Trả lời trực tiếp các câu hỏi kỹ thuật của Hội đồng/Giảng viên. |

---

## 2. KỊCH BẢN NÓI CHI TIẾT (LỜI THOẠI 5 PHÚT)

### Phút 0:00 – 1:00 | Phần 1: Tổng quan & Kiến trúc (Thành viên 1 - 202414288)
> *"Kính thưa Thầy và các bạn, đại diện Nhóm 18 + 19, em xin trình bày giải pháp cho bài thi Track A — Dr May Day: Rule Engine Sprint.*
> *Mục tiêu của dự án là xây dựng một Rule Engine in-memory, tất định và có độ trễ cực thấp để hỗ trợ phân tầng phản vệ theo hướng dẫn Bộ Y tế.*
> *Về mặt kiến trúc, nhóm đã phân tích và ra quyết định kiến trúc ADR-01: lựa chọn mô hình Functional Layered Pipeline (Đường ống phân tầng chức năng). Mô hình này cho phép tách biệt rõ ràng giữa Tầng 1 (đánh giá Sốc phản vệ dựa trên tiêu chuẩn tụt huyết áp theo độ tuổi) và Tầng 2 (đánh giá phản vệ qua 3 kịch bản lâm sàng R01, R02, R03), giúp đạt hiệu năng tối đa và mã nguồn trong sáng.*
> *Đặc biệt, hệ thống tuân thủ hợp đồng phần mềm: không đưa ra lời khuyên điều trị trong lý do, và tuân thủ Zero PII/PHI."*

---

### Phút 1:00 – 2:30 | Phần 2: Core Rule Engine & Xử lý biên (Thành viên 2 - 202414324)
> *"Tiếp theo, em xin làm rõ cách hiện thực Rule Engine trong module `rule_engine/classifier.py`:*
> *1. **Định danh tất định:** Rule engine hoạt động pure Python, không phụ thuộc thư viện ngoài. Với Tầng 1, hệ thống định nghĩa chính xác ngưỡng tụt huyết áp theo 4 nhóm tuổi: sơ sinh (< 60 mmHg), trẻ nhũ nhi (< 70 mmHg), trẻ nhỏ (công thức $70 + 2 \times \text{tuổi}$), và người lớn (< 90 mmHg hoặc giảm $> 30\%$ so với nền).*
> *2. **Độ ưu tiên luật:** Khi dữ liệu thỏa mãn đồng thời nhiều rule, hệ thống áp dụng cơ chế giải quyết xung đột theo thứ tự ưu tiên chuẩn kỹ thuật: $R01 > R02 > R03$.*
> *3. **Xử lý dữ liệu thiếu (A-04):** Theo tinh thần an toàn bệnh nhân và Issue #15, nếu dữ liệu thiếu trường HATT nhưng thỏa mãn triệu chứng Tầng 2, hệ thống an toàn quy về `PHAN_VE` để theo dõi sát, tuyệt đối không crash hay nuốt lỗi ngoại lệ."*

---

### Phút 2:30 – 4:00 | Phần 3: Audit Trail & Hiệu năng Benchmark (Thành viên 3 - 202414276)
> *"Em xin trình bày về hai yêu cầu phi chức năng cốt lõi: An toàn dữ liệu (A-06) và Hiệu năng (A-10):*
> *1. **Audit Trail (Module `rule_engine/audit.py`):** Mỗi lần thực thi phân loại, hệ thống tự động ghi lại một bản ghi kiểm toán với đúng 4 trường bắt buộc theo ISO: `[Timestamp, User_UUID, Action_Type, Status]`. Để đảm bảo Zero PII theo tiêu chí A-06, hệ thống chỉ lưu `Action_Type` dạng mã hóa kỹ thuật (`CLASSIFY_SUCCESS`, `CLASSIFY_ERROR`) và `Status`, tuyệt đối không log tên, tuổi hay dữ liệu lâm sàng thô của bệnh nhân.*
> *2. **Benchmark hiệu năng:** Nhóm đã xây dựng script đo kiểm `scripts/benchmark.py` với 100 lần warm-up và 1.000 vòng lặp đo latency. Kết quả thực nghiệm trên máy chuẩn: trung vị p50 đạt **0.0017 ms**, và phân vị p95 đạt **0.0018 ms** — vượt xa chỉ tiêu đề bài yêu cầu là dưới 100 ms."*

---

### Phút 4:00 – 5:30 | Phần 4: Demo thực tế & CI/CD (Thành viên 4 - 202414384)
*(Thành viên 4 thao tác màn hình terminal và trình duyệt)*
> *"Em xin phép demo trực tiếp bộ kiểm thử tự động và quy trình CI/CD của nhóm:*
> *Đầu tiên, em chạy lệnh `pytest -v`:*
> *(Gõ lệnh: `pytest -v`)*
> *Toàn bộ **29/29 test cases** đều pass 100% trong 0.05 giây, bao quát từ các ca chuẩn, ca biên $\pm 1$ mmHg, ca ranh giới tuổi, đến các ca thiếu dữ liệu và kiểm tra Audit Trail.*
> *Tiếp theo, em chạy script benchmark:*
> *(Gõ lệnh: `python scripts/benchmark.py`)*
> *Màn hình hiển thị: p95 = 0.0018 ms -> ĐẠT TIÊU CHUẨN A-07/A-10.*
> *Về mặt tích hợp liên tục (CI/CD), toàn bộ mã nguồn trên fork đều kích hoạt GitHub Actions test tự động xanh 100%. Đồng thời, PR #38 nộp bài trên repo `ktpmud-project` đã qua khâu `Validate Submission` tự động.*
> *Sau đây, nhóm chúng em xin lắng nghe câu hỏi từ Quý Thầy/Hội đồng ạ."*

---

## 3. CÁC CÂU LỆNH DEMO TRỰC TIẾP (CHUẨN BỊ TRƯỚC SẴN TRÊN TERMINAL)

Mở sẵn terminal tại thư mục dự án `ktpmud-bkt-ruleengine-starter`:

```bash
# 1. Chạy toàn bộ 29 unit tests chi tiết
pytest -v

# 2. Chạy benchmark đo độ trễ p50, p90, p95
python scripts/benchmark.py

# 3. Xem nhanh cấu trúc mã nguồn và kiểm toán
python -c "from rule_engine import classify_with_audit, AuditLogger; logger = AuditLogger(); res = classify_with_audit({'tuoi': 25, 'bieu_hien_da_niem_mac': True, 'trieu_chung_ho_hap': True}, 'usr-uuid-test', logger); print('Kết quả:', res); print('Audit Log:', logger.get_records()[0].to_dict())"
```

---

## 4. HƯỚNG DẪN TRẢ LỜI CÁC CÂU HỎI THƯỜNG GẶP (FAQ)

### Q1: Tại sao giảm đúng 30% HATT thì chưa coi là tụt huyết áp?
- **Trả lời:** Theo văn bản SSoT `docs/decision-table.md`, tiêu chuẩn là **"giảm trên 30%"** ($> 30\%$). Do đó nếu giảm đúng $30\%$ thì điều kiện so sánh nghiêm ngặt `drop_rate > 0.30` trả về `False`. Nhóm đã viết riêng test case biên kiểm tra giá trị $30.0\%$ (không kích hoạt) và $30.01\%$ (kích hoạt).

### Q2: Tại sao không log thông tin triệu chứng hay chẩn đoán vào Audit Trail?
- **Trả lời:** Để tuân thủ tiêu chuẩn Zero PII/PHI (A-06) và GDPR/HIPAA. Bất kỳ thông tin lâm sàng nào cũng có nguy cơ suy diễn ra danh tính bệnh nhân nếu file log bị truy cập trái phép. Audit Trail chỉ phục vụ mục đích kiểm soát bảo mật và tính khả dụng của API (`Action_Type: CLASSIFY_SUCCESS`, `Status: SUCCESS`).

### Q3: Nếu bệnh nhân đồng thời thỏa mãn R01 và R02 thì phân loại thế nào?
- **Trả lời:** Theo thống nhất kỹ thuật tại Issue #15, thứ tự ưu tiên giải quyết xung đột là $R01 > R02 > R03$. Khi thỏa cả R01 và R02, hệ thống sẽ gán `rule_id: R01-PV` và giải thích lý do tương ứng với R01.
