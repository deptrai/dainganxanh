/**
 * @jest-environment node
 *
 * Integration Test: Casso Webhook Booking Payment -> Email Trigger (Story 13.5)
 */

import { NextRequest } from 'next/server'
import { POST } from '../route'
import { sendEcoStayVoucherEmail } from '@/lib/email'
import { createHmac } from 'crypto'

const bookingRecord = {
  id: 'booking-uuid-1',
  code: 'BK123456',
  user_id: null,
  guest_name: 'Nguyễn Văn Khách',
  guest_email: 'khach@example.com',
  room_id: 'room-uuid-1',
  check_in_date: '2026-10-01',
  check_out_date: '2026-10-03',
  nights_count: 2,
  guests_count: 2,
  total_amount: 1000000,
  status: 'pending',
}

const roomRecord = {
  name: 'Bungalow Rừng Trầm',
  lots: { name: 'Vườn Ba Vì', region: 'Hà Nội' },
}

jest.mock('@/lib/supabase/server', () => {
  return {
    createServiceRoleClient: jest.fn(() => ({
      from: jest.fn((table: string) => {
        const chain: any = {
          select: jest.fn(() => chain),
          update: jest.fn(() => chain),
          insert: jest.fn().mockResolvedValue({ error: null }),
          eq: jest.fn(() => chain),
          single: jest.fn(() => {
            if (table === 'room_bookings') {
              return Promise.resolve({ data: bookingRecord, error: null })
            }
            if (table === 'rooms') {
              return Promise.resolve({ data: roomRecord, error: null })
            }
            return Promise.resolve({ data: null, error: null })
          }),
        }
        return chain
      }),
    })),
  }
})

jest.mock('@/lib/email', () => {
  const actual = jest.requireActual('@/lib/email')
  return {
    ...actual,
    sendEcoStayVoucherEmail: jest.fn().mockResolvedValue({
      success: true,
      resendId: 'msg-voucher-123',
    }),
  }
})

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

function sortObjByKey(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return obj
  const sorted: Record<string, unknown> = {}
  Object.keys(obj as Record<string, unknown>)
    .sort()
    .forEach((k) => {
      sorted[k] = sortObjByKey((obj as Record<string, unknown>)[k])
    })
  return sorted
}

describe('Casso Webhook Booking Confirmation Email Trigger', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      CASSO_SECURE_TOKEN: 'test-secure-token',
      POLYMORPHIC_WEBHOOK_ENABLED: 'true',
    }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  test('successfully triggers sendEcoStayVoucherEmail on booking payment confirmation', async () => {
    const body = {
      error: 0,
      data: {
        id: 998877,
        tid: 'TID998877',
        description: 'Thanh toan BK123456 chuyen khoan',
        amount: 1000000,
        when: new Date().toISOString(),
      },
    }

    const timestamp = Date.now().toString()
    const sorted = sortObjByKey(body)
    const signature = createHmac('sha512', 'test-secure-token')
      .update(`${timestamp}.${JSON.stringify(sorted)}`)
      .digest('hex')

    const req = new NextRequest('http://localhost/api/webhooks/casso', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-casso-signature': `t=${timestamp},v1=${signature}`,
      },
      body: JSON.stringify(body),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const resBody = await res.json()
    expect(resBody.ok).toBe(true)

    // Wait a brief tick for the non-blocking promise to fire
    await new Promise((r) => setTimeout(r, 100))

    expect(sendEcoStayVoucherEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: 'booking-uuid-1',
        recipientEmail: 'khach@example.com',
        bookingCode: 'BK123456',
        roomName: 'Bungalow Rừng Trầm',
        gardenName: 'Vườn Ba Vì',
        totalAmount: 1000000,
      })
    )
  })
})
