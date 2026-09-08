/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '../route'
import { calculateStoreOrderPrice, PricingError } from '@/lib/pricing'

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(() => ({})),
}))

jest.mock('@/lib/pricing', () => {
  const actual = jest.requireActual('@/lib/pricing')
  return {
    ...actual,
    calculateStoreOrderPrice: jest.fn(),
  }
})

describe('POST /api/store/calculate-price', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('validates payload and returns calculated store price', async () => {
    ;(calculateStoreOrderPrice as jest.Mock).mockResolvedValueOnce({
      items: [
        {
          slug: 'nhang-tram-tu-nhien',
          productId: 'prod-1',
          name: 'Nhang Trầm Tự Nhiên',
          unitPrice: 50000,
          quantity: 2,
          lineTotal: 100000,
        },
      ],
      subtotal: 100000,
      shippingFee: 30000,
      totalAmount: 130000,
    })

    const req = new NextRequest('http://localhost/api/store/calculate-price', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ slug: 'nhang-tram-tu-nhien', quantity: 2 }],
        province: 'Hà Nội',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.subtotal).toBe(100000)
    expect(data.shippingFee).toBe(30000)
    expect(data.totalAmount).toBe(130000)
  })

  test('returns 400 when items is empty', async () => {
    const req = new NextRequest('http://localhost/api/store/calculate-price', {
      method: 'POST',
      body: JSON.stringify({
        items: [],
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  test('returns 404 when product is not found', async () => {
    ;(calculateStoreOrderPrice as jest.Mock).mockRejectedValueOnce(
      new PricingError('Sản phẩm không tồn tại hoặc đã ngừng bán', 404)
    )

    const req = new NextRequest('http://localhost/api/store/calculate-price', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ slug: 'non-existent', quantity: 1 }],
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Sản phẩm không tồn tại hoặc đã ngừng bán')
  })
})
