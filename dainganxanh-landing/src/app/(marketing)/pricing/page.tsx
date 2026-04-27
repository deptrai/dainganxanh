import type { Metadata } from 'next'
import { PricingPageClient } from "@/components/marketing/PricingPageClient";

export const metadata: Metadata = {
    title: 'Chọn Gói Trồng Cây',
    description: 'Chọn gói trồng cây Dó Đen bản địa phù hợp. Từ 260.000 VNĐ/cây, theo dõi minh bạch qua dashboard online.',
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
        '@type': 'AggregateOffer',
        priceCurrency: 'VND',
        lowPrice: '260000',
        highPrice: '410000',
        offerCount: '2',
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
