-- Remove 10,000 point welcome bonus from activation flow.
-- Point activation still sets point_activated_at, but no longer inserts a bonus transaction.

-- 1) Update activate_points RPC: remove the welcome bonus INSERT
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

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  -- Rollback activation on failure
  UPDATE users
  SET point_activated_at = NULL
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 2) Update notification trigger: remove welcome bonus case
CREATE OR REPLACE FUNCTION create_point_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_title TEXT;
  v_body TEXT;
  v_metadata JSONB;
BEGIN
  -- Only notify for positive point additions
  IF NEW.amount <= 0 THEN
    RETURN NEW;
  END IF;

  IF NEW.type = 'earned' THEN
    -- Purchase earning
    v_title := 'MPoint нэмэгдлээ';
    v_body := 'Таны худалдан авалтаас ' || NEW.amount::text || ' Monpang point нэмэгдлээ.';
    v_metadata := jsonb_build_object(
      'sub_type', 'earned',
      'amount', NEW.amount
    );
  ELSIF NEW.type = 'promotional' THEN
    -- Admin gift / other promotional
    v_title := 'Бэлэг 🎁';
    v_body := 'Monpang-с танд ' || to_char(NEW.amount, 'FM999,999') || ' Monpang point бэлэглэлээ.';
    v_metadata := jsonb_build_object(
      'sub_type', 'admin_gift',
      'amount', NEW.amount,
      'description', COALESCE(NEW.description, '')
    );
  ELSIF NEW.type = 'refund' THEN
    -- Point refund
    v_title := 'Point буцаалт';
    v_body := 'Танд ' || to_char(NEW.amount, 'FM999,999') || ' Monpang point буцаагдлаа.';
    v_metadata := jsonb_build_object(
      'sub_type', 'refund',
      'amount', NEW.amount
    );
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, title, body, metadata)
  VALUES (NEW.user_id, 'promotion', v_title, v_body, v_metadata);

  RETURN NEW;
END;
$$;
