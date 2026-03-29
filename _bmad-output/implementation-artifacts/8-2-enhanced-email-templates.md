# Story 8.2: Enhanced Email Templates

Status: ready-for-dev

## Story

As a **customer**,
I want to **nhận email đẹp với logo, ảnh cây, màu brand và layout responsive**,
so that **trải nghiệm thương hiệu nhất quán và email engagement cao hơn**.

## Acceptance Criteria

1. **Given** thanh toán được xác nhận (Casso webhook)
   **When** email xác nhận đơn hàng được gửi
   **Then** email render HTML với: logo Đại Ngàn Xanh, màu brand `#2d6a4f`, order summary (số cây, tổng tiền), CTA button "Xem vườn của tôi", footer có unsubscribe link
   **And** mobile-responsive (kiểm tra trên Gmail + iOS Mail)

2. **Given** admin gán lô cây cho đơn hàng (`assignOrderToLot`)
   **When** email thông báo gán cây được gửi
   **Then** email có: lot name, số cây được trồng, tree codes, map preview (static image), CTA "Theo dõi cây của tôi"

3. **Given** admin upload ảnh mới cho lô (`photoUpload`)
   **When** email quarterly update được gửi
   **Then** email có: ảnh nhúng (tối đa 3 ảnh grid), CO2 absorbed update, progress timeline, CTA "Xem thêm ảnh"

4. **Given** withdrawal request được tạo / approved / rejected
   **When** email withdrawal status được gửi
   **Then** email có: trạng thái rõ ràng (icon + màu), số tiền, thông tin ngân hàng, thời gian xử lý dự kiến

5. **Given** cây đến năm thứ 5 (harvest notification)
   **When** email thu hoạch được gửi
   **Then** email có: ảnh cây trưởng thành, 3 options rõ ràng (Sell Back / Keep Growing / Receive Product) với CTA cho từng option

6. **Given** admin xem Email Templates trong Settings
   **When** click "Preview"
   **Then** hiển thị rendered HTML của template mới (từ React Email) thay vì plain HTML cũ trong DB

7. **Given** bất kỳ email nào được gửi
   **When** render
   **Then** có unsubscribe link ở footer (compliance)
   **And** "From" name: "Đại Ngàn Xanh <no-reply@dainganxanh.com.vn>"

## Tasks / Subtasks

- [ ] Task 1: Setup React Email infrastructure (AC: 1–7)
  - [ ] 1.1 Install dependencies: `npm install @react-email/components @react-email/render`
  - [ ] 1.2 Tạo `src/lib/email/sender.ts` — helper `sendEmail(to: string, subject: string, emailComponent: React.ReactElement)` dùng Resend SDK trực tiếp
  - [ ] 1.3 Tạo `src/lib/email/templates/BaseLayout.tsx` — shared wrapper với logo, brand colors, footer, unsubscribe link

- [ ] Task 2: Purchase Confirmation template (AC: 1)
  - [ ] 2.1 Tạo `src/lib/email/templates/PurchaseConfirmation.tsx`
  - [ ] 2.2 Props: `{ userName, orderCode, quantity, totalAmount, dashboardUrl }`
  - [ ] 2.3 Nội dung: order summary table, CO2 impact estimate, CTA button "Xem vườn của tôi"
  - [ ] 2.4 Tích hợp vào Casso webhook `src/app/api/webhooks/casso/route.ts` (thay thế call hiện tại)

- [ ] Task 3: Tree Assigned template (AC: 2)
  - [ ] 3.1 Tạo `src/lib/email/templates/TreeAssigned.tsx`
  - [ ] 3.2 Props: `{ userName, lotName, lotRegion, quantity, treeCodes, orderDetailUrl }`
  - [ ] 3.3 Nội dung: lot info, tree codes list (tối đa 5, "và X cây khác"), CTA "Theo dõi cây của tôi"
  - [ ] 3.4 Update `src/actions/assignOrderToLot.ts`: thay `fetch(functions/v1/send-tree-assignment-email)` bằng `sendEmail()` với template mới

- [ ] Task 4: Quarterly Update template (AC: 3)
  - [ ] 4.1 Tạo `src/lib/email/templates/QuarterlyUpdate.tsx`
  - [ ] 4.2 Props: `{ userName, quarter, lotName, photoUrls: string[], co2Absorbed, treeAge, gardenUrl }`
  - [ ] 4.3 Nội dung: photo grid (tối đa 3), stats (CO2, tuổi cây), timeline milestone, CTA
  - [ ] 4.4 Expose `sendQuarterlyUpdateEmail(userId, data)` function trong `src/lib/email/sender.ts`

- [ ] Task 5: Withdrawal Status templates (AC: 4)
  - [ ] 5.1 Tạo `src/lib/email/templates/WithdrawalStatus.tsx`
  - [ ] 5.2 Props: `{ userName, type: 'created'|'approved'|'rejected', amount, bankName, bankAccountNumber, reason?: string }`
  - [ ] 5.3 Update `src/actions/withdrawals.ts`: thay `sendWithdrawalEmail()` helper (fetch Edge Function) bằng `sendEmail()` với template mới
  - [ ] 5.4 Xóa helper `sendWithdrawalEmail` cũ sau khi migrate xong

- [ ] Task 6: Harvest Notification template (AC: 5)
  - [ ] 6.1 Tạo `src/lib/email/templates/HarvestNotification.tsx`
  - [ ] 6.2 Props: `{ userName, treeCount, harvestUrl, sellBackUrl, keepGrowingUrl, receiveProductUrl }`
  - [ ] 6.3 Nội dung: 3 CTA buttons nổi bật cho 3 options, value summary

- [ ] Task 7: Admin Preview update (AC: 6)
  - [ ] 7.1 Tạo `src/lib/email/preview.ts` — export `getTemplatePreviewHtml(templateKey: string, sampleData?: object): string` dùng `@react-email/render`
  - [ ] 7.2 Update `getEmailTemplatePreview()` trong `src/actions/system-settings.ts` để dùng `getTemplatePreviewHtml()` thay vì DB `html_body`
  - [ ] 7.3 `templateKey` mapping: `purchase_confirmation`, `tree_assigned`, `quarterly_update`, `withdrawal_request_created`, `withdrawal_request_approved`, `withdrawal_request_rejected`, `harvest_notification`

- [ ] Task 8: Tests (AC: 1–7)
  - [ ] 8.1 Unit test `src/lib/email/__tests__/sender.test.ts`: mock Resend, verify `sendEmail()` calls `resend.emails.send()` với đúng params
  - [ ] 8.2 Snapshot test `src/lib/email/__tests__/templates.test.tsx`: render mỗi template với sample data, verify HTML output contains key elements (brand color, CTA text, props data)
  - [ ] 8.3 Unit test `src/lib/email/__tests__/preview.test.ts`: `getTemplatePreviewHtml()` returns non-empty HTML cho mỗi templateKey

## Dev Notes

### Architecture: Direct Resend vs Edge Functions

**Hiện tại**: Actions gọi `fetch()` đến Supabase Edge Functions (`send-withdrawal-email`, `send-tree-assignment-email`, `send-email`). Edge Functions này presumably dùng Resend SDK + DB templates.

**Mới**: Server Actions gọi `sendEmail()` trực tiếp dùng Resend SDK — **đơn giản hơn nhiều**, không cần round-trip qua Edge Function. Resend SDK đã được cài (`"resend": "^6.7.0"`).

```
Trước:  Server Action → fetch Edge Function → Edge Function → Resend API
Sau:    Server Action → sendEmail() → Resend API
```

### `sender.ts` Pattern

```typescript
// src/lib/email/sender.ts
import { Resend } from 'resend'
import { render } from '@react-email/render'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(
  to: string,
  subject: string,
  emailComponent: React.ReactElement
): Promise<{ success: boolean; error?: string }> {
  const html = await render(emailComponent)
  const { error } = await resend.emails.send({
    from: 'Đại Ngàn Xanh <no-reply@dainganxanh.com.vn>',
    to,
    subject,
    html,
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}
```

### React Email Key APIs

- `@react-email/components` exports: `Html`, `Head`, `Body`, `Container`, `Section`, `Row`, `Column`, `Img`, `Text`, `Link`, `Button`, `Hr`, `Preview`, `Heading`
- `render(element)` → returns HTML string (async)
- `render(element, { pretty: true })` → formatted HTML for preview

### Brand Design System

| Token | Value |
|-------|-------|
| Primary | `#2d6a4f` |
| Primary Light | `#40916c` |
| Background | `#f0fdf4` |
| Text | `#1f2937` |
| Text Muted | `#6b7280` |
| Font | `'Inter', Arial, sans-serif` |
| Max Width | `600px` |

### BaseLayout Template Pattern

```tsx
// src/lib/email/templates/BaseLayout.tsx
export function BaseLayout({ children, previewText }: { children: React.ReactNode; previewText?: string }) {
  return (
    <Html lang="vi">
      <Head />
      {previewText && <Preview>{previewText}</Preview>}
      <Body style={{ backgroundColor: '#f0fdf4', fontFamily: 'Inter, Arial, sans-serif' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
          {/* Header: Logo */}
          <Section style={{ backgroundColor: '#2d6a4f', padding: '24px' }}>
            <Img src="https://dainganxanh.com.vn/logo.png" alt="Đại Ngàn Xanh" width="160" />
          </Section>
          {/* Content */}
          {children}
          {/* Footer */}
          <Section style={{ padding: '24px', borderTop: '1px solid #e5e7eb' }}>
            <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
              © 2026 Đại Ngàn Xanh. <Link href="{{unsubscribe_url}}">Hủy đăng ký nhận email</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

### Existing Email Callers — BẮT BUỘC Update

| File | Current call | Replace with |
|------|-------------|-------------|
| `src/actions/withdrawals.ts:7-17` | `sendWithdrawalEmail()` helper → `fetch(send-withdrawal-email)` | `sendEmail()` + `WithdrawalStatus` template |
| `src/actions/assignOrderToLot.ts:154-165` | `fetch(send-tree-assignment-email)` | `sendEmail()` + `TreeAssigned` template |
| `src/actions/printQueue.ts:189-200` | `fetch(send-email)` | `sendEmail()` + appropriate template |
| `src/app/api/webhooks/casso/route.ts` | (check if sends email) | `sendEmail()` + `PurchaseConfirmation` template |

### Environment Variables

```bash
# .env.local — RESEND_API_KEY là biến private (không có NEXT_PUBLIC_ prefix)
RESEND_API_KEY=re_xxxxxxx    # Đã có hoặc cần tạo trên resend.com
```

### Resend SDK v6.7.0 API (đã installed)

```typescript
import { Resend } from 'resend'  // default export
const resend = new Resend(process.env.RESEND_API_KEY)
await resend.emails.send({ from, to, subject, html })
// Returns: { data: { id }, error: null } | { data: null, error: { message } }
```

### Testing Approach

```typescript
// Mock Resend in tests
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })
    }
  }))
}))

// Mock @react-email/render
jest.mock('@react-email/render', () => ({
  render: jest.fn().mockResolvedValue('<html>mocked</html>')
}))
```

For snapshot tests, render actual React Email component to HTML and check for key strings:
```typescript
import { render } from '@react-email/render'
import PurchaseConfirmation from '../PurchaseConfirmation'

const html = await render(<PurchaseConfirmation userName="Luis" orderCode="DNX-123" quantity={5} totalAmount={1300000} dashboardUrl="https://..." />)
expect(html).toContain('Luis')
expect(html).toContain('5 cây')
expect(html).toContain('#2d6a4f')
```

### File Locations

| File | Type | Note |
|------|------|------|
| `src/lib/email/sender.ts` | Utility | `'use server'` OK (called from server actions) |
| `src/lib/email/preview.ts` | Utility | Preview helper for admin |
| `src/lib/email/templates/BaseLayout.tsx` | Template | Shared wrapper |
| `src/lib/email/templates/PurchaseConfirmation.tsx` | Template | NEW |
| `src/lib/email/templates/TreeAssigned.tsx` | Template | NEW |
| `src/lib/email/templates/QuarterlyUpdate.tsx` | Template | NEW |
| `src/lib/email/templates/WithdrawalStatus.tsx` | Template | NEW |
| `src/lib/email/templates/HarvestNotification.tsx` | Template | NEW |
| `src/actions/withdrawals.ts` | Action | MODIFY — replace `sendWithdrawalEmail()` |
| `src/actions/assignOrderToLot.ts` | Action | MODIFY — replace Edge Function fetch |
| `src/actions/printQueue.ts` | Action | MODIFY — replace Edge Function fetch |
| `src/app/api/webhooks/casso/route.ts` | API Route | MODIFY — add purchase confirmation email |
| `src/actions/system-settings.ts` | Action | MODIFY — `getEmailTemplatePreview()` |

### Previous Story Context

Story 8-1 (Web Push) cũng modify `photoUpload.ts` và `assignOrderToLot.ts`. Khi implement story này, cần **rebase** hoặc merge changes carefully để tránh conflict ở `assignOrderToLot.ts`.

### References

- Email patterns: [Source: src/actions/withdrawals.ts#sendWithdrawalEmail]
- Edge Function calls: [Source: src/actions/assignOrderToLot.ts:154]
- EmailTemplatesList: [Source: src/components/admin/settings/EmailTemplatesList.tsx]
- getEmailTemplatePreview: [Source: src/actions/system-settings.ts]
- Resend SDK: installed as `"resend": "^6.7.0"` in package.json

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
