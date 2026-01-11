# Story 1.8: Email Confirmation với Contract PDF

Status: review

## Story

As a **buyer**,
I want to **nhận email với hợp đồng PDF và mã cây**,
so that **tôi có tài liệu chính thức**.

## Acceptance Criteria

1. **Given** thanh toán confirmed  
   **When** hệ thống xử lý đơn hàng  
   **Then** email gửi trong 5 phút đến email đã đăng ký

2. **And** email chứa:
   - PDF contract (signed digitally)
   - Tree code(s): TREE-2026-XXXXX
   - Link dashboard: `/crm/my-garden`

3. **And** email mobile-responsive

4. **And** PDF có đầy đủ thông tin pháp lý

## Tasks / Subtasks

- [ ] Task 1: Email Template (AC: 2, 3)
  - [ ] 1.1 Tạo `email-templates/order-confirmation.html`
  - [ ] 1.2 Responsive HTML email template
  - [ ] 1.3 Include: Order summary, tree codes, dashboard link
  - [ ] 1.4 Brand styling: Green theme, logo

- [ ] Task 2: PDF Contract Generation (AC: 2, 4)
  - [ ] 2.1 Tạo `supabase/functions/generate-contract/index.ts`
  - [ ] 2.2 Use PDFKit hoặc Puppeteer cho PDF generation
  - [ ] 2.3 Contract template với user info, tree codes
  - [ ] 2.4 Digital signature placeholder
  - [ ] 2.5 Upload PDF to Supabase Storage (`contracts` bucket)

- [ ] Task 3: Email Sending Function (AC: 1)
  - [ ] 3.1 Tạo `supabase/functions/send-email/index.ts`
  - [ ] 3.2 Resend API integration
  - [ ] 3.3 Attach PDF contract
  - [ ] 3.4 Handle failures with retry logic

- [ ] Task 4: Tree Code Generation (AC: 2)
  - [ ] 4.1 Update `supabase/functions/process-payment/index.ts`
  - [ ] 4.2 Generate codes: `TREE-{year}-{orderPrefix}{seq}`
  - [ ] 4.3 Insert into `trees` table

- [ ] Task 5: Email Trigger Integration (AC: 1)
  - [ ] 5.1 Call `send-email` from `process-payment` function
  - [ ] 5.2 Include orderId, userId, treeCodes, contractUrl
  - [ ] 5.3 Log email status trong database

## Dev Notes

### Architecture Compliance
- **Edge Functions:** 
  - `generate-contract` - PDF generation
  - `send-email` - Email via SendGrid
- **Storage:** Supabase Storage `contracts` bucket
- **Trigger:** Called from `process-payment` after trees created

### Technology Requirements
- **PDF:** @react-pdf/renderer hoặc PDFKit
- **Email:** Resend API với attachments (3,000 emails/month free)
- **Storage:** Supabase Storage

### Email Template Structure
```html
Subject: 🌳 Chúc mừng! Đơn hàng #{order_code} đã được xác nhận

Body:
- Header với logo
- Greeting: "Xin chào {user_name}"
- Order summary table
- Tree codes list
- Dashboard button
- Footer với contact info
- Attachment: contract.pdf
```

### Contract PDF Content
- Header với logo công ty
- Thông tin người mua
- Danh sách mã cây
- Điều khoản chăm sóc 5 năm
- Cam kết thu mua lại
- Chữ ký điện tử
- QR code verify

### Environment Variables
- `RESEND_API_KEY` - Get from https://resend.com/api-keys
- `RESEND_FROM_EMAIL` - Verified sender email (e.g., noreply@dainganxanh.com)

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Supabase-Edge-Functions]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.8]
- [Source: docs/prd.md#FR-07]

## Dev Agent Record

### Agent Model Used
Claude 4.5 Sonnet

### Implementation Summary
**Date:** 2026-01-11

**Infrastructure Setup:**
- ✅ Resend account created (phanquochoipt@gmail.com)
- ✅ API Key: `re_EXsBoj17_Lqz8xAGwWgNjio9KTMpSC1Ne`
- ✅ Database tables: `trees`, `email_logs`, `orders` (with RLS policies)
- ✅ Supabase Storage: `contracts` bucket (private)

**Implementation Completed:**
1. **Email Template** - Responsive HTML with order summary, tree codes, impact stats
2. **Edge Functions:**
   - `send-email` - Resend integration với PDF attachment
   - `generate-contract` - PDF generation using pdf-lib
   - `process-payment` - Orchestrator cho toàn bộ flow
3. **Database Migration** - Orders table với indexes và RLS
4. **Tree Code Generation** - Format `TREE-2026-XXXXX`

### File List
- email-templates/order-confirmation.html (NEW)
- supabase/functions/send-email/index.ts (NEW)
- supabase/functions/generate-contract/index.ts (NEW)
- supabase/functions/process-payment/index.ts (NEW)
- supabase/functions/README.md (NEW)
- supabase/migrations/20260111_create_orders_table.sql (NEW)

### Change Log
- 2026-01-11: Story 1-8 implementation complete
- Infrastructure setup: Resend, database tables, storage bucket
- Edge Functions created for email, PDF, and payment processing
- Ready for deployment and testing

### Deployment Required

**1. Set Supabase Secrets:**
```bash
supabase secrets set RESEND_API_KEY=re_EXsBoj17_Lqz8xAGwWgNjio9KTMpSC1Ne
supabase secrets set RESEND_FROM_EMAIL=noreply@dainganxanh.com
supabase secrets set NEXT_PUBLIC_BASE_URL=https://dainganxanh.com
```

**2. Deploy Edge Functions:**
```bash
cd dainganxanh-landing
supabase functions deploy send-email
supabase functions deploy generate-contract
supabase functions deploy process-payment
```

**3. Test Flow:**
```bash
curl -X POST https://[project-ref].supabase.co/functions/v1/process-payment \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "userEmail": "test@example.com",
    "userName": "Test User",
    "orderCode": "DH123456",
    "quantity": 5,
    "totalAmount": 1300000,
    "paymentMethod": "banking"
  }'
```

### Notes
- Email template uses Handlebars-style variables
- PDF contract includes legal terms and digital signature
- All functions include error logging
- Email failures don't block payment processing
- Domain verification needed for production emails (thtmmo.com)
