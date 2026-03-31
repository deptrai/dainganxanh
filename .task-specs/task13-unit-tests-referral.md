# Task 13: Unit Tests cho Mandatory Referral System

## Mục tiêu
Viết/cập nhật unit tests để đảm bảo hệ thống referral bắt buộc hoạt động đúng, sau đó test trên UI.

## Ngữ cảnh
Vừa hoàn thành Tasks 9-12:
- Task 9: Thêm `referred_by_user_id` column và backfill
- Task 10: Fix `ensureUserProfile` để lưu referrer khi tạo user mới
- Task 11: Validation FE đã có sẵn
- Task 12: Hiển thị referrer trong OrderTable UI

Cần test coverage cho các chức năng này.

## Yêu cầu

### 1. Unit Tests Backend
Cần test các functions:

**A. `ensureUserProfile` (src/actions/ensureUserProfile.ts)**
- ✅ Khi cookie `ref` có mã hợp lệ → set đúng `referred_by_user_id`
- ✅ Khi cookie `ref` có mã không hợp lệ → fallback về DEFAULT_REFERRER_ID
- ✅ Khi không có cookie `ref` → fallback về DEFAULT_REFERRER_ID
- ✅ Khi user đã tồn tại → không tạo lại profile
- ✅ Logging đúng cho mỗi trường hợp

**B. `fetchAdminOrders` (src/actions/adminOrders.ts)**
- ✅ Fetch đúng referrer data (email + referral_code)
- ✅ Map đúng referrer vào orders
- ✅ Handle orders không có referrer (referrer = null)

### 2. Unit Tests Frontend
**A. OrderTable Component (src/components/admin/OrderTable.tsx)**
- ✅ Render column "Người Giới Thiệu"
- ✅ Hiển thị referral_code và email khi có referrer
- ✅ Hiển thị "Không có" khi không có referrer
- ✅ colSpan = 9 trong expanded rows

**B. Register Page (src/app/(marketing)/register/page.tsx)**
- ✅ Validation: không cho gửi OTP nếu ref code rỗng
- ✅ Cookie được set với expires = 90 days
- ✅ Fallback về DEFAULT_REF nếu ref code rỗng

### 3. Integration/E2E Test Manual trên UI
Sau khi unit tests pass, test manual flow:
1. Đăng ký user mới với mã giới thiệu hợp lệ
2. Verify user được tạo với đúng `referred_by_user_id`
3. Tạo order với user mới
4. Verify order có `referred_by` đúng
5. Check admin UI hiển thị người giới thiệu đúng

## Files cần test

```
src/actions/ensureUserProfile.ts
src/actions/adminOrders.ts
src/components/admin/OrderTable.tsx
src/app/(marketing)/register/page.tsx
```

## Test Framework
- Backend: Jest hoặc Vitest
- Frontend: React Testing Library
- Mocking: Mock Supabase client, cookies

## Acceptance Criteria
- [ ] Tất cả unit tests pass
- [ ] Coverage ≥ 80% cho các files được test
- [ ] Manual UI test flow thành công
- [ ] Không có regression bugs

## Notes
- Nếu có tests cũ bị break do thay đổi schema/logic, sửa lại cho pass
- Focus vào happy path và edge cases (invalid ref code, missing ref code)
