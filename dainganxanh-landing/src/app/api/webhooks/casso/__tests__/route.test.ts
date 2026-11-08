/**
 * @jest-environment node
 *
 * Unit Tests: Casso webhook utilities & processStoreOrder
 *
 * Covers: prefix extraction, order type detection, stale check,
 *         and processStoreOrder (CONFIRM_OK, CONFIRM_IDEMPOTENT, CONFIRM_MISMATCH, CONFIRM_STOCK_FAIL).
 */

import { processStoreOrder, type OrderLike } from '../route'
import { captureError } from '@/lib/monitoring'
import { revalidatePath } from 'next/cache'

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('@/lib/monitoring', () => ({
  captureError: jest.fn(),
  trackLatency: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(),
}))

jest.mock('@/lib/utils/telegram', () => ({
  notifyPaymentSuccess: jest.fn(),
  notifyContractFailure: jest.fn(),
}))

jest.mock('@/actions/createReferralClick', () => ({
  createReferralClick: jest.fn(),
}))

jest.mock('@/lib/email', () => ({
  sendEcoStayVoucherEmail: jest.fn(),
}))

describe('Casso webhook utilities', () => {
  test('ORDER_CODE_REGEX matches DH/BK/ST codes', () => {
    const regex = /\b((?:DH|BK|ST)[A-Z0-9]{6})\b/i
    expect('Payment DH123456'.match(regex)?.[1]).toBe('DH123456')
    expect('Payment BK123456'.match(regex)?.[1]).toBe('BK123456')
    expect('Payment ST123456'.match(regex)?.[1]).toBe('ST123456')
    expect('Payment XX123456'.match(regex)?.[1]).toBeUndefined()
  })

  test('orderTypeFromCode maps prefixes correctly', () => {
    function orderTypeFromCode(code: string) {
      if (code.startsWith('DH')) return 'tree'
      if (code.startsWith('BK')) return 'booking'
      if (code.startsWith('ST')) return 'store'
      return null
    }
    expect(orderTypeFromCode('DH123456')).toBe('tree')
    expect(orderTypeFromCode('BK123456')).toBe('booking')
    expect(orderTypeFromCode('ST123456')).toBe('store')
    expect(orderTypeFromCode('XX123456')).toBeNull()
  })

  test('stale transaction detection works', () => {
    function isStaleTransaction(txAt: string) {
      const transactionTime = new Date(txAt).getTime()
      return Date.now() - transactionTime > 60 * 60 * 1000
    }
    expect(isStaleTransaction(new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())).toBe(true)
    expect(isStaleTransaction(new Date().toISOString())).toBe(false)
  })

  test('POLYMORPHIC_WEBHOOK_ENABLED defaults to true', () => {
    function isPolymorphicEnabled() {
      return process.env.POLYMORPHIC_WEBHOOK_ENABLED !== 'false'
    }
    expect(isPolymorphicEnabled()).toBe(true)
    process.env.POLYMORPHIC_WEBHOOK_ENABLED = 'false'
    expect(isPolymorphicEnabled()).toBe(false)
    process.env.POLYMORPHIC_WEBHOOK_ENABLED = 'true'
    expect(isPolymorphicEnabled()).toBe(true)
  })
})

describe('processStoreOrder', () => {
  const baseOrder: OrderLike = {
    id: 'ord-store-1',
    code: 'ST123456',
    user_id: 'user-1',
    customer_name: 'Nguyễn Văn A',
    total_amount: 500000,
    status: 'pending',
  }

  function createMockSupabase(overrides?: {
    currentStatus?: string
    currentNull?: boolean
    items?: Array<{ id: string; product_id: string; quantity: number }>
    rpcError?: any
    updateError?: any
    updateNoRows?: boolean
  }) {
    const mockRpc = jest.fn().mockImplementation(() => {
      if (overrides?.rpcError) {
        return Promise.resolve({ error: overrides.rpcError })
      }
      return Promise.resolve({ error: null })
    })

    const mockUpdateSelect = jest.fn().mockResolvedValue({
      data: overrides?.updateNoRows ? [] : [{ id: 'ord-store-1' }],
      error: overrides?.updateError ?? null,
    })
    const mockUpdateEqStatus = jest.fn().mockReturnValue({ select: mockUpdateSelect })
    const mockUpdateEq = jest.fn().mockReturnValue({ eq: mockUpdateEqStatus })

    const mockUpdate = jest.fn().mockReturnValue({
      eq: mockUpdateEq,
    })

    const mockFrom = jest.fn().mockImplementation((table: string) => {
      if (table === 'store_orders') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: overrides?.currentNull ? null : { status: overrides?.currentStatus ?? 'pending' },
                error: null,
              }),
            }),
          }),
          update: mockUpdate,
        }
      }
      if (table === 'store_order_items') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: overrides?.items ?? [
                { id: 'item-1', product_id: 'prod-abc', quantity: 2 },
              ],
              error: null,
            }),
          }),
        }
      }
      return {}
    })

    return {
      from: mockFrom,
      rpc: mockRpc,
      mockUpdate,
      mockUpdateEq,
      mockUpdateEqStatus,
      mockUpdateSelect,
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('CONFIRM_OK: confirms pending banking order, calls confirm_product_stock without calling release or reserve', async () => {
    const supabase = createMockSupabase()
    const tx = { id: 12345, tid: 'casso-tid-1', amount: 500000 }

    const result = await processStoreOrder(
      supabase as any,
      tx,
      'ST123456',
      baseOrder,
      'matched'
    )

    expect(result).toEqual({ ok: true })
    // Atomically confirms stock via confirm_product_stock
    expect(supabase.rpc).toHaveBeenCalledWith('confirm_product_stock', {
      p_product_id: 'prod-abc',
      p_qty: 2,
    })
    // Never calls release_product_stock or reserve_product_stock
    expect(supabase.rpc).not.toHaveBeenCalledWith('release_product_stock', expect.anything())
    expect(supabase.rpc).not.toHaveBeenCalledWith('reserve_product_stock', expect.anything())

    // Updates order status to confirmed
    expect(supabase.mockUpdate).toHaveBeenCalledWith({
      status: 'confirmed',
      payment_ref: '12345',
      expires_at: null,
    })
    expect(supabase.mockUpdateEq).toHaveBeenCalledWith('id', 'ord-store-1')
    expect(supabase.mockUpdateEqStatus).toHaveBeenCalledWith('status', 'pending')

    // Revalidates the store catalog pages
    expect(revalidatePath).toHaveBeenCalledWith('/store')
  })

  it('CONFIRM_IDEMPOTENT: skips silently if order status is already confirmed (not pending)', async () => {
    const supabase = createMockSupabase({ currentStatus: 'confirmed' })
    const tx = { id: 12345, amount: 500000 }

    const result = await processStoreOrder(
      supabase as any,
      tx,
      'ST123456',
      baseOrder,
      'matched'
    )

    expect(result).toEqual({ ok: true })
    expect(supabase.rpc).not.toHaveBeenCalled()
    expect(supabase.mockUpdate).not.toHaveBeenCalled()
  })

  it('CONFIRM_MISMATCH: returns ok: false and does not touch stock or order when paymentStatus is amount_mismatch', async () => {
    const supabase = createMockSupabase()
    const tx = { id: 12345, amount: 300000 }

    const result = await processStoreOrder(
      supabase as any,
      tx,
      'ST123456',
      baseOrder,
      'amount_mismatch'
    )

    expect(result).toEqual({ ok: false, error: 'Amount mismatch' })
    expect(supabase.from).not.toHaveBeenCalled()
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('CONFIRM_STOCK_FAIL: logs error to captureError but continues confirming order when confirm_product_stock fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const rpcError = new Error('Stock confirmation RPC failed')
    const supabase = createMockSupabase({ rpcError })
    const tx = { id: 'tx-str-99', amount: 500000 }

    const result = await processStoreOrder(
      supabase as any,
      tx,
      'ST123456',
      baseOrder,
      'matched'
    )

    expect(result).toEqual({ ok: true })
    expect(captureError).toHaveBeenCalledWith(
      rpcError,
      expect.objectContaining({
        route: '/api/webhooks/casso',
        orderType: 'store',
        orderCode: 'ST123456',
        action: 'confirm_product_stock',
      })
    )
    // Order is still updated to confirmed because money was received
    expect(supabase.mockUpdate).toHaveBeenCalledWith({
      status: 'confirmed',
      payment_ref: 'tx-str-99',
      expires_at: null,
    })
    consoleSpy.mockRestore()
  })

  it('CONFIRM_UPDATE_FAIL: returns ok: false and skips stock confirmation when the order update fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const supabase = createMockSupabase({ updateError: new Error('DB write failed') })
    const tx = { id: 12345, amount: 500000 }

    const result = await processStoreOrder(
      supabase as any,
      tx,
      'ST123456',
      baseOrder,
      'matched'
    )

    expect(result).toEqual({ ok: false, error: 'DB write failed' })
    // Stock must not be decremented — the order never flipped to confirmed
    expect(supabase.rpc).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('CONFIRM_RACE_LOST: skips stock confirmation when the conditional update matches no rows', async () => {
    const supabase = createMockSupabase({ updateNoRows: true })
    const tx = { id: 12345, amount: 500000 }

    const result = await processStoreOrder(
      supabase as any,
      tx,
      'ST123456',
      baseOrder,
      'matched'
    )

    expect(result).toEqual({ ok: true })
    // Another delivery won the pending→confirmed transition — do not decrement again
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('CONFIRM_CANCELLED_LATE_PAYMENT: alerts ops via captureError when payment arrives for a cancelled order', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const supabase = createMockSupabase({ currentStatus: 'cancelled' })
    const tx = { id: 12345, amount: 500000 }

    const result = await processStoreOrder(
      supabase as any,
      tx,
      'ST123456',
      baseOrder,
      'matched'
    )

    // Transaction is still marked processed — payment DID arrive — but ops is alerted
    expect(result).toEqual({ ok: true })
    expect(supabase.rpc).not.toHaveBeenCalled()
    expect(supabase.mockUpdate).not.toHaveBeenCalled()
    expect(captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        orderType: 'store',
        orderCode: 'ST123456',
        action: 'late_payment_cancelled_order',
      })
    )
    consoleSpy.mockRestore()
  })
})
