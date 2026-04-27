"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { createBrowserClient } from "@/lib/supabase/client";
import { usePriceCalculator } from "@/hooks/usePriceCalculator";
import { PACKAGES, isValidPackageType, type PackageType } from "@/lib/constants";
import { QuantitySelector } from "@/components/checkout/QuantitySelector";
import { PriceSummary } from "@/components/checkout/PriceSummary";
import { QuantityErrorBoundary } from "@/components/checkout/QuantityErrorBoundary";
import { cn } from "@/lib/utils";

function QuantityPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Read initial quantity from URL params (e.g., /quantity?initial=10)
    const initialQuantity = parseInt(searchParams.get("initial") || "1", 10);
    const validInitialQuantity = Math.max(1, Math.min(1000, initialQuantity));

    // Read package type from URL (default 'standard')
    const packageParam = searchParams.get("package") || "standard";
    const packageType: PackageType = isValidPackageType(packageParam) ? packageParam : "standard";
    const unitPrice = PACKAGES[packageType].price;
    const packageName = PACKAGES[packageType].name;

    const {
        quantity,
        error,
        isValid,
        increment,
        decrement,
        handleInputChange,
        formattedTotal,
        formattedUnitPrice,
    } = usePriceCalculator(validInitialQuantity, unitPrice);

    const handleContinue = async () => {
        if (isValid) {
            const supabase = createBrowserClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                router.push(`/checkout?quantity=${quantity}&package=${packageType}`);
            } else {
                router.push(`/register?quantity=${quantity}&package=${packageType}`);
            }
        }
    };

    return (
        <QuantityErrorBoundary>
            <div>
                {/* Navigation */}
                <nav className="container mx-auto px-4 py-4">
                    <Link
                        href="/pricing"
                        className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Quay lại chọn gói</span>
                    </Link>
                </nav>

                {/* Main Content */}
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Chọn Số Lượng Cây
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            {packageName} — Mỗi cây Dó Đen sẽ được chăm sóc trong 10 năm và bạn có thể theo dõi minh bạch qua GPS
                        </p>
                    </motion.div>

                    {/* Content Grid */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Left Column - Quantity Selector */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl p-8 shadow-lg border border-emerald-100"
                        >
                            <QuantitySelector
                                quantity={quantity}
                                onIncrement={increment}
                                onDecrement={decrement}
                                onInputChange={handleInputChange}
                                error={error}
                                min={1}
                                max={1000}
                            />

                            {/* Quick Select Buttons */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <p className="text-sm font-semibold text-gray-700 mb-3">Chọn nhanh:</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {[5, 10, 50, 100].map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            aria-label={`Chọn ${value} cây`}
                                            onClick={() => handleInputChange(value.toString())}
                                            className={cn(
                                                "py-2 px-3 rounded-lg text-sm font-medium transition-all",
                                                "border-2",
                                                quantity === value
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                    : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50"
                                            )}
                                        >
                                            {value}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Column - Price Summary */}
                        <div className="space-y-6">
                            <PriceSummary
                                quantity={quantity}
                                unitPrice={formattedUnitPrice}
                                totalPrice={formattedTotal}
                            />

                            {/* CTA Button */}
                            <motion.button
                                type="button"
                                aria-label="Tiếp tục đến trang đăng ký"
                                onClick={handleContinue}
                                disabled={!isValid}
                                whileHover={isValid ? { scale: 1.02 } : {}}
                                whileTap={isValid ? { scale: 0.98 } : {}}
                                className={cn(
                                    "w-full py-4 px-6 rounded-xl font-semibold text-white",
                                    "shadow-lg transition-all duration-300",
                                    "flex items-center justify-center gap-2 group",
                                    isValid
                                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 hover:shadow-xl"
                                        : "bg-gray-300 cursor-not-allowed"
                                )}
                            >
                                <span>Tiếp tục đăng ký</span>
                                <ArrowRight className={cn(
                                    "w-5 h-5 transition-transform",
                                    isValid && "group-hover:translate-x-1"
                                )} />
                            </motion.button>

                            {/* Trust Badge */}
                            <div className="text-center text-sm text-gray-600">
                                <p>🔒 Thanh toán an toàn & bảo mật</p>
                            </div>
                        </div>
                    </div>

                    {/* Benefits Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-16 grid md:grid-cols-3 gap-6"
                    >
                        <div className="text-center p-6 bg-white rounded-xl border border-emerald-100">
                            <div className="text-3xl mb-2">🌱</div>
                            <h3 className="font-semibold text-gray-900 mb-1">Giống chất lượng</h3>
                            <p className="text-sm text-gray-600">Dó Đen (Aquilaria) bản địa</p>
                        </div>
                        <div className="text-center p-6 bg-white rounded-xl border border-emerald-100">
                            <div className="text-3xl mb-2">📍</div>
                            <h3 className="font-semibold text-gray-900 mb-1">Theo dõi GPS</h3>
                            <p className="text-sm text-gray-600">Minh bạch 100% vị trí cây</p>
                        </div>
                        <div className="text-center p-6 bg-white rounded-xl border border-emerald-100">
                            <div className="text-3xl mb-2">📊</div>
                            <h3 className="font-semibold text-gray-900 mb-1">Báo cáo định kỳ</h3>
                            <p className="text-sm text-gray-600">Cập nhật hàng quý với ảnh</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </QuantityErrorBoundary>
    );
}

export default function QuantityPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
            <QuantityPageContent />
        </Suspense>
    );
}
