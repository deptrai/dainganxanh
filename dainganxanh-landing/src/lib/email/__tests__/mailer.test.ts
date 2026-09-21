/**
 * @jest-environment node
 */
import { sendEcoStayVoucherEmail, sendTreeContractEmail, sendStoreDispatchEmail } from '../index'

const mockInsert = jest.fn().mockResolvedValue({ error: null })
const mockSend = jest.fn().mockResolvedValue({ data: { id: 'resend-msg-123' }, error: null })

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}))

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: mockInsert,
    })),
  })),
}))

describe('Centralized Email Delivery Service — Resend & Logging', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, RESEND_API_KEY: 're_test_key_123456' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  test('sendEcoStayVoucherEmail sends email via Resend and logs to email_logs', async () => {
    const result = await sendEcoStayVoucherEmail({
      bookingId: '11111111-1111-1111-1111-111111111111',
      recipientEmail: 'guest@example.com',
      guestName: 'Nguyễn Thu Trang',
      bookingCode: 'BK778899',
      roomName: 'Bungalow Rừng Trầm',
      gardenName: 'Vườn Ba Vì',
      gardenAddress: 'Ba Vì, Hà Nội',
      checkInDate: '2026-10-01',
      checkOutDate: '2026-10-03',
      nightsCount: 2,
      guestsCount: 2,
      totalAmount: 2000000,
    })

    expect(result.success).toBe(true)
    expect(result.resendId).toBe('resend-msg-123')
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'guest@example.com',
        subject: expect.stringContaining('BK778899'),
      })
    )
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: '11111111-1111-1111-1111-111111111111',
        email_type: 'ecostay_voucher',
        recipient: 'guest@example.com',
        status: 'sent',
        resend_id: 'resend-msg-123',
      })
    )
  })

  test('sendStoreDispatchEmail formats items table and logs store_dispatch', async () => {
    const result = await sendStoreDispatchEmail({
      storeOrderId: '22222222-2222-2222-2222-222222222222',
      recipientEmail: 'customer@example.com',
      customerName: 'Trần Văn Bình',
      orderCode: 'ST123456',
      carrier: 'GHTK',
      trackingCode: 'TRACK123',
      shippingAddress: '456 Lê Duẩn',
      shippingProvince: 'Đà Nẵng',
      subtotal: 100000,
      shippingFee: 30000,
      totalAmount: 130000,
      items: [
        {
          name: 'Nhang Trầm Tự Nhiên',
          quantity: 2,
          unitPrice: 50000,
          lineTotal: 100000,
        },
      ],
    })

    expect(result.success).toBe(true)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'customer@example.com',
        subject: expect.stringContaining('ST123456'),
      })
    )
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: '22222222-2222-2222-2222-222222222222',
        email_type: 'store_dispatch',
        recipient: 'customer@example.com',
        status: 'sent',
      })
    )
  })

  test('falls back gracefully when RESEND_API_KEY is missing (dev/mock mode)', async () => {
    delete process.env.RESEND_API_KEY

    const result = await sendTreeContractEmail({
      orderId: '33333333-3333-3333-3333-333333333333',
      recipientEmail: 'treeowner@example.com',
      userName: 'Lê Hoàng',
      orderCode: 'DH998877',
      quantity: 10,
      totalAmount: 2600000,
    })

    expect(result.success).toBe(true)
    expect(result.resendId).toBe('dev-mock-id')
    expect(mockSend).not.toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: '33333333-3333-3333-3333-333333333333',
        email_type: 'tree_contract',
        recipient: 'treeowner@example.com',
        status: 'sent',
      })
    )
  })

  test('returns success=false when Resend returns an error and logs failure to email_logs', async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: 'Resend API rejected the recipient' },
    })

    const result = await sendStoreDispatchEmail({
      storeOrderId: '44444444-4444-4444-4444-444444444444',
      recipientEmail: 'fail@example.com',
      customerName: 'Phạm Cảnh',
      orderCode: 'ST999999',
      shippingAddress: '789 Nguyễn Trãi',
      shippingProvince: 'TP.HCM',
      subtotal: 50000,
      shippingFee: 30000,
      totalAmount: 80000,
      items: [{ name: 'Trầm Tốc', quantity: 1, unitPrice: 50000, lineTotal: 50000 }],
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Resend API rejected the recipient')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: '44444444-4444-4444-4444-444444444444',
        email_type: 'store_dispatch',
        recipient: 'fail@example.com',
        status: 'failed',
        error_message: 'Resend API rejected the recipient',
      })
    )
  })

  test('returns success=false when Resend throws an exception and logs to email_logs', async () => {
    mockSend.mockRejectedValueOnce(new Error('Network timeout'))

    const result = await sendEcoStayVoucherEmail({
      bookingId: '55555555-5555-5555-5555-555555555555',
      recipientEmail: 'network@example.com',
      guestName: 'Đỗ Văn Sắc',
      bookingCode: 'BK777777',
      roomName: 'Bungalow',
      checkInDate: '2026-10-01',
      checkOutDate: '2026-10-02',
      nightsCount: 1,
      guestsCount: 1,
      totalAmount: 500000,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Network timeout')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: '55555555-5555-5555-5555-555555555555',
        email_type: 'ecostay_voucher',
        recipient: 'network@example.com',
        status: 'failed',
      })
    )
  })
})
