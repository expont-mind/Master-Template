-- Add separate print status columns for 3 print workflows
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_products_printed BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_box_printed BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_downloaded BOOLEAN DEFAULT FALSE;
