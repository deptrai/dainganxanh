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
    title: 'Đại Ngàn Xanh - Gieo Hạt Lành, Gặt Phước Báu',
    description: 'Trồng 1.000.000 cây Dó Đen bản địa cho Việt Nam. Chỉ 260.000 VNĐ/cây, theo dõi minh bạch qua dashboard online.',
    keywords: ['trồng cây', 'dó đen', 'môi trường', 'carbon credit', 'trầm hương', 'Việt Nam'],
    authors: [{ name: 'Đại Ngàn Xanh' }],
    openGraph: {
        title: 'Đại Ngàn Xanh - Gieo Hạt Lành, Gặt Phước Báu',
        description: 'Gieo một mầm xanh, dệt nên đại ngàn vĩnh cửu',
        type: 'website',
        locale: 'vi_VN',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Đại Ngàn Xanh',
        description: 'Trồng 1.000.000 cây Dó Đen bản địa cho Việt Nam',
    },
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
                {children}
            </body>
        </html>
    )
}
