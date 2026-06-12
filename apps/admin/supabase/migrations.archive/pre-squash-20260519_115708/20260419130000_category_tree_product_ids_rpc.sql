-- RPC that returns all distinct product IDs reachable from a category
-- tree (the slugged category + every descendant). Required because
-- passing ~700 UUIDs back through a PostgREST .in() filter blows the
-- CDN's 16KB URL limit and fails silently, leaving category pages
-- empty (observed on /products?category=make-up-566e).
--
-- Returns only active products. Sorted by product.id so callers can
-- page consistently and apply their own sort on the fetched rows.
create or replace function public.get_category_tree_product_ids(
  p_slug text
)
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  with recursive tree as (
    select c.id
    from categories c
    where c.slug = p_slug and c.is_active = true
    union all
    select child.id
    from categories child
    join tree t on child.parent_id = t.id
    where child.is_active = true
  )
  select distinct p.id
  from products p
  join product_categories pc on pc.product_id = p.id
  where pc.category_id in (select id from tree)
    and p.is_active = true
  order by p.id; -- deterministic; final ordering happens in caller
$$;

revoke all on function public.get_category_tree_product_ids(text) from public;
grant execute on function public.get_category_tree_product_ids(text) to anon, authenticated, service_role;
