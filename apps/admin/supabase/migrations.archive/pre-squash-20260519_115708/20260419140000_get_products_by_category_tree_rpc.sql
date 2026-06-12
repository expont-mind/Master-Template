-- Paginated products-by-category-tree RPC. The frontend was
-- previously doing category-tree resolution + product-id filter
-- client-side, but when a category has more than ~300 descendant
-- products the resulting `.in("id", [...])` URL crosses the Vercel
-- 14KB request limit and silently 414's (observed on
-- /products?category=make-up-566e with 652 unique products). Moving
-- the whole filtered query server-side sidesteps the URL issue
-- entirely.
--
-- `total_count` is repeated on each row so the caller can derive the
-- paginated total without a second query.
create or replace function public.get_products_by_category_tree(
  p_slug text,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_in_stock boolean default null,
  p_sort text default 'newest',
  p_limit int default 24,
  p_offset int default 0
)
returns table (
  id uuid,
  name text,
  slug text,
  price numeric,
  discount_price numeric,
  is_featured boolean,
  stock_quantity int,
  category_id uuid,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_limit int := greatest(1, least(coalesce(p_limit, 24), 100));
  v_offset int := greatest(0, coalesce(p_offset, 0));
begin
  return query
  with recursive tree as (
    select c.id
    from categories c
    where c.slug = p_slug and c.is_active = true
    union all
    select child.id
    from categories child
    join tree t on child.parent_id = t.id
    where child.is_active = true
  ),
  candidates as (
    select distinct p.id as product_id
    from products p
    join product_categories pc on pc.product_id = p.id
    where pc.category_id in (select tree.id from tree)
      and p.is_active = true
  ),
  filtered as (
    select
      p.id,
      p.name::text as name,
      p.slug::text as slug,
      p.price,
      p.discount_price,
      p.is_featured,
      p.stock_quantity,
      p.category_id,
      count(*) over () as total_count
    from products p
    join candidates ca on ca.product_id = p.id
    where
      (
        p_min_price is null
        or (case
          when p.discount_price is not null and p.discount_price > 0
            then p.discount_price >= p_min_price
          else p.price >= p_min_price
        end)
      )
      and (
        p_max_price is null
        or (case
          when p.discount_price is not null and p.discount_price > 0
            then p.discount_price <= p_max_price
          else p.price <= p_max_price
        end)
      )
      and (p_in_stock is null or p_in_stock = false or p.stock_quantity > 0)
  )
  select f.id, f.name, f.slug, f.price, f.discount_price,
         f.is_featured, f.stock_quantity, f.category_id, f.total_count
  from filtered f
  order by
    case when p_sort = 'price_asc'
      then coalesce(nullif(f.discount_price, 0), f.price) end asc nulls last,
    case when p_sort = 'price_desc'
      then coalesce(nullif(f.discount_price, 0), f.price) end desc nulls last,
    case when p_sort = 'popular' then f.stock_quantity end asc nulls last,
    case when p_sort = 'newest' or p_sort is null or p_sort not in ('price_asc','price_desc','popular')
      then f.id end asc
  limit v_limit
  offset v_offset;
end;
$$;

revoke all on function public.get_products_by_category_tree(
  text, numeric, numeric, boolean, text, int, int
) from public;
grant execute on function public.get_products_by_category_tree(
  text, numeric, numeric, boolean, text, int, int
) to anon, authenticated, service_role;
