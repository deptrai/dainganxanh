# Story 3.7: Analytics & Reporting Dashboard

Status: ready-for-dev

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

- [ ] Task 1: Analytics Page (AC: 1, 4)
  - [ ] 1.1 Tạo `/src/app/crm/admin/analytics/page.tsx`
  - [ ] 1.2 KPI cards grid
  - [ ] 1.3 Date range selector
  - [ ] 1.4 Refresh button

- [ ] Task 2: KPI Cards (AC: 1)
  - [ ] 2.1 Tạo `components/admin/KPICard.tsx`
  - [ ] 2.2 Total trees planted
  - [ ] 2.3 Active users (last 30 days)
  - [ ] 2.4 Total revenue
  - [ ] 2.5 Carbon offset (trees × 20kg CO2)
  - [ ] 2.6 Trend indicators (vs last period)

- [ ] Task 3: Charts (AC: 2)
  - [ ] 3.1 Tạo `components/admin/PlantingChart.tsx`
  - [ ] 3.2 Line chart: Trees planted over time
  - [ ] 3.3 Bar chart: Revenue by month
  - [ ] 3.4 Funnel chart: Conversion funnel

- [ ] Task 4: Conversion Funnel (AC: 2)
  - [ ] 4.1 Stages: Landing → Register → Checkout → Pay → Complete
  - [ ] 4.2 Calculate conversion rates
  - [ ] 4.3 Identify drop-off points

- [ ] Task 5: Export Functionality (AC: 3)
  - [ ] 5.1 Tạo `components/admin/ExportButton.tsx`
  - [ ] 5.2 Export as PDF (with charts)
  - [ ] 5.3 Export as Excel (raw data)

- [ ] Task 6: API for Analytics (AC: 1, 2, 4)
  - [ ] 6.1 Tạo `/src/app/api/admin/analytics/route.ts`
  - [ ] 6.2 Aggregate queries
  - [ ] 6.3 Cache results (5 min)

## Dev Notes

### Architecture Compliance
- **Route:** `/crm/admin/analytics`
- **Charts:** Recharts hoặc Chart.js
- **Export:** jsPDF + xlsx

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

```typescript
// components/admin/PlantingChart.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'

const PlantingChart = ({ data }) => (
  <LineChart data={data}>
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="count" stroke="#2E8B57" />
  </LineChart>
)
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Admin-Routes]
- [Source: _bmad-output/planning-artifacts/wireframes.md#Admin-Dashboard]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.7]
- [Source: docs/prd.md#FR-19]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/app/crm/admin/analytics/page.tsx
- src/components/admin/KPICard.tsx
- src/components/admin/PlantingChart.tsx
- src/components/admin/RevenueChart.tsx
- src/components/admin/ConversionFunnel.tsx
- src/components/admin/ExportButton.tsx
- src/app/api/admin/analytics/route.ts
