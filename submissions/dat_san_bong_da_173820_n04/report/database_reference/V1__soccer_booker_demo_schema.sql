-- ============================================================================
-- SOCCER BOOKER - CLOUD POSTGRESQL SCHEMA (OPTION 1: NEON / SUPABASE)
-- Phạm vi Demo: Nhánh 1 (Tài khoản), Nhánh 2 (Đặt sân & Cọc), Nhánh 4 (Quản lý sân)
-- Nhánh 3 (Giải đấu) sẽ được bổ sung ở V3__tournaments_schema.sql khi mở rộng.
-- Tương thích: PostgreSQL 15+ (Neon.tech / Supabase)
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE role_code AS ENUM ('CLIENT', 'PITCH_OWNER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE pitch_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE slot_block_type AS ENUM ('BLOCKED', 'UNAVAILABLE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM (
        'PENDING', 'WAITING_FOR_DEPOSIT', 'CONFIRMED', 'REJECTED',
        'CANCELLED', 'EXPIRED', 'COMPLETED', 'NO_SHOW'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE deposit_report_status AS ENUM ('REPORTED', 'CONFIRMED', 'REJECTED', 'WITHDRAWN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE comment_target_type AS ENUM ('PITCH', 'PITCH_SLOT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE financial_entry_type AS ENUM ('RECEIVED', 'REFUND', 'OUTSTANDING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE financial_entry_status AS ENUM ('RECORDED', 'VOIDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE oauth_provider AS ENUM ('GOOGLE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- NHÁNH 1: QUẢN LÝ TÀI KHOẢN & XÁC THỰC (FR-01..04, FR-47)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255),
    status user_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_phone UNIQUE (phone),
    CONSTRAINT ck_users_email_nonempty CHECK (length(trim(email)) > 0),
    CONSTRAINT ck_users_phone_nonempty CHECK (length(trim(phone)) > 0)
);

CREATE TABLE IF NOT EXISTS roles (
    role_id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code role_code NOT NULL UNIQUE,
    description VARCHAR(255)
);

INSERT INTO roles(code, description) VALUES
    ('CLIENT', 'Quyền tìm kiếm, đặt sân, đánh giá và bình luận'),
    ('PITCH_OWNER', 'Quyền quản lý cụm sân, sân bóng, khung giờ, booking và doanh thu')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id SMALLINT NOT NULL REFERENCES roles(role_id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
    oauth_account_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    provider oauth_provider NOT NULL,
    provider_subject VARCHAR(255) NOT NULL,
    provider_email VARCHAR(254),
    linked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_oauth_provider_subject UNIQUE (provider, provider_subject),
    CONSTRAINT uq_oauth_user_provider UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    verification_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pitch_owner_profiles (
    owner_profile_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    display_name VARCHAR(150) NOT NULL,
    contact_email VARCHAR(254),
    contact_phone VARCHAR(20),
    facebook_url TEXT,
    other_contact TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- NHÁNH 4: QUẢN LÝ SÂN BÓNG, KHUNG GIỜ & TÀI KHOẢN NGÂN HÀNG (FR-48..54, FR-16)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pitch_complexes (
    complex_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_user_id BIGINT NOT NULL REFERENCES users(user_id),
    complex_name VARCHAR(180) NOT NULL,
    address_line TEXT NOT NULL,
    ward VARCHAR(100),
    district VARCHAR(100),
    province VARCHAR(100) NOT NULL,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    description TEXT,
    status pitch_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_complex_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT ck_complex_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS pitches (
    pitch_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    complex_id BIGINT NOT NULL REFERENCES pitch_complexes(complex_id),
    pitch_name VARCHAR(150) NOT NULL,
    pitch_type VARCHAR(50) NOT NULL,
    surface_type VARCHAR(100),
    description TEXT,
    deposit_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
    status pitch_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_pitch_name_in_complex UNIQUE (complex_id, pitch_name)
);

CREATE TABLE IF NOT EXISTS pitch_images (
    image_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pitch_id BIGINT NOT NULL REFERENCES pitches(pitch_id) ON DELETE CASCADE,
    object_key TEXT NOT NULL,
    image_url TEXT,
    alt_text VARCHAR(255),
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_pitch_image_object UNIQUE (pitch_id, object_key)
);

CREATE TABLE IF NOT EXISTS amenities (
    amenity_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    amenity_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS pitch_amenities (
    pitch_id BIGINT NOT NULL REFERENCES pitches(pitch_id) ON DELETE CASCADE,
    amenity_id BIGINT NOT NULL REFERENCES amenities(amenity_id),
    PRIMARY KEY (pitch_id, amenity_id)
);

-- Ràng buộc btree_gist ngăn chặn tuyệt đối việc tạo 2 khung giờ giao nhau
CREATE TABLE IF NOT EXISTS time_slots (
    time_slot_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slot_name VARCHAR(80) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT ck_time_slot_positive CHECK (end_time > start_time),
    CONSTRAINT uq_time_slot_interval UNIQUE (start_time, end_time),
    CONSTRAINT ex_time_slots_no_overlap EXCLUDE USING gist
        ((tsrange(TIMESTAMP '2000-01-01' + start_time, TIMESTAMP '2000-01-01' + end_time, '[)')) WITH &&)
);

CREATE TABLE IF NOT EXISTS pitch_weekly_slots (
    pitch_weekly_slot_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pitch_id BIGINT NOT NULL REFERENCES pitches(pitch_id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    time_slot_id BIGINT NOT NULL REFERENCES time_slots(time_slot_id),
    price NUMERIC(14,2) NOT NULL CHECK (price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_pitch_weekday_slot UNIQUE (pitch_id, day_of_week, time_slot_id)
);

CREATE TABLE IF NOT EXISTS pitch_slot_blocks (
    slot_block_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pitch_id BIGINT NOT NULL REFERENCES pitches(pitch_id) ON DELETE CASCADE,
    block_date DATE NOT NULL,
    time_slot_id BIGINT NOT NULL REFERENCES time_slots(time_slot_id),
    block_type slot_block_type NOT NULL DEFAULT 'BLOCKED',
    reason TEXT,
    created_by BIGINT NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_pitch_slot_block UNIQUE (pitch_id, block_date, time_slot_id)
);

CREATE TABLE IF NOT EXISTS owner_bank_accounts (
    bank_account_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_user_id BIGINT NOT NULL REFERENCES users(user_id),
    bank_name VARCHAR(120) NOT NULL,
    account_number VARCHAR(80) NOT NULL,
    account_holder VARCHAR(150) NOT NULL,
    qr_image_url TEXT,
    transfer_instruction TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- NHÁNH 2: ĐẶT SÂN, GIỮ CHỖ 4H, BÁO CỌC, ĐÁNH GIÁ & TÀI CHÍNH
-- ============================================================================

CREATE TABLE IF NOT EXISTS bookings (
    booking_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_code VARCHAR(30) NOT NULL UNIQUE,
    client_user_id BIGINT NOT NULL REFERENCES users(user_id),
    pitch_id BIGINT NOT NULL REFERENCES pitches(pitch_id),
    booking_date DATE NOT NULL,
    time_slot_id BIGINT NOT NULL REFERENCES time_slots(time_slot_id),
    status booking_status NOT NULL DEFAULT 'PENDING',
    pitch_price NUMERIC(14,2) NOT NULL CHECK (pitch_price >= 0),
    deposit_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
    bank_account_id BIGINT REFERENCES owner_bank_accounts(bank_account_id) ON DELETE SET NULL,
    bank_name_snapshot VARCHAR(120),
    account_number_snapshot VARCHAR(80),
    account_holder_snapshot VARCHAR(150),
    transfer_instruction_snapshot TEXT,
    client_note TEXT,
    owner_note TEXT,
    expires_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_booking_deposit_not_over_price CHECK (deposit_amount <= pitch_price)
);

-- Partial Unique Index: Chặn tuyệt đối đặt trùng khung giờ đang giữ chỗ/hoạt động
CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_reserved_slot
ON bookings(pitch_id, booking_date, time_slot_id)
WHERE status IN ('PENDING', 'WAITING_FOR_DEPOSIT', 'CONFIRMED', 'COMPLETED', 'NO_SHOW');

CREATE INDEX IF NOT EXISTS ix_bookings_client_date ON bookings(client_user_id, booking_date DESC);
CREATE INDEX IF NOT EXISTS ix_bookings_pitch_date_status ON bookings(pitch_id, booking_date, status);

CREATE TABLE IF NOT EXISTS booking_status_history (
    booking_status_history_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    old_status booking_status,
    new_status booking_status NOT NULL,
    changed_by BIGINT REFERENCES users(user_id),
    reason TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS booking_deposit_reports (
    deposit_report_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    reported_by BIGINT NOT NULL REFERENCES users(user_id),
    reported_amount NUMERIC(14,2) NOT NULL CHECK (reported_amount >= 0),
    status deposit_report_status NOT NULL DEFAULT 'REPORTED',
    client_message TEXT,
    reviewed_by BIGINT REFERENCES users(user_id),
    reviewed_at TIMESTAMPTZ,
    review_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS no_show_events (
    no_show_event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE REFERENCES bookings(booking_id),
    client_user_id BIGINT NOT NULL REFERENCES users(user_id),
    marked_by BIGINT NOT NULL REFERENCES users(user_id),
    marked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    mark_reason TEXT,
    reversed_by BIGINT REFERENCES users(user_id),
    reversed_at TIMESTAMPTZ,
    reversal_reason TEXT,
    is_reversed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS reviews (
    review_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE REFERENCES bookings(booking_id),
    pitch_id BIGINT NOT NULL REFERENCES pitches(pitch_id),
    client_user_id BIGINT NOT NULL REFERENCES users(user_id),
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    content TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
    comment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    author_user_id BIGINT NOT NULL REFERENCES users(user_id),
    target_type comment_target_type NOT NULL,
    target_id BIGINT NOT NULL,
    content TEXT NOT NULL CHECK (length(trim(content)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS ix_comments_target ON comments(target_type, target_id, created_at);

CREATE TABLE IF NOT EXISTS financial_entries (
    financial_entry_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_user_id BIGINT NOT NULL REFERENCES users(user_id),
    booking_id BIGINT NOT NULL REFERENCES bookings(booking_id),
    entry_type financial_entry_type NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    status financial_entry_status NOT NULL DEFAULT 'RECORDED',
    description TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recorded_by BIGINT NOT NULL REFERENCES users(user_id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    voided_by BIGINT REFERENCES users(user_id),
    voided_at TIMESTAMPTZ,
    void_reason TEXT
);
CREATE INDEX IF NOT EXISTS ix_financial_owner_date ON financial_entries(owner_user_id, occurred_at);

CREATE TABLE IF NOT EXISTS audit_logs (
    audit_log_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_user_id BIGINT REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE VIEW v_pitch_rating_summary AS
SELECT pitch_id, COUNT(*) AS review_count, ROUND(AVG(rating)::numeric, 2) AS average_rating
FROM reviews
GROUP BY pitch_id;

COMMIT;
