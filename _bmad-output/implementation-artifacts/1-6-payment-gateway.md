# Story 1.6: Payment Gateway (Banking + USDT)

Status: ready-for-dev

## Story

As a **buyer**,
I want to **thanh toán qua chuyển khoản hoặc USDT**,
so that **tôi dùng được phương thức thanh toán ưa thích**.

## Acceptance Criteria

### Banking Payment
1. **Given** tôi ở màn hình thanh toán  
   **When** tôi chọn "Chuyển khoản ngân hàng"  
   **Then** hiển thị thông tin tài khoản + QR code

2. **And** nội dung chuyển khoản: [order-code]

3. **When** hoàn thành chuyển khoản  
   **Then** hệ thống detect trong 5 phút (webhook)

4. **And** order status = "Đã thanh toán"

### USDT Payment
5. **Given** tôi chọn "USDT"  
   **When** tôi scan wallet address và gửi đúng số tiền  
   **Then** blockchain transaction confirm trong 10 phút

6. **And** order status = "Đã thanh toán"

## Tasks / Subtasks

- [ ] Task 1: Payment Selection UI (AC: 1, 5)
  - [ ] 1.1 Tạo route `/src/app/crm/checkout/page.tsx`
  - [ ] 1.2 Tạo `components/checkout/PaymentMethodSelector.tsx`
  - [ ] 1.3 Toggle giữa "Banking" và "USDT"

- [ ] Task 2: Banking Payment Display (AC: 1, 2)
  - [ ] 2.1 Tạo `components/checkout/BankingPayment.tsx`
  - [ ] 2.2 Hiển thị thông tin ngân hàng (MB Bank, số TK, chủ TK)
  - [ ] 2.3 Generate QR code với VietQR API
  - [ ] 2.4 Generate unique order code cho nội dung CK

- [ ] Task 3: USDT Payment Display (AC: 5)
  - [ ] 3.1 Tạo `components/checkout/USDTPayment.tsx`
  - [ ] 3.2 Hiển thị wallet address (TRC20 hoặc ERC20)
  - [ ] 3.3 Generate QR code cho wallet
  - [ ] 3.4 Tính giá USDT từ VND (real-time rate)

- [ ] Task 4: Order Creation (AC: 2)
  - [ ] 4.1 Create order trong database với status "pending"
  - [ ] 4.2 Generate order code: `DH` + 6 random chars
  - [ ] 4.3 Store payment_type: 'banking' | 'usdt'

- [ ] Task 5: Payment Webhook (AC: 3, 4, 6)
  - [ ] 5.1 Tạo `/src/app/api/webhooks/payment/route.ts`
  - [ ] 5.2 Verify webhook signature
  - [ ] 5.3 Update order status to "paid"
  - [ ] 5.4 Trigger tree code generation (Edge Function)

- [ ] Task 6: Payment Polling (fallback) (AC: 3)
  - [ ] 6.1 Manual "Tôi đã chuyển khoản" button
  - [ ] 6.2 Admin manual verification flow
  - [ ] 6.3 Status polling mỗi 30 giây

## Dev Notes

### Architecture Compliance
- **Route:** `/crm/checkout` - protected route
- **API:** `/api/webhooks/payment` - public webhook
- **Edge Function:** `process-payment` cho tree code generation

### Technology Requirements
- **QR Code:** `qrcode.react` library
- **VietQR:** VietQR API cho banking QR
- **Crypto Rate:** CoinGecko API cho VND → USDT

### Banking Info (Example)
```typescript
const BANK_INFO = {
  bank: 'MB Bank',
  accountNumber: '123456789999',
  accountName: 'CTY TNHH DAI NGAN XANH',
  branch: 'TP HCM'
}
```

### Database Schema
- Orders table đã có: `payment_type`, `payment_ref`, `status`

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Supabase-Edge-Functions]
- [Source: _bmad-output/planning-artifacts/wireframes.md#Payment-Gateway]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Payment-Flow]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.6]
- [Source: docs/prd.md#FR-05]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/app/crm/checkout/page.tsx
- src/components/checkout/PaymentMethodSelector.tsx
- src/components/checkout/BankingPayment.tsx
- src/components/checkout/USDTPayment.tsx
- src/app/api/webhooks/payment/route.ts
- supabase/functions/process-payment/index.ts
