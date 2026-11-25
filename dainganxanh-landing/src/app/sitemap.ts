import { MetadataRoute } from 'next'
import { createServiceRoleClient } from '@/lib/supabase/server'

const BASE_URL = 'https://dainganxanh.com.vn'

interface BilingualRouteOptions {
  viPath: string
  enPath?: string
  lastModified?: Date
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

function createBilingualEntries({
  viPath,
  enPath = viPath,
  lastModified = new Date(),
  changeFrequency = 'weekly',
  priority = 0.7,
}: BilingualRouteOptions): MetadataRoute.Sitemap {
  const viUrl = `${BASE_URL}${viPath}`
  const enUrl = `${BASE_URL}/en${enPath}`

  const alternates = {
    languages: {
      vi: viUrl,
      en: enUrl,
      'x-default': viUrl,
    },
  }

  return [
    {
      url: viUrl,
      lastModified,
      changeFrequency,
      priority,
      alternates,
    },
    {
      url: enUrl,
      lastModified,
      changeFrequency,
      priority,
      alternates,
    },
  ]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticConfigs: BilingualRouteOptions[] = [
    { viPath: '', priority: 1.0, changeFrequency: 'daily' },
    { viPath: '/pricing', priority: 0.8, changeFrequency: 'monthly' },
    { viPath: '/store', priority: 0.8, changeFrequency: 'daily' },
    { viPath: '/eco-tourism', priority: 0.8, changeFrequency: 'weekly' },
    { viPath: '/about', priority: 0.7, changeFrequency: 'monthly' },
    { viPath: '/transparency', priority: 0.7, changeFrequency: 'monthly' },
    { viPath: '/contact', priority: 0.6, changeFrequency: 'monthly' },
    { viPath: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { viPath: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { viPath: '/blog', priority: 0.8, changeFrequency: 'daily' },
  ]

  const staticEntries: MetadataRoute.Sitemap = staticConfigs.flatMap((cfg) =>
    createBilingualEntries(cfg)
  )

  const dynamicEntries: MetadataRoute.Sitemap = []

  try {
    const supabase = createServiceRoleClient()

    // 1. Products
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('status', 'active')

    for (const prod of products ?? []) {
      if (prod.slug) {
        dynamicEntries.push(
          ...createBilingualEntries({
            viPath: `/store/${prod.slug}`,
            lastModified: prod.updated_at ? new Date(prod.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
          })
        )
      }
    }

    // 2. Eco-Tourism Lots
    const { data: lots } = await supabase
      .from('lots')
      .select('id, updated_at')

    for (const lot of lots ?? []) {
      if (lot.id) {
        dynamicEntries.push(
          ...createBilingualEntries({
            viPath: `/eco-tourism/${lot.id}`,
            lastModified: lot.updated_at ? new Date(lot.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
          })
        )
      }
    }

    // 3. Blog Posts
    const { data: posts } = await supabase
      .from('posts')
      .select(`
        id, slug, updated_at,
        post_translations ( slug, locale )
      `)
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())

    for (const post of posts ?? []) {
      if (post.slug) {
        const enTrans = Array.isArray(post.post_translations)
          ? post.post_translations.find((t: any) => t.locale === 'en')
          : null
        const enSlug = enTrans?.slug || post.slug

        dynamicEntries.push(
          ...createBilingualEntries({
            viPath: `/blog/${post.slug}`,
            enPath: `/blog/${enSlug}`,
            lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
          })
        )
      }
    }
  } catch (err) {
    console.warn('[sitemap] Failed to fetch dynamic entries:', err instanceof Error ? err.message : err)
  }

  return [...staticEntries, ...dynamicEntries]
}
