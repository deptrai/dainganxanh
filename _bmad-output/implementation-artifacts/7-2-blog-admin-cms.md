# Story 7.2: Blog Admin CMS — Tạo/Sửa/Xóa bài viết

Status: review

## Story

As a admin,
I want tạo, sửa và quản lý bài viết blog với rich text editor,
so that tôi có thể publish nội dung mới mà không cần developer.

## Acceptance Criteria

1. **AC1 — List page:** `/crm/admin/blog` — danh sách tất cả posts (draft + published), sort mới nhất trước
2. **AC2 — Create page:** `/crm/admin/blog/new` — form tạo bài với Tiptap editor
3. **AC3 — Edit page:** `/crm/admin/blog/[id]/edit` — sửa bài với pre-filled data
4. **AC4 — Fields bắt buộc:** title, content (Tiptap), status (draft/published)
5. **AC5 — Fields optional:** excerpt, cover_image (upload), tags (multi-input), meta_title, meta_desc
6. **AC6 — Image upload:** Upload cover image lên Supabase Storage bucket `blog-images`, lưu URL
7. **AC7 — Slug auto-generate:** Slug tự động generate từ title (Vietnamese → ASCII), có thể edit thủ công
8. **AC8 — Save draft / Publish:** 2 action buttons: "Lưu draft" và "Publish ngay"
9. **AC9 — Delete:** Xóa bài với confirm dialog
10. **AC10 — Admin only:** Tất cả routes protected bởi `AdminLayout` hiện có

## Prerequisite

- Story 7.1 phải hoàn thành (cần `posts` table schema)

## Tasks / Subtasks

- [x] Task 1: Admin blog list page (AC: #1, #9, #10)
  - [x] `src/app/crm/admin/blog/page.tsx`
  - [x] Table: title, status badge, published_at, actions (Edit, Delete)
  - [x] Delete với `confirm()` dialog

- [x] Task 2: Install Tiptap (AC: #2, #3)
  - [x] `npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder`

- [x] Task 3: BlogEditor component (AC: #2, #3, #4, #5, #7, #8)
  - [x] `src/components/admin/blog/BlogEditor.tsx` — Client Component
  - [x] Tiptap editor với extensions: Bold, Italic, Heading (H2-H4), BulletList, OrderedList, Image, Link, Blockquote, CodeBlock
  - [x] Form fields: title, excerpt, tags, meta_title, meta_desc, status
  - [x] Auto slug generation từ title
  - [x] Buttons: "Lưu Draft" + "Publish"

- [x] Task 4: Image upload (AC: #6)
  - [x] `src/actions/blog.ts` — Server Action upload image
  - [x] Supabase Storage bucket: `blog-images` (migration: `20260326_create_blog_images_bucket.sql`)
  - [x] Tiptap Image extension nhận URL sau khi upload

- [x] Task 5: Server Actions CRUD (AC: #2, #3, #9)
  - [x] `src/actions/blog.ts`: `createPost`, `updatePost`, `deletePost`
  - [x] Validate: title không được rỗng, slug unique

- [x] Task 6: Thêm vào AdminSidebar (AC: #10)
  - [x] `src/components/admin/AdminSidebar.tsx` — thêm "Blog" nav item

## Dev Notes

### Admin Layout — Không cần thêm auth

```
/crm/admin/layout.tsx đã handle:
- auth.getUser() check
- users.role IN ('admin', 'super_admin') check
- Redirect → /crm/dashboard nếu không phải admin
```

### Tiptap Setup

```typescript
// src/components/admin/blog/BlogEditor.tsx
'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'

const editor = useEditor({
  extensions: [
    StarterKit,
    Image.configure({ allowBase64: false }),  // chỉ URL
    Link.configure({ openOnClick: false }),
  ],
  content: initialContent,
  onUpdate: ({ editor }) => {
    onChange(editor.getHTML())  // lưu HTML
  },
})
```

### Slug generation — Vietnamese to ASCII

```typescript
// utils/slug.ts
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // remove diacritics
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
// "Cây Dó Đen là gì?" → "cay-do-den-la-gi"
```

### Server Actions pattern (từ `src/actions/withdrawals.ts`)

```typescript
// src/actions/blog.ts
'use server'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify admin
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['admin', 'super_admin'].includes(profile?.role)) throw new Error('Forbidden')

  const { error } = await supabase.from('posts').insert({
    title: formData.get('title'),
    slug: formData.get('slug'),
    content: formData.get('content'),
    excerpt: formData.get('excerpt') || null,
    status: formData.get('status'),
    published_at: formData.get('status') === 'published' ? new Date().toISOString() : null,
    author_id: user.id,
    tags: JSON.parse(formData.get('tags') as string || '[]'),
    meta_title: formData.get('meta_title') || null,
    meta_desc: formData.get('meta_desc') || null,
  })

  if (error) throw error
  revalidatePath('/blog')
  revalidatePath('/crm/admin/blog')
}
```

### Image Upload — Supabase Storage

```typescript
// Tạo bucket 'blog-images' trên Supabase dashboard (public read)
// hoặc migration:
// INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true);

export async function uploadBlogImage(file: File): Promise<string> {
  const supabase = createServiceRoleClient()
  const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`
  const { data, error } = await supabase.storage
    .from('blog-images')
    .upload(fileName, file, { contentType: file.type })

  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('blog-images').getPublicUrl(fileName)
  return publicUrl
}
```

### Project Structure Notes

```
src/
├── app/crm/admin/blog/
│   ├── page.tsx                    ← TẠO MỚI (list)
│   ├── new/page.tsx                ← TẠO MỚI
│   └── [id]/edit/page.tsx          ← TẠO MỚI
├── components/admin/
│   ├── blog/
│   │   └── BlogEditor.tsx          ← TẠO MỚI (Client Component)
│   └── AdminSidebar.tsx            ← SỬA (thêm Blog nav)
├── actions/
│   └── blog.ts                     ← TẠO MỚI
└── lib/utils/
    └── slug.ts                     ← TẠO MỚI (hoặc thêm vào utils.ts hiện có)
```

### Regression Risk

- `AdminSidebar.tsx` — chỉ thêm nav item, không thay đổi logic hiện tại
- Package install Tiptap — không conflict với dependencies hiện có

### References

- [Source: src/app/crm/admin/layout.tsx — admin auth pattern]
- [Source: src/app/crm/admin/orders/page.tsx — admin list page pattern]
- [Source: src/actions/withdrawals.ts — Server Action pattern]
- [Source: src/components/admin/AdminSidebar.tsx — sidebar nav]
- [Source: _bmad-output/planning-artifacts/research/feature-analysis-casso-blog-seo-2026-03-26.md — Blog schema]
- [Tiptap docs — https://tiptap.dev/docs/editor/getting-started/install/nextjs]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

- `src/app/crm/admin/blog/page.tsx` — List page with table + status badges
- `src/app/crm/admin/blog/DeletePostButton.tsx` — Client Component for delete with confirm dialog
- `src/app/crm/admin/blog/new/page.tsx` — Create post page
- `src/app/crm/admin/blog/[id]/edit/page.tsx` — Edit post page (pre-fills data from DB)
- `src/components/admin/blog/BlogEditor.tsx` — Tiptap rich-text editor + full form (Client Component)
- `src/actions/blog.ts` — Server Actions: createPost, updatePost, deletePost, uploadBlogImage
- `src/lib/utils/slug.ts` — Vietnamese → ASCII slug utility
- `src/components/admin/AdminSidebar.tsx` — Added Blog nav item (DocumentTextIcon)
- `supabase/migrations/20260326_create_blog_images_bucket.sql` — blog-images Storage bucket + RLS policies
