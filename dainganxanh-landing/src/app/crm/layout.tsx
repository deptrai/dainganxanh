import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { CRMHeader } from '@/components/layout/CRMHeader'

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

    return (
        <div className="min-h-screen bg-gray-50">
            <CRMHeader />
            <main>{children}</main>
        </div>
    )
}
