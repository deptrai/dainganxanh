# Story 6.1: SEO Core Setup — metadataBase, robots, sitemap, OG Image

Status: review

## Story

As a hệ thống,
I want có đầy đủ SEO foundation (sitemap, robots, OG image, canonical URL),
so that Google index đúng tất cả trang public và social preview hiển thị đẹp khi share.

## Acceptance Criteria

1. **AC1 — metadataBase:** Root layout có `metadataBase: new URL('https://dainganxanh.vn')` — fix OG image relative URL
2. **AC2 — robots.txt:** `/robots.txt` cho phép crawl trang public, block `/crm/`, `/api/`, `/(auth)/`
3. **AC3 — sitemap.xml:** `/sitemap.xml` chứa tất cả static pages + blog posts published (fetch từ Supabase)
4. **AC4 — OG Image:** Trang chủ có preview image 1200×630 khi share lên Facebook/Zalo
5. **AC5 — Title template:** Tất cả trang dùng template `%s | Đại Ngàn Xanh` thay vì title tĩnh
6. **AC6 — Canonical:** Mỗi static page có `alternates.canonical` URL đúng
7. **AC7 — Không break hiện tại:** Metadata hiện có trong `layout.tsx` được preserve, chỉ bổ sung

## Tasks / Subtasks

- [x] Task 1: Cập nhật root layout metadata (AC: #1, #5, #6)
  - [x] Sửa `src/app/layout.tsx`
  - [x] Thêm `metadataBase`, `title.template`, `alternates.canonical`
  - [x] Cập nhật `openGraph.images` với URL tuyệt đối
  - [x] Preserve keywords, authors, twitter card hiện có

- [x] Task 2: Tạo `src/app/robots.ts` (AC: #2)
  - [x] Allow: `/`
  - [x] Disallow: `/crm/`, `/api/`, `/login`, `/register`
  - [x] Include sitemap URL

- [x] Task 3: Tạo `src/app/sitemap.ts` (AC: #3)
  - [x] Static pages: `/`, `/blog`, `/pricing`
  - [x] Dynamic: fetch `posts` từ Supabase (nếu blog table chưa tồn tại, chỉ dùng static pages — có fallback)
  - [x] Dùng `createServiceRoleClient()` cho server-side Supabase call

- [x] Task 4: Tạo OG Image (AC: #4)
  - [x] Tạo `src/app/opengraph-image.tsx` dùng `ImageResponse` từ `next/og`
  - [x] Size: 1200×630, màu brand xanh lá

- [x] Task 5: Per-page canonical cho marketing pages (AC: #6)
  - [x] `src/app/(marketing)/pricing/page.tsx` — thêm export metadata với canonical
  - [x] Các trang khác nếu thiếu canonical

## Dev Notes

### Hiện trạng layout.tsx (KHÔNG xóa, chỉ bổ sung)

```typescript
// src/app/layout.tsx — HIỆN TẠI (preserve toàn bộ):
export const metadata: Metadata = {
  title: 'Đại Ngàn Xanh - Gieo Hạt Lành, Gặt Phước Báu',
  description: 'Trồng 1.000.000 cây Dó Đen bản địa...',
  keywords: ['trồng cây', 'dó đen', ...],
  authors: [{ name: 'Đại Ngàn Xanh' }],
  openGraph: { title, description, type: 'website', locale: 'vi_VN' },
  twitter: { card: 'summary_large_image', ... },
}
```

**Sau khi sửa — thêm vào:**
```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://dainganxanh.vn'),  // ← THÊM
  title: {                                            // ← ĐỔI từ string sang object
    default: 'Đại Ngàn Xanh - Gieo Hạt Lành, Gặt Phước Báu',
    template: '%s | Đại Ngàn Xanh',
  },
  description: '...',    // giữ nguyên
  keywords: [...],       // giữ nguyên
  authors: [...],        // giữ nguyên
  openGraph: {
    ...openGraphHienTai,
    url: 'https://dainganxanh.vn',       // ← THÊM
    siteName: 'Đại Ngàn Xanh',          // ← THÊM
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }], // ← THÊM (hoặc dùng opengraph-image.tsx)
  },
  twitter: { ...twitterHienTai },       // giữ nguyên, thêm images nếu chưa có
  alternates: { canonical: 'https://dainganxanh.vn' }, // ← THÊM
}
```

### robots.ts

```typescript
// src/app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/crm/', '/api/', '/login', '/register'],
      },
    ],
    sitemap: 'https://dainganxanh.vn/sitemap.xml',
  }
}
```

### sitemap.ts — Với fallback khi blog chưa có

```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next'
import { createServiceRoleClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: 'https://dainganxanh.vn', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://dainganxanh.vn/pricing', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ]

  // Blog posts — fallback nếu table chưa tồn tại
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createServiceRoleClient()
    const { data: posts } = await supabase
      .from('posts')
      .select('slug, updated_at')
      .eq('status', 'published')

    blogPages = (posts ?? []).map(post => ({
      url: `https://dainganxanh.vn/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    // Blog index page — chỉ thêm nếu có posts
    if (blogPages.length > 0) {
      staticPages.push({ url: 'https://dainganxanh.vn/blog', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 })
    }
  } catch {
    // posts table chưa tồn tại — skip silently
  }

  return [...staticPages, ...blogPages]
}
```

### opengraph-image.tsx

```typescript
// src/app/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Đại Ngàn Xanh'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div style={{
        background: 'linear-gradient(135deg, #1a5c2e 0%, #2d8a4e 100%)',
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'serif',
      }}>
        <div style={{ color: '#90ee90', fontSize: 28, marginBottom: 16 }}>🌿</div>
        <h1 style={{ color: 'white', fontSize: 64, margin: 0, textAlign: 'center' }}>
          Đại Ngàn Xanh
        </h1>
        <p style={{ color: '#b8f0c8', fontSize: 28, margin: '16px 0 0', textAlign: 'center' }}>
          Gieo một mầm xanh, dệt nên đại ngàn vĩnh cửu
        </p>
        <p style={{ color: '#90ee90', fontSize: 20, margin: '24px 0 0' }}>
          dainganxanh.vn
        </p>
      </div>
    ),
    { ...size }
  )
}
```

### Kiểm tra pages cần canonical

```
/(marketing)/pricing/     → export metadata { alternates: { canonical: '/pricing' } }
/(marketing)/checkout/    → KHÔNG cần canonical (noindex page)
/(auth)/login/           → KHÔNG cần (đã trong robots disallow)
```

### Project Structure Notes

```
src/app/
├── layout.tsx              ← SỬA (thêm metadataBase, title template, og URL)
├── robots.ts               ← TẠO MỚI
├── sitemap.ts              ← TẠO MỚI
├── opengraph-image.tsx     ← TẠO MỚI
└── (marketing)/
    └── pricing/page.tsx    ← SỬA (thêm canonical metadata)
```

### Deployment checklist sau khi xong

- [ ] Submit `/sitemap.xml` lên Google Search Console
- [ ] Test OG image: nhập URL vào [https://developers.facebook.com/tools/debug/]
- [ ] Verify robots.txt: `https://dainganxanh.vn/robots.txt`
- [ ] Run Lighthouse audit cho Core Web Vitals

### References

- [Source: src/app/layout.tsx — metadata hiện tại cần preserve]
- [Source: src/lib/supabase/server.ts — createServiceRoleClient()]
- [Next.js Sitemap Docs — https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap]
- [Next.js Robots Docs — https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots]
- [Next.js OG Image — https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_No blockers encountered._

### Completion Notes List

- **Task 1:** Cập nhật `src/app/layout.tsx` — thêm `metadataBase`, chuyển `title` sang object với `default` + `template`, thêm `alternates.canonical`, thêm `openGraph.url`, `openGraph.siteName`, `openGraph.images`, thêm `twitter.images`. Tất cả keywords, authors, description được preserve.
- **Task 2:** Tạo `src/app/robots.ts` — Next.js MetadataRoute.Robots, allow `/`, disallow `/crm/`, `/api/`, `/login`, `/register`, kèm sitemap URL.
- **Task 3:** Tạo `src/app/sitemap.ts` — static pages (`/`, `/pricing`), dynamic blog posts từ Supabase với fallback try/catch khi `posts` table chưa tồn tại. Blog index `/blog` chỉ thêm vào nếu có posts.
- **Task 4:** Tạo `src/app/opengraph-image.tsx` — edge runtime, 1200×630, gradient xanh lá brand, dùng `next/og` ImageResponse.
- **Task 5:** Refactor `pricing/page.tsx` thành server component (tách client logic vào `PricingPageClient.tsx`), export `metadata` với `alternates.canonical`.
- **Build:** `next build` thành công, tất cả routes `/robots.txt`, `/sitemap.xml`, `/opengraph-image`, `/pricing` xuất hiện đúng.

### File List

- `dainganxanh-landing/src/app/layout.tsx` (modified)
- `dainganxanh-landing/src/app/robots.ts` (created)
- `dainganxanh-landing/src/app/sitemap.ts` (created)
- `dainganxanh-landing/src/app/opengraph-image.tsx` (created)
- `dainganxanh-landing/src/app/(marketing)/pricing/page.tsx` (modified)
- `dainganxanh-landing/src/components/marketing/PricingPageClient.tsx` (created)

## Change Log

| Date | Change |
|------|--------|
| 2026-03-26 | Implement Story 6.1: SEO Core Setup — metadataBase, robots.ts, sitemap.ts, opengraph-image.tsx, pricing canonical. Build passes. |
