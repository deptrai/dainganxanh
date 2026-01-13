# Story 3.7: Analytics & Reporting Dashboard

Status: done

## Story

As an **admin**,
I want to **xem project metrics tổng**,
so that **báo cáo cho stakeholders**.

## Acceptance Criteria

1. **Given** ở Analytics page  
   **When** load  
   **Then** KPI cards: Total trees, Active users, Revenue, Carbon offset

2. **And** charts: Tree planting over time, Conversion funnel

3. **And** export PDF/Excel

4. **And** data refresh real-time hoặc manual refresh button

## Tasks / Subtasks

- [x] Task 1: Analytics Page (AC: 1, 4)
  - [x] 1.1 Tạo `/src/app/crm/admin/analytics/page.tsx`
  - [x] 1.2 KPI cards grid
  - [x] 1.3 Date range selector
  - [x] 1.4 Refresh button

- [x] Task 2: KPI Cards (AC: 1)
  - [x] 2.1 Tạo `components/admin/KPICard.tsx`
  - [x] 2.2 Total trees planted
  - [x] 2.3 Active users (last 30 days)
  - [x] 2.4 Total revenue
  - [x] 2.5 Carbon offset (trees × 20kg CO2)
  - [x] 2.6 Trend indicators (vs last period)

- [x] Task 3: Charts (AC: 2)
  - [x] 3.1 Tạo `components/admin/PlantingChart.tsx`
  - [x] 3.2 Line chart: Trees planted over time
  - [x] 3.3 Bar chart: Revenue by month
  - [x] 3.4 Funnel chart: Conversion funnel

- [x] Task 4: Conversion Funnel (AC: 2)
  - [x] 4.1 Stages: Landing → Register → Checkout → Pay → Complete
  - [x] 4.2 Calculate conversion rates
  - [x] 4.3 Identify drop-off points

- [x] Task 5: Export Functionality (AC: 3)
  - [x] 5.1 Tạo `components/admin/ExportButton.tsx`
  - [x] 5.2 Export as PDF (with charts)
  - [x] 5.3 Export as Excel (raw data)

- [x] Task 6: Server Actions for Analytics (AC: 1, 2, 4)
  - [x] 6.1 Tạo `/src/actions/analytics.ts`
  - [x] 6.2 Aggregate queries
  - [x] 6.3 Cache results (5 min)
  - [x] 6.4 Admin role verification (security)

## Dev Notes

### Architecture Compliance
- **Route:** `/crm/admin/analytics`
- **Charts:** Recharts
- **Export:** jsPDF + xlsx
- **Pattern:** Server Actions (not API routes)

### Security
- All server actions verify admin role before returning data
- Uses `verifyAdminRole()` helper function

### Caching
- In-memory cache with 5 minute TTL
- Cache keys based on date range

### Analytics Queries
```sql
-- Total trees
SELECT COUNT(*) as total_trees FROM trees WHERE status != 'dead';

-- Active users (last 30 days)
SELECT COUNT(DISTINCT user_id) as active_users
FROM orders 
WHERE created_at > NOW() - INTERVAL '30 days';

-- Total revenue
SELECT SUM(total_amount) as revenue FROM orders WHERE status = 'completed';

-- Carbon offset
SELECT SUM(co2_absorbed) as total_co2 FROM trees;

-- Trees planted over time (monthly)
SELECT 
  DATE_TRUNC('month', planted_at) as month,
  COUNT(*) as count
FROM trees
WHERE planted_at IS NOT NULL
GROUP BY month
ORDER BY month;

-- Conversion funnel
SELECT 
  'landing' as stage, COUNT(*) as count FROM page_views WHERE path = '/'
UNION ALL
SELECT 'register', COUNT(*) FROM users
UNION ALL
SELECT 'checkout', COUNT(*) FROM orders
UNION ALL
SELECT 'paid', COUNT(*) FROM orders WHERE status IN ('paid', 'verified', 'assigned', 'completed')
UNION ALL
SELECT 'completed', COUNT(*) FROM orders WHERE status = 'completed';
```

### Chart Library Setup
```bash
npm install recharts jspdf xlsx
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Admin-Routes]
- [Source: _bmad-output/planning-artifacts/wireframes.md#Admin-Dashboard]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.7]
- [Source: docs/prd.md#FR-19]

## Dev Agent Record

### Agent Model Used
Gemini Advanced Agentic Coding (Antigravity)

### Completion Date
2026-01-14

### Code Review Status
✅ PASSED - All issues fixed

### File List
- src/actions/analytics.ts (NEW)
- src/actions/__tests__/analytics.test.ts (NEW)
- src/app/crm/admin/analytics/page.tsx (NEW)
- src/components/admin/KPICard.tsx (NEW)
- src/components/admin/PlantingChart.tsx (NEW)
- src/components/admin/RevenueChart.tsx (NEW)
- src/components/admin/ConversionFunnel.tsx (NEW)
- src/components/admin/ExportButton.tsx (NEW)
- package.json (MODIFIED - added recharts, jspdf, xlsx)

### Change Log
- 2026-01-14: Initial implementation
- 2026-01-14: Code review fixes:
  - Added admin role verification
  - Added trend indicators
  - Added RevenueChart component
  - Added Landing stage to funnel (with fallback)
  - Added 5-min caching
  - Updated story file with correct file list
