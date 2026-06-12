-- ============================================================================
-- FIX: "validation failed user must exist" on checkout
--
-- Problem: handle_new_user() trigger silently swallows errors, causing
-- auth.users rows to exist without corresponding public.users rows.
-- When these users try to place orders, the FK constraint
-- orders.user_id -> public.users(id) fails.
--
-- Solution:
-- 1. Fix handle_new_user() trigger to handle unique_violation properly
-- 2. Add ensure_public_user() RPC as a safety net before order creation
-- 3. Update create_order_from_invoice() to call ensure_public_user()
-- 4. One-time sync of orphaned auth.users -> public.users
-- ============================================================================

-- 1. Fix handle_new_user() trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_avatar_url TEXT;
  v_email TEXT;
BEGIN
  v_email := NEW.email;

  v_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'given_name',
    SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1)
  );

  v_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'family_name',
    NULLIF(SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 2), '')
  );

  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  INSERT INTO public.users (id, email, first_name, last_name, avatar_url, primary_phone)
  VALUES (
    NEW.id,
    v_email,
    NULLIF(v_first_name, ''),
    NULLIF(v_last_name, ''),
    v_avatar_url,
    NEW.phone
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.users.email),
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.users.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.users.last_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    primary_phone = COALESCE(EXCLUDED.primary_phone, public.users.primary_phone);

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Email unique constraint violation: another public.users row has this email
    -- but with a different ID. First ensure the NEW user row exists, then update info.
    INSERT INTO public.users (id, email, first_name, last_name, avatar_url, primary_phone)
    VALUES (
      NEW.id,
      NULL,  -- skip email to avoid unique violation again
      NULLIF(v_first_name, ''),
      NULLIF(v_last_name, ''),
      v_avatar_url,
      NEW.phone
    )
    ON CONFLICT (id) DO UPDATE SET
      first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.users.first_name),
      last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.users.last_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
      primary_phone = COALESCE(EXCLUDED.primary_phone, public.users.primary_phone);
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error for user_id=%: % (SQLSTATE=%)', NEW.id, SQLERRM, SQLSTATE;
    -- Last resort: try a minimal insert so public.users row exists
    BEGIN
      INSERT INTO public.users (id) VALUES (NEW.id)
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user fallback insert also failed for user_id=%: %', NEW.id, SQLERRM;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ensure_public_user() RPC - safety net for application code
CREATE OR REPLACE FUNCTION ensure_public_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user record;
BEGIN
  -- Quick check: if user already exists, return immediately
  IF EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RETURN;
  END IF;

  -- Fetch from auth.users and insert into public.users
  SELECT id, email, phone, raw_user_meta_data
  INTO v_auth_user
  FROM auth.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auth user % not found', p_user_id;
  END IF;

  INSERT INTO public.users (id, email, first_name, last_name, avatar_url, primary_phone)
  VALUES (
    v_auth_user.id,
    v_auth_user.email,
    NULLIF(COALESCE(
      v_auth_user.raw_user_meta_data->>'first_name',
      v_auth_user.raw_user_meta_data->>'given_name',
      SPLIT_PART(COALESCE(v_auth_user.raw_user_meta_data->>'full_name', v_auth_user.raw_user_meta_data->>'name', ''), ' ', 1)
    ), ''),
    NULLIF(COALESCE(
      v_auth_user.raw_user_meta_data->>'last_name',
      v_auth_user.raw_user_meta_data->>'family_name',
      NULLIF(SPLIT_PART(COALESCE(v_auth_user.raw_user_meta_data->>'full_name', v_auth_user.raw_user_meta_data->>'name', ''), ' ', 2), '')
    ), ''),
    COALESCE(
      v_auth_user.raw_user_meta_data->>'avatar_url',
      v_auth_user.raw_user_meta_data->>'picture'
    ),
    v_auth_user.phone
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- 3. Update create_order_from_invoice() to call ensure_public_user() before order creation
CREATE OR REPLACE FUNCTION create_order_from_invoice(p_invoice_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice record;
    v_order_id uuid;
    v_order_number text;
    v_items jsonb;
    v_item jsonb;
    v_payment_method payment_method;
    v_address jsonb;
    v_rows_affected int;
BEGIN
    -- 1. Get invoice with all relevant data
    SELECT
        id, user_id, amount, status, order_number, order_id, pending_order_data, provider
    INTO v_invoice
    FROM payment_invoices
    WHERE id = p_invoice_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invoice not found');
    END IF;

    -- Ensure public.users row exists (safety net)
    PERFORM ensure_public_user(v_invoice.user_id);

    -- Determine payment_method from provider
    v_payment_method := CASE
        WHEN v_invoice.provider = 'lendmn' THEN 'lendmn'::payment_method
        WHEN v_invoice.provider = 'qpay' THEN 'qpay'::payment_method
        WHEN v_invoice.provider = 'storepay' THEN 'storepay'::payment_method
        ELSE 'transfer'::payment_method
    END;

    -- 2. If order_id exists, the order was pre-created - just update its status
    IF v_invoice.order_id IS NOT NULL THEN
        SELECT id, order_number INTO v_order_id, v_order_number
        FROM orders
        WHERE id = v_invoice.order_id;

        IF FOUND THEN
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                payment_method = v_payment_method,
                paid_at = COALESCE(paid_at, now()),
                updated_at = now()
            WHERE id = v_invoice.order_id
            AND (status != 'confirmed' OR payment_status != 'paid');

            GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

            IF v_rows_affected > 0 AND NOT EXISTS (
                SELECT 1 FROM orders WHERE id = v_invoice.order_id AND stock_decremented = true
            ) THEN
                PERFORM decrement_order_stock(v_invoice.order_id);
                UPDATE orders SET stock_decremented = true WHERE id = v_invoice.order_id;
            END IF;

            UPDATE payment_invoices
            SET status = 'paid', updated_at = now()
            WHERE id = p_invoice_id AND status != 'paid';

            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'order_number', v_order_number,
                'already_existed', true
            );
        END IF;
    END IF;

    -- 3. Fallback: Check if order already exists by order_number (old flow)
    IF v_invoice.order_number IS NOT NULL THEN
        SELECT id INTO v_order_id
        FROM orders
        WHERE order_number = v_invoice.order_number;

        IF FOUND THEN
            UPDATE orders
            SET
                status = 'confirmed',
                payment_status = 'paid',
                payment_method = v_payment_method,
                paid_at = COALESCE(paid_at, now()),
                updated_at = now()
            WHERE id = v_order_id
            AND (status != 'confirmed' OR payment_status != 'paid');

            GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

            IF v_rows_affected > 0 AND NOT EXISTS (
                SELECT 1 FROM orders WHERE id = v_order_id AND stock_decremented = true
            ) THEN
                PERFORM decrement_order_stock(v_order_id);
                UPDATE orders SET stock_decremented = true WHERE id = v_order_id;
            END IF;

            UPDATE payment_invoices
            SET order_id = v_order_id, status = 'paid', updated_at = now()
            WHERE id = p_invoice_id;

            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_order_id,
                'already_existed', true
            );
        END IF;
    END IF;

    -- 4. No pre-created order found - create from pending_order_data (legacy invoices)
    v_items := v_invoice.pending_order_data->'items';

    IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No pending order data');
    END IF;

    v_order_number := COALESCE(
        v_invoice.order_number,
        upper(substring(md5(random()::text) from 1 for 8))
    );

    v_address := v_invoice.pending_order_data->'address';

    INSERT INTO orders (
        user_id, order_number, status, payment_status, payment_method, total_amount,
        delivery_city, delivery_district, delivery_sub_district, delivery_detail,
        stock_decremented, paid_at
    )
    VALUES (
        v_invoice.user_id, v_order_number, 'confirmed', 'paid', v_payment_method, v_invoice.amount,
        v_address->>'city', v_address->>'district', v_address->>'sub_district', v_address->>'detail',
        true, now()
    )
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        INSERT INTO order_items (order_id, product_id, variant_id, variant_name, price, quantity)
        VALUES (
            v_order_id,
            (v_item->>'productId')::uuid,
            NULLIF(v_item->>'variantId', '')::uuid,
            NULLIF(v_item->>'variantName', ''),
            (v_item->>'price')::numeric,
            (v_item->>'quantity')::int
        );
    END LOOP;

    PERFORM decrement_order_stock(v_order_id);

    UPDATE payment_invoices
    SET order_id = v_order_id, status = 'paid', updated_at = now()
    WHERE id = p_invoice_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 4. One-time sync: insert any orphaned auth.users into public.users
INSERT INTO public.users (id, email, first_name, last_name, avatar_url, primary_phone)
SELECT
  au.id,
  au.email,
  NULLIF(COALESCE(
    au.raw_user_meta_data->>'first_name',
    au.raw_user_meta_data->>'given_name',
    SPLIT_PART(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''), ' ', 1)
  ), ''),
  NULLIF(COALESCE(
    au.raw_user_meta_data->>'last_name',
    au.raw_user_meta_data->>'family_name',
    NULLIF(SPLIT_PART(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''), ' ', 2), '')
  ), ''),
  COALESCE(
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture'
  ),
  au.phone
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
