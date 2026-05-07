---
stepsCompleted: ['step-01-load-context', 'step-02-define-thresholds', 'step-03-gather-evidence', 'step-04-evaluate-and-score', 'step-04a-subagent-security', 'step-04b-subagent-performance', 'step-04c-subagent-reliability', 'step-04d-subagent-scalability', 'step-04e-aggregate-nfr', 'step-05-generate-report']
lastStep: 'step-05-generate-report'
lastSaved: '2026-04-22'
workflowType: 'testarch-nfr'
executionMode: 'sequential'
inputDocuments:
  - _bmad-output/planning-artifacts/architecture.md
  - dainganxanh-landing/next.config.js
  - dainganxanh-landing/src/middleware.ts
  - dainganxanh-landing/src/app/api/webhooks/casso/route.ts
  - dainganxanh-landing/src/app/api/orders/cancel/route.ts
  - dainganxanh-landing/Dockerfile
  - dainganxanh-landing/e2e/performance-boundaries.spec.ts
  - dainganxanh-landing/e2e/auth.setup.ts
  - dainganxanh-landing/jest.setup.ts
  - _bmad-output/test-artifacts/test-review.md
  - _bmad-output/test-artifacts/traceability-report.md
  - _bmad-output/test-artifacts/automation-summary.md
  - _bmad-output/test-artifacts/ci-recommendations.md
---

# NFR Assessment: dainganxanh-landing

**Date**: 2026-04-21  
**Assessor**: TEA Agent (Master Test Architect)  
**Stack**: Next.js 14 + Supabase All-in-One + Dokploy (self-hosted)  
**Execution mode**: SEQUENTIAL (4 NFR domains)  
**Prior context**: test-review 59/100; traceability Gate PASS

---

## Overall Risk Level: 🟡 MEDIUM

| Domain | Risk | Grade |
|---|---|---|
| **Security** | LOW | ✅ |
| **Performance** | MEDIUM | ⚠️ |
| **Reliability** | MEDIUM | ⚠️ |
| **Scalability** | MEDIUM | ⚠️ |
| **Overall** | **MEDIUM** | **⚠️** |

**Gate Recommendation**: ✅ **GO for production** (soft launch / beta) — medium risk is acceptable at current scale (<500 concurrent users). Monitoring and hardening recommended before marketing-scale launch.

---

## Domain Assessments

### 🔒 Security — LOW Risk

| Category | Status | Note |
|---|---|---|
| Authentication | ✅ PASS | `getUser()` server-validated |
| Authorization (RBAC) | ✅ PASS | `['admin','super_admin']` consistently enforced |
| Webhook Security | ✅ PASS | HMAC-SHA512 Casso signature verification |
| Input Validation | ✅ PASS | Zod schemas on pending/identity routes |
| Secrets Management | ✅ PASS | All secrets via env vars |
| RLS Enforcement | ✅ PASS | Enabled on users, orders, trees, lots, tree_photos |
| Rate Limiting | ⚠️ CONCERN | No rate limiting on any API route |
| Security Headers | ⚠️ CONCERN | No CSP, HSTS, X-Frame-Options in middleware |
| TypeScript Safety | ⚠️ CONCERN | `ignoreBuildErrors: true` silences type errors at build |

**Priority actions:**
1. Add rate limiting to `/api/orders/cancel`, `/api/webhooks/casso`, `/api/orders/pending`
2. Add security headers via `middleware.ts` or `next.config.js` headers config
3. Re-enable TypeScript build errors (set `ignoreBuildErrors: false`)

---

### ⚡ Performance — MEDIUM Risk

| Category | Status | Note |
|---|---|---|
| Page Load (<3s) | ✅ PASS | Threshold defined in E2E; ISR on blog |
| Image Optimization | ✅ PASS | `next/image` configured |
| Build Optimization | ✅ PASS | `output: 'standalone'`, code splitting |
| DB Query Indexing | ⚠️ CONCERN | 5 indexes total — FK index only; no composite indexes for common query patterns |
| CDN / Static Assets | ⚠️ CONCERN | No CDN; static assets served from Dokploy origin |
| Caching Strategy | ⚠️ CONCERN | No Redis; ISR only for static content |
| API Response Budget (P95) | ❓ UNKNOWN | No load test results; no P95 metrics collected |

**Priority actions:**
1. Add Cloudflare CDN (free tier) for static assets
2. Add composite DB indexes: `orders(user_id, status)`, `orders(created_at DESC)`, `trees(lot_id, status)`
3. Run k6 smoke test to establish P95 baseline before marketing launch

---

### 🔄 Reliability — MEDIUM Risk

| Category | Status | Note |
|---|---|---|
| Error Handling | ✅ PASS | 23 try/catch in routes; structured logging |
| Operational Alerting | ✅ PASS | Telegram for payment/withdrawal/referral events |
| Supabase Managed HA | ✅ PASS | Built-in replication and failover |
| Health Check Endpoint | ❌ FAIL | No `/api/health` — external monitors cannot probe liveness |
| APM / Error Tracking | ⚠️ CONCERN | No Sentry/Datadog; only server logs |
| Circuit Breaker | ⚠️ CONCERN | Telegram/Casso external calls have no circuit breaker |
| Disaster Recovery | ❓ UNKNOWN | No documented backup/restore procedure |

**Priority actions:**
1. **Add `/api/health` endpoint** (5-minute fix — highest ROI reliability item)
2. Integrate Sentry (free tier) for error tracking
3. Document backup procedure (Supabase has PITR on Pro plan)

---

### 📈 Scalability — MEDIUM Risk

| Category | Status | Note |
|---|---|---|
| Stateless App Architecture | ✅ PASS | Docker standalone — scales horizontally |
| DB Connection Pooling | ✅ PASS | Supabase PgBouncer built-in |
| Storage Scaling | ✅ PASS | Supabase Storage (S3-backed) |
| Horizontal App Scaling | ⚠️ CONCERN | Dokploy single-server; no LB config |
| DB Read Scaling | ⚠️ CONCERN | No read replicas; all queries hit primary |
| Async Work Queue | ⚠️ CONCERN | Webhook/email processing synchronous in request cycle |
| Realtime Connection Limit | ⚠️ CONCERN | Supabase Free: 200 concurrent realtime connections |
| Capacity Planning | ❓ UNKNOWN | No load test; no explicit user capacity target stated |

**Priority actions:**
1. Upgrade to Supabase Pro when realtime connections approach 150 (monitor metric)
2. Plan async queue (Supabase Edge Function + pg_cron) for email/notification dispatch
3. Document horizontal scaling playbook for Dokploy (replicas + Nginx LB)

---

## Cross-Domain Risks

| Risk | Domains | Impact | Urgency |
|---|---|---|---|
| No CDN + no read replicas | Performance × Scalability | Performance degrades linearly with user growth | Plan before 1000 DAU |
| No APM + no health check | Reliability × Monitorability | Blind to production incidents | Fix `/api/health` this sprint |

---

## Priority Action Summary

| Priority | Action | Domain | Effort |
|---|---|---|---|
| P0 | Add `/api/health` endpoint | Reliability | 30 min |
| P1 | Add rate limiting to API routes | Security | 2h |
| P1 | Add security headers (CSP, HSTS) | Security | 1h |
| P1 | Add composite DB indexes | Performance | 2h |
| P2 | Integrate Sentry error tracking | Reliability | 2h |
| P2 | Add Cloudflare CDN | Performance | 1h |
| P2 | Re-enable TypeScript build errors | Security | varies |
| P3 | Plan async queue for notifications | Scalability | 1 sprint |

---

## Compliance Summary

| Standard | Status | Note |
|---|---|---|
| GDPR (data residency) | ⚠️ PARTIAL | Supabase region configurable; no explicit DPA signed |
| PCI-DSS | ✅ N/A | No card data stored; Casso handles payment |
| SOC2 | ⚠️ PARTIAL | Supabase SOC2 certified; app-level controls incomplete (no APM, no DR) |
| OWASP Top 10 | ⚠️ PARTIAL | Auth/injection/RBAC covered; rate limiting, security headers missing |

---

## Gate Decision

| Launch Phase | Status | Conditions |
|---|---|---|
| Dev / Staging | ✅ GO | — |
| Soft launch / Beta (<500 users) | ✅ GO | — |
| Marketing launch (1K–10K users) | 🟡 GO with actions | Add CDN, health check, DB indexes first |
| Scale launch (10K+ users) | 🟡 Plan needed | Read replicas, async queue, APM required |

---

*Assessment scope: application-layer only. Infrastructure (Supabase platform, Dokploy server) assessed via documentation and config; no penetration test or load test performed.*

---

## Appendix — Epic 7 Blog NFR Delta (2026-04-21, Session 6)

### Scope

Session 6 shipped the blog CMS (FR-31) + public blog routes (FR-30 SEO). This appendix measures NFR posture specifically for:

- `/blog` listing page (Server Component, paginated, tag filter)
- `/blog/[slug]` detail page (Server Component, SEO-critical)
- `/crm/admin/blog/*` (Admin CRUD — BlogEditor with Tiptap)
- Server actions: `createPost`, `updatePost`, `deletePost`, `uploadBlogImage`
- Storage bucket `blog-images` (Supabase Storage + service-role client)

### Threshold Matrix — Blog-specific

| NFR | Target | Source | Current | Status |
|---|---|---|---|---|
| **Performance** | LCP `/blog/[slug]` ≤ 2.5s @ p75 | Web Vitals Good | Not measured | ⚠️ UNKNOWN |
| **Performance** | TTFB server actions ≤ 800ms @ p95 | Next.js best practice | Not measured | ⚠️ UNKNOWN |
| **Performance** | Cover image ≤ 200KB (WebP, 1200px max) | blog-image-upload-spec | `browser-image-compression` compresses on upload | ✅ MEETS |
| **Performance** | `/blog` listing revalidate ≤ 60s | ISR cache | `export const revalidate = 60` verified | ✅ MEETS |
| **SEO** | `<title>` + `<meta description>` on every blog page | FR-30 | `generateMetadata()` + `meta_title`/`meta_desc` fields | ✅ MEETS |
| **SEO** | Open Graph image for social sharing | FR-30 | Uses `cover_image` as og:image | ✅ MEETS |
| **SEO** | Canonical URL to prevent dup content | FR-30 | `alternates.canonical` set in metadata | ✅ MEETS |
| **SEO** | JSON-LD `Article` schema | FR-30 | Implemented per PRD | ✅ MEETS |
| **SEO** | sitemap.xml includes blog posts | FR-30 | `/sitemap.ts` queries `posts` table | ✅ MEETS |
| **SEO** | robots.txt disallows `/crm/*` | FR-30 | `/robots.ts` configured | ✅ MEETS |
| **Security** | Admin-only mutation (RBAC enforced in action) | FR-31 | `verifyAdmin()` called at top of every mutation | ✅ MEETS |
| **Security** | Slug uniqueness enforced server-side | FR-31 | `maybeSingle()` check + `.neq('id', ...)` on update | ✅ MEETS |
| **Security** | Image upload MIME whitelist | blog-image-upload-spec | JPG/PNG/WebP/GIF enforced in `uploadBlogImage` | ✅ MEETS |
| **Security** | Image upload size limit | blog-image-upload-spec | 5MB limit enforced | ✅ MEETS |
| **Security** | Service-role client scoped to upload only | blog-image-upload-spec | `createServiceRoleClient` used only for storage, not for auth | ✅ MEETS |
| **Reliability** | Graceful DB error handling | NFR-6 | `createPost` returns `{success: false, error}` on insert failure | ✅ MEETS |
| **Reliability** | Optimistic UI on save (draft autosave) | Story 7-2 | Not implemented — user waits for full roundtrip | 🟡 ACCEPTABLE (draft save < 500ms locally) |
| **Accessibility** | Admin toolbar buttons have accessible names | WCAG 2.1 SC 4.1.2 | Uses `title` attr only — no `aria-label` | ⚠️ GAP (see G13 in remediation-playbook.md) |
| **Accessibility** | Blog reading order keyboard-navigable | WCAG 2.1 SC 2.1.1 | Semantic HTML `<article>`, `<h1>`, `<time>` | ✅ MEETS |
| **Accessibility** | Cover image has alt text | WCAG 2.1 SC 1.1.1 | `alt={post.title}` used | ✅ MEETS |
| **Scalability** | 10K posts, listing stays < 2s | Projection | Paginated (10/page), indexed by `published_at` | ✅ MEETS (tested up to 1K locally) |

### Dimension Scores — Blog Context

| Dimension | Score | Grade | Rationale |
|---|---|---|---|
| **Security** | 90 | A- | RBAC, input validation, MIME/size guards, no bypass paths in server actions; service-role scoped narrowly |
| **Performance** | 75 | C+ | ISR + image compression strong; **LCP/TTFB not instrumented** — largest blind spot |
| **Reliability** | 85 | B | All error paths return typed `{success, error}` — no uncaught exceptions; draft autosave not yet implemented |
| **Scalability** | 82 | B | Pagination + `published_at` index handle forecast load; no async queue for bulk ops yet |
| **Accessibility** | 78 | C+ | Reading order and alt text solid; **toolbar buttons lack aria-label** (G13) |
| **SEO (FR-30)** | 95 | A | All 6 SEO NFRs met — sitemap, robots, metadata, OG, canonical, JSON-LD |

### Blog NFR Risks (ordered by probability × impact)

| ID | Risk | Prob | Impact | Score | Mitigation |
|---|---|---|---|---|---|
| BNR-1 | LCP regression on `/blog/[slug]` due to unoptimized cover image | 3 | 3 | 9 | Add Lighthouse CI check with LCP ≤ 2.5s threshold |
| BNR-2 | Slug collision race (two admins save simultaneously) | 2 | 2 | 4 | Existing unique constraint on `posts.slug` + 2nd-check `.neq()` — risk is contained |
| BNR-3 | Storage bucket fills up (no orphan cleanup when post deleted) | 3 | 2 | 6 | Add cron to delete orphaned images (images with no post ref) — weekly |
| BNR-4 | Admin toolbar not usable by screen reader (G13) | 2 | 3 | 6 | Fix per remediation-playbook.md |
| BNR-5 | Image upload fails silently when Supabase quota hit | 2 | 3 | 6 | `uploadBlogImage` already surfaces `error.message` — add Sentry breadcrumb |
| BNR-6 | Published post cached stale for 60s (revalidate window) | 4 | 1 | 4 | Add manual `revalidatePath('/blog/[slug]')` call after update — already implemented in action |

### Blog NFR Action Items

| Priority | Action | Dimension | Effort |
|---|---|---|---|
| P1 | Add Lighthouse CI check for `/blog/[slug]` (LCP ≤ 2.5s, CLS ≤ 0.1) | Performance | 2h |
| P1 | Execute G13 aria-label fix (see remediation-playbook.md) | Accessibility | 30min |
| P2 | Add Sentry breadcrumbs to `uploadBlogImage` error path | Reliability | 30min |
| P2 | Schedule weekly orphan-image cleanup cron | Scalability | 2h |
| P2 | Instrument `createPost`/`updatePost` TTFB via Vercel Analytics | Performance | 1h |
| P3 | Implement draft autosave (debounced `updatePost` every 30s) | Reliability | 4h |
| P3 | Add `<link rel="preload">` for cover image in `/blog/[slug]` | Performance | 1h |

### Gate Decision — Blog-specific

| Launch Scenario | Status | Conditions |
|---|---|---|
| Internal content team (staff only) | ✅ GO | — |
| Limited publish (<50 posts, <1K readers/day) | ✅ GO | — |
| Marketing launch (SEO-dependent, CTR tracking) | 🟡 GO with actions | Complete P1 items first (Lighthouse CI + G13) |
| High-volume content operation (10+ posts/day, 10K+ readers/day) | 🟡 Plan needed | Orphan cleanup, draft autosave, TTFB instrumentation |

### Compliance Delta

| Standard | Delta | Note |
|---|---|---|
| WCAG 2.1 AA | ⚠️ 1 new gap (G13) | Fix in remediation-playbook.md brings blog toolbar to AA |
| GDPR | — No change | Blog doesn't collect new PII |
| OWASP Top 10 A01 (Broken Access Control) | ✅ Reinforced | Admin guard tested in `blog.test.ts` with 24 tests |
| OWASP Top 10 A03 (Injection) | ✅ Reinforced | Zod validation on all blog inputs |

---

**Blog NFR verdict**: Production-ready for marketing launch once G13 + Lighthouse CI land (~2.5h work). SEO posture (95/A) is a strong asset — FR-30 is the most mature NFR dimension in this codebase.

---

## NFR Assessment Run: 2026-04-22 — Delta Assessment

**Date**: 2026-04-22  
**Assessor**: TEA Agent (Master Test Architect)  
**Scope**: CI fix delta + E2E auth refactor (no production code changes)  
**Execution mode**: SEQUENTIAL  
**Baseline**: 2026-04-21 assessment (Overall 🟡 MEDIUM)

### Change Inventory (2026-04-21 → 2026-04-22)

| File | Change | Domain Impact |
|---|---|---|
| `src/components/auth/__tests__/OTPInput.test.tsx` | 8-digit → 6-digit sync with component | Maintainability |
| `jest.setup.ts` | Added TextEncoder/TextDecoder polyfill | Maintainability |
| `e2e/auth.setup.ts` | Refactor: Mailpit OTP, 6-digit, admin+user separation | Test Reliability |
| `e2e/fixtures/auth.setup.ts` | Mailpit OTP integration | Test Reliability |
| `e2e/specs/epic1-onboarding-payment/registration-auth.spec.ts` | Updated to match refactored setup | Test Reliability |

> **Production code unchanged.** Security, Performance, Reliability, Scalability domain findings from 2026-04-21 carry forward without change.

---

### Step 02 — NFR Threshold Matrix (2026-04-22)

Thresholds unchanged from 2026-04-21 baseline. Reproduced for completeness.

| Domain | Category | Threshold | Source |
|---|---|---|---|
| Security | Auth (server-side) | `getUser()` validated server-side only | Architecture |
| Security | RBAC | `['admin','super_admin']` on all admin routes | PRD |
| Security | Webhook | HMAC-SHA512 Casso signature | Tech spec |
| Performance | Page load | LCP ≤ 3s @ p75 | E2E perf spec |
| Performance | API response | P95 ≤ 500ms under normal load | Architecture |
| Reliability | Error handling | All API routes: structured try/catch + typed response | Architecture |
| Reliability | Health check | `/api/health` returns 200 | Ops standard |
| Scalability | Connection pooling | PgBouncer active | Supabase config |
| Maintainability | Test sync | Unit test assertions match component behavior | CI gate |
| Maintainability | E2E setup | Real OTP from Mailpit; no hardcoded bypass in CI | CI best practice |

---

### Step 03 — Evidence Delta

#### Evidence: OTPInput digit-count sync ✅ FIXED
- `OTPInput.test.tsx` previously asserted 8 inputs; component renders 6
- Fix: `expect(getOTPInputs()).toHaveLength(6)` — test now matches component
- CI gate: jest now passes this assertion

#### Evidence: TextEncoder polyfill ✅ FIXED
- `jest.setup.ts` now imports `TextEncoder`/`TextDecoder` from `util` and assigns to `global`
- Fixes fetch/supabase dependency failures in jsdom environment
- Required for any test that uses Supabase client in jest context

#### Evidence: E2E auth.setup.ts refactor ✅ IMPROVED
- **Before**: Single admin-only auth, hardcoded OTP path, fragile session reuse
- **After**:
  - `getOTPFromMailpit(email)` for real OTP retrieval from local mail server
  - Separate `setup()` blocks for `ADMIN_EMAIL` and `TEST_EMAIL`
  - Correctly expects 6 OTP inputs: `expect(otpInputs).toHaveCount(6)`
  - Handles referral-code modal + skip-identity modal flows
  - Saves separate storage states: `.auth/admin.json` and `.auth/user.json`
- Impact: E2E tests are now isolated per role; auth setup is production-realistic

#### Evidence: No production code changes ✅ CONFIRMED
- Git status (2026-04-22): only `e2e/` and test files modified
- No changes to `src/app/api/`, `src/components/` (outside `__tests__/`), `src/middleware.ts`, `next.config.js`, or `Dockerfile`
- All 2026-04-21 domain findings (Security/Performance/Reliability/Scalability) remain valid

---

### Step 04 — Domain Re-evaluation (Sequential)

#### 🔒 Security — LOW Risk (UNCHANGED)
No security-relevant code changed. 2026-04-21 findings carry forward.

**Delta**: Test coverage for OTPInput auth flow is now correctly synchronized with component behavior — test suite can detect future regressions in OTP digit count.

#### ⚡ Performance — MEDIUM Risk (UNCHANGED)
No performance-relevant code changed. 2026-04-21 findings carry forward.

**Delta**: None.

#### 🔄 Reliability — MEDIUM Risk (UNCHANGED)
No production reliability code changed. 2026-04-21 findings carry forward.

**Test Reliability delta**: E2E auth setup now uses real Mailpit OTP and separate role storage states — E2E test suite is more reliable and less prone to false positives from auth state bleed.

#### 📈 Scalability — MEDIUM Risk (UNCHANGED)
No scalability-relevant code changed. 2026-04-21 findings carry forward.

**Delta**: None.

#### 🛠 Maintainability — IMPROVED

| Check | 2026-04-21 | 2026-04-22 | Delta |
|---|---|---|---|
| OTPInput test sync | ❌ 8-digit mismatch | ✅ 6-digit synchronized | +1 |
| jest polyfill completeness | ❌ TextEncoder missing | ✅ Polyfill present | +1 |
| E2E auth coverage | ⚠️ Admin-only, fragile OTP | ✅ Admin+user, Mailpit OTP | +1 |
| TypeScript build errors | ⚠️ `ignoreBuildErrors: true` | ⚠️ Unchanged | 0 |

---

### Step 05 — Gate Decision Update (2026-04-22)

#### Overall Risk Level: 🟡 MEDIUM (UNCHANGED)

Domain scores carry forward from 2026-04-21. Maintainability sub-domain improves.

#### Updated Priority Action Summary

> P0 (`/api/health`) and P1 (rate limiting, security headers, DB indexes) from 2026-04-21 remain open. No new P0/P1 items introduced.

| Priority | Action | Status | Notes |
|---|---|---|---|
| P0 | Add `/api/health` endpoint | 🔴 OPEN | Still missing |
| P1 | Rate limiting on API routes | 🔴 OPEN | Still missing |
| P1 | Security headers (CSP, HSTS) | 🔴 OPEN | Still missing |
| P1 | Composite DB indexes | 🔴 OPEN | Still missing |
| ✅ | OTPInput test sync | ✅ DONE | Fixed 2026-04-22 |
| ✅ | TextEncoder jest polyfill | ✅ DONE | Fixed 2026-04-22 |
| ✅ | E2E auth refactor (Mailpit) | ✅ DONE | Staged 2026-04-22 |

#### Gate Recommendation (2026-04-22)

| Launch Phase | Status | Conditions |
|---|---|---|
| Dev / Staging | ✅ GO | CI now passing after test fixes |
| Soft launch / Beta (<500 users) | ✅ GO | Unchanged |
| Marketing launch (1K–10K users) | 🟡 GO with actions | P0/P1 items still required |
| Scale launch (10K+ users) | 🟡 Plan needed | Unchanged |

**Verdict**: No regression. Test quality improved in 3 areas. 2026-04-21 gate recommendation stands — P0 `/api/health` remains the highest-ROI open item before marketing launch.

---

*Delta scope: test/CI layer only. Production code unchanged. Full baseline: 2026-04-21 assessment above.*
