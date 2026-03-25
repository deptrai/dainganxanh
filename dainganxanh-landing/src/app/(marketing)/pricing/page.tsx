import type { Metadata } from 'next'
import { PricingPageClient } from "@/components/marketing/PricingPageClient";

export const metadata: Metadata = {
    title: 'Chọn Gói Trồng Cây',
    description: 'Chọn gói trồng cây Dó Đen bản địa phù hợp. Chỉ 260.000 VNĐ/cây, theo dõi minh bạch qua dashboard online.',
    alternates: {
        canonical: 'https://dainganxanh.vn/pricing',
    },
}

export default function PricingPage() {
    return <PricingPageClient />
}
