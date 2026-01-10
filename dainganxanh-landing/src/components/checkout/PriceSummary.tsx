"use client";

import { motion } from "framer-motion";
import { Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceSummaryProps {
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    className?: string;
}

export function PriceSummary({
    quantity,
    unitPrice,
    totalPrice,
    className,
}: PriceSummaryProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
                "rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 border-2 border-emerald-200",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900">Tổng chi phí</h3>
            </div>

            {/* Calculation Formula */}
            <div className="space-y-3">
                {/* Formula Display */}
                <div className="flex items-center justify-center gap-2 text-gray-700 py-3">
                    <span className="text-2xl font-bold text-emerald-600">
                        {quantity.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-xl">×</span>
                    <span className="text-lg">{unitPrice}</span>
                </div>

                {/* Divider */}
                <div className="border-t-2 border-emerald-200 border-dashed" />

                {/* Total */}
                <div className="text-center py-2">
                    <p className="text-sm text-gray-600 mb-1">Tổng cộng</p>
                    <p
                        className="text-4xl font-bold text-emerald-600"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {totalPrice}
                    </p>
                </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 pt-4 border-t border-emerald-200">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Số cây:</span>
                    <span className="font-semibold text-gray-900">
                        {quantity.toLocaleString('vi-VN')} cây
                    </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">CO₂ hấp thụ/năm:</span>
                    <span className="font-semibold text-gray-900">
                        ~{(quantity * 20).toLocaleString('vi-VN')} kg
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
