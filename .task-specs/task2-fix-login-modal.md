# Task 2: Fix Login Modal - Mandatory Referral Code

## Goal
Sửa login modal để **BẮT BUỘC** user nhập mã referral khi đăng nhập lại (không còn cookie).

## Files to Modify
- `src/app/(marketing)/login/page.tsx`

## Current Issues
1. User có thể bấm "Bỏ qua" → cookie không được set đúng
2. Modal có thể close bằng click outside
3. Không có enforcement → dẫn đến mất referral

## Changes Required

### 1. Remove "Skip" Button (Dòng 95-101)
**DELETE** hoàn toàn button "Bỏ qua":
```typescript
// DELETE THIS:
<button
    onClick={handleSkip}
    className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
>
    Bỏ qua
</button>
```

### 2. Remove handleSkip Function (Dòng 35-44)
**DELETE** function `handleSkip` vì không còn dùng nữa.

### 3. Update handleSubmit to Allow Empty Input (Dòng 20-33)
Cho phép submit với input rỗng (auto-fallback về DEFAULT_REF):

```typescript
const handleSubmit = () => {
    const code = refInput.trim().toLowerCase() || DEFAULT_REF.toLowerCase();

    // No validation error if empty - just use default
    Cookies.set("ref", code, {
        expires: 90,  // Task 5: Changed from 30 to 90
        path: "/",
        sameSite: "lax",
        secure: window.location.protocol === "https:",
    });
    onDone();
};
```

### 4. Prevent Modal Close on Outside Click (Dòng 47)
Add `onClick={(e) => e.stopPropagation()}` to modal content:

```typescript
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}  // ✅ ADD THIS
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
    >
```

### 5. Update Button Layout (Dòng 95-108)
Vì chỉ còn 1 button, update layout:

```typescript
<div className="mt-5">
    <button
        onClick={handleSubmit}
        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors"
    >
        Xác nhận
    </button>
</div>
```

### 6. Update Cookie Expiry (Both Places - Task 5)
Trong `handleSubmit` (dòng 26-31) - đã update ở bước 3 ở trên (expires: 90).

## Definition of Done
- [ ] Nút "Bỏ qua" bị xóa
- [ ] Function `handleSkip` bị xóa
- [ ] Modal KHÔNG close khi click outside
- [ ] User có thể submit với input rỗng → auto-fallback "dainganxanh"
- [ ] Cookie expires = 90 ngày (Task 5 included)
- [ ] Button "Xác nhận" full-width

## Manual Verification Steps

### Test 1: Modal Không Đóng Được
1. Xóa cookie "ref" trong DevTools
2. Login với account cũ → Modal hiện
3. Click vào background đen → Modal KHÔNG đóng
4. Try ESC key → Modal KHÔNG đóng
5. PHẢI bấm "Xác nhận" mới đóng

### Test 2: Submit Với Input Rỗng
1. Modal hiện → Input để trống
2. Bấm "Xác nhận"
3. Check DevTools → Cookie "ref" = "dainganxanh" (default)
4. Check expires = 90 days from now

### Test 3: Submit Với Custom Code
1. Modal hiện → Nhập "testcode123"
2. Bấm "Xác nhận"
3. Check DevTools → Cookie "ref" = "testcode123"
4. Check expires = 90 days from now

### Test 4: Hint Button Vẫn Hoạt Động
1. Modal hiện → Click "Bấm vào đây để dùng mã dainganxanh"
2. Input auto-fill = "dainganxanh"
3. Bấm "Xác nhận"
4. Cookie set thành công

## Notes
- Task này cũng bao gồm **Task 5** (cookie lifetime 30→90 ngày) trong login modal
- RefCodeModal là inline component trong login/page.tsx (dòng 16-112)
- Không có file riêng RefCodeModal.tsx
