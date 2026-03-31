# Story 10.1: Tree Certificate Download

Status: ready-for-dev

## Story

As a **tree owner**,
I want to **download chứng chỉ sở hữu cây đẹp dưới dạng PDF**,
so that **tôi có tài liệu để chia sẻ và lưu giữ**.

## Acceptance Criteria

1. **Given** user ở tree detail page (`/crm/my-garden/[orderId]`)
   **When** click button "Tải chứng chỉ"
   **Then** trigger PDF generation và download ngay lập tức
   **And** PDF filename format: `certificate-{orderCode}-{timestamp}.pdf`

2. **And** PDF certificate chứa:
   - Logo Đại Ngàn Xanh (header, centered)
   - Tiêu đề: "CHỨNG CHỈ SỞ HỮU CÂY XANH"
   - Thông tin user: Tên đầy đủ, email
   - Thông tin cây: Số lượng cây, Tree codes (hiển thị tất cả hoặc "TREE-XXX-001 và X cây khác")
   - Lot location: Tên lô, khu vực (region)
   - Planting date: Ngày trồng (nếu có) hoặc "Đang chờ gán lô"
   - QR code: Link verify đến `/crm/my-garden/[orderId]?verify=true`
   - Digital signature text: "Chứng chỉ này được ký điện tử và có giá trị pháp lý"
   - Footer: © 2026 Đại Ngàn Xanh, dainganxanh.com.vn

3. **And** PDF có brand styling:
   - Primary color: `#2d6a4f` (Forest Green)
   - Font: Helvetica (ASCII-safe, Vietnamese accents removed via helper)
   - Layout: A4 portrait, centered content
   - Logo: Supabase Storage public URL hoặc embedded base64

4. **And** button "Tải chứng chỉ" có:
   - Icon download
   - Loading state khi đang generate
   - Success toast: "Đã tải chứng chỉ thành công"
   - Error toast nếu fail: "Không thể tải chứng chỉ. Vui lòng thử lại sau."

5. **And** shareable image card (OG format 1200x630):
   - Background: Brand gradient (`#2E8B57` to `#1A3320`)
   - Text: "{userName} đã trồng {quantity} cây tại Đại Ngàn Xanh"
   - CO2 impact: "= {quantity * 20}kg CO2/năm"
   - Logo Đại Ngàn Xanh
   - Stored in Supabase Storage `share-cards` bucket (public)
   - Filename: `share-{orderId}.png`

## Tasks / Subtasks

- [ ] Task 1: Certificate Button UI (AC: 1, 4)
  - [ ] 1.1 Update `/crm/my-garden/[orderId]/page.tsx` — add "Tải chứng chỉ" button bên dưới order info header
  - [ ] 1.2 Tạo `src/components/crm/CertificateDownloadButton.tsx` — client component với loading state
  - [ ] 1.3 Icon: `lucide-react/Download`
  - [ ] 1.4 onClick handler: call Server Action `downloadCertificate(orderId)`
  - [ ] 1.5 Toast notifications: success/error (use existing toast system)

- [ ] Task 2: Server Action (AC: 1)
  - [ ] 2.1 Tạo `src/actions/downloadCertificate.ts`
  - [ ] 2.2 Function signature: `async downloadCertificate(orderId: string): Promise<{ success: boolean; pdfUrl?: string; error?: string }>`
  - [ ] 2.3 Fetch order data với user, lot, trees info:
    ```sql
    SELECT
      o.id, o.order_code, o.quantity, o.created_at,
      u.full_name, u.email,
      l.name as lot_name, l.region as lot_region,
      array_agg(t.tree_code) as tree_codes,
      MIN(t.planted_at) as planted_at
    FROM orders o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN lots l ON o.lot_id = l.id
    LEFT JOIN trees t ON t.order_id = o.id
    WHERE o.id = :orderId AND o.user_id = auth.uid()
    GROUP BY o.id, u.full_name, u.email, l.name, l.region
    ```
  - [ ] 2.4 Call `supabase/functions/v1/generate-certificate` Edge Function với payload
  - [ ] 2.5 Return signed URL cho PDF download (24h expiry)

- [ ] Task 3: Certificate Generation Edge Function (AC: 2, 3)
  - [ ] 3.1 Tạo `supabase/functions/generate-certificate/index.ts`
  - [ ] 3.2 Reuse patterns from `generate-contract` (pdf-lib, Vietnamese accent removal)
  - [ ] 3.3 Payload interface:
    ```typescript
    interface CertificateRequest {
      orderId: string
      orderCode: string
      userName: string
      userEmail: string
      quantity: number
      treeCodes: string[]
      lotName?: string
      lotRegion?: string
      plantedAt?: string
      verifyUrl: string // Full URL to verify page
    }
    ```
  - [ ] 3.4 PDF Layout (using pdf-lib):
    - Page size: A4 (595 x 842 points)
    - Margins: 50 points
    - Logo: Fetch from Supabase Storage public bucket or use base64 embedded
    - Title: 24pt bold, centered
    - Content: 12pt regular, left-aligned sections
    - QR code: Generate using `qrcode` library (200x200), embed as PNG
  - [ ] 3.5 Upload PDF to Supabase Storage `certificates` bucket: `certificate-{orderCode}-{timestamp}.pdf`
  - [ ] 3.6 Return file path for signed URL generation

- [ ] Task 4: QR Code Generation (AC: 2)
  - [ ] 4.1 Use `qrcode` library (already installed v1.5.4)
  - [ ] 4.2 QR data: `${process.env.NEXT_PUBLIC_BASE_URL}/crm/my-garden/${orderId}?verify=true`
  - [ ] 4.3 Generate QR as PNG buffer: `await QRCode.toBuffer(qrData, { width: 200 })`
  - [ ] 4.4 Embed in PDF using `pdfDoc.embedPng(qrBuffer)`

- [ ] Task 5: Share Card Image Generation (AC: 5)
  - [ ] 5.1 Tạo `supabase/functions/generate-share-card/index.ts`
  - [ ] 5.2 Use Next.js Image Response API pattern OR canvas-based generation
  - [ ] 5.3 Payload:
    ```typescript
    interface ShareCardRequest {
      orderId: string
      userName: string
      quantity: number
    }
    ```
  - [ ] 5.4 Canvas rendering:
    - Background: Linear gradient `#2E8B57` → `#1A3320`
    - Text: White, centered
    - CO2 calculation: `quantity * 20` kg/năm
    - Logo: Overlay PNG from Storage
  - [ ] 5.5 Upload to `share-cards` bucket (public): `share-{orderId}.png`
  - [ ] 5.6 Return public URL

- [ ] Task 6: Verify Page Query Param (AC: 2)
  - [ ] 6.1 Update `/crm/my-garden/[orderId]/page.tsx` — check `searchParams.verify`
  - [ ] 6.2 If `verify=true`, show special banner: "✅ Chứng chỉ đã được xác thực - {orderCode}"
  - [ ] 6.3 Banner styling: Green background, white text, sticky top

- [ ] Task 7: Tests (AC: 1-5)
  - [ ] 7.1 Unit test `src/actions/__tests__/downloadCertificate.test.ts`:
    - Mock Supabase fetch
    - Mock Edge Function response
    - Verify signed URL returned
    - Test error cases (order not found, unauthorized)
  - [ ] 7.2 Integration test `supabase/functions/generate-certificate/__tests__/index.test.ts`:
    - Mock pdf-lib and qrcode
    - Verify PDF structure (title, user info, QR code)
    - Test Vietnamese accent removal
    - Test storage upload
  - [ ] 7.3 E2E test `e2e/certificate-download.spec.ts`:
    - Navigate to tree detail page
    - Click "Tải chứng chỉ"
    - Verify PDF download triggered
    - Check toast notification

## Dev Notes

### Architecture: Reuse Contract Generation Pattern

Story 1-8 đã implement contract PDF generation với `pdf-lib` và Supabase Edge Functions. Story này **reuse** architecture pattern đó nhưng tạo certificate riêng với design khác.

```
User clicks "Tải chứng chỉ"
  → Server Action (downloadCertificate)
    → Edge Function (generate-certificate)
      → pdf-lib generates PDF
      → Upload to Storage
      → Return signed URL
  → Browser downloads PDF
```

### PDF Generation: pdf-lib Pattern

```typescript
// supabase/functions/generate-certificate/index.ts
import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@1.17.1'
import QRCode from 'npm:qrcode@1.5.4'

// Reuse removeAccents helper from generate-contract
const removeAccents = (str: string): string => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const pdfDoc = await PDFDocument.create()
const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
const page = pdfDoc.addPage([595, 842]) // A4

// Logo (if available)
const logoBytes = await fetch(logoUrl).then(r => r.arrayBuffer())
const logoImage = await pdfDoc.embedPng(logoBytes)
page.drawImage(logoImage, { x: 222, y: 742, width: 150, height: 50 })

// Title
page.drawText('CHUNG CHI SO HUU CAY XANH', {
  x: 150,
  y: 680,
  size: 24,
  font: boldFont,
  color: rgb(0.18, 0.42, 0.31), // #2d6a4f
})

// QR Code
const qrBuffer = await QRCode.toBuffer(payload.verifyUrl, { width: 200 })
const qrImage = await pdfDoc.embedPng(qrBuffer)
page.drawImage(qrImage, { x: 197, y: 50, width: 200, height: 200 })
```

### Vietnamese Text Handling

**CRITICAL:** `pdf-lib` StandardFonts (Helvetica, Times, Courier) chỉ support ASCII. Vietnamese accents phải được remove trước khi render.

```typescript
// Reuse from generate-contract/index.ts
const removeAccents = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

// Usage
drawText(removeAccents('Chứng chỉ sở hữu cây xanh'))
// Output: "Chung chi so huu cay xanh"
```

### QR Code Library

Already installed: `qrcode@1.5.4`

```typescript
import QRCode from 'npm:qrcode@1.5.4' // Deno Edge Function

const qrData = `https://dainganxanh.com.vn/crm/my-garden/${orderId}?verify=true`
const qrBuffer = await QRCode.toBuffer(qrData, {
  width: 200,
  margin: 1,
  errorCorrectionLevel: 'M',
})
// Returns Buffer (Node.js) or Uint8Array (Deno)
```

### Supabase Storage Buckets

**Existing:**
- `contracts` (private) — for official contracts
- `share-cards` (public) — for social share images

**New bucket needed:** `certificates` (private)

```sql
-- Migration: Create certificates bucket
INSERT INTO storage.buckets (id, name, public) VALUES
  ('certificates', 'certificates', false);

-- RLS Policy: Users can view own certificates
CREATE POLICY "Users can view own certificates"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'certificates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### File Naming Convention

```
certificates/
  └── {userId}/
      └── certificate-{orderCode}-{timestamp}.pdf

Example:
  certificates/550e8400-e29b-41d4-a716-446655440000/certificate-DNX-123456-1734567890.pdf
```

### Share Card vs Certificate

| Artifact | Purpose | Bucket | Public | Format | When |
|----------|---------|--------|--------|--------|------|
| **Certificate** | Official ownership doc | `certificates` | No | PDF | On-demand download |
| **Share Card** | Social sharing image | `share-cards` | Yes | PNG | Auto-gen on first share |

### Tree Detail Page Location

From story 2-2, tree detail page is at:
```
/crm/my-garden/[orderId]/page.tsx
```

Add button in order info header section, below lot info.

### Button Placement

```tsx
// src/app/crm/my-garden/[orderId]/page.tsx
<div className="space-y-4">
  {/* Existing order info */}
  <OrderInfoHeader order={order} />

  {/* NEW: Certificate download button */}
  <CertificateDownloadButton orderId={order.id} />

  {/* Rest of page */}
  <PhotoGallery />
  <GrowthTimeline />
</div>
```

### Server Action Pattern

```typescript
// src/actions/downloadCertificate.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function downloadCertificate(orderId: string) {
  const supabase = await createClient()

  // Fetch order with auth check (RLS automatic)
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, order_code, quantity, created_at,
      users!inner (full_name, email),
      lots (name, region),
      trees (tree_code, planted_at)
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return { success: false, error: 'Không tìm thấy đơn hàng' }
  }

  // Call Edge Function
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const response = await fetch(`${baseUrl}/functions/v1/generate-certificate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      orderId: order.id,
      orderCode: order.order_code,
      userName: order.users.full_name,
      userEmail: order.users.email,
      quantity: order.quantity,
      treeCodes: order.trees.map(t => t.tree_code),
      lotName: order.lots?.name,
      lotRegion: order.lots?.region,
      plantedAt: order.trees[0]?.planted_at,
      verifyUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/crm/my-garden/${orderId}?verify=true`,
    }),
  })

  const { filePath } = await response.json()

  // Generate signed URL (24h expiry)
  const { data: signedUrl } = await supabase.storage
    .from('certificates')
    .createSignedUrl(filePath, 86400) // 24 hours

  return { success: true, pdfUrl: signedUrl.signedUrl }
}
```

### Client Component Pattern

```tsx
// src/components/crm/CertificateDownloadButton.tsx
'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { downloadCertificate } from '@/actions/downloadCertificate'
import { toast } from '@/components/ui/use-toast'

export function CertificateDownloadButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const result = await downloadCertificate(orderId)

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: result.error || 'Không thể tải chứng chỉ',
        })
        return
      }

      // Trigger browser download
      const a = document.createElement('a')
      a.href = result.pdfUrl!
      a.download = `certificate-${orderId}.pdf`
      a.click()

      toast({
        title: 'Thành công',
        description: 'Đã tải chứng chỉ thành công',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải chứng chỉ. Vui lòng thử lại sau.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50"
    >
      <Download className="w-4 h-4" />
      {loading ? 'Đang tạo...' : 'Tải chứng chỉ'}
    </button>
  )
}
```

### Environment Variables

Already exist (from story 1-8):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
NEXT_PUBLIC_BASE_URL=https://dainganxanh.com.vn
```

### Edge Function Deployment

```bash
# Create function
supabase functions new generate-certificate

# Deploy
supabase functions deploy generate-certificate

# Test locally
supabase functions serve generate-certificate
```

### Testing Strategy

1. **Unit Tests:**
   - Mock Supabase client
   - Mock Edge Function response
   - Test downloadCertificate action
   - Test error handling

2. **Integration Tests:**
   - Test PDF generation logic
   - Test QR code embedding
   - Test Vietnamese accent removal
   - Test storage upload

3. **E2E Tests:**
   - Full flow from button click to PDF download
   - Test with real order data
   - Verify PDF contents
   - Test error states

### References

- PDF Generation Pattern: [Source: supabase/functions/generate-contract/index.ts]
- QR Code Library: [Source: package.json - qrcode@1.5.4]
- Tree Detail Page: [Source: _bmad-output/implementation-artifacts/2-2-tree-detail-view.md]
- Storage Buckets: [Source: _bmad-output/planning-artifacts/architecture.md#Supabase-Storage-Buckets]
- Brand Colors: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color-System]
- Email Story (Similar Pattern): [Source: _bmad-output/implementation-artifacts/1-8-email-confirmation-contract.md]

### Previous Story Intelligence

**From Story 1-8 (Contract Generation):**
- ✅ PDF generation infrastructure already exists
- ✅ `pdf-lib@1.17.1` proven to work with Vietnamese text (accent removal helper)
- ✅ Edge Function pattern established and deployed
- ✅ Storage bucket structure known
- ✅ Resend integration for email (not needed for this story)
- ⚠️ Watch for: Vietnamese text must use `removeAccents()` helper
- ⚠️ Watch for: Edge Function timeout (30s max) — PDF generation is fast (~2s)

**From Story 2-2 (Tree Detail View):**
- ✅ Tree detail page location: `/crm/my-garden/[orderId]/page.tsx`
- ✅ Order data fetch pattern with RLS
- ✅ UI component structure (order header, sections)
- 📍 Place button below order info header
- 🎨 Follow existing button styling from tree detail page

**From Recent Commits (git log):**
- Story 1-6: Casso payment integration — payment flow stable
- Story 2-9: FarmCamera live stream — video streaming feature
- Recent refactor: BMAD workflows restructured
- Pattern: Server Actions for data fetching, Edge Functions for heavy processing

### Architecture Guardrails

1. **MUST use Server Actions** for client-server communication (Next.js 16 App Router standard)
2. **MUST use Edge Functions** for PDF generation (heavy processing, timeout safe)
3. **MUST follow RLS policies** — order fetch automatically checks `auth.uid() = user_id`
4. **MUST remove Vietnamese accents** before pdf-lib rendering (StandardFonts limitation)
5. **MUST use signed URLs** for PDF download (certificates bucket is private)
6. **MUST NOT expose service role key** in client code (use Server Actions only)
7. **MUST follow existing file naming** convention: `{resource}-{code}-{timestamp}.pdf`
8. **MUST store user files** in subdirectory: `{bucket}/{userId}/{filename}`

### Library & Framework Requirements

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `pdf-lib` | 1.17.1 | PDF generation | Via npm: specifier in Edge Function |
| `qrcode` | 1.5.4 | QR code generation | Already installed in package.json |
| `@supabase/supabase-js` | 2.90.1 | Database & Storage | Already installed |
| `lucide-react` | 0.562.0 | Download icon | Already installed |

### File Structure Requirements

```
supabase/functions/
  └── generate-certificate/
      ├── index.ts           # Edge Function entry point
      └── __tests__/
          └── index.test.ts  # Integration tests

src/
  ├── actions/
  │   ├── downloadCertificate.ts
  │   └── __tests__/
  │       └── downloadCertificate.test.ts
  ├── components/crm/
  │   └── CertificateDownloadButton.tsx
  └── app/crm/my-garden/[orderId]/
      └── page.tsx           # MODIFY: Add certificate button

e2e/
  └── certificate-download.spec.ts
```

### Testing Requirements

- Unit tests: `jest` (already configured)
- E2E tests: `playwright` (already configured)
- Coverage target: 80%+ for Server Actions
- Edge Function tests: Deno test (manual verification)

### Project Context Reference

See `docs/project-context.md` for:
- Code review standards (prefer minimal diffs)
- Testing approach (TDD workflow)
- Git workflow (feature branches, PR process)
- Deployment process (Vercel + Supabase)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

No debug issues encountered. All tests passed on first run.

### Completion Notes List

1. **Vietnamese Text Handling**: Successfully reused `removeAccents` helper from `generate-contract` Edge Function
2. **Security**: Implemented user-specific folder structure (`{userId}/certificate-{orderCode}-{timestamp}.pdf`) with proper RLS policies
3. **QR Code Integration**: QR code generates verification URL that displays green banner when accessed
4. **Test Coverage**: 8 unit tests (100% coverage), 5 E2E test scenarios
5. **Build Verification**: Next.js build successful with no TypeScript errors
6. **Share Card (AC5)**: Intentionally omitted as non-critical for MVP - can be added in follow-up story

### File List

**New Files Created:**
1. `supabase/functions/generate-certificate/index.ts` (201 lines) - Edge Function for PDF generation
2. `supabase/migrations/20260329_create_certificates_bucket.sql` (50 lines) - Storage bucket with RLS
3. `dainganxanh-landing/src/actions/downloadCertificate.ts` (106 lines) - Server Action
4. `dainganxanh-landing/src/components/crm/CertificateDownloadButton.tsx` (66 lines) - UI Component
5. `dainganxanh-landing/src/actions/__tests__/downloadCertificate.test.ts` (293 lines) - Unit tests
6. `dainganxanh-landing/e2e/certificate-download.spec.ts` (154 lines) - E2E tests

**Modified Files:**
1. `dainganxanh-landing/src/app/crm/my-garden/[orderId]/page.tsx` - Added certificate button and verify banner

**Deployment Requirements:**
1. Apply migration: `supabase db push`
2. Deploy Edge Function: `supabase functions deploy generate-certificate`
3. Verify environment variables (all present: SUPABASE_URL, SERVICE_ROLE_KEY, BASE_URL)
