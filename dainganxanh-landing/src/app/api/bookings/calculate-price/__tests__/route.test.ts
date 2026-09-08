/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '../route'
import { calculateBookingPrice, PricingError } from '@/lib/pricing'

const mockFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(() => ({
    from: mockFrom,
  })),
}))

function makeQueryChain(resolveValue: any) {
  const chain: any = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    lt: jest.fn(() => chain),
    gt: jest.fn(() => chain),
    order: jest.fn(() => Promise.resolve(resolveValue)),
    then: (resolve: any, reject: any) => Promise.resolve(resolveValue).then(resolve, reject),
    catch: (reject: any) => Promise.resolve(resolveValue).catch(reject),
  }
  return chain
}

jest.mock('@/lib/pricing', () => {
  const actual = jest.requireActual('@/lib/pricing')
  return {
    ...actual,
    calculateBookingPrice: jest.fn(),
  }
})

describe('POST /api/bookings/calculate-price', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFrom.mockReset()
    mockFrom.mockReturnValue(makeQueryChain({ data: [], error: null }))
  })

  test('validates payload and returns calculated price', async () => {
    ;(calculateBookingPrice as jest.Mock).mockResolvedValueOnce({
      roomId: '11111111-1111-1111-1111-111111111111',
      roomName: 'Bungalow Rừng Trầm',
      nights: 2,
      basePricePerNight: 1000000,
      nightBreakdown: [
        { date: '2026-10-10', price: 1000000, isCustomRule: false },
        { date: '2026-10-11', price: 1000000, isCustomRule: false },
      ],
      totalAmount: 2000000,
    })

    const req = new NextRequest('http://localhost/api/bookings/calculate-price', {
      method: 'POST',
      body: JSON.stringify({
        room_id: '11111111-1111-1111-1111-111111111111',
        check_in_date: '2026-10-10',
        check_out_date: '2026-10-12',
        guests_count: 2,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.totalAmount).toBe(2000000)
    expect(data.nights).toBe(2)
  })

  test('returns 400 for invalid room_id or date format', async () => {
    const req = new NextRequest('http://localhost/api/bookings/calculate-price', {
      method: 'POST',
      body: JSON.stringify({
        room_id: 'invalid-uuid',
        check_in_date: '10/10/2026',
        check_out_date: '12/10/2026',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  test('returns PricingError status and message when business rule fails', async () => {
    ;(calculateBookingPrice as jest.Mock).mockRejectedValueOnce(
      new PricingError('Yêu cầu đặt tối thiểu 3 đêm cho giai đoạn này.', 400)
    )

    const req = new NextRequest('http://localhost/api/bookings/calculate-price', {
      method: 'POST',
      body: JSON.stringify({
        room_id: '11111111-1111-1111-1111-111111111111',
        check_in_date: '2026-10-10',
        check_out_date: '2026-10-12',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Yêu cầu đặt tối thiểu 3 đêm cho giai đoạn này.')
  })
})
