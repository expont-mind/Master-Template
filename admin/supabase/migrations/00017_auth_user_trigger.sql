-- ============================================================================
-- AUTH USER -> PUBLIC USER auto-sync trigger
-- Phone OTP-р бүртгэгдсэн auth user-г public.users-д автоматаар үүсгэх
-- ============================================================================

-- 1. Trigger function: auth.users-д шинэ хэрэглэгч бүртгэгдэхэд public.users-д мөр үүсгэнэ
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, primary_phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger үүсгэх
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Одоо байгаа auth users-г public.users-д нэмэх (байхгүй бол)
INSERT INTO public.users (id, email, primary_phone)
SELECT au.id, au.email, au.phone
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT DO NOTHING;

SELECT 'Auth user trigger амжилттай үүслээ!' as message;
