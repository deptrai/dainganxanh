"use client";

import { motion } from "framer-motion";
import { Sprout, Heart, Users, ArrowRight } from "lucide-react";
import { PACKAGE_INFO, formatVND, type CostBreakdown } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Icon mapping
const iconMap = {
    Sprout,
    Heart,
    Users,
};

interface PackageCardProps {
    onSelectPackage?: () => void;
    className?: string;
}

export function PackageCard({ onSelectPackage, className }: PackageCardProps) {
    const getIcon = (iconName: string) => {
        const Icon = iconMap[iconName as keyof typeof iconMap];
        return Icon ? <Icon className="w-5 h-5" /> : null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
                "relative overflow-hidden rounded-3xl bg-white p-8 shadow-xl",
                "border-2 border-emerald-100 hover:border-emerald-300 transition-all duration-300",
                "hover:shadow-2xl hover:-translate-y-1",
                className
            )}
        >
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">{PACKAGE_INFO.name}</h3>
                    <div className="flex items-center gap-1 text-emerald-600">
                        <Sprout className="w-6 h-6" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-emerald-600">
                        {formatVND(PACKAGE_INFO.price)}
                    </span>
                    <span className="text-lg text-gray-600">/{PACKAGE_INFO.unit}</span>
                </div>
            </div>

            {/* Cost Breakdown */}
            <div className="mb-6 space-y-3">
                <p className="text-sm font-semibold text-gray-700 mb-3">Chi phí bao gồm:</p>
                {PACKAGE_INFO.breakdown.map((item: CostBreakdown, index: number) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * (index + 1) }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/50 hover:bg-emerald-50 transition-colors"
                    >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            {getIcon(item.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                                <span className="text-sm font-semibold text-emerald-600 whitespace-nowrap">
                                    {formatVND(item.amount)}
                                </span>
                            </div>
                            <p className="text-xs text-gray-600">{item.description}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Features */}
            <div className="mb-6 space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-3">Quyền lợi:</p>
                {PACKAGE_INFO.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
                    "bg-gradient-to-r from-emerald-600 to-emerald-500",
                    "hover:from-emerald-700 hover:to-emerald-600",
                    "shadow-lg hover:shadow-xl transition-all duration-300",
                    "flex items-center justify-center gap-2 group"
                )}
            >
                <span>Tùy chỉnh số lượng</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full -translate-y-16 translate-x-16 opacity-20" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-100 rounded-full translate-y-12 -translate-x-12 opacity-20" />
        </motion.div>
    );
}
