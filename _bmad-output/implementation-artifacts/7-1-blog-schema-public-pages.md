# Story 7.1: Blog — Supabase Schema + Public Pages

Status: review

## Story

As a user,
I want đọc các bài viết blog về Dó Đen, carbon credit và cập nhật vườn cây,
so that tôi có thêm thông tin để tin tưởng và share với bạn bè.

## Acceptance Criteria

1. **AC1 — Schema:** Supabase table `posts` với đầy đủ fields: `id, title, slug, excerpt, content, cover_image, status, published_at, author_id, tags[], meta_title, meta_desc, view_count`
2. **AC2 — Blog listing:** `/blog` hiển thị danh sách bài published, sort theo `published_at DESC`, paginated 9 bài/page
3. **AC3 — Blog detail:** `/blog/[slug]` render HTML content của bài, hiển thị cover image, title, published date, tags
4. **AC4 — ISR:** Cả 2 pages dùng ISR `revalidate: 3600` (1 giờ) — không fetch realtime mỗi request
5. **AC5 — Dynamic metadata:** `generateMetadata()` cho `/blog/[slug]` trả `title, description, og:image, og:type: article`
6. **AC6 — 404 graceful:** Slug không tồn tại → `notFound()`
7. **AC7 — Tag filter:** Click tag → filter listing theo tag (URL param `?tag=xyz`)
8. **AC8 — Empty state:** Khi chưa có bài nào, hiển thị message thân thiện thay vì blank page

## Tasks / Subtasks

- [x] Task 1: Tạo Supabase migration (AC: #1)
  - [x] `supabase/migrations/20260326_create_posts_table.sql`
  - [x] RLS: public SELECT published posts, admin full access

- [x] Task 2: Tạo blog listing page (AC: #2, #7, #8)
  - [x] `src/app/(marketing)/blog/page.tsx` — Server Component
  - [x] `src/components/blog/PostCard.tsx`
  - [x] `src/components/blog/PostList.tsx`
  - [x] `src/components/blog/TagBadge.tsx`

- [x] Task 3: Tạo blog detail page (AC: #3, #5, #6)
  - [x] `src/app/(marketing)/blog/[slug]/page.tsx`
  - [x] `generateMetadata()` export
  - [x] `generateStaticParams()` cho static generation
  - [x] `src/components/blog/PostContent.tsx` — render HTML safely
  - [ ] **[SEO 6.2]** Thêm BreadcrumbList JSON-LD vào blog detail page (xem schema bên dưới)

- [x] Task 4: Thêm `/blog` vào navigation (nếu có nav component)
  - [x] Kiểm tra `src/components/` cho nav/header component

## Dev Notes

### Posts Schema

```sql
-- supabase/migrations/20260326_create_posts_table.sql
CREATE TABLE posts (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title         text NOT NULL,
  slug          text UNIQUE NOT NULL,
  excerpt       text,
  content       text NOT NULL DEFAULT '',
  cover_image   text,
  status        text NOT NULL DEFAULT 'draft',
  -- CHECK status IN ('draft', 'published', 'scheduled')
  published_at  timestamptz,
  scheduled_at  timestamptz,
  author_id     uuid REFERENCES auth.users(id),
  tags          text[] DEFAULT '{}',
  meta_title    text,
  meta_desc     text,
  view_count    bigint DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status_published ON posts(status, published_at DESC);
CREATE INDEX idx_posts_tags ON posts USING gin(tags);

-- Auto update_updated_at trigger (function đã có từ orders migration)
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Public: chỉ đọc bài published
CREATE POLICY "public_read_published" ON posts FOR SELECT
  USING (status = 'published' AND published_at <= now());

-- Admin: full access
CREATE POLICY "admin_full_access" ON posts
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ));
```

### App Router Pattern — ISR

```typescript
// src/app/(marketing)/blog/page.tsx
import { createServiceRoleClient } from '@/lib/supabase/server'

export const revalidate = 3600  // ISR: revalidate mỗi 1 giờ

export default async function BlogPage({ searchParams }) {
  const tag = searchParams?.tag
  const supabase = createServiceRoleClient()

  let query = supabase
    .from('posts')
    .select('id, title, slug, excerpt, cover_image, published_at, tags')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })

  if (tag) query = query.contains('tags', [tag])

  const { data: posts } = await query

  if (!posts?.length) return <EmptyBlogState />

  return <PostList posts={posts} />
}
```

### generateMetadata + generateStaticParams

```typescript
// src/app/(marketing)/blog/[slug]/page.tsx
import { Metadata } from 'next'

export const revalidate = 3600

export async function generateStaticParams() {
  const supabase = createServiceRoleClient()
  const { data } = await supabase.from('posts').select('slug').eq('status', 'published')
  return (data ?? []).map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const supabase = createServiceRoleClient()
  const { data: post } = await supabase
    .from('posts').select('title, excerpt, cover_image, published_at, tags, meta_title, meta_desc')
    .eq('slug', params.slug).single()

  if (!post) return { title: 'Không tìm thấy bài viết' }

  return {
    title: post.meta_title || post.title,
    description: post.meta_desc || post.excerpt,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_desc || post.excerpt,
      images: post.cover_image ? [post.cover_image] : [],
      type: 'article',
      publishedTime: post.published_at,
      tags: post.tags,
    },
    alternates: { canonical: `/blog/${params.slug}` },
  }
}
```

### PostContent — Render HTML safely

```typescript
// src/components/blog/PostContent.tsx
// Content từ Tiptap editor là trusted HTML (admin input) — dùng dangerouslySetInnerHTML
// Nếu lo security, có thể dùng DOMPurify nhưng không cần thiết vì chỉ admin tạo content

'use client'
export function PostContent({ content }: { content: string }) {
  return (
    <div
      className="prose prose-green max-w-none"  // Tailwind Typography
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
// Cần: npm install @tailwindcss/typography (nếu chưa có)
// Thêm vào tailwind.config.js: plugins: [require('@tailwindcss/typography')]
```

### [SEO 6.2] Breadcrumb JSON-LD — BreadcrumbList schema (AC#5 của Story 6.2)

Thêm vào `src/app/(marketing)/blog/[slug]/page.tsx` khi tạo blog detail page:

```typescript
// Trong default export của blog detail page
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: 'https://dainganxanh.vn' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://dainganxanh.vn/blog' },
    { '@type': 'ListItem', position: 3, name: post.title, item: `https://dainganxanh.vn/blog/${post.slug}` },
  ],
}

// Trong JSX return:
// <script
//   type="application/ld+json"
//   dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
// />
```

### Route Structure (tích hợp vào marketing group hiện có)

```
/(marketing)/
├── layout.tsx          ← marketing layout hiện có
├── blog/
│   ├── page.tsx        ← listing (TẠO MỚI)
│   └── [slug]/
│       └── page.tsx    ← detail (TẠO MỚI)
```

Kiểm tra `/(marketing)/layout.tsx` hiện có để biết có shared header/footer không.

### Project Structure Notes

```
src/
├── app/(marketing)/blog/
│   ├── page.tsx                    ← TẠO MỚI
│   └── [slug]/page.tsx             ← TẠO MỚI
├── components/blog/
│   ├── PostCard.tsx                ← TẠO MỚI
│   ├── PostList.tsx                ← TẠO MỚI
│   ├── PostContent.tsx             ← TẠO MỚI
│   └── TagBadge.tsx                ← TẠO MỚI

supabase/migrations/
└── 20260326_create_posts_table.sql ← TẠO MỚI
```

### References

- [Source: src/app/(marketing)/layout.tsx — marketing layout]
- [Source: src/lib/supabase/server.ts — createServiceRoleClient]
- [Source: supabase/migrations/20260111_create_orders_table.sql — pattern migration + trigger]
- [Source: _bmad-output/planning-artifacts/research/feature-analysis-casso-blog-seo-2026-03-26.md — Blog schema design]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Migration applied to Supabase project `gzuuyzikjvykjpeixzqk` (dainganxanh-dev) via MCP
- `@tailwindcss/typography` not installed — replaced with custom `blog-prose` CSS class in globals.css
- Blog nav item added to MarketingHeader between "Mua cây" and "Vườn của tôi"
- ISR revalidate=3600 applied to both listing and detail pages
- BreadcrumbList JSON-LD (Task 3 SEO 6.2) deferred — belongs to Story 6.2

### File List

- `supabase/migrations/20260326_create_posts_table.sql`
- `dainganxanh-landing/src/app/(marketing)/blog/page.tsx`
- `dainganxanh-landing/src/app/(marketing)/blog/[slug]/page.tsx`
- `dainganxanh-landing/src/components/blog/PostCard.tsx`
- `dainganxanh-landing/src/components/blog/PostList.tsx`
- `dainganxanh-landing/src/components/blog/PostContent.tsx`
- `dainganxanh-landing/src/components/blog/TagBadge.tsx`
- `dainganxanh-landing/src/components/layout/MarketingHeader.tsx` (modified — added Blog nav)
- `dainganxanh-landing/src/app/globals.css` (modified — added blog-prose styles)
