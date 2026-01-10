# Story 4.1: Referral Link Generation

Status: ready-for-dev

## Story

As a **logged-in user**,
I want to **tạo link giới thiệu**,
so that **nhận hoa hồng khi bạn bè mua**.

## Acceptance Criteria

1. **Given** đăng nhập  
   **When** click "Giới thiệu bạn bè"  
   **Then** generate unique ref code: dainganxanh.com.vn/ref/{code}

2. **And** hiển thị trong dashboard với QR code

3. **And** copy button cho link

4. **And** track số lượng clicks và conversions

5. **And** hiển thị commission earned (nếu có)

## Tasks / Subtasks

- [ ] Task 1: Referral Page (AC: 1, 2, 3)
  - [ ] 1.1 Tạo `/src/app/crm/referrals/page.tsx`
  - [ ] 1.2 Display user's referral code
  - [ ] 1.3 Full link với QR code
  - [ ] 1.4 Copy to clipboard button

- [ ] Task 2: Referral Link Generator (AC: 1)
  - [ ] 2.1 Referral code đã tự động generate khi register (users.referral_code)
  - [ ] 2.2 Display trong format: `dainganxanh.com.vn/ref/{code}`
  - [ ] 2.3 Regenerate option nếu muốn

- [ ] Task 3: QR Code Display (AC: 2)
  - [ ] 3.1 Tạo `components/crm/ReferralQRCode.tsx`
  - [ ] 3.2 Use qrcode.react library
  - [ ] 3.3 Download QR as PNG

- [ ] Task 4: Click Tracking (AC: 4)
  - [ ] 4.1 Tạo `referral_clicks` table
  - [ ] 4.2 Landing page tracks utm_ref parameter
  - [ ] 4.3 Store click with timestamp, IP (hashed)

- [ ] Task 5: Conversion Tracking (AC: 4, 5)
  - [ ] 5.1 Update order với referred_by user_id
  - [ ] 5.2 Calculate commission (% of order)
  - [ ] 5.3 Display conversions list

- [ ] Task 6: Stats Dashboard (AC: 4, 5)
  - [ ] 6.1 Tạo `components/crm/ReferralStats.tsx`
  - [ ] 6.2 Cards: Total clicks, Conversions, Commission
  - [ ] 6.3 Conversion rate %

## Dev Notes

### Architecture Compliance
- **Route:** `/crm/referrals`
- **Tracking:** Server-side click tracking
- **Database:** `referral_clicks` table

### Database Schema Addition
```sql
CREATE TABLE referral_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  ip_hash TEXT, -- Hashed for privacy
  user_agent TEXT,
  converted BOOLEAN DEFAULT FALSE,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referral_clicks_referrer ON referral_clicks(referrer_id);
```

### Referral Tracking Flow
```
1. User shares: dainganxanh.com.vn/ref/ABC123
2. Friend clicks → Landing page
3. Landing page detects ?ref=ABC123
4. Store in cookie + create referral_click record
5. Friend registers → Link to referrer
6. Friend completes order → Mark click as converted
7. Calculate commission for referrer
```

### Commission Calculation
```typescript
const COMMISSION_RATE = 0.05 // 5% of order value

const calculateCommission = (orderAmount: number) => {
  return Math.round(orderAmount * COMMISSION_RATE)
}

// Example: Order 1,300,000 VNĐ → Commission 65,000 VNĐ
```

### Landing Page Ref Handling
```typescript
// app/(marketing)/page.tsx
export default function LandingPage({ searchParams }) {
  const refCode = searchParams.ref
  
  if (refCode) {
    // Set cookie for 30 days
    cookies().set('ref', refCode, { maxAge: 30 * 24 * 60 * 60 })
    
    // Track click server-side
    await trackReferralClick(refCode, headers())
  }
  
  return <Landing />
}
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Database-Schema]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.1]
- [Source: docs/prd.md#FR-20]

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### File List
- src/app/crm/referrals/page.tsx
- src/components/crm/ReferralQRCode.tsx
- src/components/crm/ReferralStats.tsx
- src/components/crm/ReferralLink.tsx
- src/lib/referralTracking.ts
- supabase/migrations/[timestamp]_create_referral_clicks.sql
