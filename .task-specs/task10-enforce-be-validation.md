# Task 10: Enforce Referral Code in Register BE

## Goal
API register REJECT nếu không có valid referral code. Bắt buộc tất cả users mới phải có referrer.

## Critical Context
- Task 9 ✅ DONE: Column `referred_by_user_id` đã được thêm vào bảng `users`
- Tất cả users cũ đã có referrer = `dainganxanh`
- Backend PHẢI validate ref code trước khi tạo user

## Files to Modify

Need to find the register API endpoint. Likely locations:
- `src/app/api/auth/register/route.ts`
- `src/app/api/register/route.ts`
- Or using Supabase Auth Hooks

First, search for register endpoint:
```bash
grep -rn "signUp\|register" src/app/api/
```

## Implementation Requirements

### 1. Find Register Endpoint

Search for where user registration happens. Look for:
- `supabase.auth.signUp()`
- API route handling POST to `/api/register` or `/api/auth/register`

### 2. Add Validation Logic

**BEFORE creating user:**

```typescript
// Validate referral code is provided
if (!referralCode || referralCode.trim() === '') {
  return NextResponse.json(
    { error: 'Mã giới thiệu là bắt buộc' },
    { status: 400 }
  );
}

// Validate referral code exists in database
const { data: referrer, error: referrerError } = await supabase
  .from('users')
  .select('id, email, referral_code')
  .ilike('referral_code', referralCode.trim())
  .single();

if (referrerError || !referrer) {
  return NextResponse.json(
    {
      error: 'Mã giới thiệu không hợp lệ',
      details: 'Vui lòng kiểm tra lại mã giới thiệu hoặc liên hệ người giới thiệu'
    },
    { status: 400 }
  );
}

console.log('[REGISTER] Valid referrer found:', {
  referralCode: referralCode.trim(),
  referrerId: referrer.id,
  referrerEmail: referrer.email
});
```

### 3. Create User with Referrer

**When calling `signUp()`:**

```typescript
const { data: newUser, error: signUpError } = await supabase.auth.signUp({
  email,
  phone,
  password,
  options: {
    data: {
      referred_by_user_id: referrer.id,
      referral_code: referralCode.trim().toLowerCase()
    }
  }
});

if (signUpError) {
  console.error('[REGISTER] SignUp failed:', signUpError);
  return NextResponse.json(
    { error: 'Đăng ký thất bại', details: signUpError.message },
    { status: 500 }
  );
}
```

### 4. Update Users Table

**After successful signup:**

```typescript
if (newUser?.user?.id) {
  const { error: updateError } = await supabase
    .from('users')
    .update({
      referred_by_user_id: referrer.id
    })
    .eq('id', newUser.user.id);

  if (updateError) {
    console.error('[REGISTER] Failed to update users table:', updateError);
    // Non-critical - user is created, just log the error
  } else {
    console.log('[REGISTER] User created successfully:', {
      userId: newUser.user.id,
      email: newUser.user.email,
      referrerId: referrer.id
    });
  }
}
```

## Edge Cases to Handle

### Case 1: Default Fallback
If you want to allow empty ref code with auto-fallback:

```typescript
const DEFAULT_REF_CODE = "dainganxanh";
const refToValidate = referralCode?.trim() || DEFAULT_REF_CODE;
```

**BUT** based on requirements, we DON'T allow empty. Must be explicit.

### Case 2: Case Sensitivity
Always use `ilike()` for case-insensitive matching:
```typescript
.ilike('referral_code', referralCode.trim())
```

### Case 3: Supabase Auth Trigger
If using Supabase Auth webhooks/triggers instead of API route, update the trigger function.

## Definition of Done

- [ ] Found register API endpoint
- [ ] Added validation: referralCode not empty
- [ ] Added validation: referralCode exists in database
- [ ] Return 400 error with clear message if invalid
- [ ] User created with `referred_by_user_id` set
- [ ] Users table updated with referrer
- [ ] Console logs added for debugging

## Verification Steps

### Test 1: Register Without Ref Code → Should Fail
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@test.com",
    "password": "password123"
  }'
```
**Expected**: 400 error "Mã giới thiệu là bắt buộc"

### Test 2: Register With Invalid Ref Code → Should Fail
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@test.com",
    "password": "password123",
    "referralCode": "INVALID_CODE_XYZ"
  }'
```
**Expected**: 400 error "Mã giới thiệu không hợp lệ"

### Test 3: Register With Valid Ref Code → Should Succeed
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test3@test.com",
    "password": "password123",
    "referralCode": "dainganxanh"
  }'
```
**Expected**: 200 success, user created

### Test 4: Check Database
```sql
SELECT
  u.id,
  u.email,
  u.referred_by_user_id,
  u_ref.email as referrer_email,
  u_ref.referral_code as referrer_code
FROM users u
LEFT JOIN users u_ref ON u.referred_by_user_id = u_ref.id
WHERE u.email = 'test3@test.com';
```
**Expected**: referred_by_user_id = dainganxanh user ID

## Notes

- If register endpoint doesn't exist, this might be handled by Supabase Auth directly
- In that case, need to use Database Triggers or Auth Hooks
- Priority: Find the endpoint first, then implement validation
