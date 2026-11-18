# YÊU CẦU ĐẶC TẢ KỸ THUẬT VÀ TIÊU CHÍ NGHIỆM THU (M1)
**Đề tài:** Vườn Toán Lớp 3: "Ước lượng trước khi tính đúng"
**Nhóm thực hiện:** Nhóm 56 - Lớp 173820

## 1. Mục tiêu
- Bổ sung dạng bài rèn kỹ năng ước lượng trước khi thực hiện phép tính chi tiết cho học sinh lớp 3 trên các phép nhân và phép chia.
- Toàn bộ việc sinh đề và kiểm tra đúng/sai phải viết bằng thuật toán code (tất định), tuyệt đối không dùng AI/LLM làm nguồn đáp án.

## 2. Quy tắc ước lượng tất định (B-03)

Hệ thống áp dụng công thức toán học tất định (deterministic) cho mọi câu hỏi thuộc dạng bài Ước lượng, không phụ thuộc vào ví dụ rời rạc:

### 2.1. Phép nhân (`a x b`, với `10 <= a <= 999`, `2 <= b <= 9`)
- **Bước 1 — Làm tròn thừa số `a` thành `a_est`:**
  - Nếu `10 <= a < 100`: Làm tròn đến hàng chục gần nhất theo quy tắc toán học chuẩn (chữ số hàng đơn vị `>= 5` làm tròn lên, `< 5` làm tròn xuống):
    `a_est = Math.round(a / 10) * 10 = Math.floor((a + 5) / 10) * 10`
  - Nếu `100 <= a <= 999`: Làm tròn đến hàng trăm gần nhất:
    `a_est = Math.round(a / 100) * 100 = Math.floor((a + 50) / 100) * 100`
- **Bước 2 — Tính tâm ước lượng (`E_center`):**
  - Công thức: `E_center = a_est * b`
- **Bước 3 — Công thức độ rộng khoảng chấp nhận `[E_min, E_max]`:**
  - Bán kính dung sai `Delta` được xác định cố định theo độ lớn của `a`:
    - Nếu `10 <= a < 100` thì `Delta = 10`
    - Nếu `100 <= a <= 999` thì `Delta = 50`
  - Khoảng chấp nhận: `E_min = E_center - Delta` và `E_max = E_center + Delta`.
  - Giá trị ước lượng `u` của học sinh được chấm là **Hợp lý (Đúng)** khi và chỉ khi: `E_min <= u <= E_max` (tính cả 2 biên).
  - *Ví dụ:* Phép tính `48 x 3` -> `a_est = 50` -> `E_center = 50 * 3 = 150`. Do `a = 48 < 100` nên `Delta = 10` -> Khoảng chấp nhận là `[140, 160]`.

### 2.2. Phép chia (`a : b`, với `10 <= a <= 999`, `2 <= b <= 9`)
- **Bước 1 — Quy tắc tìm số tròn chục tương thích chia hết cho `b` (`a_comp`):**
  - Không dùng quy tắc làm tròn chục thông thường (vì ví dụ `87` làm tròn chục là `90` nhưng `90` không chia hết cho `4`).
  - Hệ thống định nghĩa quy tắc **Bội số tròn chục gần nhất của số chia `b`**: Tìm số `a_comp` là bội số của `(10 * b)` có khoảng cách `|a - a_comp|` nhỏ nhất theo công thức tất định:
    `a_comp = Math.floor(a / (10 * b) + 0.5) * (10 * b)`
    *(Nếu `a` cách đều hai bội số của `10 * b` thì công thức trên tự động làm tròn lên bội số lớn hơn. Trường hợp `a < 5 * b` thì lấy `a_comp = 10 * b`).*
- **Bước 2 — Tính tâm ước lượng (`E_center`) và Khoảng chấp nhận `[E_min, E_max]`:**
  - Tâm ước lượng: `E_center = a_comp / b`.
  - Bán kính dung sai cố định cho phép chia: `Delta = 2`.
  - Khoảng chấp nhận: `[E_center - 2, E_center + 2]`. Học sinh nhập `u` được chấm **Hợp lý (Đúng)** khi `E_center - 2 <= u <= E_center + 2`.
  - *Ví dụ:* Phép tính `87 : 4` -> Bước nhảy `10 * b = 40`. Ta có `Math.floor(87 / 40 + 0.5) = Math.floor(2.675) = 2` -> `a_comp = 2 * 40 = 80`. Tâm ước lượng `E_center = 80 / 4 = 20` -> Khoảng chấp nhận là `[18, 22]`.
- **Bước 3 — Quy tắc nhập và chấm kết quả chính xác cho phép chia (bao gồm chia có dư):**
  - Ở bước Tính chính xác của phép chia, giao diện hiển thị **2 ô nhập số nguyên**:
    1. `Thương` (`q`): Phần nguyên của phép chia.
    2. `Số dư` (`r`): Phần dư của phép chia (nếu học sinh để trống hoặc phép chia hết, mặc định hệ thống coi `r = 0`).
  - Hệ thống chấm bước Tính chính xác là **Đúng** khi và chỉ khi:
    `q == Math.floor(a / b)` **VÀ** `r == (a % b)`
  - *Ví dụ với `87 : 4`:* Học sinh phải nhập `Thương = 21` và `Số dư = 3` mới được chấm Đúng bước tính chính xác.

---

## 3. Chính sách giới hạn thử lại & Quy tắc chấm điểm (Mục 3 & Mục 6)

### 3.1. Chính sách giới hạn số lần thử lại bước ước lượng (`MAX_ESTIMATE_RETRIES = 2`)
- Để ngăn học sinh thử sai liên tục nhằm dò ra khoảng chấp nhận, mỗi câu hỏi chỉ cho phép học sinh gửi kiểm tra ước lượng tối đa **2 lần**:
  - **Lần 1 sai:** Hệ thống báo *"Ước lượng chưa hợp lý, em còn 1 lần thử lại"* và gợi ý làm tròn số hạng đầu.
  - **Lần 2 sai:** Hệ thống ghi nhận bước ước lượng là **Sai** (`ket_qua_uoc_luong = 0`), khóa ô nhập ước lượng, hiển thị số làm tròn gợi ý (`a_est` hoặc `a_comp`) và **tự động mở khóa bước tính chính xác** để học sinh vẫn tiếp tục hoàn thành câu hỏi.
  - Mọi request kiểm tra ước lượng từ lần thứ 3 trở đi trên cùng một câu hỏi sẽ bị Backend từ chối (`400 Bad Request`).

### 3.2. Quy tắc tính điểm (Ảnh hưởng của ước lượng đúng/sai tới điểm số)
Mỗi câu hỏi có điểm tối đa là **10 điểm** (hoặc trọng số `1.0` điểm trên thang 10 của bài luyện tập 10 câu):
- **Ước lượng Đúng (lần 1 hoặc lần 2) + Tính chính xác Đúng:** Đạt **100% điểm** (`10/10` điểm).
- **Ước lượng Sai (hết 2 lượt thử) + Tính chính xác Đúng:** Đạt **70% điểm** (`7/10` điểm — bị trừ 30% điểm do không qua bước ước lượng).
- **Ước lượng Đúng + Tính chính xác Sai:** Đạt **30% điểm** (`3/10` điểm — ghi nhận điểm tư duy ước lượng).
- **Ước lượng Sai + Tính chính xác Sai:** Đạt **0% điểm** (`0/10` điểm).

---

## 4. Bộ 12 Fixture chuẩn (B-02)

Hệ thống định nghĩa 12 câu hỏi mẫu cố định (6 câu nhân, 6 câu chia có cả chia hết và chia có dư) dùng cho seed dữ liệu và kiểm thử tự động:

| Mã Fixture | Đề bài | Loại phép tính | `a_est` / `a_comp` | Tâm `E_center` | Dung sai `Delta` | Khoảng chấp nhận `[E_min, E_max]` | Đáp án chính xác (Thương, Dư) |
|---|---|---|---|---|---|---|---|
| `B-F01` | `48 x 3` | Nhân 2 chữ số (làm tròn lên) | `50` | `150` | `10` | `[140, 160]` | `144` |
| `B-F02` | `42 x 3` | Nhân 2 chữ số (làm tròn xuống) | `40` | `120` | `10` | `[110, 130]` | `126` |
| `B-F03` | `48 x 4` | Nhân 2 chữ số (làm tròn lên) | `50` | `200` | `10` | `[190, 210]` | `192` |
| `B-F04` | `65 x 2` | Nhân 2 chữ số (tận cùng là 5) | `70` | `140` | `10` | `[130, 150]` | `130` |
| `B-F05` | `192 x 3` | Nhân 3 chữ số (làm tròn lên) | `200` | `600` | `50` | `[550, 650]` | `576` |
| `B-F06` | `318 x 2` | Nhân 3 chữ số (làm tròn xuống) | `300` | `600` | `50` | `[550, 650]` | `636` |
| `B-F07` | `87 : 4` | Chia có dư | `80` | `20` | `2` | `[18, 22]` | Thương: `21`, Dư: `3` |
| `B-F08` | `84 : 4` | Chia hết | `80` | `20` | `2` | `[18, 22]` | Thương: `21`, Dư: `0` |
| `B-F09` | `62 : 3` | Chia có dư | `60` | `20` | `2` | `[18, 22]` | Thương: `20`, Dư: `2` |
| `B-F10` | `95 : 5` | Chia hết | `100` | `20` | `2` | `[18, 22]` | Thương: `19`, Dư: `0` |
| `B-F11` | `158 : 4` | Chia 3 chữ số có dư | `160` | `40` | `2` | `[38, 42]` | Thương: `39`, Dư: `2` |
| `B-F12` | `245 : 6` | Chia 3 chữ số có dư | `240` | `40` | `2` | `[38, 42]` | Thương: `40`, Dư: `5` |

---

## 5. Tiêu chí nghiệm thu (BDD Acceptance Criteria)

- **Kịch bản 1: Học sinh ước lượng hợp lý (trong khoảng biên)**
  - **Given:** Học sinh nhận bài toán `48 x 3` (khoảng chấp nhận `[140, 160]`).
  - **When:** Học sinh nhập số ước lượng là `150` (hoặc giá trị biên `140`, `160`).
  - **Then:** Hệ thống báo *"Ước lượng hợp lý"*, lưu `ket_qua_uoc_luong = 1` và mở khóa bước tiếp theo để học sinh nhập kết quả tính chính xác (`144`).

- **Kịch bản 2: Học sinh ước lượng sai lệch ngoài khoảng và chính sách giới hạn 2 lần thử**
  - **Given:** Học sinh nhận bài toán `48 x 3` (khoảng chấp nhận `[140, 160]`).
  - **When:** Lần 1 học sinh nhập `80` (hoặc `139`, `161` sát ngoài biên).
  - **Then:** Hệ thống báo *"Ước lượng chưa hợp lý (còn 1 lượt thử)"* và gợi ý làm tròn thừa số `48` về hàng chục gần nhất. Nếu Lần 2 học sinh vẫn nhập sai (ví dụ `100`), hệ thống khóa ô ước lượng, ghi nhận `ket_qua_uoc_luong = 0`, hiển thị gợi ý `50 x 3 = 150` và tự động mở khóa ô nhập kết quả chính xác để học sinh làm tiếp.

- **Kịch bản 3: Bắt buộc hoàn thành bước ước lượng trước khi tính chính xác & giữ trạng thái khi Refresh**
  - **Given:** Học sinh đang ở màn hình làm bài và chưa hoàn thành bước ước lượng (`trang_thai_buoc = 'ESTIMATING'`).
  - **When:** Học sinh bỏ trống ô ước lượng hoặc cố gửi API nộp kết quả tính chính xác trước.
  - **Then:** Hệ thống chặn nộp bài (`400 Bad Request`) và yêu cầu thực hiện bước ước lượng trước. Khi đã qua bước ước lượng (`trang_thai_buoc = 'CALCULATING'`), nếu học sinh bấm Refresh (F5) trình duyệt, trạng thái mở khóa bước 2 vẫn được giữ nguyên từ CSDL.
