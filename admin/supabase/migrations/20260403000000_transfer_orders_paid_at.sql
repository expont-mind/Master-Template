-- ============================================================================
-- Update paid_at trigger to handle transfer orders:
-- - When payment_method = 'transfer' (unpaid): set paid_at = created_at
--   so transfer orders appear among paid orders in admin list
--   (sorted by paid_at DESC NULLS LAST)
-- - When payment_method changes away from 'transfer': clear paid_at
-- - When payment_status = 'paid': set paid_at = NOW() (existing behavior)
-- ============================================================================

CREATE OR REPLACE FUNCTION set_paid_at_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Paid: always set paid_at to NOW so order moves to top
  IF NEW.payment_status = 'paid' THEN
    NEW.paid_at := NOW();
  -- Transfer + unpaid: set paid_at = created_at so it appears among paid orders
  ELSIF NEW.payment_method = 'transfer' AND NEW.payment_status = 'unpaid' THEN
    NEW.paid_at := COALESCE(NEW.created_at, NOW());
  -- Changed from paid to non-paid (non-transfer): clear paid_at
  ELSIF OLD IS NOT NULL
    AND OLD.payment_status = 'paid'
    AND NEW.payment_status != 'paid'
    AND NEW.payment_method != 'transfer' THEN
    NEW.paid_at := NULL;
  -- Switching away from transfer while still unpaid: clear paid_at
  ELSIF OLD IS NOT NULL
    AND OLD.payment_method = 'transfer'
    AND NEW.payment_method != 'transfer'
    AND NEW.payment_status != 'paid' THEN
    NEW.paid_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Backfill existing transfer orders that have NULL paid_at
UPDATE orders
SET paid_at = created_at
WHERE payment_method = 'transfer'
  AND payment_status = 'unpaid'
  AND paid_at IS NULL;
