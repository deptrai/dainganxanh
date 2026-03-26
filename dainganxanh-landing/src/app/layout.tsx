import type { Metadata } from 'next'
import { Lora, Raleway } from 'next/font/google'
import './globals.css'

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

export const metadata: Metadata = {
    metadataBase: new URL('https://dainganxanh.com.vn'),
    title: {
        default: 'Đại Ngàn Xanh - Gieo Hạt Lành, Gặt Phước Báu',
        template: '%s | Đại Ngàn Xanh',
    },
    description: 'Trồng 1.000.000 cây Dó Đen bản địa cho Việt Nam. Chỉ 260.000 VNĐ/cây, theo dõi minh bạch qua dashboard online.',
    keywords: ['trồng cây', 'dó đen', 'môi trường', 'carbon credit', 'trầm hương', 'Việt Nam'],
    authors: [{ name: 'Đại Ngàn Xanh' }],
    alternates: {
        canonical: 'https://dainganxanh.com.vn',
    },
    openGraph: {
        title: 'Đại Ngàn Xanh - Gieo Hạt Lành, Gặt Phước Báu',
        description: 'Gieo một mầm xanh, dệt nên đại ngàn vĩnh cửu',
        type: 'website',
        locale: 'vi_VN',
        url: 'https://dainganxanh.com.vn',
        siteName: 'Đại Ngàn Xanh',
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Đại Ngàn Xanh' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Đại Ngàn Xanh',
        description: 'Trồng 1.000.000 cây Dó Đen bản địa cho Việt Nam',
        images: ['/opengraph-image'],
    },
}

const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Đại Ngàn Xanh',
    url: 'https://dainganxanh.com.vn',
    logo: {
        '@type': 'ImageObject',
        url: 'https://dainganxanh.com.vn/opengraph-image',
    },
    description: 'Nền tảng trồng 1 triệu cây Dó Đen bản địa tại Việt Nam, theo dõi minh bạch và carbon credit.',
    sameAs: [
        'https://facebook.com/dainganxanh',
    ],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="vi" className={`scroll-smooth ${lora.variable} ${raleway.variable}`}>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body className="font-sans text-brand-600 bg-brand-50 antialiased selection:bg-brand-500 selection:text-white">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
                />
                {children}
            </body>
        </html>
    )
}
