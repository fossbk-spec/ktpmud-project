# BKT Rule Engine — Track A (`nhom62`)

- **Nhóm:** `nhom62` (`Nhom_62`)
- **Track:** Track A — Hệ thống Hỗ trợ Phân tầng Nguy cơ Phản vệ (Dr. May Day: Rule Engine Sprint)
- **Repository mã nguồn:** `https://github.com/thaihop06/ktpmud-bkt-ruleengine-starter` (nhánh `develop`)
- **Release Tag:** `bkt-2026-nhom62-rc1`
- **Tuyên bố giới hạn sử dụng:** `educational/synthetic — not for clinical use`

## Tóm tắt sản phẩm
- Bộ phân loại quy tắc phân tầng nguy cơ phản vệ 2 tầng (`SOC_PHAN_VE`, `PHAN_VE`, `THEO_DOI`) với thứ tự ưu tiên cứng `R-SOC > R01-PV > R02-PV > R03-PV`.
- Áp dụng nguyên tắc **Không hạ mức (No-Downgrade)** khi thiếu số đo huyết áp tâm thu (HATT) hoặc HATT nền.
- Tính ngưỡng giảm > 30% HATT nền bằng phép nhân số nguyên (`10 * HATT < 7 * NEN`) để tránh sai số dấu phẩy động và chặn `OverflowError`.
- Lọc trắng 9 trường đầu vào (**Zero-PII**), không rò rỉ chỉ số thô hay liều thuốc/khuyến nghị điều trị trong `ly_do`, và ghi nhận **Audit Trail** đúng 4 trường `[Timestamp, User_UUID, Action_Type, Status]`.

## Cài đặt, chạy và kiểm thử từ clean checkout
- **Chạy bộ kiểm thử tự động (`pytest`):**
  ```bash
  pytest -q
