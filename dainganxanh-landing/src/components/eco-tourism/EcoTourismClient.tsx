'use client'

import { useMemo, useState } from 'react'
import { BedDouble } from 'lucide-react'
import { GardenCard, type GardenLot } from './GardenCard'

const REGIONS = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Miền Bắc', value: 'Miền Bắc' },
    { label: 'Miền Trung', value: 'Miền Trung' },
    { label: 'Miền Nam', value: 'Miền Nam' },
] as const

function RegionFilter({ active, onChange }: { active: string; onChange: (v: string) => void }) {
    return (
        <div className="flex flex-wrap gap-2 mb-8">
            {REGIONS.map(r => (
                <button
                    key={r.value}
                    onClick={() => onChange(r.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        active === r.value
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-emerald-50 hover:border-emerald-300'
                    }`}
                >
                    {r.label}
                </button>
            ))}
        </div>
    )
}

export function EcoTourismClient({ lots }: { lots: GardenLot[] }) {
    const [activeRegion, setActiveRegion] = useState<string>('all')

    const filteredLots = useMemo(() => {
        if (activeRegion === 'all') return lots
        const normalized = activeRegion.trim().toLowerCase()
        return lots.filter(lot => lot.region.trim().toLowerCase() === normalized)
    }, [lots, activeRegion])

    return (
        <>
            {/* Hero */}
            <section className="bg-gradient-to-br from-[#2C2E1B] to-[#16321F] text-white py-16 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-200 text-sm mb-4">
                        🌿 Nghỉ Dưỡng Sinh Thái
                    </span>
                    <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4">
                        Vườn Trầm Hương Có Phòng Nghỉ
                    </h1>
                    <p className="text-white/70 text-lg max-w-xl mx-auto">
                        Chọn một vườn Dó Đen để trải nghiệm nghỉ dưỡng, học hỏi về trầm hương và tận hưởng thiên nhiên.
                    </p>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 py-10">
                <RegionFilter active={activeRegion} onChange={setActiveRegion} />

                {filteredLots.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <BedDouble className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Chưa có vườn nào mở phòng. Vui lòng quay lại sau.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredLots.map(lot => (
                            <GardenCard key={lot.id} lot={lot} />
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
