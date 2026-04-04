# Test Automation Summary — Flow 1: First-time Buyer Journey

**Generated:** 2026-04-04
**Framework:** Playwright
**Flow:** `docs/userflow.md` Flow 1
**Routes:** `/` → `/pricing` → `/quantity` → `/register` → `/checkout` → `/checkout/waiting` → `/checkout/success`

## Generated Tests

### New E2E Test Files (3 files, 35 tests)

- [x] `e2e/specs/epic1-onboarding-payment/landing-page.spec.ts` — 10 tests
  - Hero section headline & CTA
  - Navbar brand & links
  - About section content
  - Product benefits (4 cards)
  - How-it-works (4 steps)
  - FAQ section
  - CTA → `/pricing` navigation
  - Navbar CTA → `/pricing` navigation
  - Footer display
  - No console errors

- [x] `e2e/specs/epic1-onboarding-payment/pricing-quantity-flow.spec.ts` — 15 tests
  - **Pricing Page (6 tests):**
    - Package display (260.000 VND/tree)
    - Cost breakdown (40k + 194k + 26k)
    - 4 features list
    - Trust indicators (5 years, 100%, 20kg)
    - CTA → `/quantity` navigation
    - No console errors
  - **Quantity Page (9 tests):**
    - Heading & quantity selector
    - Quick select buttons (5/10/50/100)
    - Price summary dynamic updates
    - Custom quantity input
    - Back link → `/pricing`
    - Continue → `/register` or `/checkout`
    - Benefits (3 trust cards)
    - Security badge

- [x] `e2e/specs/epic1-onboarding-payment/waiting-success-page.spec.ts` — 7 tests
  - **Waiting Page (5 tests):**
    - Order info + 3-step progress + polling indicator
    - Identity form or saved confirmation
    - Reassurance message
    - Missing orderCode error state
    - "Mua them cay" → `/quantity` navigation
  - **Success Page (2 tests):**
    - Order summary + CO2 impact + navigation buttons
    - "Mua them" → `/quantity` navigation

- [x] `e2e/specs/epic1-onboarding-payment/full-buyer-journey.spec.ts` — 2 tests
  - Complete journey: `/` → `/pricing` → `/quantity(5)` → `/register` → `/checkout`
  - Manual payment claim flow: register → checkout → claim → waiting

### Pre-existing Tests (5 files, 29 tests)

- [x] `registration-auth.spec.ts` — 8 tests (1 failing pre-existing)
- [x] `checkout-payment-flow.spec.ts` — 5 tests (2 skipped)
- [x] `identity-form.spec.ts` — 6 tests (5 failing pre-existing)
- [x] `cancel-and-claim.spec.ts` — 4 tests
- [x] `payment-webhook.spec.ts` — tests

## Coverage

| Page/Feature | Route | Tests | Status |
|-------------|-------|-------|--------|
| Landing Page | `/` | 10 | **NEW** |
| Pricing Page | `/pricing` | 6 | **NEW** |
| Quantity Page | `/quantity` | 9 | **NEW** |
| Registration | `/register` | 8 | Existing |
| Checkout/Payment | `/checkout` | 5 | Existing |
| Identity Form | `/checkout` | 6 | Existing (5 failing) |
| Cancel & Claim | `/checkout` | 4 | Existing |
| Waiting Page | `/checkout/waiting` | 5 | **NEW** |
| Success Page | `/checkout/success` | 2 | **NEW** |
| Full Journey | All routes | 2 | **NEW** |
| **Total** | | **57** (+ setup) | |

## Test Results

```
56 passed
6 failed (all pre-existing tests, not new)
2 skipped (known issues)
Duration: ~10.5 minutes
```

### Pre-existing Failures (not from new tests)
- `identity-form.spec.ts` (5 tests) — Timing issues with identity form after OTP flow
- `registration-auth.spec.ts` (1 test) — Login redirect not triggering in test env

## Gaps Filled

| Gap | Before | After |
|-----|--------|-------|
| Landing page content | No tests | 10 tests |
| Pricing page | No tests | 6 tests |
| Quantity quick-select | No tests | 9 tests |
| Waiting screen | No tests | 5 tests |
| Success page | No tests | 2 tests |
| Full E2E journey | No tests | 2 tests |

## Next Steps

- Fix pre-existing identity-form.spec.ts failures (timing/navigation issues)
- Fix pre-existing registration login redirect test
- Add tests for Flow 2 (Payment Processing webhook)
- Run tests in CI pipeline
