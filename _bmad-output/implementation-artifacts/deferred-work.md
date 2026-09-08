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

- [ ] Replace `as unknown as { name: string }` Supabase join type assertions with generated types (prevalent in eco-tourism modules).
- [ ] Verify `nights_count` population in `room_bookings` — `create` route computes `diffDays` but does not insert `nights_count`; confirm generated column/trigger.
- [ ] Revisit rate limit for `GET /api/bookings/my` (100 req/min) after production usage.


## Deferred from: code review of story-11.7 (2026-09-08)

- [ ] [Review][Defer] Date filters use `check_in_date` only — a stay that overlaps the range but starts before `dateFrom` is excluded. Document current behavior or switch to overlap logic (`check_in_date <= dateTo AND check_out_date >= dateFrom`).
