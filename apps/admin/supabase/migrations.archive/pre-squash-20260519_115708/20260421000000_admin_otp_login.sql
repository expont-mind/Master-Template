-- ============================================================================
-- Admin OTP Login: password_hash устгах, 2FA toggle нэмэх, нэмэлт имэйл хүснэгт
-- ============================================================================

-- 1. admins хүснэгтээс password_hash устгах (OTP-руу шилжсэн)
ALTER TABLE admins DROP COLUMN IF EXISTS password_hash;

-- 2. 2FA toggle нэмэх
ALTER TABLE admins ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT TRUE NOT NULL;

-- 3. Нэмэлт нэвтрэх имэйл хаягийн хүснэгт
CREATE TABLE IF NOT EXISTS admin_login_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    email VARCHAR NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    verification_code VARCHAR(6),
    verification_expires_at TIMESTAMP,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_admin_login_emails_admin_id
    ON admin_login_emails(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_login_emails_email_verified
    ON admin_login_emails(email) WHERE is_verified = TRUE;

-- RLS
ALTER TABLE admin_login_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on admin_login_emails"
    ON admin_login_emails FOR ALL TO service_role
    USING (true) WITH CHECK (true);
