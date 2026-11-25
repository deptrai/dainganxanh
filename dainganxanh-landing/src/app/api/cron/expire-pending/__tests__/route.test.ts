/**
 * @jest-environment node
 *
 * Unit Tests: /api/cron/expire-pending  (Story 13.3)
 *
 * Covers: Bearer CRON_SECRET authentication for GET & POST,
 *         atomic RPC invocations, return counts, error isolation.
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

const mockRpc = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(() => ({
    rpc: mockRpc,
  })),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('@/lib/monitoring', () => ({
  captureError: jest.fn(),
  trackLatency: jest.fn(),
}))

const CRON_SECRET = 'test-cron-secret-123'

beforeEach(() => {
  jest.clearAllMocks()
  process.env.CRON_SECRET = CRON_SECRET
})

describe('GET & POST /api/cron/expire-pending — Authentication', () => {
  test('returns 401 Unauthorized when Authorization header is missing', async () => {
    const req = new NextRequest('http://localhost/api/cron/expire-pending', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
    expect(mockRpc).not.toHaveBeenCalled()
  })

  test('returns 401 Unauthorized when Bearer token is invalid', async () => {
    const req = new NextRequest('http://localhost/api/cron/expire-pending', {
      method: 'POST',
      headers: { authorization: 'Bearer wrong-secret' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    expect(mockRpc).not.toHaveBeenCalled()
  })

  test('returns 401 Unauthorized for GET when token is missing', async () => {
    const req = new Request('http://localhost/api/cron/expire-pending', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(401)
    expect(mockRpc).not.toHaveBeenCalled()
  })
})

describe('POST /api/cron/expire-pending — Execution & RPC calls', () => {
  test('successfully executes RPCs and returns expired counts for POST', async () => {
    mockRpc.mockImplementation((fnName: string) => {
      if (fnName === 'expire_pending_bookings') return Promise.resolve({ data: 3, error: null })
      if (fnName === 'expire_pending_store_orders') return Promise.resolve({ data: 2, error: null })
      return Promise.resolve({ data: 0, error: null })
    })

    const req = new NextRequest('http://localhost/api/cron/expire-pending', {
      method: 'POST',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.expiredBookings).toBe(3)
    expect(body.expiredOrders).toBe(2)
    expect(typeof body.durationMs).toBe('number')
    expect(mockRpc).toHaveBeenCalledWith('expire_pending_bookings')
    expect(mockRpc).toHaveBeenCalledWith('expire_pending_store_orders')
  })

  test('successfully executes via GET with valid Bearer token', async () => {
    mockRpc.mockImplementation((fnName: string) => {
      if (fnName === 'expire_pending_bookings') return Promise.resolve({ data: 1, error: null })
      if (fnName === 'expire_pending_store_orders') return Promise.resolve({ data: 0, error: null })
      return Promise.resolve({ data: 0, error: null })
    })

    const req = new Request('http://localhost/api/cron/expire-pending', {
      method: 'GET',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    })

    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.expiredBookings).toBe(1)
    expect(body.expiredOrders).toBe(0)
  })

  test('isolates errors: if expire_pending_bookings throws, store orders still process', async () => {
    mockRpc.mockImplementation((fnName: string) => {
      if (fnName === 'expire_pending_bookings') return Promise.reject(new Error('DB Timeout on bookings'))
      if (fnName === 'expire_pending_store_orders') return Promise.resolve({ data: 5, error: null })
      return Promise.resolve({ data: 0, error: null })
    })

    const req = new NextRequest('http://localhost/api/cron/expire-pending', {
      method: 'POST',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.expiredBookings).toBe(0)
    expect(body.expiredOrders).toBe(5)
  })
})

describe('CRON_COD_SAFE — migration guard (Story 12.4)', () => {
  // expire_pending_store_orders() filter lives in SQL, not mockable via unit test.
  // Guard the safety property directly: pending COD orders (expires_at NULL) must
  // never be picked up — the WHERE clause must pin payment_method='banking' AND expires_at.
  test('expire_pending_store_orders() only expires banking orders with expires_at set', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const sql = fs.readFileSync(
      path.resolve(__dirname, '../../../../../../..', 'supabase/migrations/20260906000001_atomic_expire_pending_inventory.sql'),
      'utf8'
    )
    const fnBody = sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION public.expire_pending_store_orders'))
    expect(fnBody).toMatch(/status\s*=\s*'pending'/)
    expect(fnBody).toMatch(/payment_method\s*=\s*'banking'/)
    expect(fnBody).toMatch(/expires_at\s+IS\s+NOT\s+NULL/)
    expect(fnBody).toMatch(/expires_at\s*<\s*now\(\)/)
  })
})
