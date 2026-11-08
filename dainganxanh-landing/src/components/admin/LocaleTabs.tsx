'use client'

import React from 'react'
import { useTranslations } from 'next-intl'

export interface LocaleTabsProps {
    activeTab: 'vi' | 'en'
    onChange: (tab: 'vi' | 'en') => void
    hasEnContent?: boolean
    className?: string
    variant?: 'underline' | 'pills'
}

export function LocaleTabs({
    activeTab = 'vi',
    onChange,
    hasEnContent = false,
    className = '',
    variant = 'underline',
}: LocaleTabsProps) {
    const t = useTranslations('admin.translation')

    if (variant === 'pills') {
        return (
            <div className={`flex gap-2 ${className}`}>
                <button
                    type="button"
                    onClick={() => onChange('vi')}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                        activeTab === 'vi'
                            ? 'bg-green-100 text-green-800 font-semibold'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {t('tabVi')}
                </button>
                <button
                    type="button"
                    onClick={() => onChange('en')}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                        activeTab === 'en'
                            ? 'bg-green-100 text-green-800 font-semibold'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {t('tabEn')}
                    {hasEnContent && (
                        <span
                            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                            title={t('hasEnContentTooltip')}
                        />
                    )}
                </button>
            </div>
        )
    }

    return (
        <div className={`flex border-b border-gray-200 gap-4 ${className}`}>
            <button
                type="button"
                onClick={() => onChange('vi')}
                className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'vi'
                        ? 'border-green-600 text-green-700 font-semibold'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
                {t('tabVi')}
            </button>
            <button
                type="button"
                onClick={() => onChange('en')}
                className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'en'
                        ? 'border-green-600 text-green-700 font-semibold'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
                {t('tabEn')}
                {hasEnContent && (
                    <span
                        className="w-2 h-2 rounded-full bg-emerald-500"
                        title={t('hasEnContentTooltip')}
                    />
                )}
            </button>
        </div>
    )
}

export default LocaleTabs
