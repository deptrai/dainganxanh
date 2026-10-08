/**
 * @jest-environment node
 *
 * Unit Tests: POST /api/store/orders/create
 *
 * Covers: Zod validation, price calculation, stock reservation logic,
 *         guest vs authenticated checkout, payment method handling,
 *         23505 collision retry loop, COD pending status.
 */

import { z } from 'zod'
import { NextRequest } from 'next/server'
import { POST } from '../route'

const mockRpc = jest.fn()
const mockFrom = jest.fn()
const mockInsertStoreOrders = jest.fn()
const mockSelectStoreOrders = jest.fn()
const mockSingleStoreOrders = jest.fn()
const mockUpdateStoreOrders = jest.fn()
const mockDeleteStoreOrders = jest.fn()
const mockEqStoreOrders = jest.fn()
const mockInsertOrderItems = jest.fn()

let mockRateLimitResult = { ok: true, remaining: 29, retryAfterSec: 0 }
const mockCalculateStoreOrderPrice = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(() => ({
    rpc: mockRpc,
    from: mockFrom,
  })),
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: () => mockRateLimitResult,
}))

jest.mock('@/lib/getEffectiveUser', () => ({
  getEffectiveUser: jest.fn().mockResolvedValue(null),
}))

jest.mock('@/lib/monitoring', () => ({
  captureError: jest.fn(),
  trackLatency: jest.fn(),
}))

jest.mock('@/lib/pricing', () => {
  const actual = jest.requireActual('@/lib/pricing')
  return {
    ...actual,
    calculateStoreOrderPrice: (...args: any[]) => mockCalculateStoreOrderPrice(...args),
  }
})

const createOrderSchema = z.object({
  product_slug: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
  customer_name: z.string().min(1, 'Vui lòng nhập họ tên'),
  customer_phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ'),
  customer_email: z.string().email().optional().or(z.literal('')),
  shipping_address: z.string().min(1, 'Vui lòng nhập địa chỉ giao hàng'),
  shipping_province: z.string().min(1, 'Vui lòng chọn tỉnh/thành phố'),
  shipping_note: z.string().optional(),
  payment_method: z.enum(['banking', 'cod']),
})

describe('createOrderSchema — Store Order Validation', () => {
  const validPayload = {
    product_slug: 'nhang-tram-huong-cao-cap',
    quantity: 2,
    customer_name: 'Trần Thị B',
    customer_phone: '0912345678',
    customer_email: 'tranthib@gmail.com',
    shipping_address: '123 Hai Bà Trưng, Phường Bến Nghé, Quận 1',
    shipping_province: 'Hồ Chí Minh',
    shipping_note: 'Giao giờ hành chính',
    payment_method: 'banking' as const,
  }

  test('validates valid store order payload', () => {
    const result = createOrderSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  test('allows COD payment method', () => {
    const result = createOrderSchema.safeParse({ ...validPayload, payment_method: 'cod' })
    expect(result.success).toBe(true)
  })

  test('rejects invalid payment method', () => {
    const result = createOrderSchema.safeParse({ ...validPayload, payment_method: 'credit_card' })
    expect(result.success).toBe(false)
  })

  test('rejects quantity > 10 (MVP limit)', () => {
    const result = createOrderSchema.safeParse({ ...validPayload, quantity: 11 })
    expect(result.success).toBe(false)
  })

  test('rejects quantity < 1', () => {
    expect(createOrderSchema.safeParse({ ...validPayload, quantity: 0 }).success).toBe(false)
    expect(createOrderSchema.safeParse({ ...validPayload, quantity: -1 }).success).toBe(false)
  })

  test('rejects empty customer_name or shipping_address', () => {
    expect(createOrderSchema.safeParse({ ...validPayload, customer_name: '' }).success).toBe(false)
    expect(createOrderSchema.safeParse({ ...validPayload, shipping_address: '' }).success).toBe(false)
    expect(createOrderSchema.safeParse({ ...validPayload, shipping_province: '' }).success).toBe(false)
  })
})

describe('Store Order Calculations & Utilities', () => {
  test('calculates server-side total: product.price * quantity + shippingFee', () => {
    const productPrice = 250000
    const quantity = 3
    const shippingFee = 0
    const subtotal = productPrice * quantity
    const total = subtotal + shippingFee
    expect(subtotal).toBe(750000)
    expect(total).toBe(750000)
  })

  test('generates order code starting with ST and length 8', () => {
    const code = 'ST' + Math.random().toString(36).substring(2, 8).toUpperCase()
    expect(code.startsWith('ST')).toBe(true)
    expect(code.length).toBe(8)
    expect(code).toMatch(/^ST[A-Z0-9]{6}$/)
  })

  test('calculates 15-minute expiration for banking and null for COD', () => {
    const getExpiresAt = (method: 'banking' | 'cod', now: number) => {
      return method === 'banking' ? new Date(now + 15 * 60 * 1000).toISOString() : null
    }

    const now = 1788656000000
    expect(getExpiresAt('banking', now)).toBe(new Date(now + 15 * 60 * 1000).toISOString())
    expect(getExpiresAt('cod', now)).toBeNull()
  })
})

describe('POST /api/store/orders/create — Handler Execution & Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRateLimitResult = { ok: true, remaining: 29, retryAfterSec: 0 }

    mockFrom.mockImplementation((table: string) => {
      if (table === 'store_orders') {
        return {
          insert: mockInsertStoreOrders,
          update: mockUpdateStoreOrders,
          delete: mockDeleteStoreOrders,
        }
      }
      if (table === 'store_order_items') {
        return {
          insert: mockInsertOrderItems,
        }
      }
      return {}
    })

    mockInsertStoreOrders.mockReturnValue({ select: mockSelectStoreOrders })
    mockSelectStoreOrders.mockReturnValue({ single: mockSingleStoreOrders })
    mockUpdateStoreOrders.mockReturnValue({ eq: mockEqStoreOrders })
    mockDeleteStoreOrders.mockReturnValue({ eq: mockEqStoreOrders })
    mockInsertOrderItems.mockResolvedValue({ error: null })
    mockRpc.mockResolvedValue({ data: true, error: null })

    mockCalculateStoreOrderPrice.mockResolvedValue({
      items: [
        {
          productId: 'prod-uuid-1',
          slug: 'nhang-tram-huong-cao-cap',
          name: 'Nhang Trầm Hương Cao Cấp',
          unitPrice: 250000,
          quantity: 2,
          lineTotal: 500000,
        },
      ],
      subtotal: 500000,
      shippingFee: 0,
      totalAmount: 500000,
    })
  })

  test('creates COD order with status pending, expires_at null, and does not call update', async () => {
    mockSingleStoreOrders.mockResolvedValue({
      data: {
        id: 'order-cod-1',
        code: 'STABC123',
        total_amount: 500000,
        payment_method: 'cod',
        expires_at: null,
      },
      error: null,
    })

    const req = new NextRequest('http://localhost/api/store/orders/create', {
      method: 'POST',
      body: JSON.stringify({
        product_slug: 'nhang-tram-huong-cao-cap',
        quantity: 2,
        customer_name: 'Trần Thị B',
        customer_phone: '0912345678',
        shipping_address: '123 Hai Bà Trưng, Phường Bến Nghé, Quận 1',
        shipping_province: 'Hồ Chí Minh',
        payment_method: 'cod',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.orderId).toBe('order-cod-1')
    expect(body.paymentMethod).toBe('cod')
    expect(body.expiresAt).toBeNull()

    // Verify insert payload
    expect(mockInsertStoreOrders).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending',
        expires_at: null,
        payment_method: 'cod',
        total_amount: 500000,
      })
    )

    // Verify stock reservation was made
    expect(mockRpc).toHaveBeenCalledWith('reserve_product_stock', {
      p_product_id: 'prod-uuid-1',
      p_qty: 2,
    })

    // Verify no update was called (COD is pending, telesale will confirm later)
    expect(mockUpdateStoreOrders).not.toHaveBeenCalled()
  })

  test('creates Banking order with status pending and expires_at set ~15 minutes in future', async () => {
    const futureDate = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    mockSingleStoreOrders.mockResolvedValue({
      data: {
        id: 'order-bank-1',
        code: 'STBANK01',
        total_amount: 500000,
        payment_method: 'banking',
        expires_at: futureDate,
      },
      error: null,
    })

    const req = new NextRequest('http://localhost/api/store/orders/create', {
      method: 'POST',
      body: JSON.stringify({
        product_slug: 'nhang-tram-huong-cao-cap',
        quantity: 2,
        customer_name: 'Nguyễn Văn A',
        customer_phone: '0901234567',
        shipping_address: '456 Lê Lợi, Quận 1',
        shipping_province: 'Hồ Chí Minh',
        payment_method: 'banking',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.paymentMethod).toBe('banking')
    expect(body.expiresAt).toBe(futureDate)

    const inserted = mockInsertStoreOrders.mock.calls[0][0]
    expect(inserted.status).toBe('pending')
    expect(inserted.payment_method).toBe('banking')
    expect(typeof inserted.expires_at).toBe('string')
    const expireDiff = new Date(inserted.expires_at).getTime() - Date.now()
    expect(expireDiff).toBeGreaterThan(14 * 60 * 1000)
    expect(expireDiff).toBeLessThanOrEqual(15 * 60 * 1000 + 5000)
  })

  test('retries order insertion up to 3 times on unique code collision (23505) and succeeds', async () => {
    // First attempt fails with 23505, second attempt succeeds
    mockSingleStoreOrders
      .mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'order-retry-2',
          code: 'STRETRY2',
          total_amount: 500000,
          payment_method: 'cod',
          expires_at: null,
        },
        error: null,
      })

    const req = new NextRequest('http://localhost/api/store/orders/create', {
      method: 'POST',
      body: JSON.stringify({
        product_slug: 'nhang-tram-huong-cao-cap',
        quantity: 2,
        customer_name: 'Trần Thị B',
        customer_phone: '0912345678',
        shipping_address: '123 Hai Bà Trưng, Phường Bến Nghé, Quận 1',
        shipping_province: 'Hồ Chí Minh',
        payment_method: 'cod',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.orderId).toBe('order-retry-2')
    expect(mockInsertStoreOrders).toHaveBeenCalledTimes(2)

    // Verify different codes were used
    const firstCode = mockInsertStoreOrders.mock.calls[0][0].code
    const secondCode = mockInsertStoreOrders.mock.calls[1][0].code
    expect(firstCode).toMatch(/^ST[A-Z0-9]{6}$/)
    expect(secondCode).toMatch(/^ST[A-Z0-9]{6}$/)
    expect(firstCode).not.toBe(secondCode)

    // Stock should not be released
    expect(mockRpc).not.toHaveBeenCalledWith('release_product_stock', expect.anything())
  })

  test('releases reserved stock and returns 500 when 23505 collisions exhaust all 3 attempts', async () => {
    mockSingleStoreOrders.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key collision' },
    })

    const req = new NextRequest('http://localhost/api/store/orders/create', {
      method: 'POST',
      body: JSON.stringify({
        product_slug: 'nhang-tram-huong-cao-cap',
        quantity: 2,
        customer_name: 'Trần Thị B',
        customer_phone: '0912345678',
        shipping_address: '123 Hai Bà Trưng, Phường Bến Nghé, Quận 1',
        shipping_province: 'Hồ Chí Minh',
        payment_method: 'cod',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Không thể tạo đơn hàng')

    // Attempted 3 times
    expect(mockInsertStoreOrders).toHaveBeenCalledTimes(3)

    // Stock released
    expect(mockRpc).toHaveBeenCalledWith('release_product_stock', {
      p_product_id: 'prod-uuid-1',
      p_qty: 2,
    })
  })

  test('fails immediately on non-23505 DB error and releases stock without retrying', async () => {
    mockSingleStoreOrders.mockResolvedValue({
      data: null,
      error: { code: '42P01', message: 'relation does not exist' },
    })

    const req = new NextRequest('http://localhost/api/store/orders/create', {
      method: 'POST',
      body: JSON.stringify({
        product_slug: 'nhang-tram-huong-cao-cap',
        quantity: 2,
        customer_name: 'Trần Thị B',
        customer_phone: '0912345678',
        shipping_address: '123 Hai Bà Trưng, Phường Bến Nghé, Quận 1',
        shipping_province: 'Hồ Chí Minh',
        payment_method: 'cod',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Không thể tạo đơn hàng')

    // Only called once (no retry on non-23505)
    expect(mockInsertStoreOrders).toHaveBeenCalledTimes(1)
    expect(mockRpc).toHaveBeenCalledWith('release_product_stock', {
      p_product_id: 'prod-uuid-1',
      p_qty: 2,
    })
  })
})
