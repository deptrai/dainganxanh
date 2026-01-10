# Supabase Backend Setup Guide

## Step 1: Run Database Migration

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/gzuuyzikjvykjpeixzqk/editor
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the contents of `supabase/migrations/20260110_create_users_table.sql`
5. Paste into the SQL editor
6. Click "Run" to execute the migration

## Step 2: Configure Auth Providers

### Enable Phone Auth (SMS OTP)

1. Go to: https://supabase.com/dashboard/project/gzuuyzikjvykjpeixzqk/auth/providers
2. Find "Phone" provider
3. Toggle "Enable Phone provider" to ON
4. **For Development:** You can use Supabase's test phone numbers
5. **For Production:** Configure Twilio:
   - Add Twilio credentials in "Phone Auth Settings"
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN  
   - TWILIO_PHONE_NUMBER

### Enable Email Auth (Email OTP)

1. Same page: https://supabase.com/dashboard/project/gzuuyzikjvykjpeixzqk/auth/providers
2. Find "Email" provider
3. Toggle "Enable Email provider" to ON
4. Supabase will use built-in email service (no extra config needed)

### Configure OTP Settings

1. Go to: https://supabase.com/dashboard/project/gzuuyzikjvykjpeixzqk/auth/rate-limits
2. Set OTP expiry: **300 seconds** (5 minutes)
3. Set rate limits as needed

## Step 3: Get API Keys

1. Go to: https://supabase.com/dashboard/project/gzuuyzikjvykjpeixzqk/settings/api-keys
2. Copy the following:
   - **Project URL**: `https://gzuuyzikjvykjpeixzqk.supabase.co`
   - **anon public key**: (long string starting with `eyJ...`)

## Step 4: Configure Environment Variables

1. Create `.env.local` file in project root:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your keys:
```
NEXT_PUBLIC_SUPABASE_URL=https://gzuuyzikjvykjpeixzqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

## Step 5: Test the Setup

1. Restart the dev server:
```bash
npm run dev
```

2. Navigate to: http://localhost:3001/register?quantity=5

3. Test Phone OTP:
   - Enter a phone number (use test number if in dev mode)
   - Click "Gửi mã OTP"
   - Check for OTP (console or SMS)
   - Enter OTP to verify

4. Test Email OTP:
   - Switch to Email tab
   - Enter your email
   - Click "Gửi mã OTP"
   - Check email for OTP
   - Enter OTP to verify

## Verification Checklist

- [ ] Database migration executed successfully
- [ ] Phone provider enabled
- [ ] Email provider enabled
- [ ] API keys copied to `.env.local`
- [ ] Dev server restarted
- [ ] Phone OTP send works
- [ ] Email OTP send works
- [ ] OTP verification works
- [ ] User profile auto-created in `users` table
- [ ] Referral code auto-generated

## Troubleshooting

### "Invalid API key" error
- Check `.env.local` has correct NEXT_PUBLIC_SUPABASE_ANON_KEY
- Restart dev server after changing env vars

### OTP not received
- Check Auth provider is enabled
- For phone: verify Twilio credentials (production)
- For email: check spam folder

### User profile not created
- Check trigger `on_auth_user_created` exists
- Check RLS policies allow insert
- View logs in Supabase Dashboard → Database → Logs

## Next Steps

Once setup is complete, the OTP flow will work end-to-end:
1. User enters phone/email
2. Supabase sends OTP
3. User enters OTP
4. Supabase verifies and creates auth user
5. Trigger auto-creates profile in `users` table
6. User redirected to checkout
