# Story 3.3: Contract Printing System

Status: ready-for-dev

## Story

As an **admin**,
I want to **in hoặc gửi hợp đồng điện tử**,
so that **user có tài liệu pháp lý**.

## Acceptance Criteria

1. **Given** assigned order  
   **When** chọn print/digital  
   **Then** generate PDF contract với user info

2. **If** print → mark for postal service

3. **If** digital → auto-send via email

4. **And** contract có đầy đủ thông tin pháp lý

5. **And** lưu contract URL vào order record

## Tasks / Subtasks

- [ ] Task 1: Contract Actions (AC: 1, 2, 3)
  - [ ] 1.1 Tạo `components/admin/ContractActions.tsx`
  - [ ] 1.2 Buttons: "In hợp đồng" và "Gửi email"
  - [ ] 1.3 Status indicator: Chưa gửi / Đã gửi

- [ ] Task 2: PDF Generation (AC: 1, 4)
  - [ ] 2.1 Update `supabase/functions/generate-contract/index.ts`
  - [ ] 2.2 Contract template với user info
  - [ ] 2.3 Tree codes list
  - [ ] 2.4 Legal terms và conditions
  - [ ] 2.5 QR code for verification

- [ ] Task 3: Print Queue (AC: 2)
  - [ ] 3.1 Tạo `print_queue` table
  - [ ] 3.2 Mark order for printing
  - [ ] 3.3 Batch print interface
  - [ ] 3.4 Mark as printed/shipped

- [ ] Task 4: Email Delivery (AC: 3)
  - [ ] 4.1 Reuse `send-email` function
  - [ ] 4.2 Attach PDF contract
  - [ ] 4.3 Track delivery status

- [ ] Task 5: Contract Storage (AC: 5)
  - [ ] 5.1 Upload PDF to Supabase Storage
  - [ ] 5.2 Update order.contract_url
  - [ ] 5.3 User can re-download from dashboard

## Dev Notes

### Architecture Compliance
- **PDF:** @react-pdf/renderer hoặc Puppeteer
- **Storage:** Supabase Storage `contracts` bucket
- **Email:** SendGrid (existing)

### Contract Template Content
```
┌─────────────────────────────────────────┐
│          HỢP ĐỒNG TRỒNG CÂY            │
│              ĐẠI NGÀN XANH              │
├─────────────────────────────────────────┤
│ Số hợp đồng: {order_id}                 │
│ Ngày: {date}                            │
├─────────────────────────────────────────┤
│ THÔNG TIN KHÁCH HÀNG                    │
│ Họ tên: {user_name}                     │
│ Email: {email}                          │
│ Số điện thoại: {phone}                  │
├─────────────────────────────────────────┤
│ CHI TIẾT ĐƠN HÀNG                       │
│ Số lượng cây: {quantity}                │
│ Tổng giá trị: {total} VNĐ              │
│ Mã cây:                                 │
│   - TREE-2026-XXXXX                     │
│   - TREE-2026-XXXXX                     │
│   - ...                                 │
├─────────────────────────────────────────┤
│ ĐIỀU KHOẢN                              │
│ 1. Cam kết chăm sóc 5 năm               │
│ 2. Báo cáo hàng quý                     │
│ 3. 3 lựa chọn thu hoạch                 │
├─────────────────────────────────────────┤
│ [QR CODE]           Chữ ký điện tử:     │
│                     {signature}         │
└─────────────────────────────────────────┘
```

### Database Schema Addition
```sql
CREATE TABLE print_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  status TEXT DEFAULT 'pending', -- pending, printed, shipped
  printed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Supabase-Storage]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.3]
- [Source: docs/prd.md#FR-15]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/components/admin/ContractActions.tsx
- src/app/crm/admin/print-queue/page.tsx
- supabase/functions/generate-contract/index.ts
- supabase/migrations/[timestamp]_create_print_queue.sql
