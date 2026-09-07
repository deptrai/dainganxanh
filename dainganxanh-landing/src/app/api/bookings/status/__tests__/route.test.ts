/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET } from '../route'

const mockMaybeSingle = jest.fn()
const mockEq = jest.fn()
const mockSelect = jest.fn()
const mockFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: () => ({
    from: mockFrom,
  }),
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: () => ({ ok: true, remaining: 59 }),
}))

describe('GET /api/bookings/status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle })
  })

  it('returns 400 for invalid booking code format', async () => {
    const req = new NextRequest('http://localhost/api/bookings/status?code=INVALID')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Mã đặt phòng không hợp lệ')
  })

  it('returns 404 when booking does not exist', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const req = new NextRequest('http://localhost/api/bookings/status?code=BKABC123')
    const res = await GET(req)
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Không tìm thấy đơn đặt phòng')
  })

  it('returns status information without leaking guest PII', async () => {
    const futureExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'b1',
        code: 'BKABC123',
        status: 'pending',
        expires_at: futureExpires,
        total_amount: 2400000,
        check_in_date: '2026-10-01',
        check_out_date: '2026-10-03',
        guests_count: 2,
        rooms: { name: 'Phòng Sen' },
      },
      error: null,
    })

    const req = new NextRequest('http://localhost/api/bookings/status?code=BKABC123')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()

    expect(json.status).toBe('pending')
    expect(json.totalAmount).toBe(2400000)
    expect(json.roomName).toBe('Phòng Sen')
    expect(json.checkInDate).toBe('2026-10-01')
    expect(json.checkOutDate).toBe('2026-10-03')
    expect(json.guestsCount).toBe(2)
    // Ensure no PII leaked
    expect(json.guest_name).toBeUndefined()
    expect(json.guest_phone).toBeUndefined()
    expect(json.guest_email).toBeUndefined()
  })

  it('marks effectiveStatus as expired if expires_at in the past', async () => {
    const pastExpires = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'b2',
        code: 'BKABC124',
        status: 'pending',
        expires_at: pastExpires,
        total_amount: 1500000,
        check_in_date: '2026-10-01',
        check_out_date: '2026-10-02',
        guests_count: 1,
        rooms: { name: 'Phòng Trúc' },
      },
      error: null,
    })

    const req = new NextRequest('http://localhost/api/bookings/status?code=BKABC124')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('expired')
  })
})
