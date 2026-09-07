import Link from 'next/link'
import { MapPin } from 'lucide-react'

export interface GardenLot {
    id: string
    name: string
    region: string
    images: string[]
    priceFrom: number | null
}

function formatVND(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

export function GardenCard({ lot }: { lot: GardenLot }) {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <Link href={'/eco-tourism/' + lot.id}>
                <div className="relative aspect-[4/3] bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center">
                    {lot.images?.[0] ? (
                        <img src={lot.images[0]} alt={lot.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-5xl">🌳</span>
                    )}
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                        {lot.region}
                    </span>
                </div>
            </Link>
            <div className="p-5">
                <Link href={'/eco-tourism/' + lot.id}>
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 hover:text-emerald-700 transition-colors">
                        {lot.name}
                    </h3>
                </Link>
                <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>{lot.region}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400">Giá từ</p>
                        <p className="text-lg font-bold text-emerald-600">
                            {lot.priceFrom ? formatVND(lot.priceFrom) : '—'}
                        </p>
                    </div>
                    <Link
                        href={'/eco-tourism/' + lot.id}
                        className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        Xem phòng
                    </Link>
                </div>
            </div>
        </div>
    )
}
