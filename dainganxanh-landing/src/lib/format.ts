/**
 * Shared formatting helpers for currency, date, and numbers.
 * Safe for both Server and Client Components (no next-intl server imports).
 */

function parseDateInput(val?: Date | string | null): Date | null {
  if (!val) return null
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val
  if (typeof val === 'string') {
    let s = val.trim()
    // Normalize strings without timezone (e.g. "2025-05-08 14:00:00" from DB/postgres)
    // by treating as UTC to avoid server vs client hydration mismatches.
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(s)) {
      s = s.replace(' ', 'T') + 'Z'
    }
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

export function formatCurrency(
  val: number | string | null | undefined,
  locale: string = 'vi'
): string {
  const num = typeof val === 'number' ? (isNaN(val) ? 0 : val) : (Number(val) || 0)
  // vi outputs native Intl NBSP + ₫; en outputs ASCII space + ₫
  if (locale === 'en') {
    return new Intl.NumberFormat('en-US').format(num) + ' ₫'
  }
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

export function formatDate(
  val?: Date | string | null,
  locale: string = 'vi',
  opts?: Intl.DateTimeFormatOptions
): string {
  if (!val) return ''

  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val) && !opts) {
    const parts = val.split('-')
    const year = parts[0]
    const month = parseInt(parts[1], 10)
    const day = parseInt(parts[2], 10)
    return locale === 'en' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`
  }

  const d = parseDateInput(val)
  if (!d) return ''

  const defaultOpts: Intl.DateTimeFormatOptions =
    locale === 'en'
      ? { timeZone: 'Asia/Ho_Chi_Minh', month: 'numeric', day: 'numeric', year: 'numeric' }
      : { timeZone: 'Asia/Ho_Chi_Minh', day: 'numeric', month: 'numeric', year: 'numeric' }

  return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN', opts ?? defaultOpts)
}

export function formatDateTime(
  val?: Date | string | null,
  locale: string = 'vi',
  opts?: Intl.DateTimeFormatOptions
): string {
  if (!val) return ''
  const d = parseDateInput(val)
  if (!d) return ''

  const defaultOpts: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }

  return d.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN', opts ?? defaultOpts)
}

export function formatNumber(
  val: number | string | null | undefined,
  locale: string = 'vi',
  opts?: Intl.NumberFormatOptions
): string {
  const num = typeof val === 'number' ? (isNaN(val) ? 0 : val) : (Number(val) || 0)
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'vi-VN', opts).format(num)
}
