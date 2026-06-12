-- ============================================================================
-- Fix: paid_at was being reset to NOW() on every UPDATE to a paid order
-- (e.g. changing delivery_status, is_printed, etc.)
-- This caused orders to "shift" to today's date in the admin list.
--
-- Fix: Only set paid_at when it is NULL (first time becoming paid).
-- Transfer orders: only set paid_at = created_at when paid_at is NULL.
-- ============================================================================

CREATE OR REPLACE FUNCTION set_paid_at_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Paid: set paid_at only on first transition to paid (when paid_at is NULL)
  IF NEW.payment_status = 'paid' AND NEW.paid_at IS NULL THEN
    NEW.paid_at := NOW();
  -- Transfer + unpaid: set paid_at = created_at so it appears among paid orders
  ELSIF NEW.payment_method = 'transfer' AND NEW.payment_status = 'unpaid' AND NEW.paid_at IS NULL THEN
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

-- ============================================================================
-- Backfill: Restore corrupted paid_at values from payment_invoices and
-- order_status_history. The old trigger reset paid_at to NOW() on every
-- UPDATE, so we need to recover the original payment confirmation time.
-- ============================================================================

-- Temporarily disable the trigger so backfill UPDATEs don't re-fire it
ALTER TABLE orders DISABLE TRIGGER trg_set_paid_at;

-- 1. Best source: payment_invoices.updated_at (when invoice marked paid)
UPDATE orders o
SET paid_at = pi.updated_at
FROM payment_invoices pi
WHERE pi.order_id = o.id
  AND pi.status = 'paid'
  AND o.payment_status = 'paid';

-- 2. Fallback: order_status_history (when payment_status changed to paid)
UPDATE orders o
SET paid_at = osh.changed_at
FROM (
  SELECT DISTINCT ON (order_id) order_id, changed_at
  FROM order_status_history
  WHERE status_type = 'payment' AND new_status = 'paid'
  ORDER BY order_id, changed_at ASC
) osh
WHERE osh.order_id = o.id
  AND o.payment_status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM payment_invoices pi
    WHERE pi.order_id = o.id AND pi.status = 'paid'
  );

-- 3. Last resort: use created_at for paid orders with no payment records
UPDATE orders o
SET paid_at = o.created_at
WHERE o.payment_status = 'paid'
  AND o.paid_at IS NULL;

-- 4. Transfer orders: paid_at = created_at
UPDATE orders
SET paid_at = created_at
WHERE payment_method = 'transfer'
  AND payment_status = 'unpaid';

-- Re-enable the trigger
ALTER TABLE orders ENABLE TRIGGER trg_set_paid_at;
