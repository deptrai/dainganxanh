import {
  formatDate,
  formatDateLong,
  formatContractVND,
  numberToVietnameseWords,
  formatContractNumber,
} from '../contract-helpers'

describe('formatDate', () => {
  it('converts YYYY-MM-DD to dd/MM/yyyy', () => {
    expect(formatDate('1990-01-15')).toBe('15/01/1990')
  })

  it('pads single-digit day and month', () => {
    expect(formatDate('2000-03-05')).toBe('05/03/2000')
  })

  it('handles ISO datetime string', () => {
    expect(formatDate('2026-03-29T17:30:00+07:00')).toBe('29/03/2026')
  })

  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('')
  })

  it('returns original string for invalid format', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})

describe('formatDateLong', () => {
  it('formats date as "DD tháng MM năm YYYY"', () => {
    expect(formatDateLong('2026-03-29')).toBe('29 tháng 03 năm 2026')
  })

  it('handles ISO datetime string', () => {
    expect(formatDateLong('2026-03-29T23:59:59Z')).toBe('29 tháng 03 năm 2026')
  })

  it('returns empty string for null', () => {
    expect(formatDateLong(null)).toBe('')
  })
})

describe('formatContractVND', () => {
  it('formats number with Vietnamese locale and đ suffix', () => {
    expect(formatContractVND(260000)).toBe('260.000đ')
  })

  it('formats million amounts', () => {
    expect(formatContractVND(1560000)).toBe('1.560.000đ')
  })
})

describe('numberToVietnameseWords', () => {
  it('converts 0 to "không đồng"', () => {
    expect(numberToVietnameseWords(0)).toBe('không đồng')
  })

  it('converts 260000 to correct Vietnamese words', () => {
    expect(numberToVietnameseWords(260000)).toBe('Hai trăm sáu mươi nghìn đồng')
  })

  it('converts 1560000 correctly', () => {
    expect(numberToVietnameseWords(1560000)).toBe('Một triệu năm trăm sáu mươi nghìn đồng')
  })

  it('converts 2600000 correctly', () => {
    expect(numberToVietnameseWords(2600000)).toBe('Hai triệu sáu trăm nghìn đồng')
  })

  it('capitalizes first letter', () => {
    const result = numberToVietnameseWords(260000)
    expect(result[0]).toBe(result[0].toUpperCase())
  })

  it('handles amounts with tỷ', () => {
    expect(numberToVietnameseWords(1_000_000_000)).toBe('Một tỷ đồng')
  })

  it('returns empty string for negative numbers', () => {
    expect(numberToVietnameseWords(-100)).toBe('')
  })
})

describe('formatContractNumber', () => {
  it('formats order code with DHNLN prefix and year', () => {
    expect(formatContractNumber('DHABC123', 2026)).toBe('DHNLN-DHABC123/2026')
  })

  it('uses current year when not provided', () => {
    const result = formatContractNumber('DHABC123')
    expect(result).toMatch(/^DHNLN-DHABC123\/\d{4}$/)
  })
})
