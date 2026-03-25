import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import BlogEditor from '@/components/admin/blog/BlogEditor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, slug, content, excerpt, cover_image, status, tags, meta_title, meta_desc, published_at')
    .eq('id', id)
    .single()

  if (error || !post) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/crm/admin/blog"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Danh sách bài viết
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sửa bài viết</h1>
          <p className="mt-2 text-gray-600 text-sm font-mono">/blog/{post.slug}</p>
        </div>
        {post.status === 'published' && (
          <Link
            href={`/blog/${post.slug}`}
            target="_blank"
            className="px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
          >
            Xem bài viết →
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <BlogEditor
          post={{
            id: post.id,
            title: post.title,
            slug: post.slug,
            content: post.content ?? '',
            excerpt: post.excerpt,
            cover_image: post.cover_image,
            status: post.status,
            tags: post.tags ?? [],
            meta_title: post.meta_title,
            meta_desc: post.meta_desc,
          }}
        />
      </div>
    </div>
  )
}
