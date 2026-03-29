# Feature Analysis: Casso Integration, Blog System & SEO
**Project:** Đại Ngàn Xanh
**Date:** 2026-03-26
**Analyst:** Mary (BMad Analyst Agent)
**Stack:** Next.js 14 App Router · Supabase · TypeScript

---

## FEATURE 1: Tích hợp Casso — Auto-check Balance Thanh Toán

### 1.1 Tổng quan Casso API

Casso (casso.vn) là dịch vụ Banking Automation của Việt Nam, hỗ trợ tự động nhận thông báo giao dịch ngân hàng qua Webhook. Project hiện dùng MB Bank (`771368999999`) — Casso hỗ trợ đầy đủ.

**Casso Webhook V2** (recommended) — payload mẫu:
```json
{
  "error": 0,
  "data": {
    "id": 1,
    "tid": "TF80307914",
    "description": "DNX-ABC12345 chuyen khoan mua cay",
    "amount": 520000,
    "cusum_balance": 15900500,
    "when": "2026-03-26 10:30:00",
    "bank_sub_acc_id": "771368999999",
    "subAccId": 1,
    "type": 1,
    "bookingDate": "2026-03-26",
    "paymentChannel": "MB"
  }
}
```

**Security:** Casso gắn `Secure-Token` vào HTTP Header — không phải HMAC-SHA256, là token tĩnh bạn set trên dashboard Casso. Cần lưu vào env var và verify mỗi request.

---

### 1.2 Luồng tích hợp chi tiết

```
User chuyển khoản MB Bank
     ↓ (nội dung: "DNX-{orderCode}")
Casso nhận transaction (≤ 5 giây)
     ↓
POST /api/webhooks/casso
  Headers: { "secure-token": "xxx" }
  Body: { data: { id, tid, description, amount, when, ... } }
     ↓
[Verify] secure-token === process.env.CASSO_SECURE_TOKEN
     ↓
[Idempotency] Check Supabase: tid/id đã xử lý chưa?
     ↓
[Parse] Extract orderCode từ description (regex)
     ↓
[Match] Tìm order trong Supabase theo orderCode
     ↓
[Validate] amount >= order.total_amount (tolerance ±1000đ)
     ↓
[Process] Update order.status = 'paid'
     ↓
Trigger Supabase Edge Function "process-payment"
     ↓
Email confirmation + tree assignment
```

---

### 1.3 Technical Specs

#### API Route: `POST /api/webhooks/casso`

```typescript
// src/app/api/webhooks/casso/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

const CASSO_SECURE_TOKEN = process.env.CASSO_SECURE_TOKEN!
const ORDER_CODE_REGEX = /DNX-([A-Z0-9]{8,12})/i

export async function POST(req: NextRequest) {
  // 1. Verify secure token
  const token = req.headers.get('secure-token')
  if (token !== CASSO_SECURE_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const tx = body?.data
  if (!tx) return NextResponse.json({ ok: true }) // ignore non-data events

  // 2. Idempotency — check đã process chưa
  const supabase = createServiceRoleClient()
  const { data: existing } = await supabase
    .from('casso_transactions')
    .select('id')
    .eq('casso_tid', tx.tid)
    .single()

  if (existing) return NextResponse.json({ ok: true, duplicate: true })

  // 3. Log transaction (luôn log trước khi process)
  await supabase.from('casso_transactions').insert({
    casso_id: tx.id,
    casso_tid: tx.tid,
    amount: tx.amount,
    description: tx.description,
    bank_account: tx.bank_sub_acc_id,
    transaction_at: tx.when,
    raw_payload: tx,
    status: 'processing',
  })

  // 4. Parse orderCode từ nội dung CK
  const match = tx.description?.match(ORDER_CODE_REGEX)
  if (!match) {
    await supabase.from('casso_transactions')
      .update({ status: 'no_match', note: 'orderCode not found in description' })
      .eq('casso_tid', tx.tid)
    return NextResponse.json({ ok: true, note: 'no orderCode in description' })
  }

  const orderCode = match[1].toUpperCase()

  // 5. Tìm order + validate amount
  const { data: order } = await supabase
    .from('orders')
    .select('id, total_amount, status, user_id, user_email, user_name, quantity')
    .eq('order_code', orderCode)
    .eq('status', 'pending')
    .single()

  if (!order) {
    await supabase.from('casso_transactions')
      .update({ status: 'order_not_found', note: `Order ${orderCode} not found or not pending` })
      .eq('casso_tid', tx.tid)
    return NextResponse.json({ ok: true, note: 'order not found' })
  }

  const amountDiff = Math.abs(tx.amount - order.total_amount)
  if (amountDiff > 1000) { // tolerance 1,000đ
    await supabase.from('casso_transactions')
      .update({ status: 'amount_mismatch', note: `Expected ${order.total_amount}, got ${tx.amount}` })
      .eq('casso_tid', tx.tid)
    return NextResponse.json({ ok: true, note: 'amount mismatch' })
  }

  // 6. Trigger process-payment Edge Function
  const { error: fnError } = await supabase.functions.invoke('process-payment', {
    body: {
      userId: order.user_id,
      userEmail: order.user_email,
      userName: order.user_name,
      orderCode: orderCode,
      quantity: order.quantity,
      amount: order.total_amount,
      source: 'casso_webhook',
    },
  })

  const finalStatus = fnError ? 'function_error' : 'processed'
  await supabase.from('casso_transactions')
    .update({ status: finalStatus, order_id: order.id })
    .eq('casso_tid', tx.tid)

  return NextResponse.json({ ok: true })
}
```

#### Supabase Migration: `casso_transactions`
```sql
CREATE TABLE casso_transactions (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  casso_id        bigint,
  casso_tid       text UNIQUE NOT NULL,
  amount          bigint NOT NULL,
  description     text,
  bank_account    text,
  transaction_at  timestamptz,
  raw_payload     jsonb,
  status          text NOT NULL DEFAULT 'processing',
  -- processing | processed | no_match | order_not_found | amount_mismatch | function_error | duplicate
  note            text,
  order_id        uuid REFERENCES orders(id),
  created_at      timestamptz DEFAULT now()
);

-- RLS: chỉ service role được write
ALTER TABLE casso_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_only" ON casso_transactions USING (false);
```

#### Env vars cần thêm
```bash
CASSO_SECURE_TOKEN=your_casso_secure_token_from_dashboard
```

---

### 1.4 User Stories

| ID | Story | AC |
|----|-------|----|
| CAS-01 | Là admin, tôi muốn Casso tự động xác nhận thanh toán để không cần verify thủ công | Order chuyển sang "paid" trong ≤ 30 giây sau khi CK |
| CAS-02 | Là user, tôi muốn nhận email xác nhận ngay sau khi CK thành công | Email đến trong ≤ 2 phút |
| CAS-03 | Là admin, tôi muốn xem log tất cả giao dịch Casso | Table `casso_transactions` có đủ trạng thái |
| CAS-04 | Là admin, tôi muốn xem các giao dịch không khớp để xử lý thủ công | `status = 'no_match' / 'amount_mismatch'` hiển thị trên admin dashboard |
| CAS-05 | Là hệ thống, tôi không muốn xử lý duplicate webhook | Idempotency check theo `casso_tid` |

### 1.5 Effort Estimate
- Setup Casso account + webhook config: **0.5 ngày**
- API Route + idempotency + logging: **1 ngày**
- Supabase migration + admin view: **0.5 ngày**
- Testing (simulation): **0.5 ngày**
- **Tổng: ~2.5 ngày dev**

---

## FEATURE 2: Trang Blog — User (Public) & Admin (CMS)

### 2.1 Architecture

```
/blog                    → danh sách bài (public, SSG/ISR)
/blog/[slug]             → chi tiết bài (public, SSG/ISR)
/crm/blog                → admin list bài
/crm/blog/new            → tạo bài mới
/crm/blog/[id]/edit      → sửa bài
```

Tích hợp vào route structure hiện có: `(marketing)/blog` cho public, `/crm/blog` cho admin.

### 2.2 Supabase Schema

```sql
-- Posts table
CREATE TABLE posts (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title         text NOT NULL,
  slug          text UNIQUE NOT NULL,
  excerpt       text,                    -- mô tả ngắn cho SEO & listing
  content       text NOT NULL,           -- HTML từ rich text editor
  cover_image   text,                    -- URL từ Supabase Storage
  status        text NOT NULL DEFAULT 'draft',
  -- draft | published | scheduled
  published_at  timestamptz,
  scheduled_at  timestamptz,
  author_id     uuid REFERENCES auth.users(id),
  tags          text[] DEFAULT '{}',
  meta_title    text,                    -- SEO override title
  meta_desc     text,                    -- SEO override description
  view_count    bigint DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Public: chỉ đọc bài published
CREATE POLICY "public_read_published" ON posts
  FOR SELECT USING (status = 'published' AND published_at <= now());

-- Admin: full access
CREATE POLICY "admin_full_access" ON posts
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status_published ON posts(status, published_at DESC);
CREATE INDEX idx_posts_tags ON posts USING gin(tags);
```

### 2.3 Component Architecture

```
src/app/(marketing)/blog/
├── page.tsx                    # Blog listing — ISR revalidate 3600s
├── [slug]/
│   └── page.tsx                # Blog detail — ISR revalidate 3600s
│   └── generateMetadata.ts     # Dynamic SEO per post

src/app/crm/blog/
├── page.tsx                    # Admin: list bài (draft + published)
├── new/
│   └── page.tsx                # Tạo bài mới
└── [id]/edit/
    └── page.tsx                # Sửa bài

src/components/blog/
├── PostCard.tsx                # Card trong listing
├── PostList.tsx                # Grid/list posts
├── PostContent.tsx             # Render HTML content safely
├── TagBadge.tsx                # Tag pill
└── PostEditor.tsx              # Rich text editor (admin)
```

### 2.4 Rich Text Editor

Dùng **Tiptap** (React, headless, dễ style với Tailwind):
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link
```

Extensions cần thiết: Bold, Italic, Heading (H2-H4), BulletList, OrderedList, Image (upload Supabase Storage), Link, CodeBlock, Blockquote.

### 2.5 SEO cho Blog — Dynamic Metadata

```typescript
// src/app/(marketing)/blog/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)
  if (!post) return {}

  return {
    title: post.meta_title || post.title,
    description: post.meta_desc || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.cover_image],
      type: 'article',
      publishedTime: post.published_at,
      tags: post.tags,
    },
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  }
}

// JSON-LD structured data cho bài viết
export default async function BlogPostPage({ params }) {
  const post = await getPostBySlug(params.slug)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image,
    datePublished: post.published_at,
    author: { '@type': 'Organization', name: 'Đại Ngàn Xanh' },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* content */}
    </>
  )
}
```

### 2.6 User Stories

| ID | Story | AC |
|----|-------|----|
| BLG-01 | Là user, tôi muốn đọc blog bài viết về Dó Đen, carbon credit | `/blog` load < 2s, hiển thị danh sách bài published |
| BLG-02 | Là user, tôi muốn đọc bài chi tiết với ảnh đẹp | `/blog/[slug]` render đúng HTML, ảnh optimized |
| BLG-03 | Là user, tôi muốn filter bài theo tag | Click tag → filter list |
| BLG-04 | Là admin, tôi muốn tạo bài viết với rich text editor | Editor hỗ trợ heading, image, link, list |
| BLG-05 | Là admin, tôi muốn upload ảnh thumbnail trực tiếp | Ảnh lưu vào Supabase Storage, URL auto-fill |
| BLG-06 | Là admin, tôi muốn lưu draft trước khi publish | Status "draft" không hiện trên public |
| BLG-07 | Là admin, tôi muốn schedule bài đăng tương lai | `scheduled_at` → cron job auto publish |
| BLG-08 | Là SEO, mỗi bài blog cần có metadata riêng | `generateMetadata` trả đúng title/desc/og |

### 2.7 Effort Estimate
- Supabase schema + RLS: **0.5 ngày**
- Public blog pages (listing + detail): **2 ngày**
- Admin CMS (list + editor + upload): **3 ngày**
- SEO metadata + JSON-LD: **0.5 ngày**
- **Tổng: ~6 ngày dev**

---

## FEATURE 3: Tối ưu SEO

### 3.1 Audit Hiện trạng

| Hạng mục | Hiện trạng | Điểm |
|----------|-----------|------|
| Global metadata (title, desc) | ✅ Có | Tốt |
| Open Graph basic | ✅ Có | Cần thêm `og:image` |
| `metadataBase` | ❌ Thiếu | Quan trọng — OG image bị relative URL |
| `sitemap.xml` | ❌ Thiếu | Quan trọng cho indexing |
| `robots.txt` | ❌ Thiếu | Cần block `/crm`, `/api` |
| Structured Data JSON-LD | ❌ Thiếu | Rich results |
| Per-page metadata | ❌ Thiếu | Chỉ có global |
| Canonical URL | ❌ Thiếu | Prevent duplicate content |
| OG Image động | ❌ Thiếu | Tăng CTR social |
| `next/image` optimization | Cần kiểm tra | Core Web Vitals |

### 3.2 Implementation Plan

#### PRIORITY 1 — Quick wins (½ ngày)

**a) Thêm `metadataBase` vào root layout:**
```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://dainganxanh.vn'), // domain thật
  title: {
    default: 'Đại Ngàn Xanh - Gieo Hạt Lành, Gặt Phước Báu',
    template: '%s | Đại Ngàn Xanh',
  },
  description: 'Trồng 1.000.000 cây Dó Đen bản địa cho Việt Nam. Chỉ 260.000 VNĐ/cây.',
  keywords: ['trồng cây', 'dó đen', 'môi trường', 'carbon credit', 'trầm hương', 'Việt Nam'],
  openGraph: {
    title: 'Đại Ngàn Xanh - Gieo Hạt Lành, Gặt Phước Báu',
    description: 'Gieo một mầm xanh, dệt nên đại ngàn vĩnh cửu',
    type: 'website',
    locale: 'vi_VN',
    url: 'https://dainganxanh.vn',
    siteName: 'Đại Ngàn Xanh',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Đại Ngàn Xanh' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Đại Ngàn Xanh',
    description: 'Trồng 1.000.000 cây Dó Đen bản địa cho Việt Nam',
    images: ['/og-image.jpg'],
  },
  alternates: { canonical: 'https://dainganxanh.vn' },
}
```

**b) Tạo `src/app/robots.ts`:**
```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/crm/', '/api/', '/(auth)/'] },
    ],
    sitemap: 'https://dainganxanh.vn/sitemap.xml',
  }
}
```

#### PRIORITY 2 — Sitemap động (½ ngày)

**`src/app/sitemap.ts`:**
```typescript
import { MetadataRoute } from 'next'
import { createServiceRoleClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceRoleClient()

  // Lấy danh sách blog posts
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at')
    .eq('status', 'published')

  const staticPages: MetadataRoute.Sitemap = [
    { url: 'https://dainganxanh.vn', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://dainganxanh.vn/blog', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://dainganxanh.vn/pricing', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]

  const blogPages: MetadataRoute.Sitemap = (posts ?? []).map(post => ({
    url: `https://dainganxanh.vn/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...blogPages]
}
```

#### PRIORITY 3 — Structured Data JSON-LD (½ ngày)

**Organization schema (root layout):**
```typescript
// src/app/layout.tsx — thêm vào body
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Đại Ngàn Xanh',
  url: 'https://dainganxanh.vn',
  logo: 'https://dainganxanh.vn/logo.png',
  description: 'Nền tảng trồng cây Dó Đen và carbon credit tại Việt Nam',
  sameAs: ['https://facebook.com/dainganxanh'], // thêm social links
}
```

**Product schema (trang pricing/checkout):**
```typescript
const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Cây Dó Đen — Gói Cá Nhân',
  description: 'Trồng 1 cây Dó Đen bản địa tại Việt Nam, theo dõi minh bạch qua dashboard.',
  offers: {
    '@type': 'Offer',
    priceCurrency: 'VND',
    price: '260000',
    availability: 'https://schema.org/InStock',
  },
}
```

#### PRIORITY 4 — OG Image động (1 ngày)

```typescript
// src/app/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export default function Image() {
  return new ImageResponse(
    <div style={{ background: '#1a5c2e', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ color: 'white', fontSize: 64 }}>Đại Ngàn Xanh</h1>
      <p style={{ color: '#90ee90', fontSize: 32 }}>Gieo một mầm xanh, dệt nên đại ngàn vĩnh cửu</p>
    </div>,
    { width: 1200, height: 630 }
  )
}
```

### 3.3 Checklist hoàn thiện

- [ ] `metadataBase` + `og:image` URL vào root layout
- [ ] `src/app/robots.ts`
- [ ] `src/app/sitemap.ts` (fetch posts từ Supabase)
- [ ] `src/app/opengraph-image.tsx`
- [ ] Organization JSON-LD trong root layout
- [ ] Product JSON-LD trên trang `/pricing`
- [ ] Per-page metadata cho `/blog/[slug]` (kết hợp Feature 2)
- [ ] Audit `next/image` — thay thế `<img>` thường
- [ ] Submit sitemap lên Google Search Console
- [ ] Core Web Vitals check với Lighthouse

### 3.4 User Stories

| ID | Story | AC |
|----|-------|----|
| SEO-01 | Site có sitemap.xml để Google index | `/sitemap.xml` trả đúng XML, chứa tất cả public pages |
| SEO-02 | Site có robots.txt block /crm, /api | `/robots.txt` đúng chuẩn |
| SEO-03 | Trang chủ có OG image khi share Facebook/Zalo | Preview hiện ảnh 1200×630 |
| SEO-04 | Mỗi trang có title/desc riêng | Template `%s | Đại Ngàn Xanh` |
| SEO-05 | Google hiểu organization & product | JSON-LD valid theo schema.org |
| SEO-06 | Core Web Vitals đạt "Good" | LCP < 2.5s, CLS < 0.1, FID < 100ms |

### 3.5 Effort Estimate
- Quick wins (metadataBase, robots, sitemap): **1 ngày**
- OG image động: **0.5 ngày**
- JSON-LD structured data: **0.5 ngày**
- Image audit + next/image: **0.5 ngày**
- **Tổng: ~2.5 ngày dev**

---

## TỔNG KẾT SPRINT PLAN

| Feature | Stories | Effort | Sprint |
|---------|---------|--------|--------|
| 🏦 Casso Integration | CAS-01 → CAS-05 | 2.5 ngày | Sprint 1 |
| 🔎 SEO Cơ Bản | SEO-01 → SEO-06 | 2.5 ngày | Sprint 1 |
| 📝 Blog MVP | BLG-01 → BLG-08 | 6 ngày | Sprint 2 |

**Sprint 1 (~5 ngày):** Casso + SEO — high impact, low effort
**Sprint 2 (~6 ngày):** Blog system — content engine dài hạn

---

*Sources:*
- [Casso Webhook Setup (EN)](https://developer.casso.vn/english-v2-new/webhook/thiet-lap-webhook-thu-cong)
- [Casso API Webhook](https://developer.casso.vn/casso-api/api/thiet-lap-webhook)
- [Next.js SEO Best Practices 2025](https://www.slatebytes.com/articles/next-js-seo-in-2025-best-practices-meta-tags-and-performance-optimization-for-high-google-rankings)
- [Next.js Sitemap API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js SEO App Router Guide](https://prateeksha.com/blog/nextjs-app-router-seo-metadata-sitemaps-canonicals)
