-- ============================================================================
-- FIX: Change order_items.variant_id foreign key from RESTRICT to SET NULL
--
-- Problem: save_product deletes old variants not in the new list, but
-- order_items references them with ON DELETE RESTRICT, causing errors.
--
-- Solution: Change to ON DELETE SET NULL. Order items already store
-- variant_name and price as snapshots, so the order history is preserved.
-- ============================================================================

ALTER TABLE order_items
  DROP CONSTRAINT order_items_variant_id_fkey;

ALTER TABLE order_items
  ADD CONSTRAINT order_items_variant_id_fkey
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;
