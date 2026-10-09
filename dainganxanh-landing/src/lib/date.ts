import { formatDate, formatDateTime, formatCurrency } from './format'

export { formatDate, formatDateTime, formatCurrency }

export function formatDateVN(dateStr?: string | null): string {
    return formatDate(dateStr, 'vi')
}

export function formatDateTimeVN(dateStr?: string | null): string {
    return formatDateTime(dateStr, 'vi')
}

export function formatVND(amount: number): string {
    return formatCurrency(amount, 'vi')
}
