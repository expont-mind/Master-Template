-- ============================================================================
-- ADDRESSES TABLE - sub_district нэмэх
-- USERS TABLE - full_name, phone устгаж, first_name, last_name, primary_phone, secondary_phone нэмэх
-- ============================================================================

-- 1. addresses: sub_district нэмэх
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS sub_district VARCHAR;

-- 2. addresses: хуучин холбоо барих талбарууд устгах (хэрэв байвал)
ALTER TABLE addresses DROP COLUMN IF EXISTS last_name;
ALTER TABLE addresses DROP COLUMN IF EXISTS first_name;
ALTER TABLE addresses DROP COLUMN IF EXISTS phone;
ALTER TABLE addresses DROP COLUMN IF EXISTS phone_2;

-- 3. users: шинэ талбарууд нэмэх
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_phone VARCHAR(50);

-- 4. users: full_name, phone утгыг шилжүүлэх (өгөгдөл алдахгүй)
UPDATE users SET first_name = full_name WHERE first_name IS NULL AND full_name IS NOT NULL;
UPDATE users SET primary_phone = phone WHERE primary_phone IS NULL AND phone IS NOT NULL;

-- 5. users: хуучин талбарууд устгах
ALTER TABLE users DROP COLUMN IF EXISTS full_name;
ALTER TABLE users DROP COLUMN IF EXISTS phone;

SELECT 'addresses + users table шинэчлэгдлээ!' as message;
