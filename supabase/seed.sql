-- =============================================================================
-- SEED DATA for local development
-- =============================================================================

-- Default referrer user (dainganxanh) — required by ensureUserProfile.ts
-- ID matches DEFAULT_REFERRER_ID constant in src/actions/ensureUserProfile.ts
INSERT INTO auth.users (
    id,
    email,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '5296b70b-03bb-463b-853c-9ccff2697685',
    'admin@dainganxanh.com.vn',
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (
    id,
    email,
    full_name,
    referral_code,
    referred_by_user_id,
    created_at
) VALUES (
    '5296b70b-03bb-463b-853c-9ccff2697685',
    'admin@dainganxanh.com.vn',
    'Đất Ngàn Xanh',
    'dainganxanh',
    NULL,
    now()
) ON CONFLICT (id) DO NOTHING;
