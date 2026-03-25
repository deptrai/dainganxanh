import { MetadataRoute } from 'next'
import { createServiceRoleClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: 'https://dainganxanh.vn',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://dainganxanh.vn/pricing',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  // Blog posts — fallback nếu table chưa tồn tại
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createServiceRoleClient()
    const { data: posts } = await supabase
      .from('posts')
      .select('slug, updated_at')
      .eq('status', 'published')

    blogPages = (posts ?? []).map((post: { slug: string; updated_at: string }) => ({
      url: `https://dainganxanh.vn/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    // Blog index page — chỉ thêm nếu có posts
    if (blogPages.length > 0) {
      staticPages.push({
        url: 'https://dainganxanh.vn/blog',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      })
    }
  } catch {
    // posts table chưa tồn tại — skip silently
  }

  return [...staticPages, ...blogPages]
}
