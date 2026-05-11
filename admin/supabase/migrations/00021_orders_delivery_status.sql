-- Create delivery_status enum type
CREATE TYPE delivery_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'canceled');

-- Add delivery_status column to orders table using the new enum
ALTER TABLE orders
ADD COLUMN delivery_status delivery_status DEFAULT 'pending';

-- Migrate existing delivery-related statuses to the new delivery_status column
UPDATE orders SET delivery_status = 'shipped' WHERE status = 'shipped';
UPDATE orders SET delivery_status = 'delivered' WHERE status = 'delivered';

-- Now we need to change order_status enum to remove shipped and delivered
-- PostgreSQL doesn't allow removing enum values directly, so we need to:
-- 1. Create a new enum without shipped/delivered
-- 2. Update the column to use the new enum
-- 3. Drop the old enum

-- Create new order_status enum without delivery-related values
CREATE TYPE order_status_new AS ENUM ('pending', 'confirmed', 'canceled');

-- Update orders with shipped/delivered status to a valid new status
UPDATE orders SET status = 'confirmed' WHERE status IN ('shipped', 'delivered');

-- Drop the default constraint first (required before type change)
ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;

-- Change column to use new enum
ALTER TABLE orders
  ALTER COLUMN status TYPE order_status_new
  USING status::text::order_status_new;

-- Re-add the default
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending';

-- Drop old enum and rename new one
DROP TYPE order_status;
ALTER TYPE order_status_new RENAME TO order_status;
