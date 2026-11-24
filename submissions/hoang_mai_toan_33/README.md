# Vườn Toán Lớp 3 — Ước lượng trước khi tính đúng

- **Track:** B — BKT-2
- **Nhóm:** 33
- **Mã hồ sơ:** `hoang_mai_toan_33`
- **Starter:** [fossbk-spec/ktpmud-bkt-vuontoan-starter](https://github.com/fossbk-spec/ktpmud-bkt-vuontoan-starter), tag `bkt-2026-v1`
- **Fork mã nguồn:** [daohailinh10-code/ktpmud-bkt-vuontoan-starter](https://github.com/daohailinh10-code/ktpmud-bkt-vuontoan-starter)

## Tóm tắt sản phẩm

Vườn Toán Lớp 3 là ứng dụng luyện tập Toán dành cho học sinh lớp 3. Nhóm lựa chọn mở rộng ứng dụng với dạng bài **“Ước lượng trước khi tính đúng”**, giúp học sinh thực hiện hai bước: đưa ra kết quả ước lượng trước, sau đó nhập kết quả tính chính xác.

## Quy tắc của dạng bài

- Khoảng ước lượng được xác định theo sai số tương đối tối đa 10%: `L = ceil(0.9 × R)`, `U = floor(1.1 × R)`.
- Giá trị ước lượng được chấp nhận khi `L ≤ E ≤ U`.
- Điểm tối đa của câu hỏi được chia đều: 50% cho ước lượng và 50% cho kết quả tính chính xác.
- Các loại câu hỏi cũ và cơ chế tiến độ/sao hiện có cần được bảo toàn.

## Tài liệu trong hồ sơ

- [REQUIREMENTS](artifacts/REQUIREMENTS.md): yêu cầu chức năng và phi chức năng.
- [DECISIONS](artifacts/DECISIONS.md): các quyết định thiết kế và kiến trúc.
- [TEST_PLAN](artifacts/TEST_PLAN.md): kế hoạch, fixture và trường hợp kiểm thử.
- [PROGRESS](progress/PROGRESS.md): tiến độ và các bằng chứng đã xác minh.

## Trạng thái

README này tóm tắt phạm vi và tài liệu của hồ sơ PC-2. Trạng thái triển khai, kiểm thử và CI được ghi nhận theo bằng chứng thực tế trong báo cáo tiến độ; không xem nội dung đặc tả là bằng chứng tính năng đã hoàn tất.
