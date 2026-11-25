/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

const mockGetUser = jest.fn()
const mockSelectUser = jest.fn()

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: (table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => mockSelectUser(),
            }),
          }),
        }
      }
      return {}
    },
  })),
}))

describe('Middleware Chain & Routing & Security Headers', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake-test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fake-test-key'
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    mockSelectUser.mockResolvedValue({ data: null, error: null })
  })

  it('bypasses intl and auth check for static / excluded routes like /sitemap.xml', async () => {
    const req = new NextRequest('http://localhost:3000/sitemap.xml')
    const res = await middleware(req)

    expect(mockGetUser).not.toHaveBeenCalled()
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('bypasses intl and auth check for /api routes with security headers applied', async () => {
    const req = new NextRequest('http://localhost:3000/api/orders/pending')
    const res = await middleware(req)

    expect(mockGetUser).not.toHaveBeenCalled()
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('DENY')
  })

  it('handles default locale / route without redirect loop', async () => {
    const req = new NextRequest('http://localhost:3000/')
    const res = await middleware(req)

    // Should not redirect to /vi because localePrefix is 'as-needed'
    expect(res.status).not.toBe(307)
    expect(res.status).not.toBe(308)
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('DENY')
  })

  it('protects /crm routes for unauthenticated users (Vietnamese default)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No user') })

    const req = new NextRequest('http://localhost:3000/crm/my-garden')
    const res = await middleware(req)

    expect(res.status).toBe(307)
    const location = res.headers.get('location')
    expect(location).toContain('/login')
    expect(location).toContain('redirect=%2Fcrm%2Fmy-garden')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('DENY')
  })

  it('redirects unsupported locale prefix /fr/crm to /login without invalid prefix', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No user') })

    const req = new NextRequest('http://localhost:3000/fr/crm/my-garden')
    const res = await middleware(req)

    expect(res.status).toBe(307)
    const location = res.headers.get('location')
    expect(location).toBe('http://localhost:3000/login?redirect=%2Ffr%2Fcrm%2Fmy-garden')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('redirects to /en with NEXT_LOCALE=en cookie when user has locale="en" in DB and no cookie', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u123', email: 'test@example.com' } },
      error: null,
    })
    mockSelectUser.mockResolvedValue({ data: { locale: 'en' }, error: null })

    const req = new NextRequest('http://localhost:3000/pricing')
    const res = await middleware(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/en/pricing')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.cookies.get('NEXT_LOCALE')?.value).toBe('en')
  })

  it('does NOT redirect when user has locale="en" in DB if request is already /en-prefixed', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u123', email: 'test@example.com' } },
      error: null,
    })
    mockSelectUser.mockResolvedValue({ data: { locale: 'en' }, error: null })

    const req = new NextRequest('http://localhost:3000/en/pricing')
    const res = await middleware(req)

    expect(res.status).toBe(200)
    expect(mockSelectUser).not.toHaveBeenCalled()
  })

  it('protects /en/crm routes for unauthenticated users with localized login redirect', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No user') })

    const req = new NextRequest('http://localhost:3000/en/crm/my-garden')
    const res = await middleware(req)

    expect(res.status).toBe(307)
    const location = res.headers.get('location')
    expect(location).toContain('/en/login')
    expect(location).toContain('redirect=%2Fen%2Fcrm%2Fmy-garden')
  })

  it('allows authenticated users to access CRM routes', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u123', email: 'test@example.com' } },
      error: null,
    })

    const req = new NextRequest('http://localhost:3000/crm/my-garden')
    const res = await middleware(req)

    // Should pass through to CRM
    expect(res.status).not.toBe(307)
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('attaches all required security headers (CSP, HSTS, frame-options, etc.)', async () => {
    const req = new NextRequest('http://localhost:3000/pricing')
    const res = await middleware(req)

    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('DENY')
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
    expect(res.headers.get('content-security-policy')).toBeDefined()
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'")
  })
})
