-- Fix: welcome bonus notification was falling through to admin_gift
-- because exact string comparison failed (encoding/whitespace).
-- Use ILIKE for robust matching + update title/body to reflect 5,000 amount.

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

  IF NEW.type = 'promotional' AND NEW.description ILIKE '%Шинэ хэрэглэгчийн бонус%' THEN
    -- Welcome bonus (new user activation) — no gift dialog needed,
    -- the success dialog in the app already handles this.
    v_title := 'Танд ' || to_char(NEW.amount, 'FM999,999') || ' MPoint бэлэг 🎁';
    v_body := 'Monpang-д тавтай морил! Шинэ хэрэглэгч болсонд тань '
              || to_char(NEW.amount, 'FM999,999') || ' MPoint бэлэглэлээ.';
    v_metadata := jsonb_build_object(
      'sub_type', 'welcome_bonus',
      'amount', NEW.amount
    );
  ELSIF NEW.type = 'earned' THEN
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
