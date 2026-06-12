-- 1. increment_coupon_usage
create or replace function public.increment_coupon_usage(
  p_coupon_id uuid,
  p_delta int default 1
)
returns int
language sql
security definer
set search_path = public
as $$
  update coupons
  set usage_count = greatest(0, coalesce(usage_count, 0) + p_delta)
  where id = p_coupon_id
  returning usage_count;
$$;

revoke all on function public.increment_coupon_usage(uuid, int) from public;
grant execute on function public.increment_coupon_usage(uuid, int) to service_role;


-- 2. record_order_points_and_coupon
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
begin
  if not exists (select 1 from orders where id = p_order_id) then
    return json_build_object('success', false, 'error', 'order_not_found');
  end if;

  if p_points_used > 0 then
    insert into point_transactions (user_id, order_id, type, amount, description)
    select o.user_id, o.id, 'used', -p_points_used,
           format('Захиалга #%s', o.order_number)
    from orders o
    where o.id = p_order_id
      and not exists (select 1 from point_transactions where order_id = p_order_id and type = 'used');
  end if;

  if p_points_earned > 0 then
    insert into point_transactions (user_id, order_id, type, amount, description)
    select o.user_id, o.id, 'earned', p_points_earned,
           format('Захиалга #%s', o.order_number)
    from orders o
    where o.id = p_order_id
      and not exists (select 1 from point_transactions where order_id = p_order_id and type = 'earned');
  end if;

  if p_coupon_id is not null and p_coupon_discount > 0 then
    insert into coupon_usages (coupon_id, user_id, order_id, discount_amount)
    select p_coupon_id, o.user_id, o.id, p_coupon_discount
    from orders o
    where o.id = p_order_id
      and not exists (select 1 from coupon_usages where order_id = p_order_id);

    if found then
      perform public.increment_coupon_usage(p_coupon_id, 1);
    end if;
  end if;

  return json_build_object('success', true);
end;
$$;

revoke all on function public.record_order_points_and_coupon(uuid, int, int, uuid, numeric) from public;
grant execute on function public.record_order_points_and_coupon(uuid, int, int, uuid, numeric) to service_role;


-- 3. refund_order_points_and_coupon
create or replace function public.refund_order_points_and_coupon(
  p_order_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used_amount int;
  v_earned_amount int;
  v_balance int;
  v_total_to_refund int;
  v_used_count int;
  v_earned_count int;
  v_coupon_count int := 0;
  v_cid uuid;
begin
  if not exists (select 1 from orders where id = p_order_id) then
    return json_build_object('success', false, 'error', 'order_not_found');
  end if;

  if exists (select 1 from point_transactions where order_id = p_order_id and type = 'refund') then
    return json_build_object('success', true, 'already_refunded', true);
  end if;

  v_used_amount := (select coalesce(sum(amount), 0) from point_transactions where order_id = p_order_id and type = 'used');
  v_earned_amount := (select coalesce(sum(amount), 0) from point_transactions where order_id = p_order_id and type = 'earned');
  v_total_to_refund := abs(v_used_amount) - v_earned_amount;

  if v_total_to_refund < 0 then
    v_balance := (select coalesce(sum(pt.amount), 0) from point_transactions pt where pt.user_id = (select user_id from orders where id = p_order_id));

    if v_balance + v_total_to_refund < 0 then
      return json_build_object(
        'success', false,
        'error', 'insufficient_balance',
        'current_balance', v_balance,
        'required', -v_total_to_refund
      );
    end if;
  end if;

  v_used_count := (select count(*) from point_transactions where order_id = p_order_id and type = 'used');

  insert into point_transactions (user_id, order_id, type, amount, description)
  select o.user_id, p_order_id, 'refund', abs(pt.amount),
         format('Захиалга #%s буцаалт', o.order_number)
  from point_transactions pt
  join orders o on o.id = p_order_id
  where pt.order_id = p_order_id and pt.type = 'used';

  v_earned_count := (select count(*) from point_transactions where order_id = p_order_id and type = 'earned' and amount > 0);

  insert into point_transactions (user_id, order_id, type, amount, description)
  select o.user_id, p_order_id, 'refund', -pt.amount,
         format('Захиалга #%s буцаалт', o.order_number)
  from point_transactions pt
  join orders o on o.id = p_order_id
  where pt.order_id = p_order_id and pt.type = 'earned';

  for v_cid in select cu.coupon_id from coupon_usages cu where cu.order_id = p_order_id
  loop
    perform public.increment_coupon_usage(v_cid, -1);
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
