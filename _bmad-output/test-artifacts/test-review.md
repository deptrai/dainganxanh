---
stepsCompleted: ['step-01-load-context', 'step-02-discover-tests', 'step-03a-subagent-determinism', 'step-03b-subagent-isolation', 'step-03c-subagent-maintainability', 'step-03e-subagent-performance', 'step-03f-aggregate-scores', 'step-04-generate-report']
lastStep: 'step-04-generate-report'
lastSaved: '2026-04-20'
workflowType: 'testarch-test-review'
reviewScope: 'suite'
inputDocuments:
  - _bmad/tea/testarch/tea-index.csv
  - dainganxanh-landing/playwright.config.ts
  - dainganxanh-landing/jest.config.ts
priorBaseline:
  - _bmad-output/test-artifacts/test-review.md (2026-04-19, score 35/100)
---

# Test Quality Review: dainganxanh-landing (Full Suite Refresh)

**Review date**: 2026-04-20
**Reviewer**: TEA Agent (Master Test Architect)
**Scope**: suite (full-codebase refresh; baseline = 2026-04-19 @ 35/100)
**Stack detected**: fullstack (Next.js 14 + Supabase + Playwright E2E + Jest unit/component)

---

## Step 1 — Context Loaded

### Knowledge Base
Core fragments loaded: `test-quality`, `data-factories`, `test-levels-framework`, `selective-testing`, `test-healing-patterns`, `selector-resilience`, `timing-debugging`, `fixture-architecture`, `network-first`, `playwright-config`, `component-tdd`, `ci-burn-in`.

### Test Frameworks
- Playwright (E2E) — `playwright.config.ts`
- Jest + React Testing Library (unit/component) — `jest.config.ts`

### Discovered Counts
- E2E spec files: **22** (22 `*.spec.ts` in `e2e/`, excludes `.bak`)
- Jest test files: **39** (`*.test.ts` and `*.test.tsx` under `src/`)
- Total: **61 test files**

### Prior Baseline (2026-04-19)
- Score: 35/100 (F)
- Recommendation: Block
- Top P0 findings: 197 hard waits, 21 OTP duplicates, hardcoded creds, `analytics.test.ts` zero assertions, no E2E cleanup

### Delta Since Baseline
- Story 5-7 commits added: `route.ts` test rewrite (+24 admin/refund tests), typed-confirm modal in `OrderTable.tsx`, `OrderFilters` extended
- Total tests grew from 432 → 436

### Out of Scope
Coverage mapping and coverage gates → use `trace` workflow.

---

## Step 2 — Test Discovery & Parsing

### File Inventory (61 files)

**E2E (Playwright, 22 files)** — largest offenders first:

| File | Lines |
|---|---|
| `e2e/error-handling.spec.ts` | 1273 |
| `e2e/tree-detail-extended.spec.ts` | 929 |
| `e2e/performance-boundaries.spec.ts` | 896 |
| `e2e/accessibility.spec.ts` | 750 |
| `e2e/payment-webhook.spec.ts` | 720 |
| `e2e/notification-system.spec.ts` | 628 |
| 16 others | ≤497 |

**Jest (39 files)** — largest:

| File | Lines |
|---|---|
| `src/app/api/orders/cancel/__tests__/route.test.ts` | 525 |
| `src/actions/__tests__/printQueue.test.ts` | 445 |
| `src/actions/__tests__/withdrawals.test.ts` | 362 |
| `src/actions/__tests__/downloadCertificate.test.ts` | 321 |
| 35 others | ≤304 |

### Fixture Infrastructure (NEW since baseline)

- `e2e/fixtures/mailpit.ts` — OTP polling with condition-based retry (replaces 21 prior duplicates)
- `e2e/fixtures/wait-helpers.ts` — condition-based wait utilities (contains 8 `waitForTimeout` usages internally)

### Metric Deltas vs 2026-04-19 Baseline

| Metric | Baseline | Current | Δ |
|---|---|---|---|
| `waitForTimeout` instances in E2E | 197 | **8** (all inside fixture) | **−96%** ✅ |
| `getOTPFromMailpit` duplicates | 21 | **1** (shared fixture) | **−95%** ✅ |
| E2E spec files with hardcoded `phanquochoipt@gmail.com` | 10+ | **20** | ❌ worsened |
| Jest tests with `[P0]`/`[P1]` markers | 0 | **188** | **+188** ✅ |
| E2E tests with `[P0]`/`[P1]` markers | 0 | **0** | unchanged |
| `analytics.test.ts` behavioral assertions | 0 | refactored with real mocks | ✅ |
| `test.describe.serial` (non-parallelizable) | 3 | 2 (`payment-webhook`, `notification-system`) | slight ↓ |
| `afterEach`/`afterAll` cleanup files | 0 | **20** | ✅ |
| `playwright.config.ts` `workers` | `CI?1:1` | `CI?2:4` | ✅ |
| Total Jest tests (passing) | ~429 | **436** | +7 |

### Framework Config

- **Playwright**: `fullyParallel: true`, `workers: 2/4`, `retries: CI?2:1`, `trace: on-first-retry`, single chromium project, webServer with reuseExistingServer. ✅ Sane.
- **Jest**: `jest.config.ts` present, standard setup.

### Priority Marker Format Found
`[P0]`, `[P1]` prefixes in `test()` / `describe()` names — e.g. `describe('[P0] POST /api/orders/cancel — auth guard', ...)`. Consistent across Jest; absent in E2E.

### Evidence Collection
CLI/MCP evidence collection skipped (no new flow to capture; suite review uses file-based analysis only).

---

## Step 3 — Quality Evaluation (Parallel, 4 Dimensions)

### Overall

**Score: 59/100 (F — Critical Issues)**
**Recommendation: ⚠️ Approve with Required Fixes** — close to D threshold; does NOT block story 5-7 shipment but still needs focused work to cross 70.

Weighted calculation: `(38 × 0.30) + (68 × 0.30) + (62 × 0.25) + (78 × 0.15) = 59.3 → 59`

### Dimension Scores

| Dimension | Score | Grade | Trend vs 2026-04-19 |
|---|---|---|---|
| **Determinism** | 38 | D | ≈ stable (30 → 38, +8) |
| **Isolation** | 68 | C | ↑ (38 → 68, +30) |
| **Maintainability** | 62 | C | ↑ (30 → 62, +32) |
| **Performance** | 78 | B | ↑ (45 → 78, +33) |
| **Overall** | **59** | **F** | ↑ (35 → 59, **+24**) |

### Violations Summary

- **HIGH**: 21
- **MEDIUM**: 23
- **LOW**: 17

---

## Step 4 — Review Report

### Executive Summary

**Assessment**: Needs Improvement (Critical, but on the right trajectory)

**Verdict**: ⚠️ **Approve with required fixes** — the suite has made a massive leap since 2026-04-19 (35 → 59). The infrastructure changes (`e2e/fixtures/`, condition-based waits, `afterEach` in 20 files, workers raised to 2/4, `analytics.test.ts` fully rewritten with real mocks, 188 priority markers in Jest) are exactly the right direction. What's keeping the score below D is **Determinism (38)** — driven by 6 hand-rolled `setTimeout` retries in `error-handling.spec.ts`, 22 unguarded `new Date()` in Jest fixtures, and pervasive `if / try` branching to navigate skip-modals across all admin-*.spec.ts.

### Điểm Mạnh (vs baseline)

✅ **`e2e/fixtures/` established** — `mailpit.ts` + `wait-helpers.ts` imported by 21/22 E2E specs (was 0)
✅ **`waitForTimeout` in test code: 0** (was 197) — all 8 remaining usages are inside `wait-helpers.ts` with documented purpose
✅ **`getOTPFromMailpit` duplicates: 1** (was 21)
✅ **`playwright.config.ts`**: `fullyParallel: true`, `workers: CI?2:4`, `retries: CI?2:1` — sane
✅ **Jest priority markers: 188** across 58 files (was 0)
✅ **`analytics.test.ts`** — fully rewritten with Supabase mock + auth/error/return-shape tests (was zero behavioral assertions)
✅ **Cleanup hooks in 20 files** (was 0)
✅ **Zero `.bak` files**

### Điểm Yếu

❌ **6 hand-rolled `setTimeout` retries** in `error-handling.spec.ts` (lines 651, 729, 887, 921, 1072) and `performance-boundaries.spec.ts:674` — replaces the old `waitForTimeout` pattern with something equally flaky
❌ **20 E2E files still hardcode `phanquochoipt@gmail.com`** (was 10+ in baseline — count appears to have grown as fixtures centralized tests)
❌ **22 unguarded `new Date()` / `Date.now()`** in Jest fixtures (only 2 files use `jest.useFakeTimers`)
❌ **E2E priority markers: 0** (Jest: 188 ✅) — selective/smoke subsets impossible for E2E
❌ **`loginWithOTP` helper duplicated across 11 files** — not yet extracted to fixture
❌ **`error-handling.spec.ts: 1273 lines`** + 2 more >900 lines — violates 300-line guideline 4×

---

### Quality Criteria Assessment

| Dimension | Status | HIGH | MEDIUM | LOW | Score |
|---|---|---|---|---|---|
| Determinism | ❌ FAIL | 10 | 8 | 5 | 38 |
| Isolation | ⚠️ WARN | 4 | 8 | 5 | 68 |
| Maintainability | ⚠️ WARN | 5 | 5 | 5 | 62 |
| Performance | ✅ PASS | 2 | 2 | 2 | 78 |
| **Overall** | **F (borderline D)** | **21** | **23** | **17** | **59** |

---

### Critical Issues (Must Fix) — P0/P1

#### 1. Hand-rolled `setTimeout` retries in `error-handling.spec.ts`

**Severity**: P0 (Critical)
**Location**: `e2e/error-handling.spec.ts:651, 729, 887, 921, 1072`; `e2e/performance-boundaries.spec.ts:674`
**Criterion**: Determinism / Hard Waits
**Dimension**: Determinism

**Problem**: The refactor removed `waitForTimeout` in favor of fixtures, but 6 sites now use `await new Promise(r => setTimeout(r, N))` directly — the same pattern under a different name. `error-handling.spec.ts:1072` even rolls its own exponential backoff (`Math.pow(2, attempt-1) * 1000`). These are still hardcoded sleeps and still flaky.

**Fix** (follow `network-first` + `timing-debugging` fragments):
```typescript
// ❌ Bad
await new Promise(resolve => setTimeout(resolve, 1000))

// ✅ Good — use expect.poll or waitForResponse
await expect.poll(
    async () => (await fetch('/api/status')).status,
    { timeout: 5000, intervals: [100, 200, 500] }
).toBe(200)

// ✅ Or waitForResponse for specific network event
await page.waitForResponse(resp =>
    resp.url().includes('/api/process') && resp.status() === 200
)
```

**Impact**: Removes the last 6 deterministic-flakiness sources in E2E.

---

#### 2. Conditional test flow (`if / try` branching) pervades admin-*.spec.ts

**Severity**: P0 (Critical)
**Location**: `e2e/admin-withdrawals.spec.ts:73`, `e2e/performance-boundaries.spec.ts:36`, `e2e/admin-*.spec.ts` (~30 instances per file, across all admin specs)
**Criterion**: Determinism / Conditionals in tests
**Dimension**: Determinism

**Problem**: Tests branch on runtime URL / modal presence:
```typescript
if (hasSkipButton) {
    try { await skipButton.click() } catch { /* ignore */ }
} else if (!currentUrl.includes('/admin/withdrawals')) {
    await page.goto('/admin/withdrawals')
}
```
This means the test takes different code paths on different runs — a failing modal is silently swallowed. You don't know what was actually tested.

**Fix**: Extract the skip-modal/login handling into a single `adminLogin` fixture that guarantees a known state, then remove all the branching:
```typescript
// e2e/fixtures/admin-auth.ts
export async function loginAsAdminAndLand(page: Page, targetPath: string) {
    // One canonical path — no branching in tests
    await page.goto('/login')
    await loginWithOTP(page, ADMIN_EMAIL)
    await page.goto(targetPath)
    await expect(page).toHaveURL(targetPath)
}
```

**Impact**: Deterministic flow; test failures become meaningful.

---

#### 3. Hardcoded `phanquochoipt@gmail.com` in 20 E2E specs

**Severity**: P0 (Critical)
**Location**: `e2e/error-handling.spec.ts`, `e2e/admin-casso.spec.ts`, `e2e/admin-referrals.spec.ts`, `e2e/withdrawal-flow.spec.ts`, `e2e/harvest-decision.spec.ts`, `e2e/admin-order-management.spec.ts`, `e2e/admin-withdrawals.spec.ts`, `e2e/my-garden-dashboard.spec.ts`, `e2e/admin-users.spec.ts`, `e2e/seed-withdrawal-test-data.ts`, +11 others
**Criterion**: Isolation / Security
**Dimension**: Isolation

**Problem**: A real personal email is the shared credential for 20 test files. Parallel workers (`workers: 4` locally) will collide on OTP retrieval — whichever worker pulls the latest mail wins. This is also a credential leak in the repo.

**Fix**:
```typescript
// .env.test (gitignored)
TEST_ADMIN_EMAIL=admin@test.local
TEST_USER_EMAIL_TEMPLATE=test-{workerIndex}@test.local

// e2e/fixtures/identity.ts
export const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'admin@test.local'
export function userEmailForWorker(workerIndex: number) {
    return `test-${workerIndex}-${Date.now()}@test.local`
}
```

**Impact**: Enables true parallel execution; removes credential from source tree.

---

#### 4. DB writes without cleanup — state leaks between runs

**Severity**: P0 (Critical)
**Location**: `e2e/harvest-decision.spec.ts:29` (beforeAll inserts orders + trees, no afterAll); `e2e/seed-withdrawal-test-data.ts` (standalone seed with no teardown)
**Criterion**: Isolation / Cleanup
**Dimension**: Isolation

**Fix**:
```typescript
let testOrderId: string | null = null
let testTreeId: string | null = null

test.beforeAll(async () => {
    const { data: order } = await supabase.from('orders').insert({...}).select().single()
    testOrderId = order.id
    const { data: tree } = await supabase.from('trees').insert({ order_id: order.id, ... }).select().single()
    testTreeId = tree.id
})

test.afterAll(async () => {
    if (testTreeId) await supabase.from('trees').delete().eq('id', testTreeId)
    if (testOrderId) await supabase.from('orders').delete().eq('id', testOrderId)
})
```

**Impact**: CI database stays clean across runs; unique-constraint failures disappear.

---

#### 5. 22 unguarded `new Date()` / `Date.now()` in Jest fixtures

**Severity**: P1 (High)
**Location**: `src/components/crm/__tests__/NotificationBell.test.tsx:42,52`; `TreeCard.test.tsx:33,59,69,79`; `realtime.test.ts:69,99`; `treeCode.test.ts`; `fieldChecklist.test.ts`; +5 others
**Criterion**: Determinism / Time mocking
**Dimension**: Determinism

**Fix** (follow `QuarterSelector.test.tsx` / `FarmCamera.test.tsx` — already use fake timers):
```typescript
const FIXED_NOW = new Date('2026-04-01T10:00:00Z')

beforeEach(() => {
    jest.useFakeTimers().setSystemTime(FIXED_NOW)
})
afterEach(() => {
    jest.useRealTimers()
})
```

**Impact**: Time-dependent assertions (`formatDistanceToNow`, `isOverdue`) become reproducible.

---

#### 6. E2E specs have zero priority markers

**Severity**: P1 (High)
**Location**: All 22 E2E specs (0/22)
**Criterion**: Maintainability / Selective Testing
**Dimension**: Maintainability

**Problem**: Jest has 188 `[P0]` / `[P1]` prefixes (enables `jest --testNamePattern="\[P0\]"` for smoke runs). E2E has zero, so `playwright test --grep "@P0"` cannot filter to a smoke subset.

**Fix**: Prefix top-level `describe` / `test` like the Jest suite does:
```typescript
test.describe('[P0] Checkout — happy path', () => { ... })
test('[P0] user can complete checkout with MoMo', async ({ page }) => { ... })
```

**Impact**: Enables smoke runs (P0-only), staged CI pipelines.

---

#### 7. `test.describe.serial` on `notification-system.spec.ts` and `payment-webhook.spec.ts`

**Severity**: P1 (High)
**Location**: `e2e/notification-system.spec.ts:14`, `e2e/payment-webhook.spec.ts:15`
**Criterion**: Isolation / Parallelism
**Dimension**: Isolation + Performance

**Problem**: Each suite forces serial execution across 628 / 720 lines. Webhook idempotency tests are exactly the kind of work that should run parallel with unique order codes.

**Fix**: Generate unique `orderCode` per test (factory pattern) and drop `.serial`.

**Impact**: Cuts ~2–3 min off full E2E run.

---

### Recommendations (Should Fix) — P2

#### 8. Extract `loginWithOTP` duplicated across 11 files

Move to `e2e/fixtures/auth.ts`. Mirrors the success of `mailpit.ts` fixture.

#### 9. Split `error-handling.spec.ts` (1273 lines) into smaller suites

Suggested split: `error-handling-network.spec.ts`, `error-handling-validation.spec.ts`, `error-handling-retry.spec.ts`. Same for `tree-detail-extended.spec.ts` (929 lines).

#### 10. 11 `test.skip` without tickets

Each skip should have `// skip: JIRA-XXXX reason` comment. Sweep `error-handling.spec.ts`, `performance-boundaries.spec.ts`, `checkout-payment-flow.spec.ts`.

#### 11. Move hardcoded `TEST_*_ID` constants in `tree-detail-extended.spec.ts` to a fixture

#### 12. Half of Jest suites missing `jest.clearAllMocks()` in `beforeEach`

Add `beforeEach(() => jest.clearAllMocks())` to prevent mock pollution across tests.

#### 13. `Math.random()` in `performance-boundaries.spec.ts` for seed data

Use a seeded RNG (e.g. `seedrandom`) or fixed test fixtures for reproducibility.

---

### Best Practices Found

#### 1. `e2e/fixtures/mailpit.ts` — the model extraction
Condition-based OTP polling with timeout + clear timeout error. This is the template for the remaining fixture work (loginWithOTP, seed data, admin auth).

#### 2. `src/app/api/orders/cancel/__tests__/route.test.ts` (525 lines, story 5-7)
Priority markers on every describe+test (`[P0]`, `[P1]`, `[P2]`), explicit Vietnamese+English test names, targeted mocks per test path, 24 tests covering happy/404/403/race-condition/audit-log paths.

#### 3. `src/components/crm/__tests__/QuarterSelector.test.tsx`
Uses `jest.useFakeTimers().setSystemTime(FIXED_NOW)` correctly — reference for the 22 files that still use unguarded `new Date()`.

#### 4. `src/actions/__tests__/analytics.test.ts` (post-refactor)
Proper Supabase mock (`createServerClient` mock with chainable query builder), covers auth guard + empty-dataset path + error path. Replaces the prior "zero behavioral assertions" antipattern.

#### 5. `payment-webhook.spec.ts` — network intercept via `page.route()`
Correct network-first pattern; reference for any new E2E work.

---

### Knowledge Base References

- **test-quality** — Definition of Done, flakiness threshold
- **fixture-architecture** — Pure function → Fixture → Merge composition
- **network-first** — Intercept before navigate, deterministic waits
- **data-factories** — Per-test unique data, cleanup discipline
- **timing-debugging** — `expect.poll`, `waitForResponse` patterns
- **selective-testing** — Priority markers for smoke subsets
- **ci-burn-in** — Worker strategy, shard orchestration
- **test-priorities** — P0/P1/P2/P3 criteria

---

### Decision

**Recommendation**: ⚠️ **Approve with Required Fixes** (not Block)

**Reason**: The suite has made a **massive leap** (35 → 59, +24 points in 1 day of focused refactoring). The fixture architecture, priority markers on Jest, real behavioral tests on `analytics.test.ts`, and sane `playwright.config.ts` settings are all correct. What remains is a tight list of well-scoped P0 items (6 setTimeout retries to eliminate; `if/try` branching to extract into fixtures; hardcoded email to move into `.env.test`; 2 DB-write files to add cleanup to). These are 1–2 days of focused work each, not a suite rewrite.

Don't block story 5-7 — its tests score very well (24 tests, priority markers, targeted mocks, TOCTOU + audit-log coverage). But schedule a test-quality sprint to close the P0 list before the E2E suite can be trusted as a true gate.

---

### Appendix: Dimension Detail

**Determinism (38/D)** — hand-rolled setTimeout retries (6), if/try branching in admin specs (30+ per file × 10 files), unguarded `new Date()` in Jest (22), `Math.random()` in perf spec (7).

**Isolation (68/C)** — ✅ cookie-level cleanup consistent, fullyParallel enabled, 20 files have afterEach/afterAll; ❌ 20 files share admin email, 2 `describe.serial`, 2 files create DB rows without teardown, 25 Jest suites missing `clearAllMocks`.

**Maintainability (62/C)** — ✅ fixtures used by 21/22 specs, no `.bak`, 188 Jest priority markers, descriptive names; ❌ 23 files >300 lines, 7 >500, 2 >900, `loginWithOTP` duplicated 11×, 0 E2E priority markers.

**Performance (78/B)** — ✅ fullyParallel, workers 2/4, reuseExistingServer, 0ms hard waits in source, no `test.only`; ⚠️ 11 `test.skip` without tickets, 2 `describe.serial` reduce parallelism.

---

### Review Metadata

- **Generated By**: BMad TEA Agent (Master Test Architect)
- **Workflow**: `bmad-testarch-test-review` (subagent mode)
- **Review Date**: 2026-04-20
- **Baseline**: 2026-04-19 review (35/100 F)
- **Delta**: +24 points in 1 day (story 5-7 + P0 patches from code review)
- **Execution Mode**: Parallel (4 dimensions via subagents)
- **Subagent artifacts**:
  - `/tmp/tea-test-review-determinism-20260420T151338.json`
  - `/tmp/tea-test-review-isolation-20260420T151338.json`
  - `/tmp/tea-test-review-maintainability-20260420T151338.json`
  - `/tmp/tea-test-review-performance-20260420T151338.json`
  - `/tmp/tea-test-review-summary-20260420T151338.json`
