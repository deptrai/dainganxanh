'use client'

import React from 'react'
import { useTranslations } from 'next-intl'

interface TranslationBadgeProps {
    hasEn: boolean
    className?: string
}

export function TranslationBadge({ hasEn, className = '' }: TranslationBadgeProps) {
    const t = useTranslations('admin.translation.badge')

    if (hasEn) {
        return (
            <span
                title={t('viEnTooltip')}
                aria-label={t('viEnTooltip')}
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide border transition-colors bg-emerald-50 text-emerald-700 border-emerald-300 ${className}`}
            >
                {t('viEn')}
            </span>
        )
    }

    return (
        <span
            title={t('viOnlyTooltip')}
            aria-label={t('viOnlyTooltip')}
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide border transition-colors bg-gray-100 text-gray-500 border-gray-200 ${className}`}
        >
            {t('viOnly')}
        </span>
    )
}

export default TranslationBadge
