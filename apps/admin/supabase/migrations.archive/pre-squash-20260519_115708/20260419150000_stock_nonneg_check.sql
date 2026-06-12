-- Backstop: stock can never be negative. No current violators
-- (verified 2026-04-19: MIN(stock_quantity)=0 on both tables).
-- decrement_order_stock already floors at zero via GREATEST(0, …),
-- so this constraint formalises what the writer already guarantees
-- and rejects any future writer that forgets.
alter table public.products
  add constraint products_stock_quantity_nonneg
  check (stock_quantity >= 0);

alter table public.product_variants
  add constraint product_variants_stock_quantity_nonneg
  check (stock_quantity >= 0);
