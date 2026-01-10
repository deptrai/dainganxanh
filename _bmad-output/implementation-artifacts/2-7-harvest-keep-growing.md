# Story 2.7: Harvest Option - Keep Growing

Status: ready-for-dev

## Story

As a **tree owner đến năm 5**,
I want to **giữ cây tiếp tục chăm sóc**,
so that **tăng giá trị dài hạn**.

## Acceptance Criteria

1. **Given** tôi ở harvest options page  
   **When** chọn "Giữ cây tiếp tục chăm sóc"  
   **Then** hiển thị extended care contract (phí hàng năm)

2. **And** projected value increase timeline

3. **When** confirm  
   **Then** extend contract + update status

4. **And** continue quarterly updates

5. **And** Next harvest check sau 12 tháng

## Tasks / Subtasks

- [ ] Task 1: Keep Growing Option UI (AC: 1)
  - [ ] 1.1 Tạo `components/crm/HarvestKeepGrowing.tsx`
  - [ ] 1.2 Display annual care fee
  - [ ] 1.3 Benefits explanation

- [ ] Task 2: Value Projection (AC: 2)
  - [ ] 2.1 Tạo `components/crm/ValueProjection.tsx`
  - [ ] 2.2 Chart showing value increase over years
  - [ ] 2.3 Comparison: Sell now vs Keep growing

- [ ] Task 3: Extended Contract (AC: 1, 3)
  - [ ] 3.1 Tạo `components/crm/ExtendedCareContract.tsx`
  - [ ] 3.2 Annual fee: 100,000 VNĐ (example)
  - [ ] 3.3 Agreement terms

- [ ] Task 4: Payment Flow (AC: 3)
  - [ ] 4.1 Redirect to payment (reuse Story 1.6 components)
  - [ ] 4.2 Create extended_care_orders table
  - [ ] 4.3 Auto-renewal option

- [ ] Task 5: Status Update (AC: 3, 4, 5)
  - [ ] 5.1 Update tree status to 'growing' (extended)
  - [ ] 5.2 Set next_harvest_check date (+12 months)
  - [ ] 5.3 Continue quarterly photo schedule

## Dev Notes

### Architecture Compliance
- **Payment:** Reuse existing checkout flow
- **Status:** Tree stays in 'mature' but with extended care flag
- **Cron:** Update harvest check logic to respect extended care

### Database Schema Addition
```sql
ALTER TABLE trees ADD COLUMN extended_care BOOLEAN DEFAULT FALSE;
ALTER TABLE trees ADD COLUMN next_harvest_check TIMESTAMPTZ;

CREATE TABLE extended_care_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tree_id UUID NOT NULL REFERENCES trees(id),
  user_id UUID NOT NULL REFERENCES users(id),
  year_number INTEGER NOT NULL, -- Year 6, 7, 8...
  amount INTEGER NOT NULL,
  status order_status DEFAULT 'pending',
  payment_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Annual Care Fee Calculation
```typescript
const ANNUAL_CARE_FEE = 100000 // 100,000 VNĐ/năm

// Projected value increase
const projectValue = (currentValue: number, years: number) => {
  const annualGrowthRate = 0.15 // 15% per year for agarwood
  return Array.from({ length: years }, (_, i) => ({
    year: i + 6, // Starting from year 6
    value: Math.round(currentValue * Math.pow(1 + annualGrowthRate, i + 1))
  }))
}
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Database-Schema]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Data-Visualization]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.7]
- [Source: docs/prd.md#FR-12C]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/components/crm/HarvestKeepGrowing.tsx
- src/components/crm/ValueProjection.tsx
- src/components/crm/ExtendedCareContract.tsx
- supabase/migrations/[timestamp]_add_extended_care.sql
