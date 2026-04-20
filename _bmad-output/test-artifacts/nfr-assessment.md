---
stepsCompleted: ['step-01-load-context', 'step-02-define-thresholds', 'step-03-gather-evidence', 'step-04-evaluate-and-score', 'step-04a-subagent-security', 'step-04b-subagent-performance', 'step-04c-subagent-reliability', 'step-04d-subagent-scalability', 'step-04e-aggregate-nfr', 'step-05-generate-report']
lastStep: 'step-05-generate-report'
lastSaved: '2026-04-21'
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
  - _bmad-output/test-artifacts/test-review.md
  - _bmad-output/test-artifacts/traceability-report.md
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
