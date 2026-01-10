# Story 1.6: Payment Gateway (Banking + USDT)

Status: done

## Story

As a **buyer**,
I want to **thanh toán qua chuyển khoản hoặc USDT**,
so that **tôi dùng được phương thức thanh toán ưa thích**.

## Acceptance Criteria

### Banking Payment
1. **Given** tôi ở màn hình thanh toán  
   **When** tôi chọn "Chuyển khoản ngân hàng"  
   **Then** hiển thị thông tin tài khoản + QR code ✅

2. **And** nội dung chuyển khoản: [order-code] ✅

3. **When** hoàn thành chuyển khoản  
   **Then** hệ thống detect trong 5 phút (webhook) ⏳ (manual confirmation for MVP)

4. **And** order status = "Đã thanh toán" ⏳ (pending webhook integration)

### USDT Payment
5. **Given** tôi chọn "USDT"  
   **When** tôi scan wallet address và gửi đúng số tiền  
   **Then** blockchain transaction confirm trong 10 phút ⏳ **DEFERRED**

6. **And** order status = "Đã thanh toán" ⏳ **DEFERRED**

## Tasks / Subtasks

- [x] Task 1: Payment Selection UI (AC: 1, 5)
  - [x] 1.1 Tạo route `/src/app/(marketing)/checkout/page.tsx`
  - [x] 1.2 Tạo `components/checkout/PaymentMethodSelector.tsx`
  - [x] 1.3 Toggle giữa "Banking" và "USDT" (USDT disabled with "Sắp ra mắt" badge)

- [x] Task 2: Banking Payment Display (AC: 1, 2)
  - [x] 2.1 Tạo `components/checkout/BankingPayment.tsx`
  - [x] 2.2 Hiển thị thông tin ngân hàng (MB Bank, số TK, chủ TK)
  - [x] 2.3 Generate QR code với VietQR image URL (FIXED: dùng trực tiếp thay vì QR của URL)
  - [x] 2.4 Generate unique order code cho nội dung CK (`DH` + 6 random chars)

- [ ] Task 3: USDT Payment Display (AC: 5) **⏳ DEFERRED**
  - [ ] 3.1 Tạo `components/checkout/USDTPayment.tsx`
  - [ ] 3.2 Hiển thị wallet address (TRC20 hoặc ERC20)
  - [ ] 3.3 Generate QR code cho wallet
  - [ ] 3.4 Tính giá USDT từ VND (real-time rate)

- [x] Task 4: Order Creation (AC: 2)
  - [x] 4.1 Order code generated on page load (FIXED: useEffect instead of useState)
  - [x] 4.2 Generate order code: `DH` + 6 random chars
  - [ ] 4.3 Store payment_type in database ⏳ (pending backend integration)

- [ ] Task 5: Payment Webhook (AC: 3, 4, 6) ⏳ (simplified for MVP)
  - [ ] 5.1 Tạo `/src/app/api/webhooks/payment/route.ts`
  - [ ] 5.2 Verify webhook signature
  - [ ] 5.3 Update order status to "paid"
  - [ ] 5.4 Trigger tree code generation (Edge Function)

- [x] Task 6: Payment Polling (fallback) (AC: 3)
  - [x] 6.1 Manual "Tôi đã chuyển khoản" button ✅
  - [ ] 6.2 Admin manual verification flow ⏳
  - [ ] 6.3 Status polling mỗi 30 giây ⏳

## Dev Notes

### Architecture Compliance
- **Route:** `/checkout` - public route (changed from `/crm/checkout`)
- **API:** `/api/webhooks/payment` - public webhook (pending)
- **Edge Function:** `process-payment` cho tree code generation (pending)

### Technology Requirements
- **QR Code:** VietQR image URL (dùng trực tiếp, không cần thư viện qrcode)
- **VietQR:** `https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-compact.png`
- **Crypto Rate:** CoinGecko API cho VND → USDT (deferred)

### Banking Info (Environment Variables)
```typescript
const BANK_INFO = {
  bank: process.env.NEXT_PUBLIC_BANK_NAME || 'MB Bank',
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '0123456789',
  accountName: process.env.NEXT_PUBLIC_BANK_HOLDER || 'CTY TNHH DAI NGAN XANH',
  branch: process.env.NEXT_PUBLIC_BANK_BRANCH || 'TP HCM'
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

## Senior Developer Review (AI)

### Review Date
2026-01-11

### Review Outcome
✅ **APPROVED** (after fixes)

### Issues Found & Fixed
| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | CRITICAL | useState used as useEffect → infinite re-render | ✅ Fixed |
| 2 | HIGH | QR code logic wrong - generated QR of URL instead of using VietQR image | ✅ Fixed |
| 3 | HIGH | Bank info hardcoded in client code | ✅ Fixed (env vars) |
| 4 | MEDIUM | Missing accessibility attributes in CopyButton | ✅ Fixed |
| 5 | MEDIUM | Unused useRouter import | ✅ Fixed |
| 6 | LOW | No unit tests | Deferred |
| 7 | LOW | Incomplete error handling in copy | Deferred |

## Dev Agent Record

### Agent Model Used
Gemini 2.5 Pro (2026-01-11)

### Implementation Notes
- **Banking Payment Complete:** UI fully implemented with VietQR image
- **USDT Deferred:** As per user request, USDT shows "Sắp ra mắt" badge
- **Webhook Pending:** Manual confirmation button added for MVP
- Used VietQR image URL directly (simpler than generating QR locally)
- Bank info moved to environment variables for security
- All accessibility requirements implemented

### File List
- src/app/(marketing)/checkout/page.tsx (NEW)
- src/components/checkout/PaymentMethodSelector.tsx (NEW)
- src/components/checkout/BankingPayment.tsx (NEW)

### Change Log
- 2026-01-11: Story 1-6 Banking Payment implementation complete
- 2026-01-11: Code review fixes applied (5 issues fixed)
- USDT Payment deferred to future sprint
- Webhook integration pending for MVP
