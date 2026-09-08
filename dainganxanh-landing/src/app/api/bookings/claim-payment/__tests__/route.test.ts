/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '../route'

const mockMaybeSingle = jest.fn()
const mockEq = jest.fn()
const mockSelect = jest.fn()
const mockUpdate = jest.fn()
const mockFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: () => ({
    from: mockFrom,
  }),
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: () => ({ ok: true, remaining: 9 }),
}))

jest.mock('@/lib/monitoring', () => ({
  captureError: jest.fn(),
}))

describe('POST /api/bookings/claim-payment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle })
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    })
  })

  it('rejects invalid booking code format', async () => {
    const req = new NextRequest('http://localhost/api/bookings/claim-payment', {
      method: 'POST',
      body: JSON.stringify({ bookingCode: 'INVALID' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Mã đặt phòng không hợp lệ')
  })

  it('returns 404 if booking not found', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const req = new NextRequest('http://localhost/api/bookings/claim-payment', {
      method: 'POST',
      body: JSON.stringify({ bookingCode: 'BKABC123' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Không tìm thấy đơn đặt phòng')
  })

  it('returns 409 if booking is not pending', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: 'b1', code: 'BKABC123', status: 'confirmed' },
      error: null,
    })
    const req = new NextRequest('http://localhost/api/bookings/claim-payment', {
      method: 'POST',
      body: JSON.stringify({ bookingCode: 'BKABC123' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toBe('Đơn đặt phòng không ở trạng thái chờ thanh toán')
  })

  it('successfully records payment claimed for pending booking', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: 'b1', code: 'BKABC123', status: 'pending' },
      error: null,
    })
    const req = new NextRequest('http://localhost/api/bookings/claim-payment', {
      method: 'POST',
      body: JSON.stringify({ bookingCode: 'BKABC123' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.message).toBe('Đã ghi nhận yêu cầu xác nhận thanh toán')
  })
})
