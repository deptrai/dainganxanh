export type ProductOriginType =
    | 'mature_partner_plantation'
    | 'cooperative_farm'
    | 'dainganxanh_harvest'

export const ORIGIN_LABELS: Record<ProductOriginType, string> = {
    mature_partner_plantation: 'Vườn đối tác trưởng thành',
    cooperative_farm: 'Hợp tác xã nông dân',
    dainganxanh_harvest: 'Thu hoạch từ vườn Đại Ngàn Xanh',
}
