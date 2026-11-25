# BÁO CÁO KIỂM THỬ VÀ HIỆU NĂNG (TEST REPORT)

> Nhóm: 11 · Track A: Dr May Day Rule Engine Sprint
> Ngày đo: 16/11/2026 22:07:56
> Chuẩn đối chiếu: Tiêu chí A-08, A-09, A-10 của đề thi Hack Marathon 2026

---

## 1. Môi trường đo và cấu hình máy

| Thông số | Giá trị |
|---|---|
| **Hệ điều hành** | Windows 11 (10.0.26200) |
| **Kiến trúc CPU** | AMD64 (Intel64 Family 6 Model 151 Stepping 2, GenuineIntel) |
| **Phiên bản Python** | 3.13.14 (CPython) |
| **Thư viện kiểm thử** | pytest (chỉ dùng Python standard library cho benchmark) |

---

## 2. Kết quả kiểm thử tự động (Unit Test - Tiêu chí A-08)

- **Tổng số test cases:** 61 ca kiểm thử (bao phủ toàn bộ 45 Acceptance Criteria AC-01..AC-45).
- **Kết quả:** **61 / 61 passed (100% PASS)**.
- **Thời gian chạy test:** ~0.06 giây.
- **Phân loại ca kiểm thử đạt chuẩn A-07:**
  - *Normal cases:* AC-01, AC-04, AC-06, AC-08 (các kịch bản phản vệ chuẩn).
  - *Boundary cases:* AC-09..AC-18 (ngưỡng sốc dấu `<` chặt), AC-29..AC-36 (ranh giới chuyển đổi giữa các nhóm tuổi kề nhau 0.99 vs 1, 10.9 vs 11, 17.9 vs 18).
  - *Missing / Invalid cases:* AC-19..AC-22, AC-37..AC-44 (tuân thủ policy xử lý lỗi không hạ mức, unknown không tính là True).
  - *Explainability & Audit:* AC-23 (lý do không lộ data thô), AC-24, AC-25, AC-45 (audit đúng 4 trường, Zero PII, validate UUID).
  - *Anti-hardcoding:* AC-27 (kiểm thử với dữ liệu synthetic độc lập).

---

## 3. Kết quả đo hiệu năng (Benchmark Latency - Tiêu chí A-10)

- **Quy trình đo:**
  1. Chạy khởi động (warm-up): 200 lượt.
  2. Đo đạc chính thức: **5,000 lượt chạy** liên tục bằng `time.perf_counter()`.
  3. Dữ liệu thử nghiệm: Tập synthetic data bao gồm đa dạng các ca thuộc cả 3 mức `SOC_PHAN_VE`, `PHAN_VE` và `THEO_DOI`.

| Chỉ số | Kết quả đo được | Yêu cầu đề thi | Đánh giá |
|---|---|---|---|
| **Thời gian trung bình (Mean)** | **0.0016 ms** | - | Cực nhanh |
| **p50 (Trung vị)** | **0.0015 ms** | - | Đạt |
| **p95 (Phân vị 95)** | **0.0021 ms** | **< 100 ms** | **ĐẠT XUẤT SẮC** (nhanh hơn yêu cầu đề ra) |
| **p99 (Phân vị 99)** | **0.0029 ms** | - | Ổn định cao |
| **Max latency** | **0.0475 ms** | < 100 ms | Đạt |

---

## 4. Kết luận

Hệ thống Rule Engine đáp ứng toàn diện:
- Đúng đắn về logic nghiệp vụ y tế theo chuẩn WAO/EAACI 2020.
- Tuân thủ chính sách Zero PII và bảo mật tuyệt đối.
- Hiệu năng phân loại siêu tốc (p95 < 0.1 ms, vượt xa ngưỡng 100 ms của đề bài).
