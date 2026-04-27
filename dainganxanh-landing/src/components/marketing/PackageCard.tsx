"use client";

import { motion } from "framer-motion";
import { Sprout, Heart, Users, Shield, ArrowRight } from "lucide-react";
import { formatVND, type CostBreakdown, type PackageInfo, type PackageType } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap = { Sprout, Heart, Users, Shield };

interface PackageCardProps {
    packageData: PackageInfo;
    packageType: PackageType;
    onSelectPackage?: () => void;
    highlighted?: boolean;
    className?: string;
}

export function PackageCard({ packageData, packageType, onSelectPackage, highlighted, className }: PackageCardProps) {
    const getIcon = (iconName: string) => {
        const Icon = iconMap[iconName as keyof typeof iconMap];
        return Icon ? <Icon className="w-5 h-5" /> : null;
    };

    const isInsurance = packageType === "insurance";
    const accentColor = isInsurance ? "amber" : "emerald";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
                "relative overflow-hidden rounded-3xl bg-white p-8 shadow-xl",
                "transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
                isInsurance
                    ? "border-2 border-amber-200 hover:border-amber-400"
                    : "border-2 border-emerald-100 hover:border-emerald-300",
                highlighted && "ring-2 ring-amber-400 ring-offset-2",
                className
            )}
        >
            {/* Badge for insurance */}
            {isInsurance && (
                <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                    <Shield className="w-3.5 h-3.5" />
                    Kèm Bảo Hiểm
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">{packageData.name}</h3>
                    {!isInsurance && (
                        <div className="flex items-center gap-1 text-emerald-600">
                            <Sprout className="w-6 h-6" />
                        </div>
                    )}
                </div>
                <div className="flex items-baseline gap-2">
                    <span className={cn(
                        "text-4xl font-bold",
                        isInsurance ? "text-amber-600" : "text-emerald-600"
                    )}>
                        {formatVND(packageData.price)}
                    </span>
                    <span className="text-lg text-gray-600">/cây</span>
                </div>
            </div>

            {/* Cost Breakdown */}
            <div className="mb-6 space-y-3">
                <p className="text-sm font-semibold text-gray-700 mb-3">Chi phí bao gồm:</p>
                {packageData.breakdown.map((item: CostBreakdown, index: number) => {
                    const isInsuranceItem = item.icon === "Shield";
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * (index + 1) }}
                            className={cn(
                                "flex items-start gap-3 p-3 rounded-lg transition-colors",
                                isInsuranceItem
                                    ? "bg-amber-50/50 hover:bg-amber-50"
                                    : "bg-emerald-50/50 hover:bg-emerald-50"
                            )}
                        >
                            <div className={cn(
                                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                                isInsuranceItem
                                    ? "bg-amber-100 text-amber-600"
                                    : "bg-emerald-100 text-emerald-600"
                            )}>
                                {getIcon(item.icon)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                                    <span className={cn(
                                        "text-sm font-semibold whitespace-nowrap",
                                        isInsuranceItem ? "text-amber-600" : "text-emerald-600"
                                    )}>
                                        {formatVND(item.amount)}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600">{item.description}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Features */}
            <div className="mb-6 space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-3">Quyền lợi:</p>
                {packageData.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isInsurance ? "bg-amber-500" : "bg-emerald-500"
                        )} />
                        <span>{feature}</span>
                    </div>
                ))}
            </div>

            {/* CTA Button */}
            <motion.button
                type="button"
                aria-label="Tùy chỉnh số lượng cây muốn trồng"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSelectPackage}
                className={cn(
                    "w-full py-4 px-6 rounded-xl font-semibold text-white",
                    "shadow-lg hover:shadow-xl transition-all duration-300",
                    "flex items-center justify-center gap-2 group",
                    isInsurance
                        ? "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600"
                        : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600"
                )}
            >
                <span>Tùy chỉnh số lượng</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            {/* Decorative elements */}
            <div className={cn(
                "absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-16 translate-x-16 opacity-20",
                isInsurance ? "bg-amber-100" : "bg-emerald-100"
            )} />
            <div className={cn(
                "absolute bottom-0 left-0 w-24 h-24 rounded-full translate-y-12 -translate-x-12 opacity-20",
                isInsurance ? "bg-amber-100" : "bg-emerald-100"
            )} />
        </motion.div>
    );
}
