# Task 5: Increase Cookie Lifetime to 90 Days

## Goal
Update cookie `ref` lifetime từ **30 ngày** → **90 ngày** ở tất cả nơi set cookie.

## Why?
- User gap 10 ngày giữa register và mua hàng vẫn còn cookie
- Giảm tình trạng cookie hết hạn → mất referral
- 90 ngày = ~3 tháng, đủ cho hầu hết user journey

## Files to Update

### File 1: `src/app/(marketing)/register/page.tsx`
**Location**: Around line 67-76 (handleVerifyComplete function)

**Current code**:
```typescript
Cookies.set("ref", refToUse, {
    expires: 30,  // ❌ 30 days
    path: "/",
    sameSite: "lax",
    secure: window.location.protocol === "https:",
});
```

**New code**:
```typescript
Cookies.set("ref", refToUse, {
    expires: 90,  // ✅ Changed to 90 days
    path: "/",
    sameSite: "lax",
    secure: window.location.protocol === "https:",
});
```

---

### File 2: `src/app/(marketing)/login/page.tsx`
**Location**: Around line 26-31 (handleSubmit in RefCodeModal)

**IMPORTANT**: This should already be updated in Task 2!

**Current code**:
```typescript
Cookies.set("ref", code, {
    expires: 30,  // ❌ 30 days
    path: "/",
    sameSite: "lax",
    secure: window.location.protocol === "https:",
});
```

**New code**:
```typescript
Cookies.set("ref", code, {
    expires: 90,  // ✅ Changed to 90 days
    path: "/",
    sameSite: "lax",
    secure: window.location.protocol === "https:",
});
```

**NOTE**: If Task 2 was implemented correctly, this is already 90. Verify only.

---

### File 3: Search for Other Occurrences
Run this command to find all places setting cookie "ref":

```bash
cd /Users/luisphan/intent/workspaces/expected-llama/dainganxanh/dainganxanh-landing
grep -rn 'Cookies.set.*ref' src/
```

Expected output:
- `src/app/(marketing)/register/page.tsx:XX`
- `src/app/(marketing)/login/page.tsx:XX`
- Possibly `src/components/crm/ReferralTracker.tsx` or similar

Update ALL occurrences to `expires: 90`.

---

## Definition of Done
- [ ] `register/page.tsx`: expires = 90
- [ ] `login/page.tsx`: expires = 90 (should be done in Task 2)
- [ ] Search confirmed: no more `expires: 30` for cookie "ref"
- [ ] All Cookies.set("ref") use expires: 90

## Manual Verification Steps

### Test 1: Register Flow
1. Register new account với ref code "dainganxanh"
2. Open DevTools → Application tab → Cookies
3. Find cookie "ref"
4. **Verify**: Expires = 90 days from now (not 30 days)

### Test 2: Login Flow (Modal)
1. Delete cookie "ref"
2. Login với account cũ
3. Modal hiện → Submit ref code
4. Open DevTools → Application tab → Cookies
5. **Verify**: Expires = 90 days from now (not 30 days)

### Test 3: Global Search
```bash
cd /Users/luisphan/intent/workspaces/expected-llama/dainganxanh/dainganxanh-landing
grep -rn 'expires.*30' src/ | grep -i cookie | grep -i ref
```

**Expected output**: Empty (no results) = Good!

## Files to Modify Summary

| File | Line | Old | New |
|------|------|-----|-----|
| `register/page.tsx` | ~72 | `expires: 30` | `expires: 90` |
| `login/page.tsx` | ~27 | `expires: 30` | `expires: 90` |

## Notes
- Simple find-and-replace task
- Critical for reducing cookie expiry issues
- Task 2 should have already updated `login/page.tsx`
- If ReferralTracker.tsx exists and sets cookie, update it too
