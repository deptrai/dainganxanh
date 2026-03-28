-- Migration: Generate referral codes from user name/email (readable, no diacritics)

-- Enable unaccent extension for diacritic removal
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Helper: convert a raw name/email to a clean slug
CREATE OR REPLACE FUNCTION slugify_for_referral(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Remove diacritics (handles Vietnamese, accented Latin)
  slug := unaccent(input_text);
  -- Lowercase
  slug := lower(slug);
  -- Remove anything that's not a-z or 0-9
  slug := regexp_replace(slug, '[^a-z0-9]', '', 'g');
  -- Truncate to 20 chars max
  slug := left(slug, 20);
  RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Updated trigger function: name-based referral code with uniqueness fallback
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_name  TEXT;
  base_code TEXT;
  new_code  TEXT;
  suffix    INT := 0;
  code_exists BOOLEAN;
BEGIN
  -- 1. Try full_name from auth metadata first, then name, then email prefix
  raw_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(split_part(NEW.email, '@', 1)), '')
  );

  -- 2. Slugify
  base_code := slugify_for_referral(COALESCE(raw_name, ''));

  -- 3. Fallback if slug is too short (< 3 chars)
  IF length(base_code) < 3 THEN
    base_code := 'user' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  END IF;

  -- 4. Ensure uniqueness: try base_code, then base_code2, base_code3, ...
  new_code := base_code;
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.users WHERE referral_code = new_code
    ) INTO code_exists;
    EXIT WHEN NOT code_exists;
    suffix    := suffix + 1;
    new_code  := base_code || suffix::TEXT;
  END LOOP;

  -- 5. Insert user profile
  INSERT INTO public.users (id, phone, email, referral_code)
  VALUES (NEW.id, NEW.phone, NEW.email, new_code)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger (it already exists, this replaces the function in place)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

GRANT INSERT ON public.users TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
