import { formatCurrency, formatDate, formatDateTime, formatNumber } from '../format'

describe('formatCurrency', () => {
  it('formats numbers for vi locale with ₫', () => {
    const formatted = formatCurrency(30000, 'vi')
    // vi-VN format uses non-breaking space (or normal space) before ₫
    expect(formatted).toMatch(/30\.000[\s\u00A0]?₫/)
  })

  it('formats numbers for en locale with ₫', () => {
    const formatted = formatCurrency(30000, 'en')
    expect(formatted).toBe('30,000 ₫')
  })

  it('coerces string numbers correctly', () => {
    expect(formatCurrency('410000' as any, 'en')).toBe('410,000 ₫')
    expect(formatCurrency('30000' as any, 'vi')).toMatch(/30\.000[\s\u00A0]?₫/)
  })

  it('handles 0, NaN, null, undefined gracefully', () => {
    expect(formatCurrency(0, 'en')).toBe('0 ₫')
    expect(formatCurrency(NaN, 'en')).toBe('0 ₫')
    expect(formatCurrency(null as any, 'en')).toBe('0 ₫')
    expect(formatCurrency(undefined as any, 'en')).toBe('0 ₫')
  })
})

describe('formatDate', () => {
  it('formats YYYY-MM-DD directly without timezone shift', () => {
    expect(formatDate('2026-03-15', 'vi')).toBe('15/3/2026')
    expect(formatDate('2026-03-15', 'en')).toBe('3/15/2026')
  })

  it('normalizes DB strings without offset into UTC and formats in Asia/Ho_Chi_Minh', () => {
    // 2026-05-08 14:00:00 UTC -> in +7 (Asia/Ho_Chi_Minh) is 21:00 on 2026-05-08
    const formattedVi = formatDate('2026-05-08 14:00:00', 'vi')
    expect(formattedVi).toMatch(/8\/5\/2026|08\/05\/2026/)

    const formattedEn = formatDate('2026-05-08 14:00:00', 'en')
    expect(formattedEn).toMatch(/5\/8\/2026|05\/08\/2026/)
  })

  it('returns empty string for null, undefined, or invalid date', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
    expect(formatDate('invalid-date')).toBe('')
  })
})

describe('formatDateTime', () => {
  it('formats date and time in Asia/Ho_Chi_Minh', () => {
    // 2026-05-08 03:00:00 UTC -> +7 is 10:00 AM
    const res = formatDateTime('2026-05-08 03:00:00', 'vi')
    expect(res).toContain('2026')
    expect(res).toContain('10:00')
  })

  it('returns empty string for null or invalid date', () => {
    expect(formatDateTime(null)).toBe('')
    expect(formatDateTime('not-a-date')).toBe('')
  })
})

describe('formatNumber', () => {
  it('formats number with locale separators', () => {
    expect(formatNumber(1234567, 'vi')).toBe('1.234.567')
    expect(formatNumber(1234567, 'en')).toBe('1,234,567')
  })

  it('coerces strings and handles 0/NaN', () => {
    expect(formatNumber('5000' as any, 'en')).toBe('5,000')
    expect(formatNumber(NaN, 'en')).toBe('0')
    expect(formatNumber(null as any, 'en')).toBe('0')
  })
})
