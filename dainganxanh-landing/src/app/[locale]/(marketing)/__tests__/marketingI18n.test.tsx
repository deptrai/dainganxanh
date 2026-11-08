import React from 'react'
import { render, screen } from '@testing-library/react'
import StorePage from '../store/page'
import ProductPage from '../store/[slug]/page'
import BlogPage from '../blog/page'
import PostPage, { generateMetadata as generatePostMetadata } from '../blog/[slug]/page'
import EcoTourismPage from '../eco-tourism/page'
import GardenDetailPage from '../eco-tourism/[lotId]/page'

const mockFrom = jest.fn()
const mockNotFound = jest.fn().mockImplementation(() => {
  throw new Error('NEXT_NOT_FOUND')
})

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(() => ({
    from: mockFrom,
  })),
}))

jest.mock('next-intl/server', () => ({
  setRequestLocale: jest.fn(),
  getTranslations: jest.fn().mockResolvedValue((key: string) => key),
}))

jest.mock('@/components/store/StoreClient', () => ({
  StoreClient: ({ categories, products }: any) => (
    <div
      data-testid="store-client"
      data-categories={JSON.stringify(categories)}
      data-products={JSON.stringify(products)}
    />
  ),
}))

jest.mock('@/components/store/ProductDetailClient', () => ({
  ProductDetailClient: ({ product, related }: any) => (
    <div
      data-testid="product-detail-client"
      data-product={JSON.stringify(product)}
      data-related={JSON.stringify(related)}
    />
  ),
}))

jest.mock('@/components/blog/PostList', () => ({
  PostList: ({ posts }: any) => (
    <div data-testid="post-list" data-posts={JSON.stringify(posts)} />
  ),
}))

jest.mock('@/components/blog/PostContent', () => ({
  PostContent: ({ content }: any) => <div data-testid="post-content">{content}</div>,
}))

jest.mock('@/components/blog/BlogSidebar', () => ({
  BlogSidebar: ({ posts }: any) => (
    <div data-testid="blog-sidebar" data-posts={JSON.stringify(posts)} />
  ),
}))

jest.mock('@/components/eco-tourism/EcoTourismClient', () => ({
  EcoTourismClient: ({ lots }: any) => (
    <div data-testid="eco-tourism-client" data-lots={JSON.stringify(lots)} />
  ),
}))

jest.mock('@/components/eco-tourism/GardenDetailClient', () => ({
  GardenDetailClient: ({ garden }: any) => (
    <div data-testid="garden-detail-client" data-garden={JSON.stringify(garden)} />
  ),
}))

describe('Marketing pages i18n localization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Store pages i18n', () => {
    it('renders translated category and product in /en/store', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'product_categories') {
          return {
            select: () => ({
              order: () =>
                Promise.resolve({
                  data: [
                    {
                      id: 'cat-1',
                      name: 'Nước hoa',
                      slug: 'nuoc-hoa',
                      translations: { en: { name: 'Perfume' } },
                    },
                  ],
                }),
            }),
          }
        }
        if (table === 'products') {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  order: () =>
                    Promise.resolve({
                      data: [
                        {
                          id: 'prod-1',
                          name: 'Trà Hoa Vàng',
                          description: 'Trà thảo mộc',
                          slug: 'tra-hoa-vang',
                          price: 200000,
                          translations: {
                            en: {
                              name: 'Golden Camellia Tea',
                              description: 'Herbal tea',
                            },
                          },
                          product_categories: {
                            name: 'Nước hoa',
                            slug: 'nuoc-hoa',
                            translations: { en: { name: 'Perfume' } },
                          },
                        },
                      ],
                    }),
                }),
              }),
            }),
          }
        }
        return {}
      })

      const page = await StorePage({ params: Promise.resolve({ locale: 'en' }) })
      render(page)

      const clientEl = screen.getByTestId('store-client')
      const categories = JSON.parse(clientEl.getAttribute('data-categories') || '[]')
      const products = JSON.parse(clientEl.getAttribute('data-products') || '[]')

      expect(categories[0].name).toBe('Perfume')
      expect(products[0].name).toBe('Golden Camellia Tea')
      expect(products[0].description).toBe('Herbal tea')
    })

    it('renders translated product details in /en/store/[slug]', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: {
                        id: 'prod-1',
                        name: 'Trà Hoa Vàng',
                        slug: 'tra-hoa-vang',
                        description: 'Mô tả tiếng Việt',
                        price: 150000,
                        translations: {
                          en: {
                            name: 'Golden Flower Tea',
                            description: 'English description',
                          },
                        },
                        product_categories: {
                          id: 'cat-1',
                          name: 'Trà',
                          translations: { en: { name: 'Tea' } },
                        },
                        lots: {
                          id: 'lot-1',
                          name: 'Lô A',
                          translations: { en: { name: 'Lot A' } },
                        },
                      },
                    }),
                }),
              }),
            }),
          }
        }
        return {}
      })

      const page = await ProductPage({
        params: Promise.resolve({ slug: 'tra-hoa-vang', locale: 'en' }),
      })
      render(page)

      const detailEl = screen.getByTestId('product-detail-client')
      const product = JSON.parse(detailEl.getAttribute('data-product') || '{}')

      expect(product.name).toBe('Golden Flower Tea')
      expect(product.description).toBe('English description')
      expect(product.product_categories.name).toBe('Tea')
      expect(product.lots.name).toBe('Lot A')
    })
  })

  describe('Blog pages i18n & fallback', () => {
    it('uses post_translations for EN locale on /en/blog', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'posts') {
          return {
            select: () => ({
              eq: () => ({
                lte: () => ({
                  order: () => ({
                    range: () =>
                      Promise.resolve({
                        data: [
                          {
                            id: 'post-1',
                            title: 'Tiêu đề tiếng Việt',
                            slug: 'tieu-de-tieng-viet',
                            excerpt: 'Tóm tắt tiếng Việt',
                            post_translations: [
                              {
                                id: 'trans-1',
                                locale: 'en',
                                title: 'English Title',
                                slug: 'english-title',
                                excerpt: 'English Excerpt',
                              },
                            ],
                          },
                          {
                            id: 'post-2',
                            title: 'Bài viết chưa dịch',
                            slug: 'bai-viet-chua-dich',
                            excerpt: 'Tóm tắt bài 2',
                            post_translations: [],
                          },
                        ],
                        count: 2,
                        error: null,
                      }),
                  }),
                  // for allPostsForTags
                  then: (resolve: any) => resolve({ data: [] }),
                }),
              }),
            }),
          }
        }
        return {}
      })

      const page = await BlogPage({
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({}),
      })
      render(page)

      const postList = screen.getByTestId('post-list')
      const posts = JSON.parse(postList.getAttribute('data-posts') || '[]')

      expect(posts[0].title).toBe('English Title')
      expect(posts[0].slug).toBe('english-title')
      expect(posts[0].excerpt).toBe('English Excerpt')

      // Post 2 falls back to Vietnamese
      expect(posts[1].title).toBe('Bài viết chưa dịch')
      expect(posts[1].slug).toBe('bai-viet-chua-dich')
    })

    it('renders EN post via post_translations on /en/blog/[slug]', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'post_translations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: {
                        id: 'trans-1',
                        title: 'English Blog Title',
                        slug: 'english-blog-title',
                        excerpt: 'English Excerpt',
                        content: '<p>English Body</p>',
                        posts: {
                          id: 'post-1',
                          title: 'Tiêu đề gốc',
                          slug: 'tieu-de-goc',
                          status: 'published',
                          published_at: '2026-03-01T00:00:00Z',
                          tags: ['news'],
                        },
                      },
                    }),
                }),
              }),
            }),
          }
        }
        if (table === 'posts') {
          return {
            select: () => ({
              eq: () => ({
                lte: () => ({
                  neq: () => ({
                    order: () => ({
                      limit: () => Promise.resolve({ data: [] }),
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        return {}
      })

      const page = await PostPage({
        params: Promise.resolve({ locale: 'en', slug: 'english-blog-title' }),
      })
      render(page)

      expect(screen.getByText('English Blog Title')).toBeInTheDocument()
      expect(screen.getByText('English Excerpt')).toBeInTheDocument()
      expect(screen.getByText('<p>English Body</p>')).toBeInTheDocument()
    })

    it('renders VI fallback without 404 when requesting /en/blog/[vi-slug] with no post_translations', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'post_translations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: null }),
                }),
              }),
            }),
          }
        }
        if (table === 'posts') {
          const sidebarChain = {
            neq: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: [] }),
              }),
            }),
          }
          return {
            select: () => ({
              eq: (field: string, _val: string) => {
                if (field === 'slug') {
                  return {
                    eq: () => ({
                      lte: () => ({
                        maybeSingle: () =>
                          Promise.resolve({
                            data: {
                              id: 'post-untranslated',
                              title: 'Tiêu đề gốc tiếng Việt',
                              slug: 'bai-viet-goc',
                              excerpt: 'Tóm tắt tiếng Việt',
                              content: '<p>Nội dung gốc tiếng Việt</p>',
                              cover_image: null,
                              published_at: '2026-03-01T00:00:00Z',
                              tags: ['vietnam'],
                              view_count: 10,
                              post_translations: [],
                            },
                          }),
                      }),
                    }),
                  }
                }
                // status = 'published' (sidebar)
                return {
                  lte: () => sidebarChain,
                }
              },
            }),
          }
        }
        return {}
      })

      const page = await PostPage({
        params: Promise.resolve({ locale: 'en', slug: 'bai-viet-goc' }),
      })
      render(page)

      expect(mockNotFound).not.toHaveBeenCalled()
      expect(screen.getByText('Tiêu đề gốc tiếng Việt')).toBeInTheDocument()
      expect(screen.getByText('<p>Nội dung gốc tiếng Việt</p>')).toBeInTheDocument()
    })

    it('renders canonical and alternates in generateMetadata for both locales', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'post_translations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: {
                        title: 'English Title',
                        slug: 'english-slug',
                        posts: {
                          id: 'post-1',
                          title: 'Tiêu đề VI',
                          slug: 'tieu-de-vi',
                          status: 'published',
                          published_at: '2026-03-01T00:00:00Z',
                        },
                      },
                    }),
                }),
              }),
            }),
          }
        }
        if (table === 'posts') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: {
                        title: 'Tiêu đề VI',
                        slug: 'tieu-de-vi',
                        status: 'published',
                        published_at: '2026-03-01T00:00:00Z',
                        post_translations: [{ locale: 'en', slug: 'english-slug', title: 'English Title' }],
                      },
                    }),
                }),
              }),
            }),
          }
        }
        return {}
      })

      // Test EN metadata
      const enMeta = await generatePostMetadata({
        params: Promise.resolve({ locale: 'en', slug: 'english-slug' }),
      })
      expect(enMeta.alternates?.canonical).toBe('https://dainganxanh.com.vn/en/blog/english-slug')
      expect(enMeta.alternates?.languages).toEqual({
        vi: 'https://dainganxanh.com.vn/blog/tieu-de-vi',
        en: 'https://dainganxanh.com.vn/en/blog/english-slug',
        'x-default': 'https://dainganxanh.com.vn/blog/tieu-de-vi',
      })

      // Test VI metadata
      const viMeta = await generatePostMetadata({
        params: Promise.resolve({ locale: 'vi', slug: 'tieu-de-vi' }),
      })
      expect(viMeta.alternates?.canonical).toBe('https://dainganxanh.com.vn/blog/tieu-de-vi')
      expect(viMeta.alternates?.languages).toEqual({
        vi: 'https://dainganxanh.com.vn/blog/tieu-de-vi',
        en: 'https://dainganxanh.com.vn/en/blog/english-slug',
        'x-default': 'https://dainganxanh.com.vn/blog/tieu-de-vi',
      })
    })

    it('triggers notFound when post is future-dated (scheduled) via EN slug', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'post_translations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: {
                        id: 'trans-future',
                        title: 'Future Post',
                        slug: 'future-post',
                        posts: {
                          id: 'post-future',
                          status: 'published',
                          published_at: '2099-01-01T00:00:00Z', // Future date!
                        },
                      },
                    }),
                }),
              }),
            }),
          }
        }
        if (table === 'posts') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  lte: () => ({
                    maybeSingle: () => Promise.resolve({ data: null }),
                  }),
                }),
              }),
            }),
          }
        }
        return {}
      })

      await expect(
        PostPage({
          params: Promise.resolve({ locale: 'en', slug: 'future-post' }),
        })
      ).rejects.toThrow('NEXT_NOT_FOUND')

      expect(mockNotFound).toHaveBeenCalled()
    })
  })

  describe('Eco-tourism pages i18n', () => {
    it('translates lot and room information on /en/eco-tourism', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'lots') {
          return {
            select: () => ({
              eq: () => ({
                order: () =>
                  Promise.resolve({
                    data: [
                      {
                        id: 'lot-1',
                        name: 'Vườn Trầm Hương Ba Vì',
                        region: 'Hà Nội',
                        translations: {
                          en: { name: 'Ba Vi Agarwood Garden' },
                        },
                        rooms: [
                          {
                            id: 'room-1',
                            name: 'Phòng VIP 1',
                            status: 'active',
                            price_per_night: 800000,
                            translations: { en: { name: 'VIP Suite 1' } },
                          },
                        ],
                      },
                    ],
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'room_pricing_rules') {
          return {
            select: () => ({
              in: () => Promise.resolve({ data: [], error: null }),
            }),
          }
        }
        return {}
      })

      const page = await EcoTourismPage({
        params: Promise.resolve({ locale: 'en' }),
      })
      render(page)

      const clientEl = screen.getByTestId('eco-tourism-client')
      const lots = JSON.parse(clientEl.getAttribute('data-lots') || '[]')

      expect(lots[0].name).toBe('Ba Vi Agarwood Garden')
    })

    it('translates lot and room details on /en/eco-tourism/[lotId]', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'lots') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: {
                      id: 'lot-1',
                      name: 'Vườn Trầm Ba Vì',
                      region: 'Hà Nội',
                      description: 'Mô tả tiếng Việt',
                      translations: {
                        en: {
                          name: 'Ba Vi Agarwood Retreat',
                          description: 'Serene agarwood sanctuary in Ba Vi',
                        },
                      },
                      rooms: [
                        {
                          id: 'room-1',
                          name: 'Phòng Mộc',
                          description: 'Phòng nhìn ra đồi',
                          capacity: 2,
                          price_per_night: 900000,
                          status: 'active',
                          translations: {
                            en: {
                              name: 'Wood Suite',
                              description: 'Hill view suite',
                            },
                          },
                        },
                      ],
                    },
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'room_bookings' || table === 'room_blocks' || table === 'room_pricing_rules') {
          const chain: any = {
            in: () => chain,
            gte: () => Promise.resolve({ data: [] }),
            then: (resolve: any) => resolve({ data: [] }),
          }
          return {
            select: () => chain,
          }
        }
        return {}
      })

      const page = await GardenDetailPage({
        params: Promise.resolve({ locale: 'en', lotId: 'lot-1' }),
      })
      render(page)

      const clientEl = screen.getByTestId('garden-detail-client')
      const garden = JSON.parse(clientEl.getAttribute('data-garden') || '{}')

      expect(garden.name).toBe('Ba Vi Agarwood Retreat')
      expect(garden.description).toBe('Serene agarwood sanctuary in Ba Vi')
      expect(garden.rooms[0].name).toBe('Wood Suite')
      expect(garden.rooms[0].description).toBe('Hill view suite')
    })
  })
})
