-- Soft-delete user account: clears personal data, deletes orders/addresses/etc,
-- but keeps point_transactions, user_coupons, primary_phone, and point_activated_at
-- so the user can re-login with the same phone and retain points/coupons
-- without receiving the welcome bonus again.

CREATE OR REPLACE FUNCTION delete_user()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Nullify order refs in point_transactions (keep transactions, remove order link)
  UPDATE point_transactions SET order_id = NULL WHERE user_id = v_user_id;

  -- 2. Delete payments (RESTRICT on orders.id — must delete before orders)
  DELETE FROM payments
  WHERE order_id IN (SELECT id FROM orders WHERE user_id = v_user_id);

  -- 3. Delete payment_invoices for user's orders
  DELETE FROM payment_invoices
  WHERE order_id IN (SELECT id FROM orders WHERE user_id = v_user_id);

  -- 4. Delete orders (cascades to: order_items, order_status_history)
  --    (SET NULL on: coupon_usages.order_id, notifications.order_id)
  DELETE FROM orders WHERE user_id = v_user_id;

  -- 5. Delete remaining user data
  DELETE FROM notifications WHERE user_id = v_user_id;
  DELETE FROM addresses WHERE user_id = v_user_id;
  DELETE FROM wishlists WHERE user_id = v_user_id;
  DELETE FROM reviews WHERE user_id = v_user_id;
  DELETE FROM cart_items WHERE user_id = v_user_id;

  -- 6. KEEP: point_transactions, user_coupons, coupon_usages (usage tracking)

  -- 7. Soft-delete: clear personal info, keep phone + point_activated_at
  UPDATE users SET
    first_name = NULL,
    last_name = NULL,
    email = NULL,
    avatar_url = NULL,
    secondary_phone = NULL,
    status = 'inactive',
    updated_at = NOW()
  WHERE id = v_user_id;
END;
$$;
