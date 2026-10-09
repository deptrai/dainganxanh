import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Lora, Raleway } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { routing, type Locale } from '@/i18n/routing'
import '../globals.css'

const lora = Lora({
    subsets: ['latin', 'vietnamese'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-lora',
    display: 'swap',
})

const raleway = Raleway({
    subsets: ['latin', 'vietnamese'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-raleway',
    display: 'swap',
})

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params
    const isEn = locale === 'en'

    return {
        metadataBase: new URL('https://dainganxanh.com.vn'),
        title: {
            default: isEn
                ? 'Dai Ngan Xanh - Sowing Good Deeds, Reaping Blessings'
                : 'Đại Ngàn Xanh - Gieo Hạt Lành, Gặt Phước Báu',
            template: isEn ? '%s | Dai Ngan Xanh' : '%s | Đại Ngàn Xanh',
        },
        description: isEn
            ? 'Plant 1,000,000 native Aquilaria trees for Vietnam. From 410,000 VND/tree, track transparently via online dashboard.'
            : 'Trồng 1.000.000 cây Dó Đen bản địa cho Việt Nam. Từ 410.000 VNĐ/cây, theo dõi minh bạch qua dashboard online.',
        keywords: isEn
            ? ['tree planting', 'aquilaria', 'environment', 'carbon credit', 'agarwood', 'Vietnam']
            : ['trồng cây', 'dó đen', 'môi trường', 'carbon credit', 'trầm hương', 'Việt Nam'],
        authors: [{ name: isEn ? 'Dai Ngan Xanh' : 'Đại Ngàn Xanh' }],
        alternates: {
            canonical: isEn ? 'https://dainganxanh.com.vn/en' : 'https://dainganxanh.com.vn',
            languages: {
                vi: 'https://dainganxanh.com.vn',
                en: 'https://dainganxanh.com.vn/en',
                'x-default': 'https://dainganxanh.com.vn',
            },
        },
        openGraph: {
            title: isEn
                ? 'Dai Ngan Xanh - Sowing Good Deeds, Reaping Blessings'
                : 'Đại Ngàn Xanh - Gieo Hạt Lành, Gặt Phước Báu',
            description: isEn
                ? 'Sow a seedling, weave an eternal forest'
                : 'Gieo một mầm xanh, dệt nên đại ngàn vĩnh cửu',
            type: 'website',
            locale: isEn ? 'en_US' : 'vi_VN',
            url: isEn ? 'https://dainganxanh.com.vn/en' : 'https://dainganxanh.com.vn',
            siteName: isEn ? 'Dai Ngan Xanh' : 'Đại Ngàn Xanh',
            images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: isEn ? 'Dai Ngan Xanh' : 'Đại Ngàn Xanh' }],
        },
        twitter: {
            card: 'summary_large_image',
            title: isEn ? 'Dai Ngan Xanh' : 'Đại Ngàn Xanh',
            description: isEn
                ? 'Plant 1,000,000 native Aquilaria trees for Vietnam'
                : 'Trồng 1.000.000 cây Dó Đen bản địa cho Việt Nam',
            images: ['/opengraph-image'],
        },
    }
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params

    if (!routing.locales.includes(locale as Locale)) {
        notFound()
    }

    setRequestLocale(locale)
    const messages = await getMessages()

    const organizationJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: locale === 'en' ? 'Dai Ngan Xanh' : 'Đại Ngàn Xanh',
        url: 'https://dainganxanh.com.vn',
        logo: {
            '@type': 'ImageObject',
            url: 'https://dainganxanh.com.vn/opengraph-image',
        },
        description: locale === 'en'
            ? 'Platform to plant 1 million native Aquilaria trees in Vietnam, with transparent tracking and carbon credits.'
            : 'Nền tảng trồng 1 triệu cây Dó Đen bản địa tại Việt Nam, theo dõi minh bạch và carbon credit.',
        sameAs: [
            'https://facebook.com/dainganxanh',
        ],
    }

    return (
        <html lang={locale} className={`scroll-smooth ${lora.variable} ${raleway.variable}`}>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body className="font-sans text-brand-600 bg-brand-50 antialiased selection:bg-brand-500 selection:text-white">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
                />
                <NextIntlClientProvider locale={locale} messages={messages}>
                    {children}
                </NextIntlClientProvider>
            </body>
        </html>
    )
}
