-- Atomic helpers for admin order-edit flows.
--
-- Without these, two admins concurrently editing the same order racing the
-- coupon usage_count or refunding the same order can corrupt point balance
-- and coupon usage limits. The web client did the same operations with
-- read-modify-write SQL.
--
-- Each function is SECURITY DEFINER and idempotent — safe to call from
-- the admin API route which already authenticates the caller.

-- ─────────────────────────────────────────────────────────────────────
-- 1. Atomic coupon usage_count delta
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.increment_coupon_usage(
  p_coupon_id uuid,
  p_delta int default 1
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_count int;
begin
  update coupons
  set usage_count = greatest(0, coalesce(usage_count, 0) + p_delta)
  where id = p_coupon_id
  returning usage_count into v_new_count;
  return coalesce(v_new_count, 0);
end;
$$;

revoke all on function public.increment_coupon_usage(uuid, int) from public;
grant execute on function public.increment_coupon_usage(uuid, int) to service_role;

-- ─────────────────────────────────────────────────────────────────────
-- 2. Refund order points + reverse coupon usage in a single transaction.
-- Idempotent — checks existing refund rows before inserting.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.refund_order_points_and_coupon(
  p_order_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_existing_refund_count int;
  v_used_count int := 0;
  v_earned_count int := 0;
  v_coupon_count int := 0;
  v_used_amount int;
  v_earned_amount int;
  v_balance int;
  v_total_to_refund int := 0;
begin
  select id, user_id, order_number into v_order
  from orders
  where id = p_order_id;

  if not found then
    return json_build_object('success', false, 'error', 'order_not_found');
  end if;

  -- Idempotency check
  select count(*) into v_existing_refund_count
  from point_transactions
  where order_id = p_order_id and type = 'refund';

  if v_existing_refund_count > 0 then
    return json_build_object('success', true, 'already_refunded', true);
  end if;

  -- Compute total points the user is *gaining* from the refund
  select coalesce(sum(amount), 0) into v_used_amount
  from point_transactions
  where order_id = p_order_id and type = 'used';

  select coalesce(sum(amount), 0) into v_earned_amount
  from point_transactions
  where order_id = p_order_id and type = 'earned';

  -- balance check: refund of `used` points adds back |used_amount|.
  -- Reversing earned points subtracts earned_amount. Net effect:
  -- delta = abs(used_amount) - earned_amount. Must not push balance < 0.
  v_total_to_refund := abs(v_used_amount) - v_earned_amount;

  if v_total_to_refund < 0 then
    -- We will be deducting from user balance. Verify they can afford it.
    select coalesce(sum(amount), 0) into v_balance
    from point_transactions
    where user_id = v_order.user_id;

    if v_balance + v_total_to_refund < 0 then
      return json_build_object(
        'success', false,
        'error', 'insufficient_balance',
        'current_balance', v_balance,
        'required', -v_total_to_refund
      );
    end if;
  end if;

  -- Refund used points (positive entries)
  insert into point_transactions (user_id, order_id, type, amount, description)
  select
    v_order.user_id,
    p_order_id,
    'refund',
    abs(amount),
    format('Захиалга #%s буцаалт', v_order.order_number)
  from point_transactions
  where order_id = p_order_id and type = 'used';
  get diagnostics v_used_count = row_count;

  -- Reverse earned points (negative entries)
  insert into point_transactions (user_id, order_id, type, amount, description)
  select
    v_order.user_id,
    p_order_id,
    'refund',
    -amount,
    format('Захиалга #%s буцаалт', v_order.order_number)
  from point_transactions
  where order_id = p_order_id and type = 'earned';
  get diagnostics v_earned_count = row_count;

  -- Reverse coupon usage atomically
  for v_used_amount in
    select cu.coupon_id
    from coupon_usages cu
    where cu.order_id = p_order_id
  loop
    perform public.increment_coupon_usage(v_used_amount::uuid, -1);
    v_coupon_count := v_coupon_count + 1;
  end loop;

  delete from coupon_usages where order_id = p_order_id;

  return json_build_object(
    'success', true,
    'refunded_used', v_used_count,
    'reversed_earned', v_earned_count,
    'reversed_coupons', v_coupon_count
  );
end;
$$;

revoke all on function public.refund_order_points_and_coupon(uuid) from public;
grant execute on function public.refund_order_points_and_coupon(uuid) to service_role;

-- ─────────────────────────────────────────────────────────────────────
-- 3. Record order points usage + earned + coupon usage in one transaction.
-- Idempotent on each insert — guards against duplicate row insertion.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.record_order_points_and_coupon(
  p_order_id uuid,
  p_points_used int,
  p_points_earned int,
  p_coupon_id uuid default null,
  p_coupon_discount numeric default 0
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_existing int;
begin
  select id, user_id, order_number into v_order
  from orders
  where id = p_order_id;

  if not found then
    return json_build_object('success', false, 'error', 'order_not_found');
  end if;

  if p_points_used > 0 then
    select count(*) into v_existing
    from point_transactions
    where order_id = p_order_id and type = 'used';

    if v_existing = 0 then
      insert into point_transactions
        (user_id, order_id, type, amount, description)
      values
        (v_order.user_id, p_order_id, 'used', -p_points_used,
         format('Захиалга #%s', v_order.order_number));
    end if;
  end if;

  if p_points_earned > 0 then
    select count(*) into v_existing
    from point_transactions
    where order_id = p_order_id and type = 'earned';

    if v_existing = 0 then
      insert into point_transactions
        (user_id, order_id, type, amount, description)
      values
        (v_order.user_id, p_order_id, 'earned', p_points_earned,
         format('Захиалга #%s', v_order.order_number));
    end if;
  end if;

  if p_coupon_id is not null and p_coupon_discount > 0 then
    select count(*) into v_existing
    from coupon_usages
    where order_id = p_order_id;

    if v_existing = 0 then
      insert into coupon_usages
        (coupon_id, user_id, order_id, discount_amount)
      values
        (p_coupon_id, v_order.user_id, p_order_id, p_coupon_discount);

      perform public.increment_coupon_usage(p_coupon_id, 1);
    end if;
  end if;

  return json_build_object('success', true);
end;
$$;

revoke all on function public.record_order_points_and_coupon(uuid, int, int, uuid, numeric) from public;
grant execute on function public.record_order_points_and_coupon(uuid, int, int, uuid, numeric) to service_role;
