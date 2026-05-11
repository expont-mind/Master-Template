-- ============================================================================
-- Auto-create user notification when points are added
-- ============================================================================

-- Trigger function: creates a notification row for positive point transactions
CREATE OR REPLACE FUNCTION create_point_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_title TEXT;
  v_body TEXT;
BEGIN
  -- Only notify for positive point additions
  IF NEW.amount <= 0 THEN
    RETURN NEW;
  END IF;

  IF NEW.type = 'promotional' AND NEW.description = 'Шинэ хэрэглэгчийн бонус' THEN
    -- Welcome bonus (new user activation)
    v_title := 'Танд 10,000 MPoint бэлэг 🎁';
    v_body := 'Monpang-д тавтай морил! Шинэ хэрэглэгч болсонд тань 10K MPoint бэлэглэлээ.';
  ELSIF NEW.type = 'earned' THEN
    -- Purchase earning
    v_title := 'MPoint нэмэгдлээ';
    v_body := 'Таны худалдан авалтаас ' || NEW.amount::text || ' Monpang point нэмэгдлээ.';
  ELSIF NEW.type = 'promotional' THEN
    -- Admin gift / other promotional
    v_title := 'Бэлэг 🎁';
    v_body := 'Monpang-с танд ' || to_char(NEW.amount, 'FM999,999') || ' Monpang point бэлэглэлээ.';
  ELSIF NEW.type = 'refund' THEN
    -- Point refund
    v_title := 'Point буцаалт';
    v_body := 'Танд ' || to_char(NEW.amount, 'FM999,999') || ' Monpang point буцаагдлаа.';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, title, body)
  VALUES (NEW.user_id, 'promotion', v_title, v_body);

  RETURN NEW;
END;
$$;

-- Attach trigger to point_transactions table
CREATE TRIGGER trg_point_transaction_notification
  AFTER INSERT ON point_transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_point_notification();

-- Ensure service_role can insert notifications
GRANT INSERT ON notifications TO service_role;
