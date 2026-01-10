# Story 2.8: Harvest Option - Receive Product

Status: ready-for-dev

## Story

As a **tree owner đến năm 5**,
I want to **nhận sản phẩm trầm hương từ cây**,
so that **tôi có sản phẩm thực từ investment**.

## Acceptance Criteria

1. **Given** tôi ở harvest options page  
   **When** chọn "Nhận sản phẩm trầm hương"  
   **Then** hiển thị available options (tinh dầu, gỗ thô, etc.)

2. **And** form nhập thông tin giao hàng

3. **When** confirm order  
   **Then** tạo product fulfillment ticket

4. **And** gửi tracking info when shipped

5. **And** tree status = "Đã thu hoạch"

## Tasks / Subtasks

- [ ] Task 1: Product Selection UI (AC: 1)
  - [ ] 1.1 Tạo `components/crm/HarvestReceiveProduct.tsx`
  - [ ] 1.2 Product catalog: tinh dầu, gỗ thô, vòng tay, etc.
  - [ ] 1.3 Product images và descriptions
  - [ ] 1.4 Value equivalence display

- [ ] Task 2: Shipping Form (AC: 2)
  - [ ] 2.1 Tạo `components/crm/ShippingForm.tsx`
  - [ ] 2.2 Fields: name, phone, address, notes
  - [ ] 2.3 Province/District/Ward selector (Vietnamese)
  - [ ] 2.4 Form validation với Zod

- [ ] Task 3: Order Processing (AC: 3, 5)
  - [ ] 3.1 Tạo `supabase/functions/process-product-order/index.ts`
  - [ ] 3.2 Create product_fulfillment table
  - [ ] 3.3 Update tree status to 'harvested'
  - [ ] 3.4 Notify admin of new fulfillment

- [ ] Task 4: Tracking System (AC: 4)
  - [ ] 4.1 Admin updates tracking_number
  - [ ] 4.2 Email với tracking link
  - [ ] 4.3 In-app status display (Đang xử lý → Đang giao → Đã giao)

- [ ] Task 5: Confirmation Page (AC: 3)
  - [ ] 5.1 Order confirmation với product details
  - [ ] 5.2 Estimated delivery time
  - [ ] 5.3 Support contact info

## Dev Notes

### Architecture Compliance
- **Products:** Stored in database products table
- **Fulfillment:** Manual admin process
- **Shipping:** Integration với VNPost/GHN API (future)

### Database Schema Addition
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  tree_value_equivalent DECIMAL(10, 2), -- How many trees needed
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_fulfillments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tree_id UUID NOT NULL REFERENCES trees(id),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  shipping_name TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_province TEXT,
  shipping_district TEXT,
  shipping_ward TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending', -- pending, processing, shipped, delivered
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Product Catalog (Seed Data)
```sql
INSERT INTO products (name, description, tree_value_equivalent) VALUES
  ('Tinh dầu trầm hương 10ml', 'Tinh dầu nguyên chất từ gỗ Dó Bầu', 1),
  ('Gỗ trầm thô 100g', 'Gỗ Dó Bầu nguyên khối', 1),
  ('Vòng tay trầm hương', 'Vòng tay từ gỗ trầm tự nhiên', 2),
  ('Bộ nhang trầm', 'Nhang trầm hương cao cấp 50 que', 1);
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Database-Schema]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form-Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.8]
- [Source: docs/prd.md#FR-12D]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/components/crm/HarvestReceiveProduct.tsx
- src/components/crm/ProductCatalog.tsx
- src/components/crm/ShippingForm.tsx
- src/components/crm/FulfillmentStatus.tsx
- supabase/functions/process-product-order/index.ts
- supabase/migrations/[timestamp]_create_products_fulfillments.sql
- supabase/seed-products.sql
