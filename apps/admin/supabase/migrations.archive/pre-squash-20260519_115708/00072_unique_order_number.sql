-- Add UNIQUE constraint to orders.order_number to prevent duplicates
-- First clean up any existing duplicates (keep the newest one)
WITH duplicates AS (
    SELECT id, order_number,
           ROW_NUMBER() OVER (PARTITION BY order_number ORDER BY created_at DESC) AS rn
    FROM orders
    WHERE order_number IS NOT NULL
)
UPDATE orders
SET order_number = order_number || '-' || substring(gen_random_uuid()::text from 1 for 4)
FROM duplicates
WHERE orders.id = duplicates.id AND duplicates.rn > 1;

-- Now add the unique constraint
ALTER TABLE orders ADD CONSTRAINT unique_order_number UNIQUE (order_number);
