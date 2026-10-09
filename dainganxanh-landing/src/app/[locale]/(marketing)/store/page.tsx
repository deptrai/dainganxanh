import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { StoreClient } from '@/components/store/StoreClient'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    setRequestLocale(locale)
    const t = await getTranslations({ locale, namespace: 'store.metadata' })
    const canonical = locale === 'vi' ? 'https://dainganxanh.com.vn/store' : 'https://dainganxanh.com.vn/en/store'
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical,
            languages: {
                vi: 'https://dainganxanh.com.vn/store',
                en: 'https://dainganxanh.com.vn/en/store',
                'x-default': 'https://dainganxanh.com.vn/store',
            },
        },
    }
}

export default async function StorePage({ params = Promise.resolve({ locale: 'vi' }) }: { params?: Promise<{ locale: string }> } = {}) {
    const { locale } = await params
    setRequestLocale(locale)
    const supabase = createServiceRoleClient()

    const { data: categories } = await supabase
        .from('product_categories')
        .select('id, name, slug')
        .order('sort_order')

    const { data: products } = await supabase
        .from('products')
        .select(`
            id, name, slug, description, price, compare_at_price, stock_quantity,
            images, is_featured, status, origin_type,
            product_categories ( name, slug )
        `)
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

    return (
        <StoreClient
            categories={categories ?? []}
            products={(products ?? []) as any}
        />
    )
}
