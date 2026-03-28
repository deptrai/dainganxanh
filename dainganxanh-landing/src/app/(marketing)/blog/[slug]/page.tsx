import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ArrowLeft, Calendar, Eye } from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { PostContent } from '@/components/blog/PostContent'
import { TagBadge } from '@/components/blog/TagBadge'
import { BlogSidebar } from '@/components/blog/BlogSidebar'

export const revalidate = 3600 // ISR: revalidate every 1 hour

interface PostPageProps {
  params: Promise<{ slug: string }>
}

// Pre-generate paths for published posts at build time
export async function generateStaticParams() {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('posts')
    .select('slug')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())

  return (data ?? []).map((p: { slug: string }) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = createServiceRoleClient()
  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt, cover_image, published_at, tags, meta_title, meta_desc')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) {
    return { title: 'Không tìm thấy bài viết — Đại Ngàn Xanh' }
  }

  const title = post.meta_title || post.title
  const description = post.meta_desc || post.excerpt || ''

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: post.cover_image ? [{ url: post.cover_image, alt: title }] : [],
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      tags: post.tags ?? [],
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const supabase = createServiceRoleClient()

  const { data: post } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, content, cover_image, published_at, tags, view_count')
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .single()

  if (!post) {
    notFound()
  }

  // Fetch other posts for sidebar
  const { data: sidebarPosts } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, cover_image, published_at, tags')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(6)

  const publishedDate = post.published_at
    ? format(new Date(post.published_at), "dd MMMM yyyy", { locale: vi })
    : null

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: 'https://dainganxanh.com.vn' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://dainganxanh.com.vn/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://dainganxanh.com.vn/blog/${slug}` },
    ],
  }

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      {/* Back link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-800 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại Blog
      </Link>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Main Article */}
        <article className="flex-1 min-w-0">
          {/* Cover Image */}
          {post.cover_image && (
            <div className="relative aspect-video rounded-2xl overflow-hidden mb-8 bg-emerald-50">
              <Image
                src={post.cover_image}
                alt={post.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          )}

          {/* Header */}
          <header className="mb-8">
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag: string) => (
                  <TagBadge key={tag} tag={tag} asLink />
                ))}
              </div>
            )}

            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              {publishedDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {publishedDate}
                </span>
              )}
              {post.view_count != null && post.view_count > 0 && (
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {post.view_count.toLocaleString('vi-VN')} lượt xem
                </span>
              )}
            </div>

            {post.excerpt && (
              <p className="mt-4 text-base text-gray-600 leading-relaxed border-l-4 border-emerald-300 pl-4 italic">
                {post.excerpt}
              </p>
            )}
          </header>

          <hr className="border-gray-200 mb-8" />

          <PostContent content={post.content} />

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Xem thêm bài viết
            </Link>
          </div>
        </article>

        {/* Sidebar */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0">
          <div className="sticky top-24">
            <BlogSidebar posts={sidebarPosts ?? []} currentSlug={slug} />
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
