-- ============================================================================
-- MOCK ORDER DATA FOR TESTING
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, create some test users if they don't exist
INSERT INTO users (id, email, phone, full_name, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'bat@example.com', '99001122', 'Бат-Эрдэнэ', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'bold@example.com', '99112233', 'Болдбаатар', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'saraa@example.com', '99223344', 'Сарантуяа', 'active'),
  ('44444444-4444-4444-4444-444444444444', 'tuya@example.com', '99334455', 'Оюунтуяа', 'active'),
  ('55555555-5555-5555-5555-555555555555', 'dorj@example.com', '99445566', 'Дорж', 'active')
ON CONFLICT (id) DO NOTHING;

-- Create some test products if they don't exist
INSERT INTO products (id, name, slug, description, price, status) VALUES
  ('aaaa1111-aaaa-1111-aaaa-111111111111', 'iPhone 15 Pro Max', 'iphone-15-pro-max', 'Apple iPhone 15 Pro Max 256GB', 4500000, 'active'),
  ('aaaa2222-aaaa-2222-aaaa-222222222222', 'Samsung Galaxy S24', 'samsung-galaxy-s24', 'Samsung Galaxy S24 Ultra 512GB', 3800000, 'active'),
  ('aaaa3333-aaaa-3333-aaaa-333333333333', 'Nike Air Max 90', 'nike-air-max-90', 'Nike Air Max 90 эрэгтэй пүүз', 450000, 'active'),
  ('aaaa4444-aaaa-4444-aaaa-444444444444', 'Adidas Ultraboost', 'adidas-ultraboost', 'Adidas Ultraboost 22 гүйлтийн пүүз', 520000, 'active'),
  ('aaaa5555-aaaa-5555-aaaa-555555555555', 'MacBook Pro 14"', 'macbook-pro-14', 'Apple MacBook Pro 14 inch M3 Pro', 7200000, 'active')
ON CONFLICT (id) DO NOTHING;

-- Create product variants
INSERT INTO product_variants (id, product_id, sku, name, price, stock_quantity) VALUES
  ('bbbb1111-bbbb-1111-bbbb-111111111111', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'IP15PM-256-BLK', '256GB - Хар', 4500000, 10),
  ('bbbb2222-bbbb-2222-bbbb-222222222222', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'SGS24-512-GRY', '512GB - Саарал', 3800000, 15),
  ('bbbb3333-bbbb-3333-bbbb-333333333333', 'aaaa3333-aaaa-3333-aaaa-333333333333', 'NAM90-42-WHT', '42 - Цагаан', 450000, 20),
  ('bbbb4444-bbbb-4444-bbbb-444444444444', 'aaaa4444-aaaa-4444-aaaa-444444444444', 'AUB22-43-BLK', '43 - Хар', 520000, 12),
  ('bbbb5555-bbbb-5555-bbbb-555555555555', 'aaaa5555-aaaa-5555-aaaa-555555555555', 'MBP14-M3P-SLV', 'M3 Pro - Мөнгөлөг', 7200000, 5)
ON CONFLICT (id) DO NOTHING;

-- Create orders
INSERT INTO orders (id, user_id, status, total_amount, payment_status, created_at) VALUES
  -- Pending orders
  ('cccc1111-cccc-1111-cccc-111111111111', '11111111-1111-1111-1111-111111111111', 'pending', 4950000, 'unpaid', NOW() - INTERVAL '1 hour'),
  ('cccc2222-cccc-2222-cccc-222222222222', '22222222-2222-2222-2222-222222222222', 'pending', 3800000, 'processing', NOW() - INTERVAL '2 hours'),

  -- Confirmed orders
  ('cccc3333-cccc-3333-cccc-333333333333', '33333333-3333-3333-3333-333333333333', 'confirmed', 970000, 'paid', NOW() - INTERVAL '1 day'),
  ('cccc4444-cccc-4444-cccc-444444444444', '44444444-4444-4444-4444-444444444444', 'confirmed', 7200000, 'paid', NOW() - INTERVAL '2 days'),

  -- Shipped orders
  ('cccc5555-cccc-5555-cccc-555555555555', '55555555-5555-5555-5555-555555555555', 'shipped', 450000, 'paid', NOW() - INTERVAL '3 days'),
  ('cccc6666-cccc-6666-cccc-666666666666', '11111111-1111-1111-1111-111111111111', 'shipped', 8300000, 'paid', NOW() - INTERVAL '4 days'),

  -- Delivered orders
  ('cccc7777-cccc-7777-cccc-777777777777', '22222222-2222-2222-2222-222222222222', 'delivered', 520000, 'paid', NOW() - INTERVAL '5 days'),
  ('cccc8888-cccc-8888-cccc-888888888888', '33333333-3333-3333-3333-333333333333', 'delivered', 4500000, 'paid', NOW() - INTERVAL '1 week'),

  -- Canceled orders
  ('cccc9999-cccc-9999-cccc-999999999999', '44444444-4444-4444-4444-444444444444', 'canceled', 3800000, 'failed', NOW() - INTERVAL '1 week'),
  ('ccccaaaa-cccc-aaaa-cccc-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'canceled', 970000, 'unpaid', NOW() - INTERVAL '2 weeks')
ON CONFLICT (id) DO NOTHING;

-- Create order items
INSERT INTO order_items (id, order_id, product_id, variant_id, variant_name, price, quantity) VALUES
  -- Order 1: iPhone + Nike
  ('dddd1111-dddd-1111-dddd-111111111111', 'cccc1111-cccc-1111-cccc-111111111111', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'bbbb1111-bbbb-1111-bbbb-111111111111', '256GB - Хар', 4500000, 1),
  ('dddd1112-dddd-1112-dddd-111111111112', 'cccc1111-cccc-1111-cccc-111111111111', 'aaaa3333-aaaa-3333-aaaa-333333333333', 'bbbb3333-bbbb-3333-bbbb-333333333333', '42 - Цагаан', 450000, 1),

  -- Order 2: Samsung
  ('dddd2222-dddd-2222-dddd-222222222222', 'cccc2222-cccc-2222-cccc-222222222222', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'bbbb2222-bbbb-2222-bbbb-222222222222', '512GB - Саарал', 3800000, 1),

  -- Order 3: Nike + Adidas
  ('dddd3333-dddd-3333-dddd-333333333333', 'cccc3333-cccc-3333-cccc-333333333333', 'aaaa3333-aaaa-3333-aaaa-333333333333', 'bbbb3333-bbbb-3333-bbbb-333333333333', '42 - Цагаан', 450000, 1),
  ('dddd3334-dddd-3334-dddd-333333333334', 'cccc3333-cccc-3333-cccc-333333333333', 'aaaa4444-aaaa-4444-aaaa-444444444444', 'bbbb4444-bbbb-4444-bbbb-444444444444', '43 - Хар', 520000, 1),

  -- Order 4: MacBook
  ('dddd4444-dddd-4444-dddd-444444444444', 'cccc4444-cccc-4444-cccc-444444444444', 'aaaa5555-aaaa-5555-aaaa-555555555555', 'bbbb5555-bbbb-5555-bbbb-555555555555', 'M3 Pro - Мөнгөлөг', 7200000, 1),

  -- Order 5: Nike
  ('dddd5555-dddd-5555-dddd-555555555555', 'cccc5555-cccc-5555-cccc-555555555555', 'aaaa3333-aaaa-3333-aaaa-333333333333', 'bbbb3333-bbbb-3333-bbbb-333333333333', '42 - Цагаан', 450000, 1),

  -- Order 6: iPhone + Samsung
  ('dddd6666-dddd-6666-dddd-666666666666', 'cccc6666-cccc-6666-cccc-666666666666', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'bbbb1111-bbbb-1111-bbbb-111111111111', '256GB - Хар', 4500000, 1),
  ('dddd6667-dddd-6667-dddd-666666666667', 'cccc6666-cccc-6666-cccc-666666666666', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'bbbb2222-bbbb-2222-bbbb-222222222222', '512GB - Саарал', 3800000, 1),

  -- Order 7: Adidas
  ('dddd7777-dddd-7777-dddd-777777777777', 'cccc7777-cccc-7777-cccc-777777777777', 'aaaa4444-aaaa-4444-aaaa-444444444444', 'bbbb4444-bbbb-4444-bbbb-444444444444', '43 - Хар', 520000, 1),

  -- Order 8: iPhone
  ('dddd8888-dddd-8888-dddd-888888888888', 'cccc8888-cccc-8888-cccc-888888888888', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'bbbb1111-bbbb-1111-bbbb-111111111111', '256GB - Хар', 4500000, 1),

  -- Order 9: Samsung (canceled)
  ('dddd9999-dddd-9999-dddd-999999999999', 'cccc9999-cccc-9999-cccc-999999999999', 'aaaa2222-aaaa-2222-aaaa-222222222222', 'bbbb2222-bbbb-2222-bbbb-222222222222', '512GB - Саарал', 3800000, 1),

  -- Order 10: Nike + Adidas (canceled)
  ('ddddaaaa-dddd-aaaa-dddd-aaaaaaaaaaaa', 'ccccaaaa-cccc-aaaa-cccc-aaaaaaaaaaaa', 'aaaa3333-aaaa-3333-aaaa-333333333333', 'bbbb3333-bbbb-3333-bbbb-333333333333', '42 - Цагаан', 450000, 1),
  ('ddddaaab-dddd-aaab-dddd-aaaaaaaaabbb', 'ccccaaaa-cccc-aaaa-cccc-aaaaaaaaaaaa', 'aaaa4444-aaaa-4444-aaaa-444444444444', 'bbbb4444-bbbb-4444-bbbb-444444444444', '43 - Хар', 520000, 1)
ON CONFLICT (id) DO NOTHING;

-- Verify the data
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Products: ' || COUNT(*) FROM products;
SELECT 'Product Variants: ' || COUNT(*) FROM product_variants;
SELECT 'Orders: ' || COUNT(*) FROM orders;
SELECT 'Order Items: ' || COUNT(*) FROM order_items;
