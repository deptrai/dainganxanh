# Supabase Backend Setup for Story 1-4

## Overview
This document outlines the Supabase backend configuration required for the OTP registration flow to work in production.

## Database Migration

Create a new migration file in your Supabase project:

```sql
-- Create users profile table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  full_name TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code: DNG + 6 random digits
    new_code := 'DNG' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.users WHERE referral_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-create user profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, phone, email, referral_code)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.email,
    generate_referral_code()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute on new auth user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);
```

## Supabase Auth Configuration

### 1. Enable Phone Auth

In Supabase Dashboard → Authentication → Providers:
- ✅ Enable "Phone" provider
- Configure SMS provider (Twilio recommended)
- Set OTP expiry to 300 seconds (5 minutes)

### 2. Enable Email Auth

In Supabase Dashboard → Authentication → Providers:
- ✅ Enable "Email" provider
- Configure email templates
- Set OTP expiry to 300 seconds (5 minutes)

### 3. SMS Provider Setup (Twilio)

Add environment variables to Supabase:
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

### 4. Email Provider Setup (Optional)

Supabase uses built-in email by default. For custom provider:
```
SENDGRID_API_KEY=your_sendgrid_key
```

## Frontend Integration

Update `src/hooks/useAuth.ts` to use real Supabase client:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// In sendOTP function:
const { error } = await supabase.auth.signInWithOtp({
  [mode]: identifier,
  options: { shouldCreateUser: true }
});

// In verifyOTP function:
const { data, error } = await supabase.auth.verifyOtp({
  [mode]: identifier,
  token: code,
  type: mode === 'phone' ? 'sms' : 'email'
});
```

## Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing Checklist

- [ ] Run migration in Supabase
- [ ] Test phone OTP send
- [ ] Test email OTP send
- [ ] Verify OTP with correct code
- [ ] Verify OTP with incorrect code
- [ ] Check user profile auto-creation
- [ ] Verify referral code generation
- [ ] Test OTP expiry (5 minutes)
- [ ] Test resend cooldown (30 seconds)

## Notes

- Frontend is complete with mock OTP flow
- Backend setup required before production deployment
- Current implementation uses mock API calls for development
- Replace mock calls with Supabase client when backend is ready
