import { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { BookOpen } from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { PostList } from '@/components/blog/PostList'

export const revalidate = 3600 // ISR: revalidate every 1 hour

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'blog.meta' })
  const canonical = locale === 'vi' ? 'https://dainganxanh.com.vn/blog' : 'https://dainganxanh.com.vn/en/blog'
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical,
      languages: {
        vi: 'https://dainganxanh.com.vn/blog',
        en: 'https://dainganxanh.com.vn/en/blog',
        'x-default': 'https://dainganxanh.com.vn/blog',
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: canonical,
      siteName: 'Đại Ngàn Xanh',
      type: 'website',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
    },
  }
}

const PAGE_SIZE = 9

interface BlogPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tag?: string; page?: string }>
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const { tag, page: pageParam } = await searchParams
  const t = await getTranslations({ locale, namespace: 'blog.page' })
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
        <BlogHeader currentTag={tag} t={t} />
        <EmptyBlogState tag={tag} t={t} />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <BlogHeader currentTag={tag} t={t} />
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

function BlogHeader({ currentTag, t }: { currentTag?: string; t: any }) {
  return (
    <div className="text-center mb-10">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-4">
        <BookOpen className="w-7 h-7 text-emerald-600" />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
        {t('headerTitle')}
      </h1>
      <p className="text-gray-500 max-w-xl mx-auto">
        {currentTag
          ? t('tagFilterActive', { tag: currentTag })
          : t('headerSubtitle')}
      </p>
    </div>
  )
}

function EmptyBlogState({ tag, t }: { tag?: string; t: any }) {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🌱</div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">
        {tag ? t('emptyWithTag', { tag }) : t('empty')}
      </h2>
      <p className="text-gray-500 text-sm max-w-sm mx-auto">
        {t('emptyDesc')}
      </p>
    </div>
  )
}
