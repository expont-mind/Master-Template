-- ============================================================================
-- AUTH USER -> PUBLIC USER auto-sync trigger (OAuth дэмжсэн)
-- Facebook, Google OAuth-аар бүртгэгдсэн хэрэглэгчдийг зөв үүсгэх
-- ============================================================================

-- 1. Сайжруулсан trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_avatar_url TEXT;
  v_email TEXT;
BEGIN
  -- Email авах
  v_email := NEW.email;

  -- OAuth metadata-аас мэдээлэл авах (Facebook, Google)
  v_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'given_name',
    SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1)
  );

  v_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'family_name',
    NULLIF(SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 2), '')
  );

  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- public.users-д оруулах
  INSERT INTO public.users (id, email, first_name, last_name, avatar_url, primary_phone)
  VALUES (
    NEW.id,
    v_email,
    NULLIF(v_first_name, ''),
    NULLIF(v_last_name, ''),
    v_avatar_url,
    NEW.phone
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.users.email),
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.users.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.users.last_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    primary_phone = COALESCE(EXCLUDED.primary_phone, public.users.primary_phone);

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Email давхцсан бол update хийх
    UPDATE public.users SET
      first_name = COALESCE(NULLIF(v_first_name, ''), first_name),
      last_name = COALESCE(NULLIF(v_last_name, ''), last_name),
      avatar_url = COALESCE(v_avatar_url, avatar_url)
    WHERE email = v_email;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Алдааг log хийж, trigger fail хийхгүй
    RAISE WARNING 'handle_new_user error: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger дахин үүсгэх
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Одоо байгаа OAuth хэрэглэгчдийг sync хийх (өмнө нь бүртгэгдсэн боловч public.users-д байхгүй бол)
INSERT INTO public.users (id, email, first_name, last_name, avatar_url, primary_phone)
SELECT
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'first_name',
    au.raw_user_meta_data->>'given_name',
    SPLIT_PART(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''), ' ', 1)
  ),
  COALESCE(
    au.raw_user_meta_data->>'last_name',
    au.raw_user_meta_data->>'family_name',
    NULLIF(SPLIT_PART(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''), ' ', 2), '')
  ),
  COALESCE(
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture'
  ),
  au.phone
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

SELECT 'OAuth-supported auth user trigger амжилттай үүслээ!' as message;
