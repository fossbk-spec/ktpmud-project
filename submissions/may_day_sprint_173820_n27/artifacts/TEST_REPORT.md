# Báo cáo kiểm thử và hiệu năng — snapshot gắn tag 19/11/2026

## 1. Phạm vi

Mã classifier/audit/test trên `track-a-development` ở commit [`4be2751f76e540a563de9f09f24935753f80a2e7`](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/commit/4be2751f76e540a563de9f09f24935753f80a2e7). [PR #10](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/pull/10) đã merge, tạo commit tích hợp [`7af8d47fd410b96dcdb4b7caccd48580ce07cf4a`](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/commit/7af8d47fd410b96dcdb4b7caccd48580ce07cf4a), không đổi mã phân loại. CI thành công trên commit merge đã được gắn [tag `bkt-2026-173820_n27-rc1`](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/tree/bkt-2026-173820_n27-rc1); [phần Freeze tiến độ](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/e692ad5d45f6de21d28279b957eb723b8ec256ac/progress/PROGRESS.md) ghi nhận sau khi tạo tag.

Nguồn: [Test Cases 175 ca](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/7af8d47fd410b96dcdb4b7caccd48580ce07cf4a/TEST_CASES.csv), [81 ca helper](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/7af8d47fd410b96dcdb4b7caccd48580ce07cf4a/tests/fixtures/INTERNAL_STATE_CASES.csv), [QA Matrix](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/7af8d47fd410b96dcdb4b7caccd48580ce07cf4a/docs/qa/QA_MATRIX.xlsx) và [phương pháp đối chiếu QA](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/7af8d47fd410b96dcdb4b7caccd48580ce07cf4a/docs/qa/EXECUTION_REVIEW.md).

## 2. Kết quả thực thi

| Kiểm tra | Bằng chứng và kết quả | Giới hạn |
|---|---|---|
| Pytest ứng viên | `python -m pytest -q` tại checkout tài liệu PR #10, Python 3.12.14, pytest 9.2.0: **490 passed, 3 skipped, 1 warning**. [CI trên commit merge `7af8d47`](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/actions/runs/44525947180) có kết luận `success`. | Ba test launcher Windows bị skip trên Linux; warning plugin pytest trong môi trường local. Không suy ra đã chạy trên Windows. |
| Test nghiệp vụ | [Test classifier](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/7af8d47fd410b96dcdb4b7caccd48580ce07cf4a/tests/test_classifier.py) đọc 175 case CSV và 81 case logic riêng; kiểm expected, `ly_do`, biên, 729 trạng thái boolean, câu sai đối chứng và câu tương đương. [Test audit](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/7af8d47fd410b96dcdb4b7caccd48580ce07cf4a/tests/test_audit.py) có **61 test**; [runner](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/7af8d47fd410b96dcdb4b7caccd48580ce07cf4a/tests/test_run_case.py) có test CSV/CLI. | `490 passed` là số mục pytest, không phải 490 yêu cầu độc lập hoặc nghiệm thu TA. |
| QA bổ sung | 21 input JSON trực tiếp trong workbook đã chạy, đều khớp mức/mã hoặc loại lỗi, ghi 21 record synthetic. Hai input synthetic mới ngoài CSV/đảo thứ tự khóa cho kết quả tương đương, ghi bốn record audit. [Chi tiết](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/7af8d47fd410b96dcdb4b7caccd48580ce07cf4a/docs/qa/EXECUTION_REVIEW.md). | 175 file output do QA cung cấp hỗ trợ truy vết, không tự là 175 test độc lập. |
| Clean checkout/PR CI | [CI PR #7](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/actions/runs/44106490534), [CI PR #10](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/actions/runs/44517747720) và [CI sau merge `7af8d47`](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/actions/runs/44525947180) đều chạy trong checkout GitHub Actions và thành công. Clean checkout độc lập ở mốc cũ `0d00584` có 483 passed; kết quả 490 ở ứng viên do CI chứng minh. | CI sau merge đã ghim đúng SHA; clean checkout độc lập cũ không được gán cho SHA này. |

## 3. Benchmark full path

[Script benchmark](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/7af8d47fd410b96dcdb4b7caccd48580ce07cf4a/benchmarks/benchmark_classify.py) đo public `classify()` gồm ghi audit JSONL thật qua open/append/write/flush/close, không `fsync`. Mỗi lượt 100 warm-up ngoài thống kê, 1.000 mẫu, nearest-rank p50/p95 (vị trí 500/950). Lượt rà QA kiểm vector 1–20 ms (p50=10, p95=19) và inject writer lỗi ở lần gọi 105: run dừng, không xuất percentile.

| Mã nguồn | Môi trường và kết quả | Mẫu |
|---|---|---|
| `4be2751` lần đầu | Python 3.12.14, Linux, Xeon Platinum 8573C; p50 **0.107712 ms**, p95 **0.301703 ms**. | [1.000 mẫu và metadata](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/7af8d47fd410b96dcdb4b7caccd48580ce07cf4a/docs/testing/benchmark_4be_timings.json) |
| Cùng mã nguồn, rà QA lần hai | Python 3.12.14, Linux 6.18.57, Xeon Platinum 8573C, RAM khoảng 9,7 GiB; p50 **0.110113 ms**, p95 **0.349306 ms**. | [1.000 mẫu bổ sung](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/7af8d47fd410b96dcdb4b7caccd48580ce07cf4a/docs/testing/benchmark_4be_recheck.json) |

Cả hai lượt thấp hơn ngưỡng p95 <100 ms **trong môi trường đã khai báo**. `/tmp` là `tmpfs`, lưu trong bộ nhớ; không đại diện tốc độ ghi ổ vật lý. Mỗi lượt ghi 100 + 1.000 audit record; không có exception. [Báo cáo phương pháp và giới hạn](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/7af8d47fd410b96dcdb4b7caccd48580ce07cf4a/docs/testing/BENCHMARK_REPORT.md). Nếu code hoặc môi trường cuối đổi, đo lại trước khi tuyên bố kết quả trên tag.

## 4. A-01–A-11 và việc còn chờ

[QA Matrix](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/7af8d47fd410b96dcdb4b7caccd48580ce07cf4a/docs/qa/QA_MATRIX.xlsx) ghi 11 AC `PASS` **trên ứng viên**, 63/64 ca QA và 55/60 checklist `PASS`. Một ca QA (`QA-033`) và năm checklist (`CHK-029/039/042/045/060`) còn `BLOCKED` trong workbook tại tag: các dòng yêu cầu SHA chưa được sửa hồi tố sau khi tag xuất hiện; các dòng còn lại thiếu record peer technical review/mapping từ thành viên. Các câu giải thích `ly_do` đã được Leader rà ngữ nghĩa; không biến lượt rà đó thành review cá nhân của Hải/Việt Đức.

| AC | Tự đánh giá trên tag | Bằng chứng và giới hạn |
|---|---|---|
| A-01–A-08 | `PASS` theo test, đối chiếu input và QA hiện có. | Tag trỏ đúng commit CI xanh; review kỹ thuật cá nhân của thành viên chưa có record riêng. |
| A-09 | `PASS`: workflow PR và CI sau merge xanh. | [Run trên SHA đã gắn tag](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/actions/runs/44525947180). |
| A-10 | `PASS` theo hai lượt đo trên code không đổi tại tag. | p95 0.301703/0.349306 ms trong `/tmp` tmpfs; không đại diện I/O ổ vật lý. |
| A-11 | `PASS`: README có nguyên văn disclaimer. | [README tại SHA đã gắn tag](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/7af8d47fd410b96dcdb4b7caccd48580ce07cf4a/README.md). |

`validate` xanh của PR nộp bài chỉ chứng minh cấu trúc tự động. `source-ref.json` ghi SHA merge, tag đã tạo và CI tương ứng; [Freeze progress](https://github.com/Huy-duc-1211/ktpmud-bkt-ruleengine-starter/blob/e692ad5d45f6de21d28279b957eb723b8ec256ac/progress/PROGRESS.md) được cập nhật sau khi gắn tag. Kiểm lại `validate` trên cùng Draft PR và chỉ chuyển Ready ngày 20/11. Không suy ra TA đã nghiệm thu từ CI hoặc approval nội bộ.
