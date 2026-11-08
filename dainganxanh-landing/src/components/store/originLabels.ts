export type ProductOriginType =
    | 'mature_partner_plantation'
    | 'cooperative_farm'
    | 'dainganxanh_harvest'

export const ORIGIN_LABELS = {
    mature_partner_plantation: 'Vườn đối tác trưởng thành',
    cooperative_farm: 'Hợp tác xã nông dân',
    dainganxanh_harvest: 'Thu hoạch từ vườn Đại Ngàn Xanh',
} satisfies Record<ProductOriginType, string>

/**
 * Tra nhãn origin cho UI. Trả null khi thiếu hoặc không map được
 * (union type trên là nguồn guard compile-time chống drift với DB CHECK constraint).
 */
export function originLabel(
    originType: string | null | undefined,
    t?: (key: string) => string
): string | null {
    if (!originType || !(originType in ORIGIN_LABELS)) return null
    if (t) {
        return t(`origins.${originType}`)
    }
    return ORIGIN_LABELS[originType as keyof typeof ORIGIN_LABELS] ?? null
}
