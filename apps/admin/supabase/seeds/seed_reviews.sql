-- ============================================================================
-- MOCK REVIEW DATA FOR TESTING
-- Run this in Supabase SQL Editor
-- Note: This assumes seed_orders.sql has been run first (users and products exist)
-- ============================================================================

-- Grant permissions (if not already done)
GRANT ALL ON reviews TO anon, authenticated, service_role;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- Create reviews (using existing users and products from seed_orders.sql)
INSERT INTO reviews (id, user_id, product_id, rating, comment, status, created_at) VALUES
  -- iPhone 15 Pro Max reviews
  ('eeee1111-eeee-1111-eeee-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaa1111-aaaa-1111-aaaa-111111111111', 5, 'Маш гайхалтай утас! Камер нь үнэхээр сайн, батерей удаан барина. Үнэ нь арай өндөр ч чанартай.', 'active', NOW() - INTERVAL '2 days'),

  ('eeee1112-eeee-1112-eeee-111111111112', '22222222-2222-2222-2222-222222222222', 'aaaa1111-aaaa-1111-aaaa-111111111111', 4, 'Ерөнхийдөө сайн утас. Гэхдээ USB-C болсон нь арай төвөгтэй байна, хуучин кабелиуд тохирохгүй.', 'active', NOW() - INTERVAL '3 days'),

  ('eeee1113-eeee-1113-eeee-111111111113', '33333333-3333-3333-3333-333333333333', 'aaaa1111-aaaa-1111-aaaa-111111111111', 5, 'Найздаа бэлэг өгсөн, маш их таалагдсан!', 'active', NOW() - INTERVAL '5 days'),

  -- Samsung Galaxy S24 reviews
  ('eeee2221-eeee-2221-eeee-222222222221', '44444444-4444-4444-4444-444444444444', 'aaaa2222-aaaa-2222-aaaa-222222222222', 5, 'AI функцүүд нь үнэхээр гайхалтай! Circle to Search маш хэрэгтэй. Дэлгэц тод, батерей сайн.', 'active', NOW() - INTERVAL '1 day'),

  ('eeee2222-eeee-2222-eeee-222222222222', '55555555-5555-5555-5555-555555555555', 'aaaa2222-aaaa-2222-aaaa-222222222222', 4, 'Утас маш сайн, гэхдээ S23-аас тийм ч их ялгаатай биш юм шиг.', 'active', NOW() - INTERVAL '4 days'),

  ('eeee2223-eeee-2223-eeee-222222222223', '11111111-1111-1111-1111-111111111111', 'aaaa2222-aaaa-2222-aaaa-222222222222', 3, 'Утас сайн ч хэт халдаг, тоглоом тоглоход гар халдаг.', 'flagged', NOW() - INTERVAL '6 days'),

  -- Nike Air Max 90 reviews
  ('eeee3331-eeee-3331-eeee-333333333331', '22222222-2222-2222-2222-222222222222', 'aaaa3333-aaaa-3333-aaaa-333333333333', 5, 'Маш тав тухтай! Өдөржин өмсөж болно, хөл огт ядрахгүй.', 'active', NOW() - INTERVAL '1 week'),

  ('eeee3332-eeee-3332-eeee-333333333332', '33333333-3333-3333-3333-333333333333', 'aaaa3333-aaaa-3333-aaaa-333333333333', 4, 'Загвар сайхан, чанар сайн. Гэхдээ хэмжээ арай жижиг байсан, нэг размер том авах хэрэгтэй.', 'active', NOW() - INTERVAL '8 days'),

  ('eeee3333-eeee-3333-eeee-333333333333', '44444444-4444-4444-4444-444444444444', 'aaaa3333-aaaa-3333-aaaa-333333333333', 2, 'Хуурамч бараа ирсэн байх. Үнэхээр муу чанартай.', 'flagged', NOW() - INTERVAL '10 days'),

  -- Adidas Ultraboost reviews
  ('eeee4441-eeee-4441-eeee-444444444441', '55555555-5555-5555-5555-555555555555', 'aaaa4444-aaaa-4444-aaaa-444444444444', 5, 'Гүйлтэнд хамгийн тохиромжтой пүүз! Boost технологи үнэхээр гайхалтай.', 'active', NOW() - INTERVAL '3 days'),

  ('eeee4442-eeee-4442-eeee-444444444442', '11111111-1111-1111-1111-111111111111', 'aaaa4444-aaaa-4444-aaaa-444444444444', 4, 'Сайн пүүз, гэхдээ үнэ нь арай өндөр.', 'active', NOW() - INTERVAL '9 days'),

  -- MacBook Pro 14" reviews
  ('eeee5551-eeee-5551-eeee-555555555551', '33333333-3333-3333-3333-333333333333', 'aaaa5555-aaaa-5555-aaaa-555555555555', 5, 'M3 Pro чип маш хурдан! Видео эдит, код бичихэд төгс. Батерей 10+ цаг барина.', 'active', NOW() - INTERVAL '2 days'),

  ('eeee5552-eeee-5552-eeee-555555555552', '44444444-4444-4444-4444-444444444444', 'aaaa5555-aaaa-5555-aaaa-555555555555', 5, 'Хамгийн сайн ажлын компьютер! Windows-оос солиод маш их сэтгэл хангалуун байна.', 'active', NOW() - INTERVAL '5 days'),

  ('eeee5553-eeee-5553-eeee-555555555553', '22222222-2222-2222-2222-222222222222', 'aaaa5555-aaaa-5555-aaaa-555555555555', 4, 'Компьютер маш сайн, гэхдээ порт цөөн. USB-C хаб заавал хэрэгтэй болдог.', 'active', NOW() - INTERVAL '1 week'),

  -- Hidden review (spam example)
  ('eeee6661-eeee-6661-eeee-666666666661', '55555555-5555-5555-5555-555555555555', 'aaaa1111-aaaa-1111-aaaa-111111111111', 1, 'asdkjfhasdf spam text here', 'hidden', NOW() - INTERVAL '2 weeks'),

  -- Another flagged review
  ('eeee7771-eeee-7771-eeee-777777777771', '22222222-2222-2222-2222-222222222222', 'aaaa4444-aaaa-4444-aaaa-444444444444', 1, 'Муу бараа, бүү авна уу! Манай дэлгүүрт ирээрэй www.spam-site.com', 'flagged', NOW() - INTERVAL '12 days')

ON CONFLICT (id) DO UPDATE SET
  rating = EXCLUDED.rating,
  comment = EXCLUDED.comment,
  status = EXCLUDED.status;

-- Verify the data
SELECT 'Total Reviews: ' || COUNT(*) FROM reviews;
SELECT 'Active: ' || COUNT(*) FROM reviews WHERE status = 'active';
SELECT 'Hidden: ' || COUNT(*) FROM reviews WHERE status = 'hidden';
SELECT 'Flagged: ' || COUNT(*) FROM reviews WHERE status = 'flagged';

-- Show reviews with user and product names
SELECT
  r.rating,
  r.status,
  LEFT(r.comment, 50) as comment_preview,
  u.full_name as user_name,
  p.name as product_name
FROM reviews r
JOIN users u ON r.user_id = u.id
JOIN products p ON r.product_id = p.id
ORDER BY r.created_at DESC;
