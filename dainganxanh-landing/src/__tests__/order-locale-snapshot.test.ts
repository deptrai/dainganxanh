/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST as postPendingOrder } from '@/app/api/orders/pending/route'
import { POST as postStoreOrder } from '@/app/api/store/orders/create/route'
import { POST as postBooking } from '@/app/api/bookings/create/route'

const mockUpsertOrder = jest.fn()
const mockInsertStoreOrder = jest.fn()
const mockInsertBooking = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(() => ({
    from: (table: string) => {
      if (table === 'orders') {
        return {
          upsert: (...args: any[]) => {
            mockUpsertOrder(...args)
            return Promise.resolve({ error: null })
          },
          update: () => ({ eq: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) }) }),
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { id: 'order-1', code: 'DH999999' }, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'store_orders') {
        return {
          insert: (...args: any[]) => {
            mockInsertStoreOrder(...args)
            return {
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: 'store-1',
                      code: 'DH123456',
                      total_amount: 150000,
                      payment_method: 'banking',
                      expires_at: null,
                    },
                    error: null,
                  }),
              }),
            }
          },
        }
      }
      if (table === 'store_order_items') {
        return {
          insert: () => Promise.resolve({ error: null }),
        }
      }
      if (table === 'room_bookings') {
        return {
          insert: (...args: any[]) => {
            mockInsertBooking(...args)
            return {
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: 'bk-1',
                      code: 'BK123456',
                      room_id: 'r1',
                      check_in_date: '2026-05-01',
                      check_out_date: '2026-05-03',
                      nights_count: 2,
                      total_amount: 1000000,
                      payment_method: 'banking',
                      expires_at: null,
                      status: 'pending',
                    },
                    error: null,
                  }),
              }),
            }
          },
        }
      }
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { referral_code: null, referred_by: null } }),
            }),
          }),
        }
      }
      const chainable: any = {
        select: () => chainable,
        eq: () => chainable,
        lte: () => chainable,
        gt: () => chainable,
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        then: (resolve: any) => resolve({ data: [], error: null }),
      }
      return chainable
    },
    rpc: jest.fn().mockResolvedValue({ data: true, error: null }),
  })),
}))

jest.mock('@/lib/getEffectiveUser', () => ({
  getEffectiveUser: jest.fn().mockResolvedValue({
    userId: 'user-test-123',
    email: 'user@example.com',
    name: 'Test User',
  }),
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: () => ({ ok: true, remaining: 10, retryAfterSec: 0 }),
}))

jest.mock('@/lib/utils/telegram', () => ({
  notifyNewOrder: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/pricing', () => ({
  calculateStoreOrderPrice: jest.fn().mockResolvedValue({
    items: [{ productId: 'prod-1', name: 'Nhang Trầm', unitPrice: 150000, quantity: 1 }],
    subtotal: 150000,
    shippingFee: 0,
    totalAmount: 150000,
  }),
  calculateBookingPrice: jest.fn().mockResolvedValue({
    room: { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', name: 'Bungalow', price_per_night: 500000 },
    nights: 2,
    subtotal: 1000000,
    totalAmount: 1000000,
  }),
  PricingError: class PricingError extends Error {
    statusCode = 400
  },
}))

describe('Order & Booking Locale Snapshotting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Tree Investment Orders (/api/orders/pending)', () => {
    const basePayload = {
      code: 'DH999999',
      quantity: 1,
      total_amount: 410000,
      unit_price: 410000,
      payment_method: 'banking' as const,
    }

    it('snapshots locale = "en" when NEXT_LOCALE=en cookie is present', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders/pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'NEXT_LOCALE=en',
        },
        body: JSON.stringify(basePayload),
      })

      const res = await postPendingOrder(req)
      expect(res.status).toBe(200)

      expect(mockUpsertOrder).toHaveBeenCalledTimes(1)
      const upsertArg = mockUpsertOrder.mock.calls[0][0]
      expect(upsertArg.locale).toBe('en')
    })

    it('snapshots locale = "vi" when NEXT_LOCALE cookie is omitted (guest default)', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders/pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(basePayload),
      })

      const res = await postPendingOrder(req)
      expect(res.status).toBe(200)

      expect(mockUpsertOrder).toHaveBeenCalledTimes(1)
      const upsertArg = mockUpsertOrder.mock.calls[0][0]
      expect(upsertArg.locale).toBe('vi')
    })

    it('falls back to "vi" when NEXT_LOCALE cookie has invalid value (e.g. "fr")', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders/pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'NEXT_LOCALE=fr',
        },
        body: JSON.stringify(basePayload),
      })

      const res = await postPendingOrder(req)
      expect(res.status).toBe(200)

      expect(mockUpsertOrder).toHaveBeenCalledTimes(1)
      const upsertArg = mockUpsertOrder.mock.calls[0][0]
      expect(upsertArg.locale).toBe('vi')
    })

    it('falls back to body locale when cookie is absent or invalid', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders/pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'NEXT_LOCALE=fr',
        },
        body: JSON.stringify({ ...basePayload, locale: 'en' }),
      })

      const res = await postPendingOrder(req)
      expect(res.status).toBe(200)

      expect(mockUpsertOrder).toHaveBeenCalledTimes(1)
      const upsertArg = mockUpsertOrder.mock.calls[0][0]
      expect(upsertArg.locale).toBe('en')
    })
  })

  describe('Store Product Orders (/api/store/orders/create)', () => {
    const storePayload = {
      product_slug: 'nhang-tram',
      quantity: 1,
      customer_name: 'Nguyen Van A',
      customer_phone: '0901234567',
      shipping_address: '123 Le Loi',
      shipping_province: 'TP. Ho Chi Minh',
      payment_method: 'banking',
      total_amount: 150000,
    }

    it('snapshots locale = "en" in store_orders when NEXT_LOCALE=en', async () => {
      const req = new NextRequest('http://localhost:3000/api/store/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'NEXT_LOCALE=en',
        },
        body: JSON.stringify(storePayload),
      })

      const res = await postStoreOrder(req)
      expect(res.status).toBe(200)

      expect(mockInsertStoreOrder).toHaveBeenCalledTimes(1)
      const insertArg = mockInsertStoreOrder.mock.calls[0][0]
      expect(insertArg.locale).toBe('en')
    })

    it('defaults store_orders locale to "vi" when NEXT_LOCALE is absent', async () => {
      const req = new NextRequest('http://localhost:3000/api/store/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storePayload),
      })

      const res = await postStoreOrder(req)
      expect(res.status).toBe(200)

      expect(mockInsertStoreOrder).toHaveBeenCalledTimes(1)
      const insertArg = mockInsertStoreOrder.mock.calls[0][0]
      expect(insertArg.locale).toBe('vi')
    })
  })

  describe('Room Bookings (/api/bookings/create)', () => {
    const bookingPayload = {
      room_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      guest_name: 'John Doe',
      guest_phone: '0901234567',
      check_in_date: '2027-01-10',
      check_out_date: '2027-01-12',
      guests_count: 2,
      payment_method: 'banking',
      total_amount: 1000000,
    }

    it('snapshots locale = "en" in room_bookings when NEXT_LOCALE=en', async () => {
      const req = new NextRequest('http://localhost:3000/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'NEXT_LOCALE=en',
        },
        body: JSON.stringify(bookingPayload),
      })

      const res = await postBooking(req)
      expect(res.status).toBe(201)

      expect(mockInsertBooking).toHaveBeenCalledTimes(1)
      const insertArg = mockInsertBooking.mock.calls[0][0]
      expect(insertArg.locale).toBe('en')
    })

    it('defaults room_bookings locale to "vi" when NEXT_LOCALE is absent', async () => {
      const req = new NextRequest('http://localhost:3000/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      })

      const res = await postBooking(req)
      expect(res.status).toBe(201)

      expect(mockInsertBooking).toHaveBeenCalledTimes(1)
      const insertArg = mockInsertBooking.mock.calls[0][0]
      expect(insertArg.locale).toBe('vi')
    })
  })
})
