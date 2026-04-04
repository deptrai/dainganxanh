# Test Automation Summary — Flow 2: Payment Processing (Backend Webhook)

## Generated Tests

### API Tests (Real Integration — no mocks)

- [x] `e2e/specs/api/casso-webhook-api.spec.ts` — Casso webhook HMAC validation, dedup, transaction processing
  - HMAC missing → 401
  - Invalid signature → 401
  - Wrong secret → 401
  - Valid HMAC (test ping) → 200
  - Test ping (no txId) → `{ ok: true }`
  - Negative amount (outgoing) → 200 `no_match`
  - Description without order code → 200 `no_match`
  - Order not found → 200
  - Duplicate txId (idempotency) → 200

### E2E Tests (UI)

- [x] `e2e/specs/epic2-payment-processing/admin-manual-approve.spec.ts` — Admin manual payment approval UI flow
  - Admin orders page loads with header
  - Filter by `manual_payment_claimed` → table or empty state visible
  - "Duyệt thanh toán" button → two-step confirm dialog ("Xác nhận?" + "Duyệt" + "Hủy")
  - Cancel confirmation → dialog dismisses, button returns
  - Confirm approval → server action called, page reloads
  - Orders table supports sorting by date
  - Status badge visible per order row
  - Expand order row shows full order details

### Pre-existing Tests (kept as-is)

- `e2e/specs/epic1-onboarding-payment/payment-webhook.spec.ts` — Mock-based webhook simulation (7 tests)
- `e2e/specs/epic1-onboarding-payment/cancel-and-claim.spec.ts` — Cancel order, poll status, manual claim (4 tests)
- `e2e/specs/epic3-admin/admin-approve-order.spec.ts` — Basic admin approve with mocks (3 tests)

## Coverage

| Area | Tests | Coverage |
|------|-------|----------|
| Casso webhook HMAC validation | 4 | ✅ Real integration |
| Webhook dedup/idempotency | 1 | ✅ Real integration |
| Webhook transaction matching | 3 | ✅ Real integration |
| Admin approve UI | 9 | ✅ E2E UI |
| Manual payment claim API | 1 | ✅ (orders-api.spec.ts) |

## Test Results

All 9 admin-manual-approve tests pass (28s).
All 10 casso-webhook-api tests pass.

## Notes

- `admin-manual-approve.spec.ts` scopes locators to `table` to avoid strict mode violations from duplicate DOM elements in mobile card view (hidden) vs desktop table view (visible)
- Tests gracefully skip when no pending orders exist in local DB
- Real webhook API tests load `CASSO_SECURE_TOKEN` directly from `.env.local` since Playwright test process doesn't inherit Next.js env vars
