'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'

const GOAL = 1_000_000

function formatNumber(n: number, locale: string): string {
    return n.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')
}

function AnimatedNumber({ value, locale }: { value: number; locale: string }) {
    const spring = useSpring(0, { duration: 2000 })
    const display = useTransform(spring, (v) => formatNumber(Math.floor(v), locale))

    useEffect(() => {
        spring.set(value)
    }, [spring, value])

    return <motion.span>{display}</motion.span>
}

export function TreeCounter({ initialCount }: { initialCount?: number }) {
    const [count, setCount] = useState(initialCount ?? 0)
    const t = useTranslations('landing')
    const locale = useLocale()

    useEffect(() => {
        if (initialCount !== undefined) {
            setCount(initialCount)
        }
    }, [initialCount])

    return (
        <div className="px-5 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white mb-8 shadow-lg">
            <span className="font-bold text-accent-gold text-3xl md:text-4xl">
                <AnimatedNumber value={count} locale={locale} />
            </span>{' '}
            <span className="text-2xl md:text-3xl">
                / {formatNumber(GOAL, locale)} {t('hero.rootedTrees')}
            </span>
        </div>
    )
}
