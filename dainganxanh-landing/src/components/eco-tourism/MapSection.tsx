import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'

const MiniMap = dynamic(() => import('@/components/admin/MiniMap'), { ssr: false })

interface MapSectionProps {
    lat: number | null
    lng: number | null
    label?: string
}

export function MapSection({ lat, lng, label }: MapSectionProps) {
    if (lat == null || lng == null) {
        return (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 flex items-center gap-2 text-gray-500">
                <MapPin className="w-5 h-5" />
                <span>Chưa có vị trí</span>
            </div>
        )
    }

    return (
        <div className="rounded-2xl overflow-hidden border border-gray-100">
            <MiniMap lat={lat} lng={lng} height={240} />
            {label && <p className="p-3 text-sm text-gray-600 bg-white">{label}</p>}
        </div>
    )
}
