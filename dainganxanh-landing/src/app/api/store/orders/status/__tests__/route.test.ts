/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET } from '../route'

const mockMaybeSingle = jest.fn()
const mockEq = jest.fn()
const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockRpc = jest.fn().mockResolvedValue({ data: 1, error: null })

let mockRateLimitResult: { ok: boolean; remaining: number; retryAfterSec?: number } = {
  ok: true,
  remaining: 59,
}

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
  }),
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: () => mockRateLimitResult,
}))

describe('GET /api/store/orders/status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRateLimitResult = { ok: true, remaining: 59 }
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle })
  })

  it('returns 429 when rate limited with Retry-After header', async () => {
    mockRateLimitResult = { ok: false, remaining: 0, retryAfterSec: 45 }
    const req = new NextRequest('http://localhost/api/store/orders/status?code=STABC123')
    const res = await GET(req)
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('45')
    const json = await res.json()
    expect(json.error).toBe('Quá nhiều yêu cầu. Vui lòng thử lại sau.')
  })

  it('returns 400 for missing order code', async () => {
    const req = new NextRequest('http://localhost/api/store/orders/status')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Mã đơn hàng không hợp lệ')
  })

  it('returns 400 for invalid order code format', async () => {
    const invalidCodes = ['INVALID', 'BK123456', 'ST123', 'ST1234567', 'ST!@#$%^']
    for (const code of invalidCodes) {
      const req = new NextRequest(`http://localhost/api/store/orders/status?code=${code}`)
      const res = await GET(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Mã đơn hàng không hợp lệ')
    }
  })

  it('normalizes lowercase and ST- prefix before lookup', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        code: 'STABC123',
        status: 'pending',
        total_amount: 350000,
        payment_method: 'banking',
        expires_at: null,
        tracking_number: null,
      },
      error: null,
    })

    const reqLowercase = new NextRequest('http://localhost/api/store/orders/status?code=stabc123')
    const resLowercase = await GET(reqLowercase)
    expect(resLowercase.status).toBe(200)
    expect(mockEq).toHaveBeenCalledWith('code', 'STABC123')

    const reqPrefixed = new NextRequest('http://localhost/api/store/orders/status?code=ST-ABC123')
    const resPrefixed = await GET(reqPrefixed)
    expect(resPrefixed.status).toBe(200)
    expect(mockEq).toHaveBeenCalledWith('code', 'STABC123')
  })

  it('returns 404 when order does not exist', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const req = new NextRequest('http://localhost/api/store/orders/status?code=STABC123')
    const res = await GET(req)
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Không tìm thấy đơn hàng')
  })

  it('returns 500 when database query fails', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'db down' } })
    const req = new NextRequest('http://localhost/api/store/orders/status?code=STABC123')
    const res = await GET(req)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Lỗi hệ thống. Vui lòng thử lại sau.')
  })

  it('returns status info without leaking customer PII', async () => {
    const futureExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    mockMaybeSingle.mockResolvedValue({
      data: {
        code: 'STABC123',
        status: 'pending',
        total_amount: 450000,
        payment_method: 'banking',
        expires_at: futureExpires,
        tracking_number: 'TRK9999',
      },
      error: null,
    })

    const req = new NextRequest('http://localhost/api/store/orders/status?code=STABC123')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()

    expect(json.code).toBe('STABC123')
    expect(json.status).toBe('pending')
    expect(json.total_amount).toBe(450000)
    expect(json.payment_method).toBe('banking')
    expect(json.expires_at).toBe(futureExpires)
    expect(json.tracking_number).toBe('TRK9999')

    // Ensure no PII leaked
    expect((json as Record<string, unknown>).customer_name).toBeUndefined()
    expect((json as Record<string, unknown>).customer_phone).toBeUndefined()
    expect((json as Record<string, unknown>).customer_email).toBeUndefined()
    expect((json as Record<string, unknown>).shipping_address).toBeUndefined()
    expect((json as Record<string, unknown>).user_id).toBeUndefined()
  })

  it('marks effectiveStatus as expired if status is pending and expires_at is in the past', async () => {
    const pastExpires = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    mockMaybeSingle.mockResolvedValue({
      data: {
        code: 'STABC123',
        status: 'pending',
        total_amount: 500000,
        payment_method: 'banking',
        expires_at: pastExpires,
        tracking_number: null,
      },
      error: null,
    })

    const req = new NextRequest('http://localhost/api/store/orders/status?code=STABC123')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('expired')
    // Lazily expires the order so reserved stock frees before a reorder
    expect(mockRpc).toHaveBeenCalledWith('expire_pending_store_orders')
  })

  it('keeps confirmed status as confirmed even if expires_at was in past', async () => {
    const pastExpires = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    mockMaybeSingle.mockResolvedValue({
      data: {
        code: 'STABC123',
        status: 'confirmed',
        total_amount: 500000,
        payment_method: 'banking',
        expires_at: pastExpires,
        tracking_number: null,
      },
      error: null,
    })

    const req = new NextRequest('http://localhost/api/store/orders/status?code=STABC123')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('confirmed')
  })
})
