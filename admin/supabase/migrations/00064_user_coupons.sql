-- ============================================================================
-- USER COUPONS: Users claim coupons by entering codes
-- ============================================================================

-- Table for tracking which coupons users have claimed
CREATE TABLE user_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, coupon_id)
);

CREATE INDEX idx_user_coupons_user ON user_coupons(user_id);
CREATE INDEX idx_user_coupons_coupon ON user_coupons(coupon_id);

-- RLS
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_coupons_select_own" ON user_coupons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_coupons_insert_own" ON user_coupons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_coupons_delete_own" ON user_coupons
  FOR DELETE USING (auth.uid() = user_id);

-- Make coupons.name nullable (admin no longer needs to provide it)
ALTER TABLE coupons ALTER COLUMN name DROP NOT NULL;
ALTER TABLE coupons ALTER COLUMN name SET DEFAULT '';

-- Grant access to anon and authenticated
GRANT SELECT, INSERT, DELETE ON user_coupons TO authenticated;
GRANT SELECT ON user_coupons TO anon;
