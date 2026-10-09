import { setRequestLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { CRMHeader } from '@/components/layout/CRMHeader'
import ImpersonationBanner from '@/components/crm/ImpersonationBanner'
import { getImpersonationContext } from '@/lib/getImpersonationContext'

export default async function CRMLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    setRequestLocale(locale)

    const supabase = await createServerClient()

    // Check authentication
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect({ href: '/login', locale })
        return null
    }

    const impersonation = await getImpersonationContext()

    return (
        <div className="min-h-screen bg-gray-50">
            {impersonation?.isImpersonating && (
                <ImpersonationBanner userName={impersonation.impersonatedUserName} adminRole={impersonation.adminRole} />
            )}
            <CRMHeader />
            <main>{children}</main>
        </div>
    )
}
