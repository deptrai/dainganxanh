'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { BedDouble } from 'lucide-react'
import { GardenCard, type GardenLot } from './GardenCard'

const REGION_VALUES = ['all', 'Miền Bắc', 'Miền Trung', 'Miền Nam'] as const

function normalizeRegion(val?: string | null): string {
    if (!val) return 'all'
    const matched = REGION_VALUES.find(r => r.toLowerCase() === val.trim().toLowerCase())
    return matched ?? val
}

function RegionFilter({ active, onChange, t }: { active: string; onChange: (v: string) => void; t: (key: string) => string }) {
    const regions = [
        { label: t('regions.all'), value: 'all' },
        { label: t('regions.north'), value: 'Miền Bắc' },
        { label: t('regions.central'), value: 'Miền Trung' },
        { label: t('regions.south'), value: 'Miền Nam' },
    ]
    return (
        <div className="flex flex-wrap gap-2 mb-8">
            {regions.map(r => (
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

export interface EcoTourismClientProps {
    lots: GardenLot[]
    initialRegion?: string
}

export function EcoTourismClient({ lots, initialRegion }: EcoTourismClientProps) {
    const t = useTranslations('eco')
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const searchParamRegion = searchParams?.get('region')

    const [activeRegion, setActiveRegion] = useState(() => {
        const initial = searchParamRegion ?? initialRegion
        return initial ? normalizeRegion(initial) : 'all'
    })

    const isFirstRender = useRef(true)

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        const currentParam = searchParams?.get('region')
        if (currentParam) {
            setActiveRegion(normalizeRegion(currentParam))
        } else {
            setActiveRegion('all')
        }
    }, [searchParams])

    const handleRegionChange = (newRegion: string) => {
        setActiveRegion(newRegion)
        const params = new URLSearchParams(searchParams ? searchParams.toString() : '')
        if (newRegion === 'all') {
            params.delete('region')
        } else {
            params.set('region', newRegion)
        }
        const query = params.toString()
        const currentPath = pathname || '/eco-tourism'
        const newUrl = query ? `${currentPath}?${query}` : currentPath
        router.replace(newUrl, { scroll: false })
    }

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
                        {t('hero.badge')}
                    </span>
                    <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4">
                        {t('hero.title')}
                    </h1>
                    <p className="text-white/70 text-lg max-w-xl mx-auto">
                        {t('hero.subtitle')}
                    </p>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 py-10">
                <RegionFilter active={activeRegion} onChange={handleRegionChange} t={t} />

                {filteredLots.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <BedDouble className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>{t('empty.noGardens')}</p>
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
