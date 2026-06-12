-- ============================================================================
-- delete_unpaid_order RPC: cancel an unpaid order owned by the caller
--
-- Background: mobile (profile_controller.dart:449-459) calls this RPC to
-- delete unpaid orders from the user's order list. The RPC was applied to
-- production manually but never committed as a migration. As a result the
-- production version is unknown and appears to be missing FK cleanup —
-- callers report intermittent "Захиалга устгахад алдаа гарлаа" errors on
-- orders that have entries in `payments` (RESTRICT) or `point_transactions`
-- (NO ACTION default).
--
-- This canonical version mirrors delete_user()'s cleanup ordering:
--   1. Null out point_transactions.order_id (preserve audit trail, drop link)
--   2. Delete payments  (RESTRICT FK)
--   3. Delete payment_invoices  (SET NULL — could rely on FK, but explicit)
--   4. Delete orders  (CASCADE: order_items, order_status_history)
--
-- Safety:
--   - SECURITY DEFINER + auth.uid() ownership check
--   - payment_status must be 'unpaid' or 'processing'
--   - Returns jsonb so callers can handle the not-found / not-allowed cases
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_unpaid_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_order record;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Нэвтэрнэ үү');
  END IF;

  SELECT id, user_id, payment_status
  INTO v_order
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Захиалга олдсонгүй');
  END IF;

  IF v_order.user_id <> v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Энэ захиалгыг устгах эрхгүй');
  END IF;

  IF v_order.payment_status NOT IN ('unpaid', 'processing') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Зөвхөн төлбөр хийгдээгүй захиалгыг устгах боломжтой'
    );
  END IF;

  -- 1. Drop point_transactions order link (keep audit trail).
  UPDATE point_transactions
  SET order_id = NULL
  WHERE order_id = p_order_id;

  -- 2. Legacy payments table has RESTRICT — must clear first.
  DELETE FROM payments WHERE order_id = p_order_id;

  -- 3. payment_invoices is SET NULL on FK; deleting them is cleaner anyway
  --    since they are now orphan invoices for a cancelled order.
  DELETE FROM payment_invoices WHERE order_id = p_order_id;

  -- 4. Delete the order. CASCADE removes order_items + order_status_history.
  --    SET NULL on: coupon_usages.order_id, notifications.order_id,
  --    admin_features tables.
  DELETE FROM orders WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION delete_unpaid_order(uuid) TO authenticated;
