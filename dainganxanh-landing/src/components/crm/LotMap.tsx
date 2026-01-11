'use client'

interface LotMapProps {
    lotName: string
    region: string
    gpsLat: number | null
    gpsLng: number | null
    gpsPolygon: any | null
}

export default function LotMap({ lotName, region, gpsLat, gpsLng, gpsPolygon }: LotMapProps) {
    // For MVP: Show static placeholder
    // TODO: Integrate Google Maps API when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is available

    const hasGPS = gpsLat && gpsLng

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🗺️</span>
                <h2 className="text-2xl font-bold text-gray-800">Vị Trí Lô Cây</h2>
            </div>

            <div className="mb-4">
                <p className="text-lg font-semibold text-emerald-700">{lotName}</p>
                <p className="text-gray-600">{region}</p>
            </div>

            {hasGPS ? (
                <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                    {/* Placeholder for Google Maps */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <span className="text-6xl mb-4 block">📍</span>
                            <p className="text-gray-700 font-medium">
                                GPS: {gpsLat?.toFixed(6)}, {gpsLng?.toFixed(6)}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Google Maps integration coming soon
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                        <span className="text-6xl mb-4 block">🌍</span>
                        <p className="text-gray-600">Thông tin GPS đang được cập nhật</p>
                    </div>
                </div>
            )}
        </div>
    )
}
