-- RPC function for point activation.
-- Uses SECURITY DEFINER to bypass RLS (same as frontend's createAdminClient).
-- Called from mobile app since client-side inserts are blocked by RLS.

CREATE OR REPLACE FUNCTION activate_points(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone TEXT;
  v_activated_at TIMESTAMPTZ;
BEGIN
  -- Verify caller is the same user
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Check preconditions
  SELECT primary_phone, point_activated_at
  INTO v_phone, v_activated_at
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  IF v_phone IS NULL OR v_phone = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'phone_not_verified');
  END IF;

  IF v_activated_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_activated');
  END IF;

  -- Set point_activated_at
  UPDATE users
  SET point_activated_at = NOW()
  WHERE id = p_user_id;

  -- Insert welcome bonus transaction
  INSERT INTO point_transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'promotional', 10000, 'Шинэ хэрэглэгчийн бонус');

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  -- Rollback activation on failure
  UPDATE users
  SET point_activated_at = NULL
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION activate_points(UUID) TO authenticated;
