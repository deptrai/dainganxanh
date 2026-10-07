## Deferred from: code review of 13-6-lot-scoped-admin-roles (2026-09-07)

- DF1 — Layout allows lot-scoped users into all `/crm/admin/*` pages [src/app/crm/admin/layout.tsx] — Per-AC #3 this is intended; per-page actions still enforce permissions. Page-level gating is future work.
- DF2 — No RLS integration tests — Testing RLS cross-lot denial requires Supabase test harness.
- DF3 — No explicit regression test for existing admin without `admin_user_lots` — Backward compatibility implicitly covered by `lots.test.ts` but not an explicit test case.

# Deferred Work

## Deferred from: code review of story-10.1 (2026-03-28)

- Hardcoded referral code `DNG895075` in checkout/page.tsx:81 — pre-existing pattern, should be moved to config/env
- No DB indexes on identity columns (dob, id_number, etc.) in orders table — not critical for MVP, these columns aren't queried directly
- No uniqueness constraint on `id_number` column — business decision needed: same person may place multiple orders

## Deferred from: code review of story-10.2 (2026-03-29)

- Placeholder PNGs (signature.png, stamp.png) — must replace with real scanned images before production deploy
- No rate limiting on POST /api/contracts/generate — infrastructure concern, consider adding rate limit middleware
- Year boundary race in `formatContractNumber` — `new Date().getFullYear()` could return wrong year at midnight Dec 31; low impact

## Deferred from: code review of story-10.3 (2026-03-29)

- Base64 stack overflow trong send-email EF khi PDF > 100KB — `String.fromCharCode(...new Uint8Array(buf))` vượt stack limit V8. Fix: dùng chunked loop hoặc `encodeBase64` từ Deno std
- XSS qua userName trong send-email HTML — `.replace(/{{user_name}}/g, payload.userName)` không escape HTML. Fix: HTML-encode user-supplied values
- btoa/fromCharCode locale issue — binary PDF bytes 128-255 có thể bị corrupt. Fix: dùng `encodeBase64` từ `deno.land/std/encoding/base64.ts`

## Deferred from: code review of 5-7-order-refund-completed (2026-04-20)

- Admin cancelling a `verified`/`paid`/`assigned` order silently 404s — AC2 scope was only `completed`; follow-up story should extend admin cancel to other non-terminal statuses.
- Analytics revenue + carbon under-report after refund; 5-min cache hides the drift (`src/actions/analytics.ts:144-170`).
- "Gán lô cây" + "Hoàn tiền" buttons coexist on completed rows; `assignOrderToLot` has no status re-check at UPDATE time → concurrent admin actions can double-assign trees then refund.
- No CSRF / rate-limit on admin money-relevant POST routes (`src/app/api/orders/cancel/route.ts`); platform-level fix needed.
- `Order.status` TypeScript union missing `failed` / `manual_payment_claimed` values that the DB CHECK already admits — renders `undefined` badges silently.
- `admin_audit_log.admin_id` FK points to `public.users`; admins present only in `auth.users` cause insert to fail (silently swallowed by route's try/catch).
- Referral commission clawback policy when a completed order is refunded — `getAvailableBalance` filters by `status='completed'`; refunded orders disappear from commission base. If referrer already withdrew, balance can go negative. Needs policy decision (full vs partial clawback, deduct vs notify, freeze payouts during dispute window).

## Deferred from: code review of 11-6-view-my-bookings-crm.md (2026-09-07)

- [x] Replace `as unknown as { name: string }` Supabase join type assertions with generated types (prevalent in eco-tourism modules). — **DONE 2026-10-07 (TD-06):** `src/types/database.types.ts` generated từ `supabase gen types --linked`; 0 cast `as unknown as` còn lại trong production code.
- [ ] Verify `nights_count` population in `room_bookings` — `create` route computes `diffDays` but does not insert `nights_count`; confirm generated column/trigger.
- [ ] Revisit rate limit for `GET /api/bookings/my` (100 req/min) after production usage.


## Deferred from: code review of story-11.7 (2026-09-08)

- [x] [Review][Defer] Date filters use `check_in_date` only — a stay that overlaps the range but starts before `dateFrom` is excluded. Document current behavior or switch to overlap logic (`check_in_date <= dateTo AND check_out_date >= dateFrom`). — **DONE 2026-10-07 (TD-09):** overlap logic đã áp dụng trong `src/actions/adminBookings.ts`, kèm test cả 3 trường hợp (both / only dateFrom / only dateTo).

## Deferred from: Epic 11 Retrospective — tech debt cleanup (2026-10-07)

Đã fix trong đợt dọn debt sau retro (chi tiết: `epic-11-retro-2026-10-07.md`):

- [x] **TD-02** Region filter sync URL `?region=` (SSR pre-select + `router.replace` scroll:false).
- [x] **TD-03** VietQR polling: pause khi tab ẩn, resume + poll ngay khi tab visible; giữ polling thay Realtime vì PII của guest.
- [x] **TD-04** Rate-limit trang voucher công khai: 20 req/phút/IP qua `rateLimitByKey` (refactor từ `rate-limit.ts`), UI lỗi riêng không `notFound()`.
- [x] **TD-06** Generated Supabase types (`src/types/database.types.ts`), gỡ sạch `as unknown as` trong production code.
- [x] **TD-07** Hotline/email hỗ trợ gom về `SUPPORT_HOTLINE`/`SUPPORT_EMAIL` trong `src/lib/constants.ts`.
- [x] **TD-08** Audit service-role client trên 6 trang CRM user-facing: tất cả scoped đúng `effectiveUserId`. **Fix thêm IDOR:** `getAvailableBalance`/`getSavedBankInfo` trong `src/actions/withdrawals.ts` thiếu auth check → thêm `assertOwnsUserId` (hỗ trợ impersonation).
- [x] **TD-09** Admin date filter chuyển sang overlap logic.
- [x] **TD-10 (phần lớn)** Đã giải quyết bởi story 13-6 (RLS theo lot + layout gating + `getAssignedLotIds`).

Còn tồn lại (chưa fix):

- [ ] **TD-01** (Trung bình) Bỏ qua `room_pricing_rules` — giá "Giá từ" chỉ là `MIN(price_per_night)`, chưa có giá mùa vụ/cuối tuần. Cần khi Epic 12 định giá sản phẩm tương tự.
- [ ] **TD-05** (Thấp) Tự động hủy đơn pending quá hạn phụ thuộc cron 15 phút (`POST /api/cron/expire-pending`) — chấp nhận cho MVP; Epic 12 cần kiểm chứng cơ chế release inventory của 13.3.
- [ ] **TD-10 (gap nhỏ)** `resort_manager` xem được chi tiết mọi booking theo ID ở `src/app/crm/admin/bookings/[bookingId]/page.tsx` — chưa check lot thuộc `admin_user_lots` cho role này (RLS đã chặn ở listing).
- [ ] **TD-11** (Trung bình) Calendar chỉ có view tháng; chưa có view tuần, drag & drop đổi phòng/ngày; đơn hủy vẫn chiếm chỗ hiển thị. Enhancement, không chặn Epic 12.
- [ ] Chuẩn hóa pattern scoped data access: helper `getScopedCrmClient()` (service-role + filter `effectiveUserId` tự động) để tránh quên filter tay ở route mới.
- [ ] Thống nhất 404 (`notFound()`) cho mọi trang chi tiết theo ID URL — hiện `my-garden/[orderId]` render "Truy cập bị từ chối" (HTTP 200) trong khi `my-bookings/[bookingId]` trả 404 → information leakage.
- [ ] Test `RoomCalendar.test.tsx` từng fail cứng do hardcode tháng 9/2026 — đã fix bằng ngày động theo `new Date()`; rà thêm các test date-dependent khác khi đến mốc thời gian.
