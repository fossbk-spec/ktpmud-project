-- ============================================================================
-- SOCCER BOOKER - DỮ LIỆU CRAWL THỰC TẾ CÁC SÂN BÓNG KHU VỰC HÀ NỘI (V3)
-- Nguồn tham khảo: sanbong.vn, datsan247.vn, sporta.vn, vecgroup.vn, klarasport.com
-- Bao gồm địa chỉ thực tế, tọa độ GPS, loại sân (5v5, 7v7, 11v11) & bảng giá theo khung giờ Hà Nội
-- ============================================================================

BEGIN;

-- Đảm bảo có đủ Owner chính cho demo trên lớp
DO $$
DECLARE
    v_owner_id BIGINT;
    v_client_id BIGINT;
    v_cid BIGINT;
    v_pid BIGINT;
BEGIN
    SELECT user_id INTO v_owner_id FROM users WHERE email = 'owner@soccerbooker.vn' LIMIT 1;
    SELECT user_id INTO v_client_id FROM users WHERE email = 'client@soccerbooker.vn' LIMIT 1;

    -- 1. Cụm Sân Bóng Thành Phát (Cầu Giấy)
    IF NOT EXISTS (SELECT 1 FROM pitch_complexes WHERE complex_name = 'Sân Bóng Thành Phát') THEN
        INSERT INTO pitch_complexes (owner_user_id, complex_name, address_line, ward, district, province, latitude, longitude, description)
        VALUES (v_owner_id, 'Sân Bóng Thành Phát', 'Số 2 Hoàng Minh Giám (Đối diện THPT Hà Nội - Amsterdam)', 'Trung Hòa', 'Cầu Giấy', 'Hà Nội', 21.0049000, 105.7958000,
                'Tổ hợp sân cỏ nhân tạo chất lượng cao tại khu vực Cầu Giấy - Trung Hòa Nhân Chính. Có bãi đỗ ô tô rộng rãi, căn tin, đèn LED chống chói.')
        RETURNING complex_id INTO v_cid;

        INSERT INTO pitches (complex_id, pitch_name, pitch_type, surface_type, description, deposit_amount)
        VALUES (v_cid, 'Sân 7 Thành Phát 01', '7v7', 'Cỏ nhân tạo FIFA Quality Pro', 'Sân 7 tiêu chuẩn 30x50m, cỏ mới êm chân, thoát nước tốt', 250000)
        RETURNING pitch_id INTO v_pid;

        INSERT INTO pitches (complex_id, pitch_name, pitch_type, surface_type, description, deposit_amount)
        VALUES (v_cid, 'Sân 7 Thành Phát 02', '7v7', 'Cỏ nhân tạo FIFA Quality Pro', 'Sân 7 tiêu chuẩn thi đấu phủi, có khán đài nhỏ', 250000);
    END IF;

    -- 2. Sân Bóng Đông Đô (Cầu Giấy)
    IF NOT EXISTS (SELECT 1 FROM pitch_complexes WHERE complex_name = 'Sân Bóng Đông Đô') THEN
        INSERT INTO pitch_complexes (owner_user_id, complex_name, address_line, ward, district, province, latitude, longitude, description)
        VALUES (v_owner_id, 'Sân Bóng Đông Đô', 'Lô D33, Thửa 39 Trần Thái Tông', 'Dịch Vọng Hậu', 'Cầu Giấy', 'Hà Nội', 21.0315000, 105.7885000,
                'Cụm sân quen thuộc của dân văn phòng khu vực Duy Tân - Trần Thái Tông. Dịch vụ thuê giày, áo pitch, nước uống đầy đủ.')
        RETURNING complex_id INTO v_cid;

        INSERT INTO pitches (complex_id, pitch_name, pitch_type, surface_type, description, deposit_amount)
        VALUES (v_cid, 'Sân 7 Đông Đô A', '7v7', 'Cỏ nhân tạo sợi kim cương', 'Mặt sân phẳng, hệ thống chiếu sáng 6 cột LED 400W', 250000);

        INSERT INTO pitches (complex_id, pitch_name, pitch_type, surface_type, description, deposit_amount)
        VALUES (v_cid, 'Sân 5 Đông Đô B', '5v5', 'Cỏ nhân tạo', 'Sân 5 người dành cho đội nhỏ hoặc giao hữu công ty', 150000);
    END IF;

    -- 3. Sân Bóng Đại học Thủy Lợi (Đống Đa)
    IF NOT EXISTS (SELECT 1 FROM pitch_complexes WHERE complex_name = 'Sân Bóng Đại học Thủy Lợi') THEN
        INSERT INTO pitch_complexes (owner_user_id, complex_name, address_line, ward, district, province, latitude, longitude, description)
        VALUES (v_owner_id, 'Sân Bóng Đại học Thủy Lợi', 'Ngõ 95 phố Chùa Bộc (Khuôn viên ĐH Thủy Lợi)', 'Trung Liệt', 'Đống Đa', 'Hà Nội', 21.0076000, 105.8256000,
                'Sân bóng đá truyền thống lâu đời khu vực Đống Đa, mặt cỏ chăm sóc định kỳ, hỗ trợ gộp sân 11 người.')
        RETURNING complex_id INTO v_cid;

        INSERT INTO pitches (complex_id, pitch_name, pitch_type, surface_type, description, deposit_amount)
        VALUES (v_cid, 'Sân 7 Thủy Lợi 1', '7v7', 'Cỏ nhân tạo thế hệ mới', 'Sân 7 người khu vực Chùa Bộc - Tây Sơn', 200000);

        INSERT INTO pitches (complex_id, pitch_name, pitch_type, surface_type, description, deposit_amount)
        VALUES (v_cid, 'Sân 11 Thủy Lợi (Gộp)', '11v11', 'Cỏ nhân tạo tiêu chuẩn', 'Sân 11 người chuyên tổ chức giải sinh viên & phủi nội thành', 500000);
    END IF;

    -- 4. Sân Bóng Hoàng Cầu (Sân 69 Hoàng Cầu - Đống Đa)
    IF NOT EXISTS (SELECT 1 FROM pitch_complexes WHERE complex_name = 'Sân Bóng 69 Hoàng Cầu') THEN
        INSERT INTO pitch_complexes (owner_user_id, complex_name, address_line, ward, district, province, latitude, longitude, description)
        VALUES (v_owner_id, 'Sân Bóng 69 Hoàng Cầu', 'Số 69 phố Hoàng Cầu mới', 'Ô Chợ Dừa', 'Đống Đa', 'Hà Nội', 21.0169000, 105.8233000,
                'Sân trung tâm Đống Đa kích thước 30x42m, thoát nước nhanh, có khu vực khán đài và căng tin phục vụ tận khuya.')
        RETURNING complex_id INTO v_cid;

        INSERT INTO pitches (complex_id, pitch_name, pitch_type, surface_type, description, deposit_amount)
        VALUES (v_cid, 'Sân 7 Hoàng Cầu 1', '7v7', 'Cỏ nhân tạo cao cấp', 'Sân gần hồ Hoàng Cầu thoáng mát', 250000);
    END IF;

    -- 5. Sân Bóng Phòng Không - Không Quân (Thanh Xuân)
    IF NOT EXISTS (SELECT 1 FROM pitch_complexes WHERE complex_name = 'Sân Bóng Phòng Không - Không Quân') THEN
        INSERT INTO pitch_complexes (owner_user_id, complex_name, address_line, ward, district, province, latitude, longitude, description)
        VALUES (v_owner_id, 'Sân Bóng Phòng Không - Không Quân', 'Số 3 Lê Trọng Tấn', 'Khương Mai', 'Thanh Xuân', 'Hà Nội', 20.9968000, 105.8294000,
                'Cụm sân lớn ngay nút giao Trường Chinh - Lê Trọng Tấn, bãi đỗ ô tô rộng, an ninh 24/7.')
        RETURNING complex_id INTO v_cid;

        INSERT INTO pitches (complex_id, pitch_name, pitch_type, surface_type, description, deposit_amount)
        VALUES (v_cid, 'Sân 7 PKKQ - Số 1', '7v7', 'Cỏ nhân tạo chuẩn', 'Sân 7 rộng đẹp, không bị vướng cột đèn', 250000);

        INSERT INTO pitches (complex_id, pitch_name, pitch_type, surface_type, description, deposit_amount)
        VALUES (v_cid, 'Sân 5 PKKQ - Số 2', '5v5', 'Cỏ nhân tạo', 'Sân 5 người phù hợp tập kỹ thuật và đá 5v5', 150000);
    END IF;

    -- 6. Sân Bóng 99 Định Công Hạ (Hoàng Mai)
    IF NOT EXISTS (SELECT 1 FROM pitch_complexes WHERE complex_name = 'Sân Bóng 99 Định Công Hạ') THEN
        INSERT INTO pitch_complexes (owner_user_id, complex_name, address_line, ward, district, province, latitude, longitude, description)
        VALUES (v_owner_id, 'Sân Bóng 99 Định Công Hạ', 'Ngõ 99 Định Công Hạ', 'Định Công', 'Hoàng Mai', 'Hà Nội', 20.9785000, 105.8278000,
                'Cụm sân thoáng đãng khu vực Định Công - Hoàng Mai với giá thuê hợp lý, nhiều khung giờ trống buổi chiều và tối muộn.')
        RETURNING complex_id INTO v_cid;

        INSERT INTO pitches (complex_id, pitch_name, pitch_type, surface_type, description, deposit_amount)
        VALUES (v_cid, 'Sân 7 Định Công 1', '7v7', 'Cỏ nhân tạo', 'Sân 7 người giá sinh viên khu vực Hoàng Mai', 200000);
    END IF;

    -- 7. Sân Bóng Phú Viên Long Biên (Long Biên)
    IF NOT EXISTS (SELECT 1 FROM pitch_complexes WHERE complex_name = 'Sân Bóng Phú Viên Long Biên') THEN
        INSERT INTO pitch_complexes (owner_user_id, complex_name, address_line, ward, district, province, latitude, longitude, description)
        VALUES (v_owner_id, 'Sân Bóng Phú Viên Long Biên', 'Số 138 Phú Viên (Gần cầu Chương Dương / Long Biên)', 'Bồ Đề', 'Long Biên', 'Hà Nội', 21.0419000, 105.8705000,
                'Cụm sân ven đê sông Hồng lộng gió, cực kỳ mát mẻ vào mùa hè, có khu nghỉ ngơi và giữ xe miễn phí.')
        RETURNING complex_id INTO v_cid;

        INSERT INTO pitches (complex_id, pitch_name, pitch_type, surface_type, description, deposit_amount)
        VALUES (v_cid, 'Sân 7 Phú Viên 01', '7v7', 'Cỏ nhân tạo cao cấp', 'Sân 7 view ven đê thoáng mát', 200000);
    END IF;

    -- 8. Sân Bóng C500 Học viện An Ninh (Hà Đông)
    IF NOT EXISTS (SELECT 1 FROM pitch_complexes WHERE complex_name = 'Sân Bóng C500 - Học viện An Ninh') THEN
        INSERT INTO pitch_complexes (owner_user_id, complex_name, address_line, ward, district, province, latitude, longitude, description)
        VALUES (v_owner_id, 'Sân Bóng C500 - Học viện An Ninh', 'Đường 19/5, Khu đô thị Văn Quán', 'Văn Quán', 'Hà Đông', 'Hà Nội', 20.9803000, 105.7921000,
                'Tổ hợp sân bóng nổi tiếng nhất khu vực Hà Đông - Thanh Xuân, mặt cỏ đạt chuẩn tổ chức các giải phủi lớn.')
        RETURNING complex_id INTO v_cid;

        INSERT INTO pitches (complex_id, pitch_name, pitch_type, surface_type, description, deposit_amount)
        VALUES (v_cid, 'Sân 7 C500 - Sân Chính', '7v7', 'Cỏ nhân tạo FIFA', 'Sân trung tâm có khán đài và hệ thống chiếu sáng cao áp', 250000);
    END IF;
END $$;

-- Cấu hình bảng giá thực tế theo từng quận & loại sân (dựa trên dữ liệu crawl Hà Nội)
-- - 06:00 - 16:00 (Ca sáng): Sân 5: 250k, Sân 7: 300k-350k, Sân 11: 800k
-- - 16:00 - 17:30 (Ca chiều): Sân 5: 350k, Sân 7: 550k-600k, Sân 11: 1.200k
-- - 17:30 - 20:30 (Giờ vàng): Sân 5: 500k, Sân 7: 750k-850k, Sân 11: 1.800k
-- - 20:30 - 22:00 (Ca tối muộn): Sân 5: 300k, Sân 7: 400k-500k, Sân 11: 1.000k
INSERT INTO pitch_weekly_slots (pitch_id, day_of_week, time_slot_id, price, is_active)
SELECT
    p.pitch_id,
    d.dow,
    ts.time_slot_id,
    CASE
        WHEN p.pitch_type = '11v11' THEN
            CASE
                WHEN ts.start_time IN ('17:30', '19:00') THEN 1800000
                WHEN ts.start_time = '16:00' THEN 1200000
                WHEN ts.start_time = '20:30' THEN 1000000
                ELSE 800000
            END
        WHEN p.pitch_type = '5v5' THEN
            CASE
                WHEN ts.start_time IN ('17:30', '19:00') THEN 500000
                WHEN ts.start_time = '16:00' THEN 350000
                WHEN ts.start_time = '20:30' THEN 300000
                ELSE 250000
            END
        ELSE -- 7v7 theo khu vực Hà Nội (Cầu Giấy / Đống Đa / Thanh Xuân nhỉnh hơn Hoàng Mai / Long Biên)
            CASE
                WHEN pc.district IN ('Cầu Giấy', 'Đống Đa', 'Thanh Xuân', 'Nam Từ Liêm') THEN
                    CASE
                        WHEN ts.start_time IN ('17:30', '19:00') THEN 800000
                        WHEN ts.start_time = '16:00' THEN 600000
                        WHEN ts.start_time = '20:30' THEN 450000
                        ELSE 320000
                    END
                ELSE
                    CASE
                        WHEN ts.start_time IN ('17:30', '19:00') THEN 700000
                        WHEN ts.start_time = '16:00' THEN 500000
                        WHEN ts.start_time = '20:30' THEN 400000
                        ELSE 300000
                    END
            END
    END AS price,
    TRUE
FROM pitches p
JOIN pitch_complexes pc ON pc.complex_id = p.complex_id
CROSS JOIN generate_series(1, 7) AS d(dow)
CROSS JOIN time_slots ts
ON CONFLICT (pitch_id, day_of_week, time_slot_id) DO UPDATE SET
    price = EXCLUDED.price,
    is_active = TRUE;

-- Thêm 1 booking mẫu trạng thái WAITING_FOR_DEPOSIT cho ngày hôm nay/ngày mai để demo cả luồng duyệt cọc trên Owner
INSERT INTO bookings (
    booking_code, client_user_id, pitch_id, booking_date, time_slot_id,
    status, pitch_price, deposit_amount, bank_name_snapshot, account_number_snapshot,
    account_holder_snapshot, transfer_instruction_snapshot, client_note, expires_at
)
SELECT
    'SB-DEMO-HOLD-01',
    (SELECT user_id FROM users WHERE email = 'client@soccerbooker.vn'),
    p.pitch_id,
    CURRENT_DATE + INTERVAL '1 day',
    ts.time_slot_id,
    'WAITING_FOR_DEPOSIT',
    800000,
    250000,
    'MB Bank',
    '0912345678999',
    'CHU SAN DEMO SOCCER BOOKER',
    'Chuyển khoản cọc kèm nội dung: SB-DEMO-HOLD-01',
    'Đặt giữ chỗ khung giờ vàng sân Thành Phát',
    CURRENT_TIMESTAMP + INTERVAL '4 hours'
FROM pitches p
JOIN time_slots ts ON ts.start_time = '19:00'
WHERE p.pitch_name = 'Sân 7 Thành Phát 01'
ON CONFLICT DO NOTHING;

INSERT INTO booking_deposit_reports (booking_id, reported_by, reported_amount, status, client_message)
SELECT
    b.booking_id,
    b.client_user_id,
    250000,
    'REPORTED',
    'Đã chuyển khoản MB Bank lúc 19:45, nhờ chủ sân duyệt giúp!'
FROM bookings b
WHERE b.booking_code = 'SB-DEMO-HOLD-01'
  AND NOT EXISTS (SELECT 1 FROM booking_deposit_reports r WHERE r.booking_id = b.booking_id);

COMMIT;
