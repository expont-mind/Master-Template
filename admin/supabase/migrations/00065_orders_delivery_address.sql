-- Add delivery address snapshot fields to orders table
-- These capture the address at checkout time, rather than relying on the user's current address

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_city TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_district TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_sub_district TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_detail TEXT;
