# Story 2.5: Year 5 Harvest Notification

Status: done

## Story

As a **long-term tree owner**,
I want to **được thông báo khi cây sẵn sàng thu hoạch**,
so that **tôi có thể quyết định bước tiếp theo**.

## Acceptance Criteria

1. **Given** cây 60 tháng tuổi  
   **When** monthly cron job chạy  
   **Then** nhận email "Cây của bạn sẵn sàng thu hoạch"

2. **And** email chứa link đến harvest options page

3. **And** In-app notification với badge "Sẵn sàng thu hoạch"

4. **And** Dashboard tree card hiện harvest indicator

## Tasks / Subtasks

- [x] Task 1: Cron Job Setup (AC: 1)
  - [x] 1.1 Tạo `supabase/functions/check-harvest-ready/index.ts`
  - [x] 1.2 Query trees WHERE age >= 60 months AND status != 'harvested'
  - [x] 1.3 Schedule: Monthly (1st of each month) - Configured in Supabase Dashboard

- [x] Task 2: Harvest Email (AC: 1, 2)
  - [x] 2.1 Create email template (embedded in Edge Function)
  - [x] 2.2 Content: Congratulations, 3 options preview, CTA button
  - [x] 2.3 Link to `/crm/my-garden/[orderId]/harvest`

- [x] Task 3: In-App Notification (AC: 3)
  - [x] 3.1 Insert notification với type='harvest_ready'
  - [x] 3.2 Update NotificationBell với harvest icon (🌟)
  - [x] 3.3 Special styling cho harvest notifications

- [x] Task 4: Dashboard Indicator (AC: 4)
  - [x] 4.1 Update TreeCard component với HarvestBadge
  - [x] 4.2 Show "🌟 Sẵn sàng thu hoạch" badge
  - [x] 4.3 Highlight card với gold border (ring-4 ring-yellow-400)

- [x] Task 5: Harvest Page Route (AC: 2)
  - [x] 5.1 Created route `/src/app/crm/my-garden/[orderId]/harvest/page.tsx`
  - [x] 5.2 Show 3 harvest options (Coming Soon placeholders for Stories 2.6, 2.7, 2.8)

## Dev Notes

### Architecture Compliance
- **Cron:** Supabase Edge Function with manual invoke or scheduled
- **Email:** Resend API (replaced SendGrid for simplicity)
- **Route:** New harvest options page with auth check

### Important: DEV vs PROD Thresholds
Development mode uses 3-minute threshold instead of 60 months for quick testing.

Files with DEV thresholds (configurable via ENVIRONMENT variable):
- `check-harvest-ready/index.ts` lines 43-53: Uses `isDev` flag with 3-minute threshold for DEV, 60 months for PROD
- `TreeCard.tsx` lines 50-52: Uses `isDev` flag with 3-minute threshold for DEV, 60 months for PROD  
- `HarvestBadge.tsx` line 10: Checks `ageInMonths < 60` (TreeCard passes correct value based on environment)

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Supabase-Edge-Functions]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.5]
- [Source: docs/prd.md#FR-12]

## Dev Agent Record

### Agent Model Used
Claude 4.5 Sonnet (Gemini M12)

### File List
- supabase/functions/check-harvest-ready/index.ts
- dainganxanh-landing/src/app/crm/my-garden/[orderId]/harvest/page.tsx
- dainganxanh-landing/src/app/crm/my-garden/[orderId]/page.tsx
- dainganxanh-landing/src/components/crm/HarvestBadge.tsx
- dainganxanh-landing/src/components/crm/TreeCard.tsx
- dainganxanh-landing/src/components/crm/NotificationBell.tsx
- dainganxanh-landing/src/components/AuthNavLink.tsx
- dainganxanh-landing/src/app/page.tsx
- email-templates/harvest-ready.html

### Change Log
| Date | Change | Files |
|------|--------|-------|
| 2026-01-11 | Created Edge Function with Resend | check-harvest-ready/index.ts |
| 2026-01-11 | Created HarvestBadge component | HarvestBadge.tsx |
| 2026-01-11 | Updated TreeCard with harvest indicators | TreeCard.tsx |
| 2026-01-11 | Created harvest page route | harvest/page.tsx |
| 2026-01-11 | Fixed notification click navigation | NotificationBell.tsx |
| 2026-01-11 | Added individual trees display | [orderId]/page.tsx |
| 2026-01-11 | Fixed harvest icon in notifications | NotificationBell.tsx |
| 2026-01-12 | **Code Review Fixes** | Multiple files |
| 2026-01-12 | Fixed HarvestBadge logic (< 60 months check) | HarvestBadge.tsx |
| 2026-01-12 | Added harvest fields to Notification interface | realtime.ts |
| 2026-01-12 | Fixed flaky test (getAllByText) | NotificationBell.test.tsx |
| 2026-01-12 | Added Mark All As Read functionality | NotificationBell.tsx, realtime.ts |
| 2026-01-12 | Fixed CO2 calculation consistency | harvest/page.tsx |
| 2026-01-12 | Updated DEV/PROD threshold documentation | 2-5-harvest-notification.md |
| 2026-01-12 | Added loading skeleton for harvest page | harvest/loading.tsx |

### Code Review Follow-ups (AI)
- [x] [LOW] Make threshold configurable via environment variable - DONE
- [x] [MEDIUM] Add rate limiting/batching for Resend API calls - DONE (500ms delay)
- [x] [MEDIUM] Calculate CO2 from tree age - DONE
- [x] [MEDIUM] Add body text to notifications - DONE
- [x] [HIGH] Fix HarvestBadge logic to check >= 60 months - DONE (2026-01-12)
- [x] [HIGH] Add harvest notification fields to interface - DONE (2026-01-12)
- [x] [MEDIUM] Fix flaky NotificationBell test - DONE (2026-01-12)
- [x] [MEDIUM] Add Mark All As Read button - DONE (2026-01-12)
- [x] [MEDIUM] Fix CO2 calculation consistency - DONE (2026-01-12)
- [x] [LOW] Update outdated comments in story notes - DONE (2026-01-12)
- [x] [LOW] Add loading state for harvest page - DONE (2026-01-12)
- [ ] [LOW] Remove console.log statements from Edge Function for production (keep for debugging)
