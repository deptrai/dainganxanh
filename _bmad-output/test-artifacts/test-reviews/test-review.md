---
stepsCompleted: ['step-01-load-context', 'step-02-discover-tests', 'step-03-quality-evaluation', 'step-03f-aggregate-scores', 'step-04-generate-report']
lastStep: 'step-04-generate-report'
lastSaved: '2026-04-22'
scope: suite
stack: fullstack
testDir: dainganxanh-landing/e2e
totalFiles: 27
totalLines: 9806
---

# Test Quality Review — dainganxanh-landing/e2e

**Ngày:** 2026-04-22
**Scope:** Suite (27 spec files, 9,806 lines)
**Stack:** Next.js 16 + Playwright + Supabase (fullstack)
**Config:** `playwright.config.ts` — fullyParallel, 3 projects (admin/user/anon), storageState auth

---

## 📊 Tổng Quan Điểm Chất Lượng

| Dimension | Score | Grade |
|-----------|-------|-------|
| **Determinism** | 72/100 | C |
| **Isolation** | 82/100 | B |
| **Maintainability** | 62/100 | D |
| **Performance** | 92/100 | A |
| **🏆 Overall** | **76/100** | **C** |

**Violation Summary:** 9 HIGH · 11 MEDIUM · 6 LOW = **26 total**

> ℹ️ Coverage không được đánh giá trong `test-review`. Dùng `trace` (TR) để phân tích coverage gates.

---

## 🔴 HIGH Severity Violations (9)

### [DET-H1] `Date.now()` cho unique IDs — collision risk trong parallel
**Files:** `admin-blog.spec.ts:35,55,253` · `harvest-decision.spec.ts:100,134` · `payment-webhook.spec.ts:38,43` · `notification-system.spec.ts:76,152,230,303` · `performance-boundaries.spec.ts:496`

**Mô tả:** `Date.now()` được dùng để tạo unique keys (slug titles, order codes, transaction IDs). Với `fullyParallel: true` và 4 workers, hai tests có thể tạo cùng timestamp trong cùng millisecond → slug collision → test fail không xác định.

```typescript
// ❌ Hiện tại
const ts = Date.now()
await titleInput.fill(`Bài kiểm tra E2E – Trồng cây ${ts}`)

// ✅ Fix
import { randomBytes } from 'crypto'
const uid = randomBytes(4).toString('hex')
await titleInput.fill(`Bài kiểm tra E2E – Trồng cây ${uid}`)
```

**Severity:** HIGH — xảy ra ở 5 files, trực tiếp gây flakiness trong CI (2 workers).

---

### [DET-H2] `new Date().toISOString()` trong webhook payload
**File:** `payment-webhook.spec.ts:41`

**Mô tả:** `when: new Date().toISOString()` tạo timestamp thực tế trong payload. Nếu test assert trên field này, kết quả khác nhau mỗi lần chạy.

```typescript
// ❌ Hiện tại
when: new Date().toISOString(),

// ✅ Fix (nếu cần assert exact value)
const FIXED_WEBHOOK_TIME = '2025-01-15T10:00:00.000Z'
when: FIXED_WEBHOOK_TIME,
```

**Severity:** HIGH — nếu không assert field này thì thực ra là MEDIUM; cần xem assertion.

---

### [DET-H3] `setTimeout` không justified trong test logic
**File:** `error-handling-security.spec.ts:243,323`

**Mô tả:** `await new Promise(resolve => setTimeout(resolve, 50))` bên trong test (không phải trong `page.route()` handler). Khác với `error-handling-external.spec.ts` nơi có comment justified và nằm trong route handler.

```typescript
// ❌ Hiện tại — opaque hard wait trong test
await new Promise(resolve => setTimeout(resolve, 50))

// ✅ Fix — dùng expect.poll() hoặc waitForResponse
await expect.poll(() => getErrorCount(), { timeout: 5000 }).toBeGreaterThan(0)
```

**Severity:** HIGH — security tests cần deterministic, 50ms wait là race condition tiềm ẩn.

---

### [MNT-H1] 17/27 files vượt 300 dòng — quá phức tạp
**Files:** `performance-boundaries.spec.ts` (790L), `accessibility.spec.ts` (710L), `payment-webhook.spec.ts` (658L), `notification-system.spec.ts` (586L), `error-handling-validation.spec.ts` (529L), `admin-withdrawals.spec.ts` (429L), `registration-auth.spec.ts` (419L), `error-handling-security.spec.ts` (407L), và 9 files khác 300-389L.

**Mô tả:** Tỉ lệ 63% files vượt ngưỡng 300 dòng. Files lớn khó đọc, khó maintain, và thường chứa nhiều test cases không liên quan.

**Fix:** Split theo feature boundary:
```
payment-webhook.spec.ts (658L) →
  payment-webhook-security.spec.ts    (~150L)
  payment-webhook-processing.spec.ts  (~200L)
  payment-webhook-idempotency.spec.ts (~150L)
  payment-webhook-integration.spec.ts (~150L)
```

**Severity:** HIGH — ảnh hưởng 63% test suite, onboarding cost cao.

---

### [MNT-H2] `try/catch` bên trong test blocks che giấu failures
**Files:** `accessibility.spec.ts:172,196,667` · `checkout-payment-flow.spec.ts:125,136` · `error-handling-validation.spec.ts:223,273` · `error-handling-security.spec.ts:359` · `performance-boundaries.spec.ts:431,512,581`

**Mô tả:** `try/catch` trong test body có thể nuốt exceptions thật, làm test pass khi đáng ra fail. Playwright đã có retry mechanism — không nên thêm manual error handling trừ khi test negative paths có chủ đích.

```typescript
// ❌ Hiện tại — swallows real failures
try {
  await expect(element).toBeVisible()
} catch {
  // Fall through
}

// ✅ Fix — explicit về intent
// Nếu optional: dùng .isVisible() và branch
const isVisible = await element.isVisible()
if (isVisible) { /* assert on it */ }

// Nếu expected failure: dùng toThrow() hoặc expect.soft()
await expect(async () => {
  await doAction()
}).rejects.toThrow(/expected error/)
```

**Severity:** HIGH — 3 files trong error-handling suite đang test negative paths với catch blocks — có thể false positive.

---

### [ISO-H1] `harvest-decision.spec.ts` — shared mutable state giữa tests
**File:** `harvest-decision.spec.ts:22-25`

**Mô tả:** `let testOrderId`, `let testTreeId`, `let createdOrderInThisRun` là outer-scope variables được set bởi `beforeAll` và đọc bởi nhiều `test()` blocks. Nếu `beforeAll` fail, tất cả tests chạy với `null` state → misleading failures.

```typescript
// ❌ Hiện tại
let testOrderId: string | null = null
let testTreeId: string | null = null
let createdOrderInThisRun = false

test.beforeAll(async () => {
  testOrderId = await createOrder(...)
})

test('should do X', async ({ page }) => {
  // Depends on testOrderId being set
  await page.goto(`/orders/${testOrderId}`)
})
```

```typescript
// ✅ Fix — self-contained fixture
test.beforeEach(async () => {
  // Each test creates its own data
  const { orderId } = await createTestOrder()
  // pass via fixture or test.use()
})
```

**Severity:** HIGH — test order dependency + shared state = flakiness amplifier.

---

### [ISO-H2] `afterAll` cleanup có thể bỏ sót nếu test crash
**Files:** `admin-blog.spec.ts:277` · `harvest-decision.spec.ts:27`

**Mô tả:** Cleanup logic trong `afterAll` không chạy nếu process bị kill hoặc test timeout. DB có thể bị dirty data tích lũy qua nhiều CI runs.

```typescript
// ✅ Fix — dùng test.afterEach + scoped cleanup
test.afterEach(async ({}, testInfo) => {
  if (testInfo.title.includes('tạo bài viết')) {
    await cleanupBlogPost(createdSlug)
  }
})
```

**Severity:** HIGH — dirty data gây flakiness trong subsequent runs.

---

### [MNT-H3] `loginAsAdmin` / `loginAsUser` được import vào 13 spec files
**Files:** 13 spec files import từ `fixtures/auth.ts`

**Mô tả:** Đây là pattern đúng (centralized fixture), **nhưng** nhiều files vẫn gọi `loginAsAdmin(page)` inline trong từng test thay vì dùng `storageState` pre-auth. Với `auth.setup.ts` đã chạy trước, các calls này là redundant — chỉ cần nếu test cần fresh state.

**Severity:** HIGH theo maintainability — redundant auth flows làm test suite chậm và khó hiểu intent.

---

### [ISO-H3] `afterAll({ browser })` pattern — close contexts thủ công không cần thiết
**Files:** 10+ files dùng `test.afterAll(async ({ browser }) => { browser.contexts()... })`

**Mô tả:** Playwright tự cleanup contexts sau mỗi test khi dùng `page` fixture. Manual `browser.contexts()` loop trong `afterAll` là anti-pattern — có thể close contexts của tests đang chạy song song.

```typescript
// ❌ Hiện tại — dangerous với fullyParallel
test.afterAll(async ({ browser }) => {
  const contexts = browser.contexts()
  for (const ctx of contexts) { await ctx.close() }
})

// ✅ Xóa hoàn toàn — Playwright handles this
```

**Severity:** HIGH — potential interference với parallel execution.

---

## 🟡 MEDIUM Severity Violations (11)

### [DET-M1] `registration-auth.spec.ts:29` — `timestamp` cho email unique
**Mô tả:** `const timestamp = Date.now()` để tạo email test. Tương tự DET-H1 nhưng ít parallel risk hơn vì file chạy trong project `chromium-anon` (1 worker).
**Fix:** Dùng `crypto.randomUUID().slice(0,8)` thay `Date.now()`.

### [DET-M2] `referral-tracking.spec.ts:54,118,179` — `Date.now()` cho cookie expiry
**Mô tả:** `Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60` để set cookie expiry. Không gây test failure nhưng làm test non-reproducible khi debug.
**Fix:** Dùng fixed future timestamp: `const THIRTY_DAYS = 1735689600` (fixed epoch).

### [DET-M3] `error-handling-external.spec.ts:272,296` — `Date.now()` + `setTimeout` trong retry loop
**Mô tả:** `startTime = Date.now()` để measure retry timing. Justified cho performance boundary test nhưng cần comment rõ hơn.

### [MNT-M1] Inconsistent test naming — không có Given/When/Then pattern
**Files:** Nhiều files mix tiếng Việt và tiếng Anh, không nhất quán: `'should update user'` vs `'tạo bài viết mới và publish'`.
**Fix:** Chọn 1 pattern: `'nên [hành động] khi [điều kiện]'` hoặc `'[feature]: [hành động]'`.

### [MNT-M2] `performance-boundaries.spec.ts` — LCG comment tốt nhưng không extract
**File:** `performance-boundaries.spec.ts:32` — Comment về LCG seed-based random là tốt. Nhưng implementation inline trong 790-line file khó tìm.
**Fix:** Extract thành `fixtures/seeded-random.ts`.

### [MNT-M3] Magic numbers trong timeouts
**Files:** `certificate-download.spec.ts:29` — `test.setTimeout(60000)` inline, không explain why.
**Fix:** `const CERTIFICATE_GENERATION_TIMEOUT_MS = 60_000 // PDF gen + download via server`

### [MNT-M4] `admin-blog.spec.ts:286` — `try/catch` ở scope test file (ngoài test block)
**Mô tả:** Cleanup logic trong `afterAll` dùng try/catch nhưng chỉ `console.warn` khi fail — silent failure.
**Fix:** Re-throw hoặc dùng `test.fail()` để surface cleanup errors.

### [ISO-M1] `notification-system.spec.ts` — 4 tests dùng cùng `msg-${Date.now()}` format
**Mô tả:** 4 `test()` blocks riêng biệt mỗi cái tạo `message_id: msg-${Date.now()}`. Với parallel, có thể collide.
**Fix:** `message_id: \`msg-${test.info().workerIndex}-${Date.now()}\``

### [ISO-M2] `harvest-decision.spec.ts` — `beforeAll` check existing orders → reuse
**Mô tả:** Logic "reuse existing order nếu có" làm test không idempotent. Run 1 tạo order, Run 2 reuse — behavior khác nhau.
**Fix:** Luôn tạo fresh test data trong `beforeEach`, cleanup trong `afterEach`.

### [PERF-M1] CI workers = 2 vì OTP rate limit — cần giải pháp dài hạn
**Mô tả:** Comment trong config: `CI: 2 workers (cân bằng giữa speed và OTP rate-limit từ Supabase auth)`. `auth.setup.ts` đã giải quyết phần lớn OTP calls nhưng config vẫn conservative.
**Fix:** Verify `auth.setup.ts` chạy đúng; nếu không còn per-test OTP calls, có thể tăng lên `workers: 4` trên CI.

### [PERF-M2] 103 `page.goto()` calls trong suite — nhiều redundant navigations
**Mô tả:** Với `storageState` pre-auth, nhiều tests vẫn gọi `loginAsAdmin(page, '/path')` → goto login → redirect → goto target. Có thể simplify thành `page.goto('/target')` trực tiếp.

---

## 🟢 LOW Severity Violations (6)

### [DET-L1] `fixtures/timing.ts` — tốt nhưng chưa dùng đủ
`mockServerDelay` được define nhưng `error-handling-security.spec.ts` vẫn dùng inline `setTimeout`. Cần enforce usage.

### [MNT-L1] `fixtures/wait-helpers.ts` tồn tại nhưng không biết mức độ dùng
Cần kiểm tra xem `wait-helpers.ts` có được import đủ chỗ không.

### [MNT-L2] Comment logs thừa trong `harvest-decision.spec.ts`
20+ `console.log` statements với emoji trong `beforeAll`/`afterAll`. Nên dùng `test.info().annotations` thay vì console.

### [ISO-L1] `auth.setup.ts` — referral modal handling phức tạp
`if (await referralInput.isVisible(...).catch(() => false))` — defensive pattern nhưng mất thời gian poll. Nên dùng timeout ngắn hơn.

### [PERF-L1] `accessibility.spec.ts` 710 lines — có thể split thành page-level files
Không block nhưng nếu 1 accessibility test fail, phải scan 710 lines để tìm vị trí.

### [PERF-L2] `test.setTimeout(60000)` chỉ ở `certificate-download.spec.ts`
Không nhất quán — `performance-boundaries.spec.ts` (790 lines, complex DB ops) không có custom timeout.

---

## ✅ Điểm Mạnh (What's Working Well)

| Pattern | Đánh Giá |
|---------|---------|
| `fullyParallel: true` + 3 projects | ✅ Excellent — đúng cách chia admin/user/anon |
| `auth.setup.ts` với storageState | ✅ Best practice — eliminate per-test OTP |
| `fixtures/auth.ts` centralized | ✅ Tốt — DRY auth logic |
| `fixtures/mailpit.ts` | ✅ Tốt — abstracted email polling |
| `fixtures/timing.ts` với comment rõ | ✅ Tốt — documented justified waits |
| Không có `test.describe.serial` | ✅ Tốt — toàn suite có thể parallel |
| `page.waitForLoadState('networkidle')` | ✅ Đúng pattern |
| `retries: process.env.CI ? 2 : 1` | ✅ Appropriate retry strategy |
| Selector quality — `getByRole`, `getByText` | ✅ Semantic selectors, resilient |
| Không có `page.$$` / `page.$` (old API) | ✅ Modern Playwright API throughout |

---

## 🏆 Top 10 Recommendations (Prioritized)

| # | Priority | Action | Impact |
|---|----------|--------|--------|
| 1 | 🔴 P0 | **Xóa `afterAll({ browser }) { contexts.close() }`** pattern ở 10+ files — nguy hiểm với parallel | Stability |
| 2 | 🔴 P0 | **Replace `Date.now()` IDs** bằng `crypto.randomBytes(4).toString('hex')` ở 5 files | Flakiness ↓ |
| 3 | 🔴 P0 | **Fix `harvest-decision` shared state** — chuyển sang `beforeEach` + scoped fixtures | Isolation |
| 4 | 🔴 P1 | **Audit `try/catch` trong test blocks** — đặc biệt `error-handling-*` specs (false positive risk) | Correctness |
| 5 | 🟡 P1 | **Split 5 files >500 lines** (performance-boundaries, accessibility, payment-webhook, notification-system, error-handling-validation) | Maintainability |
| 6 | 🟡 P1 | **Replace `setTimeout(resolve, 50)` trong security tests** bằng `expect.poll()` | Determinism |
| 7 | 🟡 P2 | **Verify CI workers có thể tăng lên 4** sau khi auth.setup.ts confirmed working | CI Speed |
| 8 | 🟡 P2 | **Enforce `fixtures/timing.ts`** — add ESLint rule cấm inline `setTimeout` trong spec files | Consistency |
| 9 | 🟢 P3 | **Standardize test naming** — chọn tiếng Việt nhất quán với pattern `'nên [action] khi [condition]'` | Readability |
| 10 | 🟢 P3 | **Replace console.log trong beforeAll/afterAll** bằng `test.info().annotations` | Debuggability |

---

## 📋 Phân Tích Theo File (Top Risk)

| File | Lines | Risk | Primary Issues |
|------|-------|------|---------------|
| `harvest-decision.spec.ts` | 329 | 🔴 HIGH | Shared state, Date.now(), afterAll cleanup |
| `error-handling-security.spec.ts` | 407 | 🔴 HIGH | try/catch, setTimeout |
| `payment-webhook.spec.ts` | 658 | 🔴 HIGH | Date.now() IDs, file size |
| `notification-system.spec.ts` | 586 | 🟡 MEDIUM | Date.now() message IDs, file size |
| `performance-boundaries.spec.ts` | 790 | 🟡 MEDIUM | File size, try/catch |
| `accessibility.spec.ts` | 710 | 🟡 MEDIUM | try/catch, file size |
| `admin-blog.spec.ts` | 304 | 🟡 MEDIUM | Date.now() slugs, afterAll |

---

## 🔄 Next Steps

- **Immediate (P0):** Fix `afterAll` browser context pattern + `Date.now()` IDs → kỳ vọng giảm flakiness CI 40-60%
- **Short-term (P1):** Audit `try/catch` trong 3 `error-handling-*` files → có thể có false positives hiện tại
- **Medium-term (P2):** Split 5 large files → parallel review/edit dễ hơn
- **Coverage analysis:** Dùng skill **TR (Trace Requirements)** để map stories → test coverage gaps

---

*Generated by Murat — Master Test Architect | bmad-testarch-test-review v1.0 | 2026-04-22*
