import { MarketingHeader } from "@/components/layout/MarketingHeader"
import ImpersonationBanner from "@/components/crm/ImpersonationBanner"
import { getImpersonationContext } from "@/lib/getImpersonationContext"

export default async function MarketingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const impersonation = await getImpersonationContext()

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
            {impersonation?.isImpersonating && (
                <ImpersonationBanner userName={impersonation.impersonatedUserName} adminRole={impersonation.adminRole} />
            )}
            <MarketingHeader />
            <main className="relative">{children}</main>
        </div>
    )
}
