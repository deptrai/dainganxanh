"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { PackageCard } from "@/components/marketing/PackageCard";
import { PACKAGES } from "@/lib/constants";

export function PricingPageClient() {
    const router = useRouter();
    const t = useTranslations('pricing');

    const handleSelectPackage = () => {
        const defaultQuantity = 10;
        router.push(`/quantity?initial=${defaultQuantity}&package=insurance`);
    };

    return (
        <div>
            {/* Header */}
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        {t('page.title')}
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        {t('page.subtitle')}
                    </p>
                </div>

                {/* Single Package Card — centered */}
                <div className="max-w-lg mx-auto">
                    <PackageCard
                        packageData={PACKAGES.insurance}
                        packageType="insurance"
                        highlighted
                        onSelectPackage={handleSelectPackage}
                    />
                </div>

                {/* Trust Indicators */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-600 mb-2">{t('page.trustCareYears')}</div>
                        <p className="text-gray-600">{t('page.trustCare')}</p>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-600 mb-2">{t('page.trustGpsRate')}</div>
                        <p className="text-gray-600">{t('page.trustGps')}</p>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-600 mb-2">{t('page.trustCo2Rate')}</div>
                        <p className="text-gray-600">{t('page.trustCo2')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
