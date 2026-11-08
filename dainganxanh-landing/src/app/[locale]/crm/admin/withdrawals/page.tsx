import { redirect } from '@/i18n/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import WithdrawalsList from '@/components/admin/WithdrawalsList'

export const dynamic = 'force-dynamic'

interface AdminWithdrawalsPageProps {
    params: Promise<{ locale: string }>
}

export default async function AdminWithdrawalsPage({ params }: AdminWithdrawalsPageProps) {
    const { locale } = await params
    setRequestLocale(locale)

    const supabase = await createServerClient()

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        redirect({ href: '/login', locale })
        return null
    }

    // Check admin role
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        console.error('Failed to fetch user profile:', profileError)
        redirect({ href: '/crm/dashboard', locale })
        return null
    }

    // Only allow admin and super_admin roles
    if (!['admin', 'super_admin'].includes(profile.role)) {
        redirect({ href: '/crm/dashboard', locale })
        return null
    }

    // Fetch all withdrawals using service role client
    const serviceSupabase = createServiceRoleClient()

    const { data: withdrawals, error: withdrawalsError } = await serviceSupabase
        .from('withdrawals')
        .select(`
      *,
      users!withdrawals_user_id_public_users_fkey (
        full_name,
        email
      )
    `)
        .order('created_at', { ascending: false })

    if (withdrawalsError) {
        console.error('Error fetching withdrawals:', withdrawalsError)
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-emerald-800">Quản Lý Rút Tiền</h1>
                    <p className="text-gray-600 mt-2">
                        Xem và xử lý các yêu cầu rút tiền hoa hồng từ người dùng
                    </p>
                </div>

                <WithdrawalsList initialWithdrawals={withdrawals || []} />
            </div>
        </div>
    )
}
