import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { CRMHeader } from '@/components/layout/CRMHeader'
import ImpersonationBanner from '@/components/crm/ImpersonationBanner'
import { getImpersonationContext } from '@/lib/getImpersonationContext'

export default async function CRMLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createServerClient()

    // Check authentication
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/login')
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
