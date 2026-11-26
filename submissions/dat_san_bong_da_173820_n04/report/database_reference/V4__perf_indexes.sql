-- V4 Performance Indexes for Soccer Booker on Neon PostgreSQL
CREATE INDEX IF NOT EXISTS ix_complexes_owner ON pitch_complexes(owner_user_id);
CREATE INDEX IF NOT EXISTS ix_pitches_complex ON pitches(complex_id);
CREATE INDEX IF NOT EXISTS ix_deposit_reports_booking ON booking_deposit_reports(booking_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_reviews_pitch_id ON reviews(pitch_id);
CREATE INDEX IF NOT EXISTS ix_bookings_expiry ON bookings(expires_at) WHERE status IN ('PENDING', 'WAITING_FOR_DEPOSIT') AND expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_owner_bank_active ON owner_bank_accounts(owner_user_id, is_default DESC, bank_account_id DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS ix_bookings_created_at ON bookings(created_at DESC);
