"use client";

import { useRouter } from "next/navigation";
import { PackageCard } from "@/components/marketing/PackageCard";
import { PACKAGES } from "@/lib/constants";

export function PricingPageClient() {
    const router = useRouter();

    const handleSelectPackage = (packageType: string) => {
        const defaultQuantity = 10;
        router.push(`/quantity?initial=${defaultQuantity}&package=${packageType}`);
    };

    return (
        <div>
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

                {/* Package Cards — 2-column grid */}
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <PackageCard
                        packageData={PACKAGES.standard}
                        packageType="standard"
                        onSelectPackage={() => handleSelectPackage("standard")}
                    />
                    <PackageCard
                        packageData={PACKAGES.insurance}
                        packageType="insurance"
                        highlighted
                        onSelectPackage={() => handleSelectPackage("insurance")}
                    />
                </div>

                {/* Trust Indicators */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-600 mb-2">10 năm</div>
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
