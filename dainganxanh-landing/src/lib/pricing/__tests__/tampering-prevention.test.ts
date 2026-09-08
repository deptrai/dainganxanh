/**
 * @jest-environment node
 *
 * Price Tampering Prevention Integration Test (Story 13.4)
 * Verifies that client attempts to tamper with prices/totals on all 3 verticals
 * (Tree Orders, Room Bookings, Store Orders) are rejected with HTTP 400.
 */

import { NextRequest } from 'next/server'
import { POST as createBooking } from '@/app/api/bookings/create/route'
import { POST as createStoreOrder } from '@/app/api/store/orders/create/route'
import { POST as createTreeOrder } from '@/app/api/orders/pending/route'

const mockRpc = jest.fn()
const mockInsert = jest.fn()
const mockSelect = jest.fn()
const mockUpdate = jest.fn()
const mockUpsert = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(() => ({
    rpc: mockRpc,
    from: jest.fn((table: string) => {
      if (table === 'rooms') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: '11111111-1111-1111-1111-111111111111',
                    name: 'Phòng VIP',
                    price_per_night: 1200000,
                    capacity: 4,
                    status: 'active',
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'room_pricing_rules') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }
      }
      if (table === 'room_blocks') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              lt: jest.fn().mockReturnValue({
                gt: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'room_bookings') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'bk-id-1',
                  code: 'BKABC123',
                  room_id: '11111111-1111-1111-1111-111111111111',
                  check_in_date: '2026-10-10',
                  check_out_date: '2026-10-12',
                  nights_count: 2,
                  total_amount: 2400000,
                  payment_method: 'banking',
                  expires_at: '2026-10-10T12:00:00Z',
                  status: 'pending',
                },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'products') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [
                  {
                    id: 'prod-1',
                    slug: 'nhang-tram',
                    name: 'Nhang Trầm',
                    price: 50000,
                    stock_quantity: 10,
                    status: 'active',
                  },
                ],
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'store_orders') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'order-1',
                  code: 'ST123456',
                  total_amount: 130000,
                  payment_method: 'banking',
                  expires_at: '2026-10-10T12:00:00Z',
                },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'store_order_items') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        }
      }
      if (table === 'orders') {
        return {
          upsert: jest.fn().mockResolvedValue({ error: null }),
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'tree-ord-1', code: 'DH123456' },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      }
      return { select: jest.fn(), insert: jest.fn(), update: jest.fn() }
    }),
  })),
}))

jest.mock('@/lib/getEffectiveUser', () => ({
  getEffectiveUser: jest.fn().mockResolvedValue({
    userId: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  }),
}))

jest.mock('@/lib/utils/telegram', () => ({
  notifyNewOrder: jest.fn().mockResolvedValue(true),
}))

describe('Price Tampering Prevention across all order endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRpc.mockResolvedValue({ data: true, error: null })
  })

  test('POST /api/bookings/create: rejects tampered total_amount (sent 1000, expected 2,400,000)', async () => {
    const req = new NextRequest('http://localhost/api/bookings/create', {
      method: 'POST',
      body: JSON.stringify({
        room_id: '11111111-1111-1111-1111-111111111111',
        guest_name: 'Nguyen Van Hack',
        guest_phone: '0912345678',
        check_in_date: '2026-10-10',
        check_out_date: '2026-10-12',
        guests_count: 2,
        payment_method: 'banking',
        total_amount: 1000, // Tampered price
      }),
    })

    const res = await createBooking(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Giá trị đơn hàng không khớp')
  })

  test('POST /api/store/orders/create: rejects tampered total_amount (sent 500, expected 130,000)', async () => {
    const req = new NextRequest('http://localhost/api/store/orders/create', {
      method: 'POST',
      body: JSON.stringify({
        product_slug: 'nhang-tram',
        quantity: 2,
        customer_name: 'Tran Hack',
        customer_phone: '0912345678',
        shipping_address: '123 Test Street',
        shipping_province: 'Hà Nội',
        payment_method: 'banking',
        total_amount: 500, // Tampered price
      }),
    })

    const res = await createStoreOrder(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Giá trị đơn hàng không khớp')
  })

  test('POST /api/orders/pending (Tree): rejects tampered total_amount', async () => {
    const req = new NextRequest('http://localhost/api/orders/pending', {
      method: 'POST',
      body: JSON.stringify({
        code: 'DHABC123',
        quantity: 2,
        unit_price: 410000,
        total_amount: 1000, // Tampered total (expected 820,000)
        payment_method: 'banking',
      }),
    })

    const res = await createTreeOrder(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid total_amount')
  })

  test('POST /api/bookings/create: calculates correct total when client sends no total_amount', async () => {
    const req = new NextRequest('http://localhost/api/bookings/create', {
      method: 'POST',
      body: JSON.stringify({
        room_id: '11111111-1111-1111-1111-111111111111',
        guest_name: 'Nguyen Van Legitimate',
        guest_phone: '0912345678',
        check_in_date: '2026-10-10',
        check_out_date: '2026-10-12',
        guests_count: 2,
        payment_method: 'banking',
      }),
    })

    const res = await createBooking(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.totalAmount).toBe(2400000)
    expect(data.bookingCode).toBe('BKABC123')
  })
})
