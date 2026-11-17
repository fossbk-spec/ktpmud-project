# BÁO CÁO KIỂM THỬ VÀ ĐO LƯỜNG HIỆU NĂNG (TEST & BENCHMARK REPORT)

- **Dự án:** Track A — Dr May Day: Rule Engine Sprint
- **Mã đề:** KTPMUD-BKT-2026-PILOT
- **Nhóm thực hiện:** Nhóm 18 + 19
- **Mốc hoàn thành:** Checkpoint 2 (15/11/2026)
- **Tài liệu căn cứ (SSoT):** `docs/decision-table.md`, Issue #15 (`ktpmud-project#15`) và phản hồi Checkpoint 1

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM THỬ (TEST SUMMARY)

Toàn bộ kiểm thử được thực thi tự động qua `pytest` phiên bản 9.2.0 trên môi trường Python 3.12:

| Bộ kiểm thử (Test Suite) | Tập tin kiểm thử | Số ca test | Đạt (Passed) | Thất bại (Failed) | Tỷ lệ thành công | Thời gian chạy |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Logic Rule Engine & Biên** | `tests/test_classifier.py` | 24 | 24 | 0 | 100% | ~0.04s |
| **Nhật ký kiểm toán (Audit)** | `tests/test_audit.py` | 4 | 4 | 0 | 100% | ~0.01s |
| **Độ trễ Benchmark (A-07)** | `tests/test_benchmark.py` | 1 | 1 | 0 | 100% | ~0.07s |
| **TỔNG CỘNG** | **3 files** | **29** | **29** | **0** | **100%** | **0.12s** |

---

## 2. MA TRẬN ĐỘ PHỦ CÁC CA KIỂM THỬ ĐẶC TẢ

### 2.1. Kiểm thử phân tầng & Kịch bản chuẩn Tầng 2
- `test_r01_normal`: Không rõ dị nguyên + da/niêm mạc + hô hấp $\rightarrow$ `PHAN_VE`, `R01-PV`.
- `test_r02_normal`: Dị nguyên nghi ngờ + da/niêm mạc + tiêu hóa nặng $\rightarrow$ `PHAN_VE`, `R02-PV`.
- `test_r03_normal`: Dị nguyên đã biết không qua đường hít + hô hấp $\rightarrow$ `PHAN_VE`, `R03-PV`.

### 2.2. Kiểm thử giá trị biên Tuổi và Huyết áp tâm thu ($\pm 1$)
- `test_boundary_age_under_1_shock` / `no_shock`: Cận biên mốc 1 tuổi với ngưỡng $\text{HATT} < 70\text{ mmHg}$.
- `test_boundary_age_1_0_shock` / `no_shock`: Biên mốc 1 tuổi ($70 + 2 \times 1 = 72\text{ mmHg}$).
- `test_boundary_age_10_9_shock` / `no_shock`: Biên cận trên mốc 11 tuổi ($70 + 2 \times 10.9 = 91.8\text{ mmHg}$).
- `test_boundary_age_11_0_shock` / `no_shock`: Biên mốc 11 tuổi với ngưỡng $\text{HATT} < 90\text{ mmHg}$.
- `test_boundary_age_17_9_shock` / `no_shock`: Biên cận trên mốc 18 tuổi với ngưỡng $\text{HATT} < 90\text{ mmHg}$.

### 2.3. Kiểm thử nhánh giảm nghiêm ngặt > 30% HATT nền (Người lớn $\ge 18$ tuổi)
- `test_adult_drop_exactly_30_percent_no_shock`: HATT nền 140, HATT 98 (giảm đúng $30\%$) $\rightarrow$ Không đạt tiêu chí Sốc, trả về `PHAN_VE`.
- `test_adult_drop_over_30_percent_shock`: HATT nền 140, HATT 95 (giảm $> 30\%$) $\rightarrow$ Đạt tiêu chí Sốc, trả về `SOC_PHAN_VE`, `R-SOC`.

### 2.4. Kiểm thử nhánh loại trừ đường hít của R03 & Thứ tự ưu tiên rule
- `test_r03_inhalation_excluded`: Tiếp xúc dị nguyên qua đường hít $\rightarrow$ Không kích hoạt R03 (chuyển sang `THEO_DOI`).
- `test_r03_inhalation_valid_non_hit`: Không qua đường hít $\rightarrow$ Kích hoạt hợp lệ `R03-PV`.
- `test_multiple_rules_r02_and_r03`: Thỏa đồng thời cả R02 và R03 $\rightarrow$ Ưu tiên `R02-PV` trước `R03-PV` theo quy định tại Issue #15.

### 2.5. Kiểm thử chính sách thiếu dữ liệu (A-04 Policy)
- `test_missing_age_returns_theo_doi`: Thiếu tuổi $\rightarrow$ Trả về `THEO_DOI`, `rule_id = None`.
- `test_missing_hatt_with_tier2_returns_phan_ve`: Thỏa Tầng 2 nhưng thiếu HATT $\rightarrow$ Giữ nguyên `PHAN_VE`, không hạ mức.
- `test_missing_baseline_hatt_adult_above_90`: Người lớn HATT $\ge 90$ và thiếu HATT nền $\rightarrow$ `PHAN_VE`.
- `test_missing_boolean_keys_safe`: Thiếu các cờ boolean $\rightarrow$ Fallback an toàn mặc định `False`, không phát sinh exception runtime.
- `test_invalid_negative_age`: Tuổi âm $\rightarrow$ Xử lý như dữ liệu không hợp lệ, trả về `THEO_DOI`.

---

## 3. KIỂM THỬ NHẬT KÝ KIỂM TOÁN (AUDIT TRAIL — A-06)

Module `rule_engine/audit.py` được kiểm thử qua 4 test cases trong `tests/test_audit.py`:
- **Đủ 4 trường bắt buộc:** Mọi bản ghi kiểm toán xuất ra đều chứa `[timestamp, user_uuid, action_type, status]`. Trường `timestamp` chuẩn hóa theo ISO-8601 UTC kết thúc bằng `Z`.
- **Tuân thủ Zero PII:** Quét tự động khẳng định không có bất kỳ thông số sinh lý thô nào (`tuoi`, `huyet_ap_tam_thu`, triệu chứng lâm sàng) bị lọt vào bản ghi audit hay metadata.
- **Tích hợp liền mạch:** Hàm `classify_with_audit()` đảm bảo luồng phân loại và ghi vết diễn ra đồng thời, không làm gián đoạn hay sai lệch kết quả.

---

## 4. BÁO CÁO ĐO LƯỜNG HIỆU NĂNG ĐỘ TRỄ (BENCHMARK LATENCY — A-07)

### 4.1. Cấu hình thực nghiệm
- **Tập lệnh đo:** `scripts/benchmark.py`
- **Môi trường:** Python 3.12 64-bit, CPU Intel/AMD x86_64, Windows/Linux.
- **Phương pháp đo:** Dùng hàm đồng hồ có độ phân giải cao `time.perf_counter_ns()`.
- **Giai đoạn warm-up:** 100 lượt chạy với các payload ngẫu nhiên để JIT/interpreter ổn định bộ nhớ.
- **Giai đoạn đo lường:** **1.000 lượt chạy liên tục** trên tập payload tổng hợp (synthetic) phủ đầy đủ các nhánh logic (R-SOC, R01, R02, R03, THEO_DOI, thiếu trường).

### 4.2. Bảng số liệu phân vị độ trễ (Latency Distribution)

| Chỉ số thống kê | Thời gian thực thi đo được | Ngưỡng yêu cầu theo đề bài (A-07) | Đánh giá |
| :--- | :---: | :---: | :---: |
| **Tối thiểu (Min)** | 0.00010 ms (~0.1 $\mu$s) | — | Rất nhanh |
| **Trung bình (Mean)** | 0.00136 ms (~1.4 $\mu$s) | — | Ổn định |
| **Phân vị 50 (Median - p50)** | **0.00170 ms (~1.7 $\mu$s)** | — | Đạt chuẩn in-memory |
| **Phân vị 90 (p90)** | **0.00180 ms (~1.8 $\mu$s)** | — | Rất thấp |
| **Phân vị 95 (p95)** | **0.00180 ms (~1.8 $\mu$s)** | **< 100.0 ms** | **ĐẠT (Nhanh gấp > 55.000 lần)** |
| **Phân vị 99 (p99)** | **0.00180 ms (~1.8 $\mu$s)** | — | Không có hiện tượng giật cục |
| **Tối đa (Max)** | 0.00420 ms (~4.2 $\mu$s) | — | Kiểm soát tốt |

### 4.3. Kết luận hiệu năng
Do Rule Engine được thiết kế theo kiến trúc **Functional Layered Pipeline** thuần túy trong bộ nhớ (In-memory Pure Python), không thực hiện I/O mạng hoặc truy vấn cơ sở dữ liệu, độ trễ p95 đo được trên 1.000 ca chạy thực tế đạt **0.00180 ms**, vượt xa yêu cầu kỹ thuật của tiêu chí A-07 ($< 100\text{ ms}$).

---

## 5. KẾT LUẬN & ĐỘ SẴN SÀNG CHO CHECKPOINT 2
- 100% unit tests tự động đều vượt qua (29/29 passed).
- Đáp ứng trọn vẹn tiêu chí A-06 (Audit Trail 4 trường, Zero PII) và A-07 (Độ trễ p95 $< 100\text{ ms}$).
- Toàn bộ 5 mục sửa đổi bắt buộc từ Checkpoint 1 đã được nghiệm thu bằng test case cụ thể.
- Hệ thống đã sẵn sàng cho đợt review Checkpoint 2 và buổi PC-2 ngày 18/11/2026.
