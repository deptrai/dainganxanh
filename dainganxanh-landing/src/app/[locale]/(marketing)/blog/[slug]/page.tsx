import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { formatDate } from '@/lib/format'
import { ArrowLeft, Calendar, Eye } from 'lucide-react'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { PostContent } from '@/components/blog/PostContent'
import { TagBadge } from '@/components/blog/TagBadge'
import { BlogSidebar } from '@/components/blog/BlogSidebar'

export const revalidate = 3600 // ISR: revalidate every 1 hour

interface PostPageProps {
  params: Promise<{ locale: string; slug: string }>
}

// Pre-generate paths for published posts at build time
export async function generateStaticParams() {
  try {
    const supabase = createServiceRoleClient()
    const now = new Date().toISOString()
    const { data: posts } = await supabase
      .from('posts')
      .select('slug')
      .eq('status', 'published')
      .lte('published_at', now)

    const { data: translations } = await supabase
      .from('post_translations')
      .select('slug, posts!inner(status, published_at)')
      .eq('locale', 'en')
      .eq('posts.status', 'published')
      .lte('posts.published_at', now)

    const viSlugs = (posts ?? []).map((p: { slug: string }) => ({ slug: p.slug }))
    const enSlugs = (translations ?? []).map((t: { slug: string }) => ({ slug: t.slug }))
    return [...viSlugs, ...enSlugs]
  } catch (err) {
    console.warn('[build] generateStaticParams for blog posts skipped or failed:', err instanceof Error ? err.message : err)
    return []
  }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'blog.meta' })
  try {
    const supabase = createServiceRoleClient()
    let title: string | undefined
    let description: string | undefined
    let coverImage: string | null = null
    let publishedAt: string | null = null
    let tags: string[] = []
    let viSlug = slug
    let enSlug = slug

    if (locale === 'en') {
      const { data: enTrans } = await supabase
        .from('post_translations')
        .select(`
          title, excerpt, meta_title, meta_desc, slug,
          posts ( title, excerpt, cover_image, published_at, tags, meta_title, meta_desc, status, slug )
        `)
        .eq('locale', 'en')
        .eq('slug', slug)
        .maybeSingle()

      const p = enTrans?.posts as any
      const isPublished = p?.status === 'published' && (!p?.published_at || new Date(p.published_at) <= new Date())
      if (enTrans && isPublished) {
        title = enTrans.meta_title || enTrans.title || p.meta_title || p.title
        description = enTrans.meta_desc || enTrans.excerpt || p.meta_desc || p.excerpt || ''
        coverImage = p.cover_image
        publishedAt = p.published_at
        tags = p.tags ?? []
        viSlug = p.slug
        enSlug = enTrans.slug
      }
    }

    if (!title) {
      const { data: post } = await supabase
        .from('posts')
        .select(`
          title, slug, excerpt, cover_image, published_at, tags, meta_title, meta_desc,
          post_translations ( locale, title, excerpt, meta_title, meta_desc, slug )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()

      if (!post) {
        return { title: t('notFound') }
      }

      viSlug = post.slug
      if (locale === 'en') {
        const en = Array.isArray(post.post_translations) ? post.post_translations.find((t: any) => t.locale === 'en') : null
        title = en?.meta_title || en?.title || post.meta_title || post.title
        description = en?.meta_desc || en?.excerpt || post.meta_desc || post.excerpt || ''
        enSlug = en?.slug || post.slug
      } else {
        title = post.meta_title || post.title
        description = post.meta_desc || post.excerpt || ''
        const en = Array.isArray(post.post_translations) ? post.post_translations.find((t: any) => t.locale === 'en') : null
        enSlug = en?.slug || post.slug
      }
      coverImage = post.cover_image
      publishedAt = post.published_at
      tags = post.tags ?? []
    }

    const canonical = locale === 'vi' ? `https://dainganxanh.com.vn/blog/${viSlug}` : `https://dainganxanh.com.vn/en/blog/${enSlug}`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: coverImage ? [{ url: coverImage, alt: title }] : [],
        type: 'article',
        publishedTime: publishedAt ?? undefined,
        tags,
      },
      alternates: {
        canonical,
        languages: {
          vi: `https://dainganxanh.com.vn/blog/${viSlug}`,
          en: `https://dainganxanh.com.vn/en/blog/${enSlug}`,
          'x-default': `https://dainganxanh.com.vn/blog/${viSlug}`,
        },
      },
    }
  } catch {
    return { title: t('defaultPostTitle') }
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'blog' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const supabase = createServiceRoleClient()

  let post: any = null

  if (locale === 'en') {
    // 1. Search post_translations by EN slug
    const { data: enTrans } = await supabase
      .from('post_translations')
      .select(`
        id, title, slug, content, excerpt, meta_title, meta_desc,
        posts (
          id, title, slug, excerpt, content, cover_image, published_at, tags, view_count, status
        )
      `)
      .eq('locale', 'en')
      .eq('slug', slug)
      .maybeSingle()

    const p = enTrans?.posts as any
    const isPublished = p?.status === 'published' && (!p?.published_at || new Date(p.published_at) <= new Date())
    if (enTrans && isPublished) {
      post = {
        id: p.id,
        title: enTrans.title || p.title,
        slug: enTrans.slug || p.slug,
        rawPostSlug: p.slug,
        excerpt: enTrans.excerpt || p.excerpt,
        content: enTrans.content || p.content,
        cover_image: p.cover_image,
        published_at: p.published_at,
        tags: p.tags,
        view_count: p.view_count,
      }
    }
  }

  // 2. Lookup by posts.slug if not found or locale is vi
  if (!post) {
    const { data: viPost } = await supabase
      .from('posts')
      .select(`
        id, title, slug, excerpt, content, cover_image, published_at, tags, view_count,
        post_translations (
          id, locale, slug, title, content, excerpt
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .maybeSingle()

    if (viPost) {
      if (locale === 'en') {
        const enTrans = Array.isArray(viPost.post_translations)
          ? viPost.post_translations.find((t: any) => t.locale === 'en')
          : null
        post = {
          id: viPost.id,
          title: enTrans?.title || viPost.title,
          slug: enTrans?.slug || viPost.slug,
          rawPostSlug: viPost.slug,
          excerpt: enTrans?.excerpt || viPost.excerpt,
          content: enTrans?.content || viPost.content,
          cover_image: viPost.cover_image,
          published_at: viPost.published_at,
          tags: viPost.tags,
          view_count: viPost.view_count,
        }
      } else {
        post = {
          ...viPost,
          rawPostSlug: viPost.slug,
        }
      }
    }
  }

  if (!post) {
    notFound()
  }

  // Fetch other posts for sidebar
  const { data: sidebarPosts } = await supabase
    .from('posts')
    .select(`
      id, title, slug, excerpt, cover_image, published_at, tags,
      post_translations ( id, locale, slug, title, excerpt )
    `)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .neq('slug', post.rawPostSlug)
    .order('published_at', { ascending: false })
    .limit(6)

  const localizedSidebarPosts = (sidebarPosts ?? []).map((p) => {
    if (locale === 'en') {
      const enTrans = Array.isArray(p.post_translations)
        ? p.post_translations.find((t: any) => t.locale === 'en')
        : null
      if (enTrans) {
        return {
          ...p,
          title: enTrans.title || p.title,
          slug: enTrans.slug || p.slug,
          excerpt: enTrans.excerpt || p.excerpt,
        }
      }
    }
    return p
  })

  const publishedDate = post.published_at
    ? formatDate(post.published_at, locale, { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  const baseUrl = locale === 'vi' ? 'https://dainganxanh.com.vn' : 'https://dainganxanh.com.vn/en'
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: tCommon('nav.home'), item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${baseUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${baseUrl}/blog/${slug}` },
    ],
  }

  return (
    <>
    <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      {/* Back link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-800 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('post.backToBlog')}
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
                  {t('post.views', { count: post.view_count })}
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
              {t('post.viewMore')}
            </Link>
          </div>
        </article>

        {/* Sidebar */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0">
          <div className="sticky top-24">
            <BlogSidebar posts={localizedSidebarPosts} currentSlug={post.slug} />
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
