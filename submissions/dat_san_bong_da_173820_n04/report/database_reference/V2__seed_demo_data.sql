-- ============================================================================
-- SOCCER BOOKER - SEED DATA MẪU CHO DEMO (OPTION 1: CLOUD POSTGRESQL)
-- Chạy sau khi đã thực thi V1__soccer_booker_demo_schema.sql
-- ============================================================================

BEGIN;

-- 1. Tài khoản Demo (mật khẩu mẫu dạng BCrypt của "Demo@123")
INSERT INTO users (full_name, email, phone, password_hash, status, email_verified_at)
VALUES
    ('Chủ sân Demo Bách Khoa', 'owner@soccerbooker.vn', '0912345678', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ACTIVE', CURRENT_TIMESTAMP),
    ('Khách hàng Demo', 'client@soccerbooker.vn', '0987654321', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ACTIVE', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Gán quyền: Owner có cả CLIENT và PITCH_OWNER; Client chỉ có CLIENT
INSERT INTO user_roles (user_id, role_id)
SELECT u.user_id, r.role_id FROM users u, roles r
WHERE u.email = 'owner@soccerbooker.vn' AND r.code IN ('CLIENT', 'PITCH_OWNER')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.user_id, r.role_id FROM users u, roles r
WHERE u.email = 'client@soccerbooker.vn' AND r.code = 'CLIENT'
ON CONFLICT DO NOTHING;

-- Hồ sơ Chủ sân & Tài khoản ngân hàng nhận cọc
INSERT INTO pitch_owner_profiles (user_id, display_name, contact_email, contact_phone)
SELECT user_id, 'Hệ thống Sân Bóng Bách Khoa & Mỹ Đình', 'owner@soccerbooker.vn', '0912345678'
FROM users WHERE email = 'owner@soccerbooker.vn'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO owner_bank_accounts (owner_user_id, bank_name, account_number, account_holder, transfer_instruction, is_default)
SELECT user_id, 'MB Bank', '0912345678999', 'CHU SAN DEMO SOCCER BOOKER', 'Chuyển khoản cọc kèm nội dung: <Ma_Booking>', TRUE
FROM users WHERE email = 'owner@soccerbooker.vn';

-- 2. Cụm sân bóng tại Hà Nội (kèm tọa độ GPS)
INSERT INTO pitch_complexes (owner_user_id, complex_name, address_line, ward, district, province, latitude, longitude, description)
SELECT user_id, 'Cụm Sân Bóng Đá Bách Khoa', 'Số 1 Đại Cồ Việt', 'Bách Khoa', 'Hai Bà Trưng', 'Hà Nội', 21.0052000, 105.8431000, 'Cụm sân cỏ nhân tạo đạt chuẩn, có đèn LED chiếu sáng và bãi đỗ xe rộng rãi.'
FROM users WHERE email = 'owner@soccerbooker.vn';

INSERT INTO pitch_complexes (owner_user_id, complex_name, address_line, ward, district, province, latitude, longitude, description)
SELECT user_id, 'Cụm Sân Thể Thao Mỹ Đình', 'Đường Lê Đức Thọ', 'Mỹ Đình 2', 'Nam Từ Liêm', 'Hà Nội', 21.0205000, 105.7639000, 'Sân 7 và sân 5 mặt cỏ FIFA Quality Pro, có căng tin và phòng thay đồ.'
FROM users WHERE email = 'owner@soccerbooker.vn';

-- 3. Danh sách sân con
INSERT INTO pitches (complex_id, pitch_name, pitch_type, surface_type, description, deposit_amount)
SELECT complex_id, 'Sân 7A - Cỏ FIFA', '7v7', 'Cỏ nhân tạo cao cấp', 'Sân 7 người tiêu chuẩn, đèn LED 400W', 200000
FROM pitch_complexes WHERE complex_name = 'Cụm Sân Bóng Đá Bách Khoa';

INSERT INTO pitches (complex_id, pitch_name, pitch_type, surface_type, description, deposit_amount)
SELECT complex_id, 'Sân 5A - Mini', '5v5', 'Cỏ nhân tạo', 'Sân 5 người phù hợp đá giao hữu văn phòng', 150000
FROM pitch_complexes WHERE complex_name = 'Cụm Sân Bóng Đá Bách Khoa';

INSERT INTO pitches (complex_id, pitch_name, pitch_type, surface_type, description, deposit_amount)
SELECT complex_id, 'Sân 7B - Mỹ Đình', '7v7', 'Cỏ nhân tạo', 'Sân 7 người thoáng mát khu vực Mỹ Đình', 200000
FROM pitch_complexes WHERE complex_name = 'Cụm Sân Thể Thao Mỹ Đình';

-- 4. Tiện ích
INSERT INTO amenities (amenity_name, description) VALUES
    ('Bãi đỗ xe máy/ô tô', 'Khu vực gửi xe có bảo vệ trông coi'),
    ('Đèn LED ban đêm', 'Hệ thống chiếu sáng không chói mắt'),
    ('Nước uống miễn phí', 'Trà đá miễn phí cho mỗi đội'),
    ('Cho thuê giày & áo pitch', 'Hỗ trợ thuê phụ kiện tại quầy')
ON CONFLICT (amenity_name) DO NOTHING;

-- 5. Khung giờ chuẩn (không chồng lấn - bảo vệ bởi btree_gist)
INSERT INTO time_slots (slot_name, start_time, end_time) VALUES
    ('Ca Sáng 1 (06:00 - 07:30)', '06:00', '07:30'),
    ('Ca Sáng 2 (07:30 - 09:00)', '07:30', '09:00'),
    ('Ca Chiều (16:00 - 17:30)', '16:00', '17:30'),
    ('Ca Vàng 1 (17:30 - 19:00)', '17:30', '19:00'),
    ('Ca Vàng 2 (19:00 - 20:30)', '19:00', '20:30'),
    ('Ca Tối (20:30 - 22:00)', '20:30', '22:00')
ON CONFLICT DO NOTHING;

-- 6. Cấu hình lịch tuần cho tất cả sân (Thứ 2 -> Chủ nhật)
INSERT INTO pitch_weekly_slots (pitch_id, day_of_week, time_slot_id, price, is_active)
SELECT p.pitch_id, d.dow, ts.time_slot_id,
    CASE
        WHEN ts.start_time IN ('17:30', '19:00') THEN 650000
        WHEN ts.start_time = '20:30' THEN 550000
        ELSE 400000
    END,
    TRUE
FROM pitches p
CROSS JOIN generate_series(1, 7) AS d(dow)
CROSS JOIN time_slots ts
ON CONFLICT DO NOTHING;

-- 7. Một số dữ liệu mẫu Booking, Tài chính & Đánh giá để hiển thị ngay khi mở Dashboard
INSERT INTO bookings (booking_code, client_user_id, pitch_id, booking_date, time_slot_id, status, pitch_price, deposit_amount, confirmed_at, completed_at)
SELECT
    'SB-20261125-001',
    (SELECT user_id FROM users WHERE email = 'client@soccerbooker.vn'),
    (SELECT pitch_id FROM pitches WHERE pitch_name = 'Sân 7A - Cỏ FIFA' LIMIT 1),
    CURRENT_DATE - INTERVAL '1 day',
    (SELECT time_slot_id FROM time_slots WHERE start_time = '17:30' LIMIT 1),
    'COMPLETED',
    650000,
    200000,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
ON CONFLICT (booking_code) DO NOTHING;

INSERT INTO financial_entries (owner_user_id, booking_id, entry_type, amount, description, recorded_by)
SELECT
    (SELECT user_id FROM users WHERE email = 'owner@soccerbooker.vn'),
    b.booking_id,
    'RECEIVED',
    200000,
    'Thu tiền cọc đơn SB-20261125-001',
    (SELECT user_id FROM users WHERE email = 'owner@soccerbooker.vn')
FROM bookings b WHERE b.booking_code = 'SB-20261125-001';

INSERT INTO reviews (booking_id, pitch_id, client_user_id, rating, content)
SELECT
    b.booking_id,
    b.pitch_id,
    b.client_user_id,
    5,
    'Mặt cỏ êm, đèn sáng rõ, chủ sân xác nhận cọc rất nhanh!'
FROM bookings b WHERE b.booking_code = 'SB-20261125-001'
ON CONFLICT (booking_id) DO NOTHING;

INSERT INTO comments (author_user_id, target_type, target_id, content)
SELECT
    (SELECT user_id FROM users WHERE email = 'client@soccerbooker.vn'),
    'PITCH',
    (SELECT pitch_id FROM pitches WHERE pitch_name = 'Sân 7A - Cỏ FIFA' LIMIT 1),
    'Sân có chỗ gửi xe ô tô miễn phí không ạ?'
;

COMMIT;
