export function formatDateVN(dateStr?: string | null): string {
    if (!dateStr) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const parts = dateStr.split('-')
        const year = parts[0]
        const month = parseInt(parts[1], 10)
        const day = parseInt(parts[2], 10)
        return `${day}/${month}/${year}`
    }
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: 'numeric', month: 'numeric', year: 'numeric' })
}

export function formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}
