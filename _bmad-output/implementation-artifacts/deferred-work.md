# Deferred Work

## Deferred from: code review of story-10.1 (2026-03-28)

- Hardcoded referral code `DNG895075` in checkout/page.tsx:81 — pre-existing pattern, should be moved to config/env
- No DB indexes on identity columns (dob, id_number, etc.) in orders table — not critical for MVP, these columns aren't queried directly
- No uniqueness constraint on `id_number` column — business decision needed: same person may place multiple orders

## Deferred from: code review of story-10.2 (2026-03-29)

- Placeholder PNGs (signature.png, stamp.png) — must replace with real scanned images before production deploy
- No rate limiting on POST /api/contracts/generate — infrastructure concern, consider adding rate limit middleware
- Year boundary race in `formatContractNumber` — `new Date().getFullYear()` could return wrong year at midnight Dec 31; low impact
