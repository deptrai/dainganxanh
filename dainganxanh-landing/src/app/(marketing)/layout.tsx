import { MarketingHeader } from "@/components/layout/MarketingHeader"

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
            <MarketingHeader />
            <main className="relative">{children}</main>
        </div>
    )
}
