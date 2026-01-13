'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface MiniMapProps {
    lat: number
    lng: number
    accuracy?: number
    height?: number
}

// Component to recenter map when coordinates change
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap()

    useEffect(() => {
        map.setView([lat, lng], 13)
    }, [lat, lng, map])

    return null
}

export default function MiniMap({ lat, lng, accuracy, height = 200 }: MiniMapProps) {
    return (
        <div className="relative rounded-lg overflow-hidden border border-gray-300">
            <MapContainer
                center={[lat, lng]}
                zoom={13}
                style={{ height: `${height}px`, width: '100%' }}
                scrollWheelZoom={false}
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lng]}>
                    <Popup>
                        <div className="text-sm">
                            <p className="font-semibold">Vị trí ảnh</p>
                            <p>Lat: {lat.toFixed(6)}</p>
                            <p>Lng: {lng.toFixed(6)}</p>
                            {accuracy && <p>Độ chính xác: ±{accuracy.toFixed(1)}m</p>}
                        </div>
                    </Popup>
                </Marker>
                <RecenterMap lat={lat} lng={lng} />
            </MapContainer>
        </div>
    )
}
