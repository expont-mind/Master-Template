-- Add max_applicable_qty to coupons: limits how many units get the discount
-- NULL = unlimited (all matching items, backward compatible)
ALTER TABLE coupons ADD COLUMN max_applicable_qty INTEGER DEFAULT NULL;
