import sitemap from '../sitemap'

const mockFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(() => ({
    from: mockFrom,
  })),
}))

describe('sitemap', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('generates 20 bilingual entries for the 10 static routes when database is empty', async () => {
    const chain = {
      data: [],
      eq: () => chain,
      lte: () => Promise.resolve({ data: [] }),
      then: (resolve: any) => Promise.resolve({ data: [] }).then(resolve),
    }
    mockFrom.mockImplementation(() => ({
      select: () => chain,
    }))

    const result = await sitemap()

    // 10 static routes × 2 (VI + EN) = 20 entries
    expect(result.length).toBe(20)

    const homeVi = result.find((item) => item.url === 'https://dainganxanh.com.vn')
    expect(homeVi).toBeDefined()
    expect(homeVi?.priority).toBe(1.0)
    expect(homeVi?.changeFrequency).toBe('daily')
    expect(homeVi?.alternates?.languages).toEqual({
      vi: 'https://dainganxanh.com.vn',
      en: 'https://dainganxanh.com.vn/en',
      'x-default': 'https://dainganxanh.com.vn',
    })

    const homeEn = result.find((item) => item.url === 'https://dainganxanh.com.vn/en')
    expect(homeEn).toBeDefined()
    expect(homeEn?.alternates?.languages).toEqual({
      vi: 'https://dainganxanh.com.vn',
      en: 'https://dainganxanh.com.vn/en',
      'x-default': 'https://dainganxanh.com.vn',
    })

    const expectedStaticPaths = [
      '',
      '/pricing',
      '/store',
      '/eco-tourism',
      '/about',
      '/transparency',
      '/contact',
      '/privacy',
      '/terms',
      '/blog',
    ]

    for (const path of expectedStaticPaths) {
      const viUrl = `https://dainganxanh.com.vn${path}`
      const enUrl = `https://dainganxanh.com.vn/en${path}`
      expect(result.some((r) => r.url === viUrl)).toBe(true)
      expect(result.some((r) => r.url === enUrl)).toBe(true)
    }
  })

  it('includes dynamic products, eco-tourism lots, and blog posts with alternates', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: [
                  { slug: 'tra-hoa-vang', updated_at: '2026-03-01T00:00:00Z' },
                ],
              }),
          }),
        }
      }
      if (table === 'lots') {
        return {
          select: () =>
            Promise.resolve({
              data: [
                { id: 'lot-ba-vi-1', updated_at: '2026-03-02T00:00:00Z' },
              ],
            }),
        }
      }
      if (table === 'posts') {
        return {
          select: () => ({
            eq: () => ({
              lte: () =>
                Promise.resolve({
                  data: [
                    {
                      id: 'post-1',
                      slug: 'bai-viet-tieng-viet',
                      updated_at: '2026-03-03T00:00:00Z',
                      post_translations: [
                        { slug: 'english-article', locale: 'en' },
                      ],
                    },
                    {
                      id: 'post-2',
                      slug: 'bai-viet-chua-dich',
                      updated_at: '2026-03-04T00:00:00Z',
                      post_translations: [],
                    },
                  ],
                }),
            }),
          }),
        }
      }
      return {}
    })

    const result = await sitemap()

    // 20 static + (1 prod × 2) + (1 lot × 2) + (2 posts × 2) = 28 entries
    expect(result.length).toBe(28)

    // Product check
    const prodVi = result.find((r) => r.url === 'https://dainganxanh.com.vn/store/tra-hoa-vang')
    const prodEn = result.find((r) => r.url === 'https://dainganxanh.com.vn/en/store/tra-hoa-vang')
    expect(prodVi).toBeDefined()
    expect(prodEn).toBeDefined()
    expect(prodVi?.alternates?.languages).toEqual({
      vi: 'https://dainganxanh.com.vn/store/tra-hoa-vang',
      en: 'https://dainganxanh.com.vn/en/store/tra-hoa-vang',
      'x-default': 'https://dainganxanh.com.vn/store/tra-hoa-vang',
    })

    // Eco-tourism lot check
    const lotVi = result.find((r) => r.url === 'https://dainganxanh.com.vn/eco-tourism/lot-ba-vi-1')
    const lotEn = result.find((r) => r.url === 'https://dainganxanh.com.vn/en/eco-tourism/lot-ba-vi-1')
    expect(lotVi).toBeDefined()
    expect(lotEn).toBeDefined()

    // Translated blog post check (cross-referencing localized slugs)
    const blog1Vi = result.find((r) => r.url === 'https://dainganxanh.com.vn/blog/bai-viet-tieng-viet')
    const blog1En = result.find((r) => r.url === 'https://dainganxanh.com.vn/en/blog/english-article')
    expect(blog1Vi).toBeDefined()
    expect(blog1En).toBeDefined()
    expect(blog1Vi?.alternates?.languages).toEqual({
      vi: 'https://dainganxanh.com.vn/blog/bai-viet-tieng-viet',
      en: 'https://dainganxanh.com.vn/en/blog/english-article',
      'x-default': 'https://dainganxanh.com.vn/blog/bai-viet-tieng-viet',
    })

    // Untranslated blog post check (graceful fallback to VI slug for EN entry)
    const blog2Vi = result.find((r) => r.url === 'https://dainganxanh.com.vn/blog/bai-viet-chua-dich')
    const blog2En = result.find((r) => r.url === 'https://dainganxanh.com.vn/en/blog/bai-viet-chua-dich')
    expect(blog2Vi).toBeDefined()
    expect(blog2En).toBeDefined()
    expect(blog2En?.alternates?.languages).toEqual({
      vi: 'https://dainganxanh.com.vn/blog/bai-viet-chua-dich',
      en: 'https://dainganxanh.com.vn/en/blog/bai-viet-chua-dich',
      'x-default': 'https://dainganxanh.com.vn/blog/bai-viet-chua-dich',
    })
  })
})
