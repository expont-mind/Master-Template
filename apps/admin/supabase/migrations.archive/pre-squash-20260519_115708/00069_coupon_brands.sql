-- Coupon Brands junction table (for brand scope)
CREATE TABLE IF NOT EXISTS coupon_brands (
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    PRIMARY KEY (coupon_id, brand_id)
);

ALTER TABLE coupon_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupon_brands_select" ON coupon_brands FOR SELECT TO authenticated USING (true);
CREATE POLICY "coupon_brands_insert" ON coupon_brands FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "coupon_brands_delete" ON coupon_brands FOR DELETE TO authenticated USING (true);
