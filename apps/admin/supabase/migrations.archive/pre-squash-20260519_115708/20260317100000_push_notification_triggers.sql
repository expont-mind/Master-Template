-- ============================================================================
-- Push notification triggers: send FCM push via edge function
-- when notifications or order status changes are created.
-- ============================================================================

-- 1. Trigger for notifications table INSERT
--    Sends push notification to user when a new notification row is created.
CREATE OR REPLACE FUNCTION send_push_on_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := (
      SELECT decrypted_secret
      FROM vault.decrypted_secrets
      WHERE name = 'project_url'
    ) || '/functions/v1/send-push-notification',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'body', COALESCE(NEW.body, ''),
      'data', jsonb_build_object(
        'type', NEW.type::text,
        'id', COALESCE(NEW.order_id::text, NEW.id::text)
      )
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_push_on_notification
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_push_on_notification();


-- 2. Trigger for order_status_history INSERT
--    Looks up user_id and order_number, generates title/body, sends push.
CREATE OR REPLACE FUNCTION send_push_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_order_number TEXT;
  v_short_id TEXT;
  v_title TEXT;
  v_body TEXT;
BEGIN
  -- Look up order owner and order number
  SELECT user_id, order_number
  INTO v_user_id, v_order_number
  FROM orders
  WHERE id = NEW.order_id;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_short_id := UPPER(LEFT(COALESCE(v_order_number, ''), 8));

  -- Generate title based on new_status
  v_title := CASE NEW.new_status
    WHEN 'confirmed' THEN 'Баталгаажсан'
    WHEN 'shipped'   THEN 'Хүргэлтэд гарсан'
    WHEN 'delivered'  THEN 'Хүргэгдсэн'
    WHEN 'canceled'   THEN 'Цуцлагдсан'
    WHEN 'paid'       THEN 'Төлбөр төлөгдсөн'
    WHEN 'failed'     THEN 'Төлбөр амжилтгүй'
    WHEN 'pending'    THEN 'Хүлээгдэж байна'
    ELSE 'Статус өөрчлөгдсөн'
  END;

  -- Generate body
  v_body := CASE NEW.new_status
    WHEN 'confirmed' THEN 'Таны #' || v_short_id || ' захиалга баталгаажлаа.'
    WHEN 'shipped'   THEN 'Таны #' || v_short_id || ' захиалга хүргэлтэд гарлаа.'
    WHEN 'delivered'  THEN 'Таны #' || v_short_id || ' захиалга хүргэгдлээ.'
    WHEN 'canceled'   THEN 'Таны #' || v_short_id || ' захиалга цуцлагдсан.'
    WHEN 'paid'       THEN 'Таны #' || v_short_id || ' захиалгын төлбөр төлөгдсөн.'
    WHEN 'failed'     THEN 'Таны #' || v_short_id || ' захиалгын төлбөр амжилтгүй.'
    WHEN 'pending'    THEN 'Таны #' || v_short_id || ' захиалга хүлээгдэж байна.'
    ELSE 'Таны #' || v_short_id || ' захиалгын статус өөрчлөгдсөн.'
  END;

  PERFORM net.http_post(
    url := (
      SELECT decrypted_secret
      FROM vault.decrypted_secrets
      WHERE name = 'project_url'
    ) || '/functions/v1/send-push-notification',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'user_id', v_user_id,
      'title', v_title,
      'body', v_body,
      'data', jsonb_build_object(
        'type', 'order',
        'id', NEW.order_id::text
      )
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_push_on_status_change
  AFTER INSERT ON order_status_history
  FOR EACH ROW
  EXECUTE FUNCTION send_push_on_status_change();
