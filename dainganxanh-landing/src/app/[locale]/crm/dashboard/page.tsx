import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export default async function DashboardPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'crm.dashboard' })

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {t('title')}
                </h1>
                <p className="text-gray-600 mb-8">
                    {t('inDevelopment')}
                </p>
                <Link
                    href="/crm/my-garden"
                    className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    {t('backToGarden')}
                </Link>
            </div>
        </div>
    )
}
