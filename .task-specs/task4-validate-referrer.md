# Task 4: Validate Referrer Before Creating Order

## Goal
Validate referral code tồn tại TRƯỚC KHI tạo pending order. Fallback về DEFAULT_REF_CODE nếu invalid.

## File to Modify
- `src/app/(marketing)/checkout/page.tsx`

## Current Flow
1. Get cookie "ref" hoặc DEFAULT_REF_CODE
2. Query referrer
3. Nếu query fail hoặc không tìm thấy → `referredBy = null`
4. **VẤN ĐỀ**: Order được tạo với `referred_by = null` → mất hoa hồng

## New Flow
1. Get cookie "ref" hoặc DEFAULT_REF_CODE
2. **Validate** referral code tồn tại
3. Nếu invalid → **Fallback** về DEFAULT_REF_CODE
4. Nếu cả 2 failed → **Log critical** nhưng vẫn tạo order (với referred_by = null)

## Implementation

### Step 1: Create Validation Function
Add this function BEFORE the checkout page component (around line 15-20):

```typescript
/**
 * Validate referral code and return referrer ID
 * @returns referrer ID if valid, null if invalid
 */
async function validateReferralCode(
    code: string,
    supabase: any
): Promise<string | null> {
    try {
        const { data: referrer, error } = await supabase
            .from("users")
            .select("id")
            .ilike("referral_code", code)
            .single();

        if (error || !referrer) {
            console.warn('[CHECKOUT] Referral code validation failed:', {
                code,
                error: error?.message,
                timestamp: new Date().toISOString(),
            });
            return null;
        }

        console.log('[CHECKOUT] Referral code validated:', {
            code,
            referrerId: referrer.id,
            timestamp: new Date().toISOString(),
        });

        return referrer.id;
    } catch (err) {
        console.error('[CHECKOUT] Validation exception:', err);
        return null;
    }
}
```

### Step 2: Update Checkout Flow
Replace the referrer query code (from Task 3) with validation logic:

```typescript
const DEFAULT_REF_CODE = "dainganxanh";
const refCookie = Cookies.get("ref") || DEFAULT_REF_CODE;
let referredBy: string | null = null;

// Step 1: Validate input referral code
console.log('[CHECKOUT] Validating referral code:', { refCookie });
referredBy = await validateReferralCode(refCookie, supabase);

// Step 2: Fallback to default if validation failed AND input was not default
if (!referredBy && refCookie.toLowerCase() !== DEFAULT_REF_CODE.toLowerCase()) {
    console.warn('[CHECKOUT] Fallback to default referral code:', {
        originalCode: refCookie,
        defaultCode: DEFAULT_REF_CODE,
        timestamp: new Date().toISOString(),
    });

    referredBy = await validateReferralCode(DEFAULT_REF_CODE, supabase);
}

// Step 3: Critical error if both failed
if (!referredBy) {
    console.error('[CHECKOUT] CRITICAL: Both referral codes failed validation:', {
        inputCode: refCookie,
        defaultCode: DEFAULT_REF_CODE,
        timestamp: new Date().toISOString(),
        userId: session?.user?.id || 'anonymous',
        note: 'Order will be created WITHOUT referrer - commission will be lost!',
    });

    // TODO: Alert admin via webhook/Telegram
    // For now, just log và vẫn cho user tạo order
}

console.log('[CHECKOUT] Final referrer assignment:', {
    referredBy,
    refCookie,
    timestamp: new Date().toISOString(),
});
```

## Key Changes
1. ✅ Validation function tách riêng
2. ✅ Try input code first
3. ✅ Fallback về DEFAULT_REF_CODE nếu failed
4. ✅ Log critical error nếu cả 2 failed
5. ✅ Vẫn cho tạo order (không block user)

## Definition of Done
- [ ] `validateReferralCode` function created
- [ ] Validate input code first
- [ ] Fallback to DEFAULT_REF_CODE if invalid
- [ ] Log critical error if both failed
- [ ] Console logs đầy đủ cho debugging

## Manual Verification Steps

### Test 1: Valid Input Code
1. Set cookie "ref" = "dainganxanh"
2. Go to checkout
3. **Expected logs**:
   ```
   [CHECKOUT] Validating referral code: { refCookie: "dainganxanh" }
   [CHECKOUT] Referral code validated: { code: "dainganxanh", referrerId: "..." }
   [CHECKOUT] Final referrer assignment: { referredBy: "...", ... }
   ```
4. Order created with correct `referred_by`

### Test 2: Invalid Input + Valid Default
1. Set cookie "ref" = "INVALID_123"
2. Go to checkout
3. **Expected logs**:
   ```
   [CHECKOUT] Validating referral code: { refCookie: "invalid_123" }
   [CHECKOUT] Referral code validation failed: { code: "invalid_123", ... }
   [CHECKOUT] Fallback to default referral code: { originalCode: "invalid_123", defaultCode: "dainganxanh" }
   [CHECKOUT] Referral code validated: { code: "dainganxanh", referrerId: "..." }
   [CHECKOUT] Final referrer assignment: { referredBy: "...", ... }
   ```
4. Order created with DEFAULT referrer

### Test 3: Both Invalid (Edge Case)
1. Set cookie "ref" = "INVALID_123"
2. Temporarily rename user with code "dainganxanh" in database
3. Go to checkout
4. **Expected logs**:
   ```
   [CHECKOUT] Validating referral code: { refCookie: "invalid_123" }
   [CHECKOUT] Referral code validation failed: { code: "invalid_123", ... }
   [CHECKOUT] Fallback to default referral code: { ... }
   [CHECKOUT] Referral code validation failed: { code: "dainganxanh", ... }
   [CHECKOUT] CRITICAL: Both referral codes failed validation: { ... }
   [CHECKOUT] Final referrer assignment: { referredBy: null, ... }
   ```
5. Order created with `referred_by = null` (but logged for investigation)

### Test 4: No Cookie (Default Path)
1. Delete cookie "ref"
2. Go to checkout
3. **Expected logs**:
   ```
   [CHECKOUT] Validating referral code: { refCookie: "dainganxanh" }
   [CHECKOUT] Referral code validated: { code: "dainganxanh", referrerId: "..." }
   [CHECKOUT] Final referrer assignment: { referredBy: "...", ... }
   ```
4. Order created with DEFAULT referrer

## Notes
- Validation function is **reusable** (có thể dùng ở nơi khác)
- Không block user nếu validation failed (UX priority)
- Critical errors được log để admin có thể investigate
- Builds on top of Task 3's logging foundation
