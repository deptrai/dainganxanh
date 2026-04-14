import { redirect } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getImpersonationContext } from '@/lib/getImpersonationContext'
import { ReferralLink } from '@/components/crm/ReferralLink'
import { ReferralQRCode } from '@/components/crm/ReferralQRCode'
import { ReferralStats } from '@/components/crm/ReferralStats'
import WithdrawalButton from '@/components/crm/WithdrawalButton'
import { getReferralStats, getReferralConversions } from '@/actions/referrals'
import { ensureUserProfile } from '@/actions/ensureUserProfile'
import { createServerClient } from '@/lib/supabase/server'

function maskEmail(email: string): string {
    const atIndex = email.indexOf('@')
    if (atIndex <= 0) return email
    const local = email.slice(0, atIndex)
    const domain = email.slice(atIndex)
    if (local.length <= 4) {
        return `${local[0]}***${domain}`
    }
    const start = local.slice(0, 2)
    const end = local.slice(-2)
    return `${start}***${end}${domain}`
}

export default async function ReferralsPage() {
    const ctx = await getImpersonationContext()

    // Layout handles redirect, but we need user for data fetching
    if (!ctx) return null

    const { effectiveUserId } = ctx

    // Use service role to bypass RLS when impersonating
    const serviceClient = createServiceRoleClient()

    // Get user's referral code, full name and referred_by_user_id
    let { data: userData } = await serviceClient
        .from('users')
        .select('referral_code, full_name, referred_by_user_id')
        .eq('id', effectiveUserId)
        .single()

    if (!userData?.referral_code) {
        // Profile chưa tồn tại — tự động tạo rồi load lại
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await ensureUserProfile(user.id, user.email ?? '', user.phone)
            const { data: refreshed } = await serviceClient
                .from('users')
                .select('referral_code, full_name, referred_by_user_id')
                .eq('id', effectiveUserId)
                .single()
            userData = refreshed
        }
    }

    let referrerDisplay: string | null = null
    if (userData?.referred_by_user_id) {
        const { data: referrer } = await serviceClient
            .from('users')
            .select('email, full_name, referral_code')
            .eq('id', userData.referred_by_user_id)
            .single()
        if (referrer) {
            if (referrer.email) {
                referrerDisplay = maskEmail(referrer.email)
            } else if (referrer.full_name) {
                referrerDisplay = referrer.full_name
            } else if (referrer.referral_code) {
                referrerDisplay = referrer.referral_code
            }
        }
    }

    if (!userData?.referral_code) {
        redirect('/crm/dashboard')
    }

    // Get referral stats
    const stats = await getReferralStats(effectiveUserId) || {
        totalClicks: 0,
        conversions: 0,
        commission: 0,
        conversionRate: 0,
    }

    // Get conversions list
    const conversions = await getReferralConversions(effectiveUserId)

    const referralUrl = `https://dainganxanh.com.vn/register?ref=${userData.referral_code}`

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-brand-600 mb-2">Giới Thiệu Bạn Bè</h1>
                    <p className="text-gray-600">
                        Chia sẻ link giới thiệu và nhận hoa hồng 10% khi bạn bè mua cây
                    </p>
                </div>

                {/* Referrer info */}
                {referrerDisplay && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-emerald-600 font-medium">Người giới thiệu bạn</p>
                            <p className="text-sm font-semibold text-gray-800">{referrerDisplay}</p>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <ReferralStats stats={stats} />

                {/* Withdrawal Section */}
                <WithdrawalButton userId={effectiveUserId} userFullName={userData.full_name} />

                {/* Referral Link and QR Code */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ReferralLink referralCode={userData.referral_code} />
                    <ReferralQRCode url={referralUrl} />
                </div>

                {/* Conversions List */}
                {conversions.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 border border-brand-100">
                        <h3 className="text-lg font-semibold text-brand-600 mb-4">
                            Lịch Sử Chuyển Đổi ({conversions.length})
                        </h3>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Mã Đơn
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Khách Hàng
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Giá Trị Đơn
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hoa Hồng
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ngày
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {conversions.map((conversion) => (
                                        <tr key={conversion.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {conversion.orderCode}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {conversion.customerName || conversion.customerEmail}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {conversion.orderAmount.toLocaleString('vi-VN')}đ
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                                +{conversion.commission.toLocaleString('vi-VN')}đ
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {conversion.orderDate ? new Date(conversion.orderDate).toLocaleDateString('vi-VN') : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {conversions.length === 0 && (
                    <div className="bg-white rounded-lg shadow-md p-12 border border-brand-100 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Chưa Có Chuyển Đổi
                        </h3>
                        <p className="text-gray-500">
                            Chia sẻ link giới thiệu của bạn để bắt đầu kiếm hoa hồng!
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
