-- RPC functions for recording point usage and awarding points after purchase.
-- Uses SECURITY DEFINER to bypass RLS (same pattern as activate_points).
-- Called from mobile app since client-side inserts are blocked by RLS.

-- 1. Record point usage (deduction) for an order
CREATE OR REPLACE FUNCTION record_point_usage(
  p_user_id UUID,
  p_order_id UUID,
  p_order_number TEXT,
  p_points_used INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- Verify caller is the same user
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Idempotency: check for existing 'used' transaction for this order
  IF EXISTS (
    SELECT 1 FROM point_transactions
    WHERE order_id = p_order_id AND type = 'used'
  ) THEN
    RETURN jsonb_build_object('success', true, 'already_exists', true);
  END IF;

  -- Verify sufficient balance
  SELECT COALESCE(SUM(amount), 0) INTO v_balance
  FROM point_transactions
  WHERE user_id = p_user_id;

  IF v_balance < p_points_used THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_balance');
  END IF;

  -- Insert usage transaction (negative amount)
  INSERT INTO point_transactions (user_id, order_id, type, amount, description)
  VALUES (p_user_id, p_order_id, 'used', -p_points_used, 'Захиалга #' || p_order_number);

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION record_point_usage(UUID, UUID, TEXT, INTEGER) TO authenticated;

-- 2. Award 2% points for a completed order
CREATE OR REPLACE FUNCTION award_points_for_order(
  p_user_id UUID,
  p_order_id UUID,
  p_order_number TEXT,
  p_order_total NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_earned INTEGER;
BEGIN
  -- Verify caller is the same user
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Calculate 2% reward
  v_earned := FLOOR(p_order_total * 0.02);
  IF v_earned <= 0 THEN
    RETURN jsonb_build_object('success', true, 'earned', 0);
  END IF;

  -- Idempotency: check for existing 'earned' transaction for this order
  IF EXISTS (
    SELECT 1 FROM point_transactions
    WHERE order_id = p_order_id AND type = 'earned'
  ) THEN
    RETURN jsonb_build_object('success', true, 'already_exists', true, 'earned', v_earned);
  END IF;

  -- Insert earned transaction
  INSERT INTO point_transactions (user_id, order_id, type, amount, description)
  VALUES (p_user_id, p_order_id, 'earned', v_earned, 'Захиалга #' || p_order_number);

  RETURN jsonb_build_object('success', true, 'earned', v_earned);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION award_points_for_order(UUID, UUID, TEXT, NUMERIC) TO authenticated;
