---
stepsCompleted: ["step-01-document-discovery", "step-02-prd-analysis", "step-03-epic-coverage-validation", "step-04-ux-alignment", "step-05-epic-quality-review", "step-06-final-assessment"]
date: 2026-09-05
project: dainganxanh
---

# Implementation Readiness Report

## Document Discovery

### Files Found

| Document | Path | Status |
|----------|------|--------|
| PRD | docs/prd.md | ✅ Merged tree + eco-tourism + store (2020 lines) |
| Architecture | _bmad-output/planning-artifacts/architecture.md | ⚠️ Outdated (tree platform only) |
| Epics | _bmad-output/planning-artifacts/epics.md | ✅ Epic 1-13, merged |
| UX Design | _bmad-output/planning-artifacts/ux-design-specification.md | ⚠️ Tree platform only |
| Sprint Status | _bmad-output/implementation-artifacts/sprint-status.yaml | ✅ Updated with Epic 11-13 |

### Issues

1. Architecture document does not reflect Eco-Tourism/Store schema
2. UX Design does not contain wireframes for Eco-Stay/Store
3. `epics-eco-tourism.md` merged into `epics.md`

---

## PRD Analysis

### Functional Requirements (Eco-Tourism + Store + Shared)

#### Eco-Stay (F-ES)
- F-ES-01: Garden landing page with region filter (P0)
- F-ES-02: Garden detail with room list (P0)
- F-ES-03: Date-based availability check (P0)
- F-ES-04: Guest booking form (P0)
- F-ES-05: 15-minute VietQR payment (P0)
- F-ES-06: Casso webhook confirm (P0)
- F-ES-07: Booking success & offline voucher (P0)
- F-ES-08: CRM my-bookings list/detail (P1)
- F-ES-09: Admin booking management (P1)
- F-ES-10: Calendar-based room admin (P2)

#### Trầm Hương Store (F-ST)
- F-ST-01: Product catalog page (P0)
- F-ST-02: Product detail page (P0)
- F-ST-03: Direct buy-now checkout (P0)
- F-ST-04: Banking & COD payment (P0)
- F-ST-05: Casso webhook confirm (P0)
- F-ST-06: Store order success (P0)
- F-ST-07: CRM my-store-orders (P1)
- F-ST-08: Admin product CRUD (P1)
- F-ST-09: Admin store order management (P1)
- F-ST-10: Multi-item persistent cart (P2)

#### Shared Infrastructure (F-SH)
- F-SH-01: Polymorphic Casso webhook dispatcher (P0)
- F-SH-02: Secure order creation APIs (P0)
- F-SH-03: Server-side price/total calculation (P0)
- F-SH-04: Inventory reservation & release (P0)
- F-SH-05: Three transactional email templates (P1)
- F-SH-06: Lot-scoped admin roles (P2)

**Total new FRs: 26**

### Non-Functional Requirements

- NFR-01: Page load time (public pages) < 3 seconds on 3G
- NFR-02: Payment confirmation end-to-end < 5 minutes via Casso
- NFR-03: Overbooking & overselling = 0 incidents
- NFR-04: Customer PII exposure = 0 unauthorized leaks
- NFR-05: Uptime = 99.5%
- NFR-06: Mobile-first responsive = all public pages
- NFR-07: WCAG 2.1 AA = public pages

---

## Epic Coverage Validation

### Coverage Matrix (new FRs)

| FR | Description | Epic | Story | Status |
|----|-------------|------|-------|--------|
| F-ES-01 | Garden landing page with region filter | Epic 11 | 11.1 | ✅ Covered |
| F-ES-02 | Garden detail with room list | Epic 11 | 11.2 | ✅ Covered |
| F-ES-03 | Date-based availability check | Epic 11 | 11.2 | ✅ Covered |
| F-ES-04 | Guest booking form | Epic 11 | 11.3 | ✅ Covered |
| F-ES-05 | 15-minute VietQR payment | Epic 11 | 11.3 | ✅ Covered |
| F-ES-06 | Casso webhook confirm | Epic 11 | 11.3 | ✅ Covered |
| F-ES-07 | Booking success & offline voucher | Epic 11 | 11.3 | ✅ Covered |
| F-ES-08 | CRM my-bookings list/detail | Epic 11 | 11.5 | ✅ Covered |
| F-ES-09 | Admin booking management | Epic 11 | 11.6 | ✅ Covered |
| F-ES-10 | Calendar-based room admin | Epic 11 | 11.7 | ✅ Covered |
| F-ST-01 | Product catalog page | Epic 12 | 12.1 | ✅ Covered |
| F-ST-02 | Product detail page | Epic 12 | 12.2 | ✅ Covered |
| F-ST-03 | Direct buy-now checkout | Epic 12 | 12.3 | ✅ Covered |
| F-ST-04 | Banking & COD payment | Epic 12 | 12.4 | ✅ Covered |
| F-ST-05 | Casso webhook confirm | Epic 12 | 12.4 | ✅ Covered |
| F-ST-06 | Store order success | Epic 12 | 12.4 | ✅ Covered |
| F-ST-07 | CRM my-store-orders | Epic 12 | 12.5 | ✅ Covered |
| F-ST-08 | Admin product CRUD | Epic 12 | 12.6 | ✅ Covered |
| F-ST-09 | Admin store order management | Epic 12 | 12.7 | ✅ Covered |
| F-ST-10 | Multi-item persistent cart | Epic 12 | 12.8 | ✅ Covered |
| F-SH-01 | Polymorphic Casso webhook dispatcher | Epic 13 | 13.1 | ✅ Covered |
| F-SH-02 | Secure order creation APIs | Epic 13 | 13.2 | ✅ Covered |
| F-SH-03 | Server-side price/total calculation | Epic 13 | 13.4 | ✅ Covered |
| F-SH-04 | Inventory reservation & release | Epic 13 | 13.3 | ✅ Covered |
| F-SH-05 | Three transactional email templates | Epic 13 | 13.5 | ✅ Covered |
| F-SH-06 | Lot-scoped admin roles | Epic 13 | 13.6 | ✅ Covered |

**Coverage: 26/26 new FRs covered (100%)**

---

## UX Alignment Assessment

### UX Document Status

- `ux-design-specification.md`: Found, but tree platform only
- `wireframes.md`: Found, but tree platform only

### Issues

- Missing wireframes/screens for Eco-Tourism pages: `/eco-tourism`, `/eco-tourism/[lotId]`, `/eco-tourism/[lotId]/book`
- Missing wireframes/screens for Store pages: `/store`, `/store/[slug]`, `/store/checkout`
- Missing admin UX for: bookings calendar, product CRUD, store order fulfillment

### Warnings

- PRD specifies specific UI/UX notes (Section 13), so UX is implied
- Development can proceed with PRD as primary reference, but UX should be created before frontend implementation of Epic 11 and 12

---

## Epic Quality Review

### Epic 11: Eco-Stay

| Check | Status | Notes |
|-------|--------|-------|
| User-value first | ✅ | Guest can browse, book, and pay |
| Standalone | ✅ | Independent from Epic 12 |
| No forward dependencies | ⚠️ | Story 11.3 needs F-SH-01 (polymorphic webhook) from Epic 13 |
| Clear acceptance criteria | ✅ | Gherkin format used |
| Traceability | ✅ | All F-ES mapped |

**Note:** Story 11.3 (payment confirmation) depends on Epic 13.1 being completed or stubbed. This is acceptable if Epic 13 is implemented first or in parallel.

### Epic 12: Trầm Hương Store

| Check | Status | Notes |
|-------|--------|-------|
| User-value first | ✅ | Customer can browse, buy, track |
| Standalone | ✅ | Independent from Epic 11 |
| No forward dependencies | ⚠️ | Story 12.4 depends on F-SH-01 and F-SH-04 from Epic 13 |
| Clear acceptance criteria | ✅ | Gherkin format used |
| Traceability | ✅ | All F-ST mapped |

**Note:** Story 12.4 (payment & stock) depends on Epic 13.1 and 13.3.

### Epic 13: Shared Payment & Inventory Infrastructure

| Check | Status | Notes |
|-------|--------|-------|
| User-value first | ⚠️ | "System" user persona; borderline but necessary cross-cutting infrastructure |
| Standalone | ⚠️ | Provides shared services for Epic 11-12; has no user-facing value on its own |
| No forward dependencies | ✅ | No dependencies on Epic 11/12 |
| Clear acceptance criteria | ✅ | Mostly clear |
| Traceability | ✅ | All F-SH mapped |

**Concerns:**
- Epic 13 is infrastructure-heavy. Consider whether it should be split or handled as enabler stories within Epic 11/12.
- However, given payment/webhook is truly cross-cutting across 3 verticals, keeping as separate epic is acceptable.

### Quality Violations

#### 🟡 Minor Concerns
- Story 11.3, 12.4, 12.8, 13.1 use "system" or generic user persona instead of specific end-user
- Story 13.5 AC are just a bullet list, not full Gherkin
- Story 13.6 lacks specific "Given/When/Then" format

#### 🟠 Major Issues
- **Forward dependencies from Epic 11/12 to Epic 13:** Payment confirmation in Epic 11 and 12 cannot work without Epic 13.1 (polymorphic webhook) and 13.3 (inventory reservation). This violates epic independence for payment confirmation stories.

**Recommendation:**
- Option A: Implement Epic 13 first (before or in parallel with Epic 11-12)
- Option B: Move Story 13.1 and 13.3 into a pre-MVP foundational sprint
- Option C: Keep dependencies but manage via sprint sequencing

---

## Summary and Recommendations

### Overall Readiness Status

**NEEDS WORK**

Readiness is blocked by:
1. Outdated Architecture document
2. Missing UX for Eco-Stay/Store
3. Forward dependencies from Epic 11/12 to Epic 13

### Critical Issues Requiring Immediate Action

1. **Update Architecture document** with Eco-Tourism/Store schema, API contracts, and route structure
2. **Create UX wireframes** for Epic 11 and 12 public/admin pages
3. **Resolve Epic 13 dependency** — decide whether to implement Epic 13 first or split foundational stories

### Recommended Next Steps

1. Run `bmad-create-architecture` to update `architecture.md`
2. Run `bmad-create-ux-design` to update UX specs with Eco-Stay/Store wireframes
3. Update `sprint-status.yaml` to sequence: Epic 13 first, then Epic 11 + 12 in parallel
4. Run `bmad-sprint-planning` to generate development sprint plan
5. Start `bmad-dev-story` for Story 13.1 (polymorphic Casso webhook)

### Final Note

This assessment found **3 major issues** across **Architecture, UX, and Epic dependencies**. Coverage of FRs is 100%, but structural artifacts need updating before implementation can proceed cleanly. The code MVP (`aff10180`) already implements parts of Epic 13 and Epic 12, so implementation can continue in parallel with artifact updates.
