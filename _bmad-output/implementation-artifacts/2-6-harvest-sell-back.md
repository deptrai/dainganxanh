# Story 2.6: Harvest Option - Sell Back

Status: ready-for-dev

## Story

As a **tree owner đến năm 5**,
I want to **bán lại cây cho công ty**,
so that **tôi nhận được giá cam kết**.

## Acceptance Criteria

1. **Given** tôi ở harvest options page  
   **When** chọn "Bán lại cho Đại Ngàn Xanh"  
   **Then** hiển thị buyback price theo hợp đồng ban đầu

2. **And** show e-contract với điều khoản mua lại

3. **When** tôi sign contract  
   **Then** transfer funds vào ví trong 30 ngày

4. **And** tree status = "Đã thu hoạch"

5. **And** Email confirmation với receipt

## Tasks / Subtasks

- [ ] Task 1: Sell Back Option UI (AC: 1)
  - [ ] 1.1 Tạo `components/crm/HarvestSellBack.tsx`
  - [ ] 1.2 Display buyback price (từ original order)
  - [ ] 1.3 Price calculation: base + 5-year growth

- [ ] Task 2: E-Contract Display (AC: 2)
  - [ ] 2.1 Tạo `components/crm/SellBackContract.tsx`
  - [ ] 2.2 Contract terms preview
  - [ ] 2.3 PDF download option

- [ ] Task 3: Digital Signature (AC: 3)
  - [ ] 3.1 Tạo `components/crm/DigitalSignature.tsx`
  - [ ] 3.2 Canvas signature pad
  - [ ] 3.3 "Tôi đồng ý" checkbox

- [ ] Task 4: Transaction Processing (AC: 3, 4)
  - [ ] 4.1 Tạo `supabase/functions/process-sellback/index.ts`
  - [ ] 4.2 Create harvest_transactions table
  - [ ] 4.3 Update tree status to 'harvested'
  - [ ] 4.4 Queue payment (admin approval)

- [ ] Task 5: Confirmation Flow (AC: 5)
  - [ ] 5.1 Success page với transaction ID
  - [ ] 5.2 Email với payment timeline
  - [ ] 5.3 Dashboard update showing sold status

## Dev Notes

### Architecture Compliance
- **Payment:** Manual admin approval → wire transfer
- **Contract:** Generated PDF với digital signature
- **Status:** Tree goes to 'harvested' status

### Database Schema Addition
```sql
CREATE TYPE harvest_type AS ENUM ('sell_back', 'keep_growing', 'receive_product');
CREATE TYPE harvest_status AS ENUM ('pending', 'approved', 'paid', 'completed');

CREATE TABLE harvest_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tree_id UUID NOT NULL REFERENCES trees(id),
  user_id UUID NOT NULL REFERENCES users(id),
  type harvest_type NOT NULL,
  amount INTEGER, -- For sell_back
  status harvest_status DEFAULT 'pending',
  contract_url TEXT,
  signature_data TEXT, -- Base64 signature image
  bank_info JSONB, -- User's bank details for payment
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
```

### Buyback Price Calculation
```typescript
const calculateBuybackPrice = (originalPrice: number, yearsGrown: number) => {
  // Base: Original investment
  // Growth: 10% per year (simplified)
  const growthRate = 0.10
  const multiplier = Math.pow(1 + growthRate, yearsGrown)
  return Math.round(originalPrice * multiplier)
}
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Database-Schema]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form-Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.6]
- [Source: docs/prd.md#FR-12B]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/components/crm/HarvestSellBack.tsx
- src/components/crm/SellBackContract.tsx
- src/components/crm/DigitalSignature.tsx
- supabase/functions/process-sellback/index.ts
- supabase/migrations/[timestamp]_create_harvest_transactions.sql
