-- ============================================================================
-- Ensure paid_at is always set when payment_status becomes 'paid'
-- 1. Trigger: auto-set paid_at on payment_status change
-- 2. Backfill: fix existing paid orders with NULL paid_at
-- ============================================================================

-- 1. Trigger function
CREATE OR REPLACE FUNCTION set_paid_at_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND NEW.paid_at IS NULL THEN
    NEW.paid_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Trigger on INSERT and UPDATE
DROP TRIGGER IF EXISTS trg_set_paid_at ON orders;
CREATE TRIGGER trg_set_paid_at
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_paid_at_on_payment();

-- 3. Backfill existing paid orders that have NULL paid_at
DO $$
BEGIN
  UPDATE orders
  SET paid_at = COALESCE(
    (SELECT pi.updated_at FROM payment_invoices pi WHERE pi.order_id = orders.id AND pi.status = 'paid' LIMIT 1),
    orders.created_at
  )
  WHERE payment_status = 'paid'
    AND paid_at IS NULL;
END;
$$;
