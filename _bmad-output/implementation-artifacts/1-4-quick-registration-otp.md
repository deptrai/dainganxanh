# Story 1.4: Quick Registration với OTP

Status: review

## Story

As a **new user**,
I want to **đăng ký nhanh bằng SĐT/Email + OTP**,
so that **tôi hoàn thành mua hàng mà không cần form phức tạp**.

## Acceptance Criteria

1. **Given** tôi ở checkout screen và chưa có tài khoản  
   **When** tôi nhập SĐT/Email và click "Gửi OTP"  
   **Then** nhận OTP 6 chữ số trong 30 giây

2. **When** tôi nhập đúng OTP  
   **Then** tài khoản được tạo tự động

3. **And** chuyển sang màn hình thanh toán

4. **And** OTP expires sau 5 phút

5. **And** Cho phép gửi lại OTP sau 30 giây

6. ~~Google/Facebook login~~ - **REMOVED** - Chỉ dùng Email/Phone + OTP

## Implementation Status

**Frontend:** ✅ Complete  
**Backend:** ⏳ Pending Supabase setup

See `docs/supabase-otp-setup.md` for backend configuration instructions.

## Dev Agent Record

### Agent Model Used
Claude 4.5 Sonnet (2026-01-10)

### Implementation Notes
- **Frontend Complete:** All UI components and flow implemented with mock OTP
- **Backend Pending:** Requires Supabase Auth configuration
- Created useAuth hook with state machine for OTP flow
- Implemented 30-second resend cooldown with countdown timer
- Vietnam phone validation: 0xxx-xxx-xxx format
- 6-digit OTP input with auto-focus and paste support
- Two-step registration: input → verify
- Suspense boundary for useSearchParams (Next.js 16 requirement)
- Order summary displayed during registration

### File List
- dainganxanh-landing/src/hooks/useAuth.ts
- dainganxanh-landing/src/components/auth/PhoneEmailInput.tsx
- dainganxanh-landing/src/components/auth/OTPInput.tsx
- dainganxanh-landing/src/app/(auth)/register/page.tsx
- dainganxanh-landing/docs/supabase-otp-setup.md

### Change Log
- 2026-01-10: Frontend implementation complete (Story 1-4)
- Backend setup documented, pending Supabase configuration

## Story

As a **new user**,
I want to **đăng ký nhanh bằng SĐT/Email + OTP**,
so that **tôi hoàn thành mua hàng mà không cần form phức tạp**.

## Acceptance Criteria

1. **Given** tôi ở checkout screen và chưa có tài khoản  
   **When** tôi nhập SĐT/Email và click "Gửi OTP"  
   **Then** nhận OTP 6 chữ số trong 30 giây

2. **When** tôi nhập đúng OTP  
   **Then** tài khoản được tạo tự động

3. **And** chuyển sang màn hình thanh toán

4. **And** OTP expires sau 5 phút

5. **And** Cho phép gửi lại OTP sau 30 giây

6. ~~Google/Facebook login~~ - **REMOVED** - Chỉ dùng Email/Phone + OTP

## Tasks / Subtasks

- [ ] Task 1: Auth Form UI (AC: 1, 5)
  - [ ] 1.1 Tạo route `/src/app/(auth)/register/page.tsx`
  - [ ] 1.2 Tạo `components/auth/PhoneEmailInput.tsx`
  - [ ] 1.3 Tạo `components/auth/OTPInput.tsx` (6 digit boxes)
  - [ ] 1.4 Countdown timer cho "Gửi lại sau Xs"

- [ ] Task 2: OTP Edge Function (AC: 1, 4)
  - [ ] 2.1 Tạo `supabase/functions/send-otp/index.ts`
  - [ ] 2.2 Generate 6-digit OTP
  - [ ] 2.3 Store OTP trong database với expires_at (5 phút)
  - [ ] 2.4 Send via Twilio (SMS) hoặc SendGrid (Email)

- [ ] Task 3: OTP Verification (AC: 2, 3)
  - [ ] 3.1 Tạo `supabase/functions/verify-otp/index.ts`
  - [ ] 3.2 Validate OTP against database
  - [ ] 3.3 Create user trong Supabase Auth
  - [ ] 3.4 Create profile trong `users` table
  - [ ] 3.5 Generate referral code tự động

- [ ] Task 4: Client Integration (AC: 3)
  - [ ] 4.1 Tạo `hooks/useAuth.ts`
  - [ ] 4.2 Handle OTP flow state machine
  - [ ] 4.3 Redirect to checkout sau verify thành công

## Dev Notes

### Architecture Compliance
- **Auth:** Supabase Auth với custom OTP flow
- **Edge Functions:** `supabase/functions/send-otp/` và `verify-otp/`
- **Database:** Table `otps` cho OTP storage

### Technology Requirements
- **SMS:** Twilio API
- **Email:** SendGrid API
- **OTP Generation:** `crypto.randomInt(100000, 999999)`

### Database Schema Addition
```sql
CREATE TABLE otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL, -- phone or email
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_otps_identifier ON otps(identifier);
```

### Environment Variables Required
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `SENDGRID_API_KEY`

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Supabase-Edge-Functions]
- [Source: _bmad-output/planning-artifacts/wireframes.md#Quick-Registration]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form-Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.4]
- [Source: docs/prd.md#FR-04]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/app/(auth)/register/page.tsx
- src/components/auth/PhoneEmailInput.tsx
- src/components/auth/OTPInput.tsx
- src/hooks/useAuth.ts
- supabase/functions/send-otp/index.ts
- supabase/functions/verify-otp/index.ts
- supabase/migrations/[timestamp]_create_otps_table.sql
