CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_name  TEXT;
  base_code TEXT;
  new_code  TEXT;
  suffix    INT := 0;
  code_exists BOOLEAN;
  rows_inserted INT;
BEGIN
  raw_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(split_part(NEW.email, '@', 1)), '')
  );

  base_code := slugify_for_referral(COALESCE(raw_name, ''));

  IF length(base_code) < 3 THEN
    base_code := 'user' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  END IF;

  new_code := base_code;
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.users WHERE referral_code = new_code
    ) INTO code_exists;
    EXIT WHEN NOT code_exists;
    suffix    := suffix + 1;
    new_code  := base_code || suffix::TEXT;
  END LOOP;

  INSERT INTO public.users (id, phone, email, referral_code)
  VALUES (NEW.id, NEW.phone, NEW.email, new_code)
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS rows_inserted = ROW_COUNT;

  IF rows_inserted = 0 THEN
    new_code := base_code || FLOOR(RANDOM() * 100000)::TEXT;
    INSERT INTO public.users (id, phone, email, referral_code)
    VALUES (NEW.id, NEW.phone, NEW.email, new_code)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
