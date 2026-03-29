CREATE OR REPLACE FUNCTION backfill_missing_user_profiles()
RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER := 0;
    rec RECORD;
    base_code TEXT;
    ref_code TEXT;
BEGIN
    FOR rec IN
        SELECT au.id, au.email, au.phone
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE pu.id IS NULL
    LOOP
        base_code := regexp_replace(
            lower(split_part(COALESCE(rec.email, ''), '@', 1)),
            '[^a-z0-9]', '', 'g'
        );
        IF length(base_code) < 3 THEN
            base_code := 'user';
        END IF;
        ref_code := left(base_code, 15) || FLOOR(RANDOM() * 100000)::TEXT;

        INSERT INTO public.users (id, email, phone, referral_code)
        VALUES (rec.id, rec.email, rec.phone, ref_code)
        ON CONFLICT DO NOTHING;

        GET DIAGNOSTICS inserted_count = ROW_COUNT;
    END LOOP;

    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT cron.unschedule('backfill-missing-user-profiles')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'backfill-missing-user-profiles'
);

SELECT cron.schedule(
    'backfill-missing-user-profiles',
    '0 * * * *',
    'SELECT backfill_missing_user_profiles()'
);
