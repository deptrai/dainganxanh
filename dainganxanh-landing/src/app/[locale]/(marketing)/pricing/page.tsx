import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PricingPageClient } from "@/components/marketing/PricingPageClient";

interface Props {
    params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'pricing' });
    const canonical = locale === 'vi' ? 'https://dainganxanh.com.vn/pricing' : 'https://dainganxanh.com.vn/en/pricing';

    return {
        title: t('page.title'),
        description: t('page.subtitle'),
        alternates: {
            canonical,
            languages: {
                vi: 'https://dainganxanh.com.vn/pricing',
                en: 'https://dainganxanh.com.vn/en/pricing',
                'x-default': 'https://dainganxanh.com.vn/pricing',
            },
        },
    };
}

export default async function PricingPage({ params = Promise.resolve({ locale: 'vi' }) }: Partial<Props> = {}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const isEn = locale === 'en';

    const productJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: isEn ? 'Aquilaria Tree — Dai Ngan Xanh Reforestation' : 'Cây Dó Đen — Trồng Rừng Đại Ngàn Xanh',
        description: isEn
            ? 'Plant native Aquilaria trees in Vietnam. Transparent tracking via online dashboard. Agarwood harvest after 10 years.'
            : 'Trồng cây Dó Đen bản địa tại Việt Nam. Theo dõi minh bạch qua dashboard. Thu hoạch trầm hương sau 10 năm.',
        image: 'https://dainganxanh.com.vn/opengraph-image',
        brand: {
            '@type': 'Organization',
            name: isEn ? 'Dai Ngan Xanh' : 'Đại Ngàn Xanh',
        },
        offers: {
            '@type': 'Offer',
            priceCurrency: 'VND',
            price: '410000',
            availability: 'https://schema.org/InStock',
            url: isEn ? 'https://dainganxanh.com.vn/en/pricing' : 'https://dainganxanh.com.vn/pricing',
            seller: { '@type': 'Organization', name: isEn ? 'Dai Ngan Xanh' : 'Đại Ngàn Xanh' },
        },
    };

    return (
        <>
            <script type="application/ld+json">
                {JSON.stringify(productJsonLd).replace(/</g, '\\u003c')}
            </script>
            <PricingPageClient />
        </>
    );
}
