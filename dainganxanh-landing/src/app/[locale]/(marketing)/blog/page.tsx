import { Metadata } from 'next'
import { BookOpen } from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { PostList } from '@/components/blog/PostList'

export const revalidate = 3600 // ISR: revalidate every 1 hour

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Cập nhật mới nhất về cây Dó Đen, carbon credit và vườn cây Đại Ngàn Xanh.',
}

const PAGE_SIZE = 9

interface BlogPageProps {
  searchParams: Promise<{ tag?: string; page?: string }>
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { tag, page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = createServiceRoleClient()

  // Build query
  let query = supabase
    .from('posts')
    .select('id, title, slug, excerpt, cover_image, published_at, tags', { count: 'exact' })
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .range(from, to)

  if (tag) query = query.contains('tags', [tag])

  const { data: posts, count, error } = await query

  // Fetch all tags for the filter bar (published posts only)
  const { data: allPostsForTags } = await supabase
    .from('posts')
    .select('tags')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())

  const allTags = Array.from(
    new Set((allPostsForTags ?? []).flatMap((p: { tags?: string[] }) => p.tags ?? []))
  ).sort() as string[]

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // Empty state
  if (!posts?.length && !error) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <BlogHeader currentTag={tag} />
        <EmptyBlogState tag={tag} />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <BlogHeader currentTag={tag} />
      <PostList
        posts={posts ?? []}
        currentTag={tag}
        allTags={allTags}
        page={page}
        totalPages={totalPages}
      />
    </div>
  )
}

function BlogHeader({ currentTag }: { currentTag?: string }) {
  return (
    <div className="text-center mb-10">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-4">
        <BookOpen className="w-7 h-7 text-emerald-600" />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
        Blog Đại Ngàn Xanh
      </h1>
      <p className="text-gray-500 max-w-xl mx-auto">
        {currentTag
          ? `Bài viết về "${currentTag}"`
          : 'Tin tức, kiến thức về cây Dó Đen, carbon credit và cập nhật từ vườn cây.'}
      </p>
    </div>
  )
}

function EmptyBlogState({ tag }: { tag?: string }) {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🌱</div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">
        {tag ? `Chưa có bài viết về "${tag}"` : 'Chưa có bài viết nào'}
      </h2>
      <p className="text-gray-500 text-sm max-w-sm mx-auto">
        Chúng tôi đang chuẩn bị nội dung. Hãy quay lại sớm để cập nhật tin tức mới nhất từ vườn cây!
      </p>
    </div>
  )
}
