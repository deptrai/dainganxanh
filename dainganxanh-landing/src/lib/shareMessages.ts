/**
 * Share message templates for different contexts
 */

export type ShareContext = 'purchase' | 'progress' | 'harvest'

export interface ShareMessageData {
    trees?: number
    months?: number
    refCode: string
    userName?: string
}

export interface ShareMessage {
    title: string
    text: string
    url: string
}

/**
 * Get base URL for share links
 */
function getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_BASE_URL || 'https://dainganxanh.com.vn'
}

/**
 * Generate share message based on context
 */
export function getShareMessage(
    context: ShareContext,
    data: ShareMessageData
): ShareMessage {
    const baseUrl = getBaseUrl()
    // Using query param format (?ref=) for consistency with referral tracking system
    // This format is tracked by ReferralTracker component and src/actions/referrals.ts
    const shareUrl = `${baseUrl}/?ref=${data.refCode}`

    switch (context) {
        case 'purchase':
            return {
                title: 'Đại Ngàn Xanh',
                text: `Tôi vừa trồng ${data.trees} cây cho Mẹ Thiên Nhiên 🌳 Mỗi cây hấp thụ 20kg CO2/năm! Tham gia cùng tôi:`,
                url: shareUrl,
            }

        case 'progress':
            return {
                title: 'Cây của tôi đang lớn!',
                text: `Cây của tôi đã ${data.months} tháng tuổi! 🌲 Xem hành trình tại:`,
                url: shareUrl,
            }

        case 'harvest':
            return {
                title: 'Thu hoạch trầm hương',
                text: `Sau 10 năm chăm sóc, cây trầm hương của tôi đã sẵn sàng thu hoạch! 🎉`,
                url: shareUrl,
            }

        default:
            // Fallback to purchase message
            return {
                title: 'Đại Ngàn Xanh',
                text: `Tôi vừa trồng ${data.trees || 1} cây cho Mẹ Thiên Nhiên 🌳`,
                url: shareUrl,
            }
    }
}

/**
 * Generate share URL with ref code
 */
export function generateShareUrl(refCode: string): string {
    const baseUrl = getBaseUrl()
    return `${baseUrl}/?ref=${refCode}`
}
