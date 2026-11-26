# Hướng Dẫn Nộp Bài (dành cho sinh viên)

## 0. Quy ước đặt tên thư mục nộp bài

```
submissions/<case_study_slug>_<ma_nhom>/
```

- `case_study_slug` — đúng slug case study trong
  [ngân hàng case study](https://fossbk-spec.github.io/ktpmud-book/do_an_mon_hoc)
  (`may_day`, `suy_tim`, `alzheimer`, `dreye`, `dai_thao_duong`, `nha_cho_thue`, `ban_do_lich_su`, `ke_hoach_hoc_tap`, hoặc `quan_ly_thiet_bi_y_te`).
- `ma_nhom` — mã nhóm giảng viên cấp, dạng `<mã lớp>_<số nhóm>` (vd
  `173820_n01` = lớp 173820, nhóm N01) — **không dùng họ tên thật hay MSSV**
  trong tên thư mục (xem Mục 3 về quyền riêng tư).

Ví dụ: `submissions/suy_tim_173820_n07/`, `submissions/dai_thao_duong_173820_n01/`.

**Quan trọng:** 1 Pull Request chỉ được đụng tới ĐÚNG 1 thư mục
`submissions/<case_study_slug>_<ma_nhom>/` của nhóm bạn. CI sẽ tự động
FAIL nếu PR chứa thay đổi ở bất kỳ đường dẫn nào khác (kể cả sửa file gốc
của repo này) — đây là cơ chế bắt buộc để nộp bài của nhóm A không bao giờ
vô tình ghi đè hay xung đột với nhóm B.

## 1. Các bước nộp bài

1. **Fork** repo này về tài khoản GitHub cá nhân (hoặc dùng chung 1 fork
   cho cả nhóm — 1 thành viên đại diện fork, thêm thành viên còn lại làm
   collaborator trên fork đó).
2. **Tạo branch riêng** từ `main`, đặt tên `submit/<case_study_slug>-<ma_lop>_<ma_nhom>` (ví dụ `submit/suy_tim-173820_n07`):
   ```
   git checkout -b submit/suy_tim-173820_n07
   ```
3. **Copy thư mục mẫu:**
   ```
   cp -r submissions/_TEMPLATE submissions/suy_tim_173820_n07
   ```

   > **Nhóm đã có thư mục trên `main`** (lớp 173820: N01, N02, N03, N27, N43): bỏ qua bước copy mẫu — chỉ thêm/cập nhật file trong thư mục đã có (nhưng phải viết lại `README.md` theo mẫu 6 mục trước PR tiếp theo, nếu không CI sẽ chặn).
4. **Điền `submission.json`** (xem schema Mục 2) và các file trong `report/`
   (SRS, C4 Model, Test Report...), `src/`, `slides/`.
5. **Chạy kiểm tra cục bộ trước khi nộp** (bắt buộc — CI sẽ chạy lại đúng
   script này, nộp trước khi tự kiểm tra chỉ tốn thời gian chờ CI fail):
   ```
   python scripts/validate_submission.py submissions/suy_tim_173820_n07
   ```
6. **Commit + push** lên fork của bạn, rồi **mở Pull Request** vào
   `main` của `fossbk-spec/ktpmud-project`.
7. Chờ CI chạy xanh (✅) — nếu đỏ (❌), đọc log lỗi, sửa, push tiếp lên
   cùng branch (PR tự cập nhật, không cần mở PR mới).
8. Giảng viên/TA review nội dung và merge. Sau khi merge, các tuần tiếp theo nộp bằng **PR mới** chỉ thêm/sửa file trong đúng thư mục của nhóm — không cần trao đổi trước với giảng viên cho cập nhật thường kỳ. Chỉ liên hệ giảng viên khi: đổi case study/mã nhóm, xóa file đã merge, nộp muộn, hoặc xung đột không tự xử lý được.

> **README bắt buộc (từ Tuần 11, 18/11):** `README.md` của nhóm phải có đủ 6 mục
> (giới thiệu sản phẩm, phạm vi MVP, kiến trúc & công nghệ, cài đặt & cách sử dụng,
> hướng phát triển Tuần 11–15, nhóm & tuân thủ) — copy từ `submissions/_TEMPLATE/README.md`.
> CI kiểm tra đủ mục, độ dài tối thiểu và không còn nội dung mẫu. Chi tiết:
> https://fossbk-spec.github.io/ktpmud-book/nop_bai

## 2. Schema `submission.json`

```json
{
  "case_study_slug": "suy_tim",
  "case_study_id": "CS-2",
  "group_code": "173820_n07",
  "members": ["MSSV1", "MSSV2", "MSSV3", "MSSV4"],
  "scenario": "khong_ap_dung",
  "submitted_at": "2026-11-25"
}
```

Trường bắt buộc: `case_study_slug`, `case_study_id`, `group_code`,
`members`. `members` dùng **MSSV**, không dùng họ tên đầy đủ (xem Mục 3).

`scenario` chỉ có ý nghĩa với CS-1 (Dr May Day) — điền `mayday_sim` (kịch
bản mô phỏng độc lập) hoặc `mayday_tichhop` (kịch bản tích hợp thật). Với
CS-2 đến CS-9 điền `khong_ap_dung`.

## 3. Quy tắc bắt buộc về quyền riêng tư (CI sẽ chặn nếu vi phạm)

1. **Không đưa dữ liệu bệnh nhân thật** vào bất kỳ đâu trong PR — tất cả 19 case study đều bắt buộc dùng dữ liệu synthetic/mô phỏng theo nguyên
   tắc Zero PII/PHI của khung chung. Vi phạm: 0 điểm toàn phần theo Rubric.
2. **Không commit khóa API, token, mật khẩu, file `.env`.**
3. **Không dùng họ tên thật đầy đủ** của thành viên trong code/README/tên
   file — dùng MSSV. Tránh rủi ro khi repo này công khai vĩnh viễn trên
   GitHub.
4. **Không commit file dữ liệu lớn** (>10MB) — dùng link Google
   Drive/HuggingFace/Kaggle trong `README.md` thay vì đẩy thẳng vào Git.
5. `scripts/validate_submission.py` chạy vài kiểm tra mẫu hình cơ bản
   (regex cho khóa API dạng phổ biến, file `.env`, MSSV/tên trong
   `submission.json` không phải placeholder) — đây là **lưới an toàn cuối**,
   không thay thế trách nhiệm tự rà soát của nhóm trước khi nộp.

## 4. Câu hỏi thường gặp

**Nhóm em có thể sửa bài sau khi đã merge không?**
Có — mỗi tuần nộp tiếp bằng **PR mới** chỉ thêm/sửa file trong đúng thư mục của nhóm; không sửa trên PR đã merge. Chỉ liên hệ giảng viên khi: đổi case study/mã nhóm, xóa file đã merge, nộp muộn, hoặc xung đột không tự xử lý được.

**2 nhóm có thể chọn cùng 1 case study không?**
Có — mỗi nhóm vẫn có thư mục riêng (`ma_nhom` khác nhau), không xung đột.

**Nhóm chọn CS-2/CS-3 (dùng chung kiến trúc 4-module) có cần nộp riêng
từng module không?**
Không — nộp toàn bộ sản phẩm (mã nguồn + báo cáo + slide) của nhóm vào
đúng 1 thư mục `submissions/<case_study_slug>_<ma_nhom>/`.

**Sao không cho push thẳng vào `main`?**
Vì `main` được bảo vệ (branch protection) — chỉ nhận thay đổi qua PR đã
qua CI xanh, tránh 1 nhóm vô tình (hoặc cố ý) ghi đè bài của nhóm khác.
