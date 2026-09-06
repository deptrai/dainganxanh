# Sprint Change Proposal — Eco-Tourism & Store Integration

**Date:** 2026-09-05
**Project:** Đại Ngàn Xanh
**Triggered by:** User asks to merge Eco-Tourism and Trầm Hương Store into the existing PRD instead of keeping as separate document.

---

## 1. Issue Summary

The project currently has two separate requirement documents:
- `docs/prd.md` — legacy tree-investment platform PRD (10 epics, 47 stories, all done)
- `_bmad-output/planning-artifacts/prd-eco-tourism.md` — new Eco-Stay + Trầm Hương Store PRD

The proposal is to merge the new Eco-Tourism/Store content into the legacy PRD rather than maintaining a separate document.

---

## 2. Impact Analysis

### Epic Impact
- No changes to Epic 1-10 (tree platform)
- Need to add **Epic 11: Eco-Stay** (10 FRs, ~8-10 stories)
- Need to add **Epic 12: Trầm Hương Store** (10 FRs, ~8-10 stories)
- Need to add **Epic 13: Shared Infrastructure** (6 FRs: polymorphic webhook, payment ledger, inventory, security)

### Artifact Conflicts
- **PRD**: Add 2 new sections + shared infrastructure; rewrite executive summary/vision
- **Architecture**: Add rooms, products, bookings, payment_transactions schema; update webhook dispatcher; RLS updates
- **Epics**: Add 3 new epics with stories
- **UX Design**: New wireframes for store, eco-tourism, checkout, admin
- **Sprint Status**: Add Epic 11-13 stories to backlog

### Technical Impact
- Database: +5 major tables
- API: +6 new endpoints
- Frontend: +8 new pages
- Webhook: Casso refactor to polymorphic DH/BK/ST dispatcher
- Security: new RLS policies, is_admin() SECURITY DEFINER

---

## 3. Recommended Approach

**Primary recommendation: Option 2 — Keep separate PRDs**

Rationale:
- Legacy PRD is approved and stable; 47 stories already done
- Eco-Tourism/Store is a distinct vertical (hospitality/retail vs fintech)
- Separate documents reduce merge risk and maintenance overhead
- Each vertical has its own lifecycle and release cadence

**If user insists on merging: Option 1 — Direct Adjustment (Major scope)**

Requires:
1. Rewrite `docs/prd.md` to include Eco-Stay, Store, Shared Infrastructure
2. Rewrite `epics.md` to add Epic 11-13
3. Rewrite `architecture.md` to reflect new schema/components
4. Update `ux-design-specification.md` and `wireframes.md`
5. Regenerate `sprint-status.yaml`

Effort: Very High
Risk: High

---

## 4. Detailed Change Proposals

### PRD Changes
- Add Section: Eco-Stay vertical
- Add Section: Trầm Hương Store vertical
- Add Section: Shared Payment & Inventory Infrastructure
- Update Executive Summary, Product Vision, Strategic Goals
- Add new personas: Eco-Tourist, Retail Customer, Resort Manager, Store Staff

### Epic Changes
```
+ Epic 11: Eco-Stay (backlog)
  - 11-1 garden listing
  - 11-2 room availability
  - 11-3 booking checkout
  - 11-4 booking payment
  - 11-5 my bookings
  - 11-6 admin booking calendar
  - ...
+ Epic 12: Trầm Hương Store (backlog)
  - 12-1 product catalog
  - 12-2 product detail
  - 12-3 store checkout
  - 12-4 store payment / COD
  - 12-5 my store orders
  - 12-6 admin product CRUD
  - 12-7 admin store order fulfillment
  - ...
+ Epic 13: Shared Payment & Inventory Infrastructure (backlog)
  - 13-1 polymorphic Casso webhook
  - 13-2 payment transactions ledger
  - 13-3 inventory reservation & release
  - 13-4 server-side price validation
  - 13-5 transactional email templates
  - 13-6 lot-scoped admin roles
```

### Architecture Changes
- Update schema diagram
- Update API contracts
- Update webhook flow
- Update RLS and security model
- Update route structure

### UX Changes
- Add wireframes for eco-tourism pages
- Add wireframes for store pages
- Add wireframes for admin views

---

## 5. Implementation Handoff

**Scope:** Major if merging; Moderate if keeping separate

**Handoff recipients:**
- Product Manager: decide final PRD strategy (merge vs separate)
- Architect: update architecture for new schema/webhook
- Scrum Master: update sprint-status.yaml and backlog
- Dev: continue MVP implementation from `prd-eco-tourism.md`

**Success criteria:**
- PRD/Epic documents reflect Eco-Tourism/Store scope
- Architecture document matches current migration
- Sprint status has trackable stories for Epic 11-13
- Code merges cleanly into `main`
