-- RPC function for updating order payment_method (qpay <-> transfer)
-- Used by mobile app since RLS doesn't allow direct UPDATE on orders table.

CREATE OR REPLACE FUNCTION update_order_payment_method(
  p_order_id uuid,
  p_payment_method text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate payment_method value
  IF p_payment_method NOT IN ('qpay', 'transfer') THEN
    RAISE EXCEPTION 'Invalid payment_method: %', p_payment_method;
  END IF;

  -- Only allow the order owner to update, and only unpaid orders
  UPDATE orders
  SET
    payment_method = p_payment_method::payment_method,
    updated_at = now()
  WHERE id = p_order_id
    AND user_id = auth.uid()
    AND payment_status = 'unpaid';
END;
$$;
