/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET } from '../route'

const mockOrder = jest.fn()
const mockRange = jest.fn()
const mockEq = jest.fn()
const mockSelect = jest.fn()
const mockFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: () => ({
    from: mockFrom,
  }),
}))

jest.mock('@/lib/getImpersonationContext', () => ({
  getImpersonationContext: jest.fn(),
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: () => ({ ok: true, remaining: 99 }),
}))

jest.mock('@/lib/monitoring', () => ({
  captureError: jest.fn(),
}))

import { getImpersonationContext } from '@/lib/getImpersonationContext'

describe('GET /api/bookings/my', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ order: mockOrder })
    mockOrder.mockReturnValue({ range: mockRange })
  })

  it('returns 401 when user not authenticated', async () => {
    ;(getImpersonationContext as jest.Mock).mockResolvedValue(null)
    const req = new NextRequest('http://localhost:3001/api/bookings/my')
    const res = await GET(req)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Vui lòng đăng nhập' })
  })

  it('returns bookings for authenticated user', async () => {
    ;(getImpersonationContext as jest.Mock).mockResolvedValue({
      effectiveUserId: 'user-123',
      isImpersonating: false,
    })

    mockRange.mockResolvedValue({
      data: [
        {
          id: 'b-1',
          code: 'BKABC123',
          check_in_date: '2026-09-10',
          check_out_date: '2026-09-12',
          guests_count: 1,
          nights_count: 2,
          total_amount: 2400000,
          payment_method: 'banking',
          status: 'confirmed',
          expires_at: null,
          created_at: '2026-09-07T10:00:00Z',
          rooms: { name: 'Phòng Deluxe', lots: { name: 'Vườn Ba Vì' } },
        },
      ],
      error: null,
      count: 1,
    })

    const req = new NextRequest('http://localhost:3001/api/bookings/my')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.bookings).toHaveLength(1)
    expect(json.bookings[0].code).toBe('BKABC123')
    expect(json.bookings[0].roomName).toBe('Phòng Deluxe')
    expect(json.bookings[0].lotName).toBe('Vườn Ba Vì')
    expect(json.pagination.totalCount).toBe(1)
  })

  it('returns empty array when no bookings', async () => {
    ;(getImpersonationContext as jest.Mock).mockResolvedValue({
      effectiveUserId: 'user-123',
      isImpersonating: false,
    })
    mockRange.mockResolvedValue({ data: [], error: null, count: 0 })

    const req = new NextRequest('http://localhost:3001/api/bookings/my')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect((await res.json()).bookings).toEqual([])
  })

  it('handles pagination with page param', async () => {
    ;(getImpersonationContext as jest.Mock).mockResolvedValue({
      effectiveUserId: 'user-123',
      isImpersonating: false,
    })
    mockRange.mockResolvedValue({ data: [], error: null, count: 0 })

    const req = new NextRequest('http://localhost:3001/api/bookings/my?page=2')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(mockRange).toHaveBeenCalledWith(20, 39)
  })

  it('handles impersonated user context', async () => {
    ;(getImpersonationContext as jest.Mock).mockResolvedValue({
      effectiveUserId: 'impersonated-456',
      isImpersonating: true,
    })
    mockRange.mockResolvedValue({ data: [], error: null, count: 0 })

    const req = new NextRequest('http://localhost:3001/api/bookings/my')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(mockEq).toHaveBeenCalledWith('user_id', 'impersonated-456')
  })

  it('handles database errors gracefully', async () => {
    ;(getImpersonationContext as jest.Mock).mockResolvedValue({
      effectiveUserId: 'user-123',
      isImpersonating: false,
    })
    mockRange.mockResolvedValue({ data: null, error: { message: 'DB error' }, count: 0 })

    const req = new NextRequest('http://localhost:3001/api/bookings/my')
    const res = await GET(req)
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Không thể tải danh sách đặt phòng')
  })
})
