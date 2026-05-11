-- ============================================================================
-- Fix push notifications:
-- 1. Add missing fcm_token column to users table
-- 2. Add Authorization header to push notification triggers
-- ============================================================================

-- 1. Add fcm_token column (was never created, causing token sync to fail)
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- 2. Store anon key in vault for trigger Authorization headers
SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cGZhdm9kcWp5b3Nkbnhqd2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxOTcyOTIsImV4cCI6MjA4Mzc3MzI5Mn0.eRaN0JNpNEIguPxWyauPvhoX0_eccnq3f_8HWp5o-v8',
  'anon_key'
);

-- 3. Recreate notification trigger function with Authorization header
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
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'anon_key'
      )
    ),
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

-- 4. Recreate status change trigger function with Authorization header
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
  SELECT user_id, order_number
  INTO v_user_id, v_order_number
  FROM orders
  WHERE id = NEW.order_id;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_short_id := UPPER(LEFT(COALESCE(v_order_number, ''), 8));

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
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'anon_key'
      )
    ),
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

-- Triggers already exist from 20260317100000, no need to recreate them.
-- CREATE OR REPLACE FUNCTION updates the function that existing triggers call.
