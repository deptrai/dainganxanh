/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '../route'
import { revalidatePath } from 'next/cache'

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

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('POST /api/bookings/cancel', () => {
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
    const req = new NextRequest('http://localhost/api/bookings/cancel', {
      method: 'POST',
      body: JSON.stringify({ bookingCode: 'INVALID' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Mã đặt phòng không hợp lệ')
  })

  it('returns 404 when booking does not exist', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const req = new NextRequest('http://localhost/api/bookings/cancel', {
      method: 'POST',
      body: JSON.stringify({ bookingCode: 'BKABC123' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Không tìm thấy đơn đặt phòng')
  })

  it('returns 409 if trying to cancel non-pending booking', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: 'b1', code: 'BKABC123', status: 'confirmed', rooms: { lot_id: 'lot-1' } },
      error: null,
    })
    const req = new NextRequest('http://localhost/api/bookings/cancel', {
      method: 'POST',
      body: JSON.stringify({ bookingCode: 'BKABC123' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toBe('Chỉ có thể hủy đơn đặt phòng đang chờ thanh toán')
  })

  it('successfully cancels pending booking and triggers revalidation', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: 'b1', code: 'BKABC123', status: 'pending', rooms: { lot_id: 'lot-1' } },
      error: null,
    })
    const req = new NextRequest('http://localhost/api/bookings/cancel', {
      method: 'POST',
      body: JSON.stringify({ bookingCode: 'BKABC123', reason: 'Đổi kế hoạch' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.message).toBe('Đã hủy đặt phòng thành công')
    expect(revalidatePath).toHaveBeenCalledWith('/eco-tourism')
    expect(revalidatePath).toHaveBeenCalledWith('/eco-tourism/lot-1', 'page')
  })
})
