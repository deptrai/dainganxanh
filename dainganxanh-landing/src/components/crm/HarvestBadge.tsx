'use client'

interface HarvestBadgeProps {
    ageInMonths: number
}

export default function HarvestBadge({ ageInMonths }: HarvestBadgeProps) {
    // Show badge for trees >= 3 minutes old (DEV mode)
    // Note: ageInMonths is still in months, but TreeCard passes it when minutesOld >= 3
    if (ageInMonths < 0) {  // Always show if called
        return null
    }

    return (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400 rounded-full shadow-md animate-pulse motion-reduce:animate-none">
            <span className="text-2xl">🌟</span>
            <span className="font-bold text-yellow-800">Sẵn sàng thu hoạch</span>
        </div>
    )
}
