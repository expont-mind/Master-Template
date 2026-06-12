-- ============================================================================
-- Add trigger to automatically sync products.is_active with products.status
-- Previously, direct updates to status (via admin API PATCH or raw SQL) did NOT
-- update is_active, causing active products to be invisible on frontend/mobile.
-- ============================================================================

-- Trigger function: keep is_active in sync with status on every UPDATE
CREATE OR REPLACE FUNCTION sync_product_is_active()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.is_active := (NEW.status = 'active');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger (BEFORE UPDATE so we can modify NEW row)
DROP TRIGGER IF EXISTS trg_sync_product_is_active ON products;
CREATE TRIGGER trg_sync_product_is_active
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_is_active();

-- One-time fix: sync any currently out-of-sync records
UPDATE products SET is_active = (status = 'active')
WHERE is_active != (status = 'active');
