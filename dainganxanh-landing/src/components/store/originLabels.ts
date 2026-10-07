export type ProductOriginType =
    | 'mature_partner_plantation'
    | 'cooperative_farm'
    | 'dainganxanh_harvest'

export const ORIGIN_LABELS: Record<ProductOriginType, string> = {
    mature_partner_plantation: 'Vườn đối tác trưởng thành',
    cooperative_farm: 'Hợp tác xã nông dân',
    dainganxanh_harvest: 'Thu hoạch từ vườn Đại Ngàn Xanh',
}

/**
 * Tra nhãn origin cho UI. Trả null khi thiếu/không map được,
 * và warn trong dev để phát hiện drift với DB CHECK constraint.
 */
export function originLabel(originType: string | null | undefined): string | null {
    if (!originType) return null
    const label = ORIGIN_LABELS[originType as ProductOriginType]
    if (!label && process.env.NODE_ENV !== 'production') {
        console.warn(`[originLabels] unknown origin_type: ${originType}`)
    }
    return label ?? null
}
