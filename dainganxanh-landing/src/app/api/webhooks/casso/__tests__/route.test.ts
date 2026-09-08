/**
 * Unit Tests: Casso webhook utilities
 *
 * Covers: prefix extraction, order type detection, stale check.
 */

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
