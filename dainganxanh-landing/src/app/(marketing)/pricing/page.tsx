"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PackageCard } from "@/components/marketing/PackageCard";

export default function PricingPage() {
    const router = useRouter();

    const handleSelectPackage = () => {
        // Navigate to quantity selector (Story 1.3) with default quantity
        const defaultQuantity = 10; // Default to 10 trees
        router.push(`/quantity?initial=${defaultQuantity}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
            {/* Navigation */}
            <nav className="container mx-auto px-4 py-4">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Về trang chủ</span>
                </Link>
            </nav>

            {/* Header */}
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Chọn Gói Trồng Cây
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Mỗi cây bạn trồng là một đóng góp cho tương lai xanh của Việt Nam
                    </p>
                </div>

                {/* Package Card */}
                <div className="max-w-2xl mx-auto">
                    <PackageCard onSelectPackage={handleSelectPackage} />
                </div>

                {/* Trust Indicators */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-600 mb-2">5 năm</div>
                        <p className="text-gray-600">Cam kết chăm sóc</p>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-600 mb-2">100%</div>
                        <p className="text-gray-600">Minh bạch GPS</p>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-600 mb-2">20kg</div>
                        <p className="text-gray-600">CO₂ hấp thụ/năm</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

