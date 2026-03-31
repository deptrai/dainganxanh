# Epic 10 Clarification: Sprint 1 vs Sprint 2

## TL;DR

Có **hai nhóm stories khác nhau** cùng được gọi là "Epic 10":

- **Epic 10 Sprint 1** (✅ DONE — commit bbac8e8, 2026-03-29 08:29): Customer identity checkout + DOCX contract generation
- **Epic 10 Sprint 2** (📋 PLANNED — stories tạo 2026-03-29 21:12-21:22): Tree certificate download + CO2 dashboard + Support chat

---

## Epic 10 Sprint 1: Contract Generation & Customer Identity

**Status:** ✅ Completed — deployed commit `bbac8e8` (2026-03-29 08:29)

**Objective:** Tự động hóa quy trình tạo hợp đồng pháp lý từ template DOCX của công ty Biocare thay vì tự render PDF bằng code.

### Stories

#### Story 10.1: Customer Identity Checkout
- **File:** `sprint1-10-1-customer-identity-checkout.md` (8.5KB)
- **Status:** done
- **What it does:**
  - Thu thập thông tin pháp lý khách hàng (CCCD, ngày sinh, địa chỉ) tại bước checkout
  - Form validation với Zod (12 chữ số CCCD, ngày sinh hợp lệ)
  - 3-step checkout: loading → identity form → banking QR
  - Pre-fill từ user profile nếu có
  - DB migration: thêm 7 columns vào `orders` table

**Key files:**
```
dainganxanh-landing/src/components/checkout/CustomerIdentityForm.tsx (284 lines + 126 test lines)
dainganxanh-landing/src/app/(marketing)/checkout/page.tsx (refactored với CheckoutStep state machine)
supabase/migrations/20260328_add_customer_identity_to_orders.sql
```

#### Story 10.2: DOCX Contract Generation Pipeline
- **File:** `sprint1-10-2-docx-contract-generation.md` (10KB)
- **Status:** done
- **What it does:**
  - Tự động điền thông tin khách hàng vào hợp đồng mẫu DOCX của công ty Biocare
  - Pipeline: DOCX template → docx-templates (fill) → ConvertAPI (to PDF) → pdf-lib (overlay chữ ký) → Supabase Storage
  - Vietnamese text helpers: `numberToVietnameseWords` (convert số thành chữ)
  - 20 unit tests cho contract-helpers
  - Chữ ký + con dấu Tổng Giám Đốc overlay lên PDF trang cuối

**Key files:**
```
dainganxanh-landing/src/app/api/contracts/generate/route.ts (264 lines)
dainganxanh-landing/src/lib/utils/contract-helpers.ts (129 lines + 99 test lines)
dainganxanh-landing/templates/contract-template.docx (DOCX template)
dainganxanh-landing/templates/signature.png + stamp.png
dainganxanh-landing/scripts/create-contract-assets.mjs (338 lines — script tạo template)
```

**Dependencies:**
- `docx-templates` npm package (fill DOCX placeholders)
- `pdf-lib@1.17.1` (overlay chữ ký/con dấu)
- ConvertAPI (DOCX → PDF) — env var `CONVERTAPI_SECRET`

#### Story 10.3: Auto Send Contract Email
- **File:** `sprint1-10-3-auto-send-contract-email.md` (5.0KB)
- **Status:** done (review)
- **What it does:**
  - Thay thế `generate-contract` Edge Function để sử dụng API route `/api/contracts/generate` mới (Story 10.2)
  - Xóa 180+ lines tự render PDF bằng pdf-lib trong Edge Function
  - Giữ nguyên flow: `process-payment` EF → `generate-contract` EF → `send-email` EF
  - Edge Function giờ chỉ delegate HTTP call đến API route và map response

**Key files:**
```
supabase/functions/generate-contract/index.ts (MODIFIED — từ 180+ lines xuống ~70 lines)
```

### Implementation Impact

**Commit stats:** 22 files changed, 1,965 insertions(+), 363 deletions(-)

**New dependencies:**
- `docx-templates` (fill DOCX)
- `pdf-lib` (overlay signature)
- `docx` (devDep — script tạo template)

**Environment variables mới:**
- `CONVERTAPI_SECRET` (ConvertAPI API key)
- `CONTRACT_API_SECRET` (auth cho `/api/contracts/generate`)

---

## Epic 10 Sprint 2: Customer Engagement & Experience

**Status:** 📋 Planned — story files created 2026-03-29 21:12-21:22, implementation **NOT started yet**

**Objective:** Tăng customer engagement sau khi mua cây thông qua certificate download, CO2 impact visualization, và in-app support chat.

### Stories

#### Story 10.1: Tree Certificate Download
- **File:** `10-1-tree-certificate-download.md` (19KB)
- **Status:** ready-for-dev
- **What it does:**
  - Tải certificate PDF cho từng cây (giấy chứng nhận cá nhân)
  - QR code link đến tree detail page
  - Vietnamese text rendering với pdf-lib (remove accents)
  - Location map thumbnail (optional)
  - 7 ACs, 7 tasks, 37 subtasks

**Estimated implementation:**
- Reuse pdf-lib@1.17.1 từ Story Sprint 1
- Reuse Supabase Storage upload patterns
- Certificate template riêng (khác contract template)

#### Story 10.2: CO2 Impact Dashboard
- **File:** `10-2-co2-impact-dashboard.md` (22KB)
- **Status:** ready-for-dev (partial — 40% implemented)
- **What it does:**
  - Dashboard visualization CO2 impact với charts (Recharts)
  - Comparison với equivalent car trips, flights
  - Shareable social media cards
  - Monthly/yearly trend charts

**Existing implementation:**
```
✅ 40% — Basic CO2 display
dainganxanh-landing/src/components/customer/PackageCard.tsx (CO2 info shown)
dainganxanh-landing/src/components/customer/TreeCard.tsx (CO2 per tree)
dainganxanh-landing/src/components/customer/MyGardenHeader.tsx (total CO2)
dainganxanh-landing/src/components/customer/GrowthMetrics.tsx (growth display)

❌ 60% — Missing features
- Dashboard page `/my-garden/co2-impact` (not found)
- Recharts visualization (not installed)
- Comparison metrics (car trips, flights)
- Shareable cards generation
```

#### Story 10.3: In-app Customer Support Chat
- **File:** `10-3-inapp-customer-support-chat.md` (20KB)
- **Status:** ready-for-dev
- **What it does:**
  - Real-time chat với support team
  - Supabase Realtime (channel subscription)
  - Admin notifications cho new messages
  - Chat history persistence
  - Reuse infrastructure từ Stories 2.3/3.1/4.4

**Estimated implementation:**
- Supabase Realtime patterns (reuse from existing stories)
- Chat UI component (new)
- Admin notification system (integrate with existing)

### Implementation Status

- **Story 10.1 (Certificate):** 0% — No files found
- **Story 10.2 (CO2 Dashboard):** 40% — Basic display only, missing dashboard/charts/shareable
- **Story 10.3 (Chat):** 0% — No files found

**Total Epic 10 Sprint 2:** ~13% complete (weighted by story size)

---

## Why Two "Epic 10"?

**Naming collision** — Hai nhóm stories khác nhau cùng được gọi "Epic 10" vì:

1. **Sprint 1** (bbac8e8): BMad workflow tạo stories 10.1/10.2/10.3 cho contract generation feature
2. **Sprint 2** (mới): BMad workflow tạo stories 10.1/10.2/10.3 cho customer engagement features
3. Sprint 1 stories bị xóa trong commit sau (3627c36 hoặc 2059b26) khi sync docs
4. Session summary nói "Epic 10 complete" (referring to Sprint 1), nhưng user muốn implement Epic 10 Sprint 2 (new stories)

**Resolution:**
- Sprint 1 stories restored với prefix `sprint1-` để phân biệt
- `sprint-status.yaml` updated: split Epic 10 thành 2 entries riêng
- File này (`EPIC-10-CLARIFICATION.md`) document sự khác biệt

---

## Next Steps

### Option A: Implement Epic 10 Sprint 2 (Recommended)

Use `bmad-dev-story` workflow để implement 3 stories mới:

```bash
# Start với Story 10.1 (Certificate Download)
/bmad-dev-story 10-1-tree-certificate-download

# Sau đó Story 10.2 (CO2 Dashboard)
/bmad-dev-story 10-2-co2-impact-dashboard

# Cuối cùng Story 10.3 (Support Chat)
/bmad-dev-story 10-3-inapp-customer-support-chat
```

**Recommended order:**
1. Story 10.1 (Certificate) — độc lập, không dependency
2. Story 10.2 (CO2 Dashboard) — 40% done, finish remaining
3. Story 10.3 (Chat) — reuse Realtime infrastructure

### Option B: Document Sprint 1 Implementation (Already Done ✅)

- ✅ Restored 3 Sprint 1 story files từ commit bbac8e8
- ✅ Updated `sprint-status.yaml` với Epic 10 Sprint 1 section (status: done)
- ✅ Created this clarification document

---

## References

- **Sprint 1 commit:** `bbac8e8` — "feat: Epic 10 — customer identity checkout + DOCX contract generation pipeline"
- **Sprint 1 commit date:** 2026-03-29 08:29:08 +0700
- **Sprint 2 story files created:** 2026-03-29 21:12-21:22 (by agents during session)
- **Cloud memory observation:** #320 "Epic 10 Complete: Contract Email Delivered" (Sprint 1)
- **Manual audit results:** Epic 10 Sprint 2 at 13% implementation (Story 10.2 CO2 display only)

---

## File Inventory

### Sprint 1 Story Files (Restored)
```
_bmad-output/implementation-artifacts/sprint1-10-1-customer-identity-checkout.md (8.5KB)
_bmad-output/implementation-artifacts/sprint1-10-2-docx-contract-generation.md (10KB)
_bmad-output/implementation-artifacts/sprint1-10-3-auto-send-contract-email.md (5.0KB)
```

### Sprint 2 Story Files (Created)
```
_bmad-output/implementation-artifacts/10-1-tree-certificate-download.md (19KB)
_bmad-output/implementation-artifacts/10-2-co2-impact-dashboard.md (22KB)
_bmad-output/implementation-artifacts/10-3-inapp-customer-support-chat.md (20KB)
```

### Total Epic 10 Documentation
**61KB** story files (24KB Sprint 1 + 61KB Sprint 2) + this clarification doc

---

**Last updated:** 2026-03-29 21:35 GMT+7
