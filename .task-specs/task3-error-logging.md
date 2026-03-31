# Task 3: Add Error Logging - Checkout Referrer Query

## Goal
Thêm error logging khi query referrer thất bại trong checkout page để có thể trace và debug.

## File to Modify
- `src/app/(marketing)/checkout/page.tsx`

## Current Code Location
Around line 157-162 (find this pattern):
```typescript
const DEFAULT_REF_CODE = "dainganxanh";
const refCookie = Cookies.get("ref") || DEFAULT_REF_CODE;
let referredBy: string | null = null;
const { data: referrer } = await supabase
    .from("users").select("id").ilike("referral_code", refCookie).single();
if (referrer) referredBy = referrer.id;
```

## Problem
- Query thất bại **im lặng** → không biết tại sao referred_by = null
- Không có context để debug (refCookie là gì? user là ai? timestamp?)
- Không phân biệt được query error vs referrer không tồn tại

## New Code (With Error Logging)

Replace the above code block with:

```typescript
const DEFAULT_REF_CODE = "dainganxanh";
const refCookie = Cookies.get("ref") || DEFAULT_REF_CODE;
let referredBy: string | null = null;

// Query referrer with error handling
const { data: referrer, error: referrerError } = await supabase
    .from("users")
    .select("id")
    .ilike("referral_code", refCookie)
    .single();

if (referrerError) {
    // Log query error với full context
    console.error('[CHECKOUT] Referrer query failed:', {
        refCookie,
        error: referrerError.message,
        code: referrerError.code,
        details: referrerError.details,
        timestamp: new Date().toISOString(),
        userId: session?.user?.id || 'anonymous',
    });

    // TODO: Optional - Alert admin via webhook/Telegram nếu cần
    // Bây giờ chỉ log để trace được
}

if (referrer) {
    referredBy = referrer.id;
    console.log('[CHECKOUT] Referrer found:', {
        referrerId: referrer.id,
        refCookie,
        timestamp: new Date().toISOString(),
    });
} else if (!referrerError) {
    // Referrer không tồn tại NHƯNG query thành công (valid case)
    console.warn('[CHECKOUT] Referral code not found in database:', {
        refCookie,
        timestamp: new Date().toISOString(),
        userId: session?.user?.id || 'anonymous',
        note: 'User may have typed invalid code or code not registered yet',
    });
}
```

## Key Changes
1. ✅ Destructure `error` from query
2. ✅ Log **full context** khi query fails
3. ✅ Log **warning** khi referral code không tồn tại
4. ✅ Log **success** khi tìm thấy referrer
5. ✅ Include: refCookie, userId, timestamp, error details

## Definition of Done
- [ ] Query có `error` destructuring
- [ ] Console.error khi query failed
- [ ] Console.warn khi code không tồn tại
- [ ] Console.log khi tìm thấy referrer
- [ ] Logs include context đầy đủ

## Manual Verification Steps

### Test 1: Valid Referral Code (Happy Path)
1. Set cookie "ref" = "dainganxanh"
2. Go to checkout page
3. **Expected console output**:
   ```
   [CHECKOUT] Referrer found: { referrerId: "...", refCookie: "dainganxanh", ... }
   ```
4. No errors

### Test 2: Invalid Referral Code
1. Set cookie "ref" = "INVALID_CODE_123"
2. Go to checkout page
3. **Expected console output**:
   ```
   [CHECKOUT] Referral code not found in database: { refCookie: "invalid_code_123", ... }
   ```

### Test 3: Network Error (Simulated)
1. Open DevTools → Network tab
2. Block all requests to Supabase domain
3. Go to checkout page
4. **Expected console output**:
   ```
   [CHECKOUT] Referrer query failed: { refCookie: "...", error: "...", code: "...", ... }
   ```

### Test 4: No Cookie (Default Fallback)
1. Delete cookie "ref"
2. Go to checkout page
3. **Expected console output**:
   ```
   [CHECKOUT] Referrer found: { referrerId: "...", refCookie: "dainganxanh", ... }
   ```
   (Because DEFAULT_REF_CODE = "dainganxanh" should exist)

## Notes
- Logs use prefix `[CHECKOUT]` để dễ filter trong console
- Include `timestamp` để correlate với server logs
- Include `userId` để trace user-specific issues
- Error logging là foundation cho Task 4 (validation)
