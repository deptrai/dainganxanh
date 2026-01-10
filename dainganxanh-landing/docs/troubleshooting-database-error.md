# Quick Fix for "Database error saving new user"

## Issue
The trigger `handle_new_user()` is failing when creating user profiles after OTP verification.

## Root Cause
The migration hasn't been run in Supabase, or there's a conflict with existing data.

## Quick Fix Steps

### Option 1: Run Migration in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/gzuuyzikjvykjpeixzqk/editor
2. Click "SQL Editor" → "New Query"
3. Copy and paste the entire content from:
   `supabase/migrations/20260110_create_users_table.sql`
4. Click "Run"

### Option 2: Disable Auto Profile Creation (Temporary)

If you want to test OTP flow without profile creation:

1. Comment out the trigger in migration:
```sql
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

2. Users will be created in `auth.users` but not in `public.users`
3. Profile can be created manually later

### Option 3: Check Existing Users

The error might be caused by trying to create a profile for a user that already exists.

Run this query in Supabase SQL Editor:
```sql
-- Check if user already has a profile
SELECT u.id, u.email, u.phone, p.referral_code
FROM auth.users u
LEFT JOIN public.users p ON u.id = p.id
WHERE u.email = 'phanquochoipt@gmail.com';
```

If the user exists in `auth.users` but not in `public.users`, manually create the profile:
```sql
INSERT INTO public.users (id, email, referral_code)
SELECT id, email, 'DNG' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
FROM auth.users
WHERE email = 'phanquochoipt@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.users.id);
```

## Recommended Solution

**Run the migration** (Option 1) - This is the proper fix.

The migration creates:
- `public.users` table
- `generate_referral_code()` function
- `handle_new_user()` trigger
- RLS policies

Once migration is run, the OTP flow will work end-to-end.

## Testing After Fix

1. Try registering with a NEW email (not phanquochoipt@gmail.com)
2. Verify OTP is sent
3. Enter OTP
4. Check if user is created in both `auth.users` and `public.users`

## Verification Query

```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Verify function exists
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';

-- Verify table exists
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'users';
```
