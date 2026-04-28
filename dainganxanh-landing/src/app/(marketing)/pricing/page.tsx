import type { Metadata } from 'next'
import { PricingPageClient } from "@/components/marketing/PricingPageClient";

export const metadata: Metadata = {
    title: 'Gói Trồng Cây Dó Đen',
    description: 'Trồng cây Dó Đen bản địa tại Việt Nam. 410.000 VNĐ/cây, chăm sóc 10 năm, bao tiêu thu hoạch. Theo dõi minh bạch qua dashboard online.',
    alternates: {
        canonical: 'https://dainganxanh.com.vn/pricing',
    },
}

const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Cây Dó Đen — Trồng Rừng Đại Ngàn Xanh',
    description: 'Trồng cây Dó Đen bản địa tại Việt Nam. Theo dõi minh bạch qua dashboard. Thu hoạch trầm hương sau 10 năm.',
    image: 'https://dainganxanh.com.vn/opengraph-image',
    brand: {
        '@type': 'Organization',
        name: 'Đại Ngàn Xanh',
    },
    offers: {
        '@type': 'Offer',
        priceCurrency: 'VND',
        price: '410000',
        availability: 'https://schema.org/InStock',
        url: 'https://dainganxanh.com.vn/pricing',
        seller: { '@type': 'Organization', name: 'Đại Ngàn Xanh' },
    },
}

export default function PricingPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
            />
            <PricingPageClient />
        </>
    )
}
