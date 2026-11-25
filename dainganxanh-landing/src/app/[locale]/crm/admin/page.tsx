import { redirect } from '@/i18n/navigation'
import { setRequestLocale } from 'next-intl/server'

// Admin root redirects to Analytics Dashboard
export default async function AdminDashboardPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    setRequestLocale(locale)
    redirect({ href: '/crm/admin/analytics', locale })
}
