/**
 * Contract generation helpers
 * - formatContractVND: format số tiền cho hợp đồng
 * - numberToVietnameseWords: chuyển số thành chữ tiếng Việt
 * - formatDate: format ngày dd/MM/yyyy
 */

// ─────────────────────────────────────────────────────────────────
// Date formatting
// ─────────────────────────────────────────────────────────────────

function parseDateParts(dateStr: string): { day: string; month: string; year: string } | null {
  // Match YYYY-MM-DD or YYYY-MM-DDT... (ISO)
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  return { year: match[1], month: match[2], day: match[3] }
}

/**
 * Format date string (YYYY-MM-DD) to Vietnamese format (dd/MM/yyyy)
 * Parses string directly to avoid timezone shifts.
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const parts = parseDateParts(dateStr)
  if (!parts) return dateStr
  return `${parts.day}/${parts.month}/${parts.year}`
}

/**
 * Format date to "DD tháng MM năm YYYY"
 * Parses string directly to avoid timezone shifts.
 */
export function formatDateLong(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const parts = parseDateParts(dateStr)
  if (!parts) return dateStr
  return `${parts.day} tháng ${parts.month} năm ${parts.year}`
}

// ─────────────────────────────────────────────────────────────────
// Currency formatting
// ─────────────────────────────────────────────────────────────────

/**
 * Format amount for Vietnamese contract display: "260.000đ"
 */
export function formatContractVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}

// ─────────────────────────────────────────────────────────────────
// Number to Vietnamese words
// ─────────────────────────────────────────────────────────────────

const UNITS = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']

function readGroup(n: number): string {
  const hundreds = Math.floor(n / 100)
  const tens = Math.floor((n % 100) / 10)
  const units = n % 10

  let result = ''

  if (hundreds > 0) {
    result += UNITS[hundreds] + ' trăm'
    if (tens === 0 && units > 0) result += ' lẻ'
  }

  if (tens > 0) {
    if (result) result += ' '
    if (tens === 1) {
      result += 'mười'
    } else {
      result += UNITS[tens] + ' mươi'
    }
    if (units === 1 && tens > 1) {
      result += ' mốt'
    } else if (units === 5 && tens > 0) {
      result += ' lăm'
    } else if (units > 0) {
      result += ' ' + UNITS[units]
    }
  } else if (units > 0) {
    if (result) result += ' '
    result += UNITS[units]
  }

  return result.trim()
}

/**
 * Convert integer amount to Vietnamese words
 * e.g. 260000 → "Hai trăm sáu mươi nghìn đồng"
 */
export function numberToVietnameseWords(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return ''
  if (amount === 0) return 'không đồng'

  const n = Math.floor(amount)

  const billions = Math.floor(n / 1_000_000_000)
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000)
  const thousands = Math.floor((n % 1_000_000) / 1_000)
  const remainder = n % 1_000

  const parts: string[] = []

  if (billions > 0) parts.push(readGroup(billions) + ' tỷ')
  if (millions > 0) parts.push(readGroup(millions) + ' triệu')
  if (thousands > 0) parts.push(readGroup(thousands) + ' nghìn')
  if (remainder > 0) parts.push(readGroup(remainder))

  const words = parts.join(' ')
  // Capitalize first letter
  return words.charAt(0).toUpperCase() + words.slice(1) + ' đồng'
}

// ─────────────────────────────────────────────────────────────────
// Contract number
// ─────────────────────────────────────────────────────────────────

/**
 * Generate contract number from order code: "DHNLN-{code}/{year}"
 */
export function formatContractNumber(orderCode: string, year?: number): string {
  const y = year ?? new Date().getFullYear()
  return `DHNLN-${orderCode}/${y}`
}
