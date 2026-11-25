import { useTranslations } from 'next-intl'

export default function Loading() {
    const t = useTranslations('eco.meta')
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent" />
                <p className="mt-4 text-sm text-gray-500">{t('loading')}</p>
            </div>
        </div>
    )
}
