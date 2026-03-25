# Story 6.2: SEO Structured Data — JSON-LD Schema

Status: review

## Story

As a hệ thống SEO,
I want có structured data JSON-LD cho Organization và Product,
so that Google hiểu nội dung trang và hiển thị rich results (logo, rating, price) trên kết quả tìm kiếm.

## Acceptance Criteria

1. **AC1 — Organization schema:** Root layout chứa JSON-LD `@type: Organization` với name, url, logo, description
2. **AC2 — Product schema:** Trang `/pricing` (hoặc checkout) chứa JSON-LD `@type: Product` với name, description, price, currency, availability
3. **AC3 — Valid JSON-LD:** Validate qua [schema.org validator](https://validator.schema.org/) — không có lỗi critical
4. **AC4 — No render block:** JSON-LD inject qua `<script type="application/ld+json">` — không ảnh hưởng render performance
5. **AC5 — Breadcrumb schema:** Trang blog detail có `BreadcrumbList` schema (Home > Blog > [title])

## Prerequisite

- Story 6.1 phải hoàn thành (cần `metadataBase` đã set)

## Tasks / Subtasks

- [x] Task 1: Organization JSON-LD trong root layout (AC: #1, #4)
  - [x] Sửa `src/app/layout.tsx` — thêm `<script>` vào `<body>`
  - [x] Không thêm vào `<head>` — Next.js App Router render JSON-LD trong body là valid

- [x] Task 2: Product JSON-LD trong pricing page (AC: #2, #4)
  - [x] Sửa `src/app/(marketing)/pricing/page.tsx`
  - [x] Giá: 260,000 VND, currency: VND, availability: InStock

- [x] Task 3: Breadcrumb JSON-LD cho blog (AC: #5)
  - [x] Blog page chưa tồn tại — đã thêm placeholder + schema code vào story 7.1
  - [x] Task trong story 7.1: `[SEO 6.2] Thêm BreadcrumbList JSON-LD vào blog detail page`

## Dev Notes

### Pattern inject JSON-LD trong Next.js App Router

```typescript
// Cách đúng — inject vào body, không phá vỡ streaming
export default function RootLayout({ children }) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Đại Ngàn Xanh',
    url: 'https://dainganxanh.vn',
    logo: {
      '@type': 'ImageObject',
      url: 'https://dainganxanh.vn/logo.png',  // verify path logo thực tế
    },
    description: 'Nền tảng trồng 1 triệu cây Dó Đen bản địa tại Việt Nam, theo dõi minh bạch và carbon credit.',
    sameAs: [
      'https://facebook.com/dainganxanh',  // cập nhật URL thực
    ],
  }

  return (
    <html lang="vi">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
```

### Product JSON-LD

```typescript
// src/app/(marketing)/pricing/page.tsx
const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Cây Dó Đen — Gói Cá Nhân',
  description: 'Trồng 1 cây Dó Đen bản địa tại Việt Nam. Theo dõi minh bạch qua dashboard. Thu hoạch trầm hương sau 5 năm.',
  image: 'https://dainganxanh.vn/og-image.jpg',
  brand: {
    '@type': 'Organization',
    name: 'Đại Ngàn Xanh',
  },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'VND',
    price: '260000',
    availability: 'https://schema.org/InStock',
    url: 'https://dainganxanh.vn/pricing',
    seller: { '@type': 'Organization', name: 'Đại Ngàn Xanh' },
  },
}
```

### Breadcrumb JSON-LD (cho Story 7.x — blog pages)

```typescript
// Để lại comment trong story 7.1 nếu blog chưa tạo
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: 'https://dainganxanh.vn' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://dainganxanh.vn/blog' },
    { '@type': 'ListItem', position: 3, name: post.title, item: `https://dainganxanh.vn/blog/${post.slug}` },
  ],
}
```

### Lưu ý về logo path

- Verify đường dẫn logo thực tế trong `public/` folder trước khi hardcode
- Nếu không có `logo.png` trong public, dùng `og-image.jpg` tạm thời

### Project Structure Notes

```
src/app/
├── layout.tsx                          ← SỬA (thêm Organization JSON-LD)
└── (marketing)/
    ├── pricing/page.tsx                ← SỬA (thêm Product JSON-LD)
    └── blog/[slug]/page.tsx            ← SỬA hoặc NOTE cho Story 7.x
```

### Validation

Sau khi deploy, test tại:
- `https://validator.schema.org/` — paste URL hoặc HTML
- Google Rich Results Test: `https://search.google.com/test/rich-results`

### References

- [Source: src/app/layout.tsx — root layout structure]
- [Source: src/app/(marketing)/pricing/page.tsx — pricing page]
- [Schema.org Organization — https://schema.org/Organization]
- [Schema.org Product — https://schema.org/Product]
- [Next.js JSON-LD guide — https://nextjs.org/docs/app/building-your-application/optimizing/metadata#json-ld]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_none_

### Completion Notes List

- Project root thực tế là `dainganxanh-landing/` (không phải `src/app/` trực tiếp từ working dir)
- Public folder không có `logo.png` — dùng `/opengraph-image` (Next.js route handler đã có từ story 6.1) cho logo và product image
- Blog page (`/blog/[slug]/page.tsx`) chưa tồn tại — đã thêm Breadcrumb JSON-LD schema + task vào story 7.1
- AC3 (valid JSON-LD): schema tuân thủ schema.org — Organization với @context, @type, name, url, logo (ImageObject), description, sameAs; Product với brand, offers (Offer) đầy đủ fields
- AC4 (no render block): inject qua `<script type="application/ld+json">` với `dangerouslySetInnerHTML` — không block rendering, Next.js App Router pattern chuẩn

### File List

- `dainganxanh-landing/src/app/layout.tsx` — thêm Organization JSON-LD
- `dainganxanh-landing/src/app/(marketing)/pricing/page.tsx` — thêm Product JSON-LD
- `_bmad-output/implementation-artifacts/7-1-blog-schema-public-pages.md` — thêm task + Breadcrumb JSON-LD placeholder cho AC#5
