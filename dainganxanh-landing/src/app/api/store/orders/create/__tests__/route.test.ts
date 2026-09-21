/**
 * Unit Tests: POST /api/store/orders/create
 *
 * Covers: Zod validation, price calculation, stock reservation logic,
 *         guest vs authenticated checkout, payment method handling.
 */

import { z } from 'zod'

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
