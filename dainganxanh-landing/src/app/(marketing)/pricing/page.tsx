import type { Metadata } from 'next'
import { PricingPageClient } from "@/components/marketing/PricingPageClient";

export const metadata: Metadata = {
    title: 'Chọn Gói Trồng Cây',
    description: 'Chọn gói trồng cây Dó Đen bản địa phù hợp. Chỉ 260.000 VNĐ/cây, theo dõi minh bạch qua dashboard online.',
    alternates: {
        canonical: 'https://dainganxanh.vn/pricing',
    },
}

const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Cây Dó Đen — Gói Cá Nhân',
    description: 'Trồng 1 cây Dó Đen bản địa tại Việt Nam. Theo dõi minh bạch qua dashboard. Thu hoạch trầm hương sau 5 năm.',
    image: 'https://dainganxanh.vn/opengraph-image',
    brand: {
        '@type': 'Organization',
        name: 'Đại Ngàn Xanh',
    },
    offers: {
        '@type': 'Offer',
        priceCurrency: 'VND',
        price: '260000',
        availability: 'https://schema.org/InStock',
        url: 'https://dainganxanh.vn/pricing',
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
