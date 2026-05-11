-- Store point/coupon info on orders for payment retry support
ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_used INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id) DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount INTEGER DEFAULT 0;
