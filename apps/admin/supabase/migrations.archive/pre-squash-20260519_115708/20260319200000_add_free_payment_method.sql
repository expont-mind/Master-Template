-- Add 'free' payment method for orders fully covered by points/coupons
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'free';
