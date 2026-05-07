export function maskName(name: string | null | undefined): string {
    if (!name?.trim()) return 'Khách hàng'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0] + '***'
    return parts[0] + ' ' + parts[1][0] + '***'
}
