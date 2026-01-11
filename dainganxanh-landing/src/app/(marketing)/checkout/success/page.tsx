"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Trees } from "lucide-react";
import { SuccessAnimation } from "@/components/checkout/SuccessAnimation";
import { ShareCardPreview } from "@/components/checkout/ShareCardPreview";
import { ShareButton } from "@/components/checkout/ShareButton";

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orderCode, setOrderCode] = useState(searchParams.get("orderCode") || "");
    const quantity = parseInt(searchParams.get("quantity") || "1");
    const userName = searchParams.get("name") || "";

    // FIXED: Generate orderCode in useEffect to avoid hydration mismatch
    useEffect(() => {
        if (!searchParams.get("orderCode")) {
            const code = `DH${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            setOrderCode(code);
            // Update URL with generated code
            const params = new URLSearchParams(searchParams.toString());
            params.set("orderCode", code);
            router.replace(`/checkout/success?${params.toString()}`, { scroll: false });
        }
    }, [searchParams, router]);

    // Calculate impact
    const co2Impact = quantity * 20;
    const totalAmount = quantity * 260000;

    // Don't render until we have orderCode
    if (!orderCode) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Success Animation */}
                <SuccessAnimation treeCount={quantity} />

                {/* Order Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2 }}
                    className="bg-white rounded-2xl p-6 shadow-xl border border-emerald-100 my-8"
                >
                    <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
                        Chi tiết đơn hàng
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Mã đơn hàng:</span>
                            <span className="font-mono font-semibold text-emerald-600">{orderCode}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Số cây:</span>
                            <span className="font-semibold">{quantity} cây</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tổng tiền:</span>
                            <span className="font-semibold text-emerald-600">
                                {totalAmount.toLocaleString("vi-VN")} ₫
                            </span>
                        </div>
                        <div className="pt-3 border-t border-gray-100">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tác động môi trường:</span>
                                <span className="text-emerald-600 font-medium">
                                    ~{co2Impact.toLocaleString()} kg CO₂/năm 🌍
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Share Card Preview */}
                <ShareCardPreview
                    userName={userName}
                    treeCount={quantity}
                    orderCode={orderCode}
                />

                {/* Share Button */}
                <ShareButton
                    treeCount={quantity}
                    orderCode={orderCode}
                    userName={userName}
                />

                {/* Navigation Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 3 }}
                    className="mt-8 space-y-4"
                >
                    {/* Primary CTA - View My Garden */}
                    <Link
                        href="/crm/my-garden"
                        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-4 px-6 rounded-xl hover:from-emerald-700 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all"
                    >
                        <Trees className="w-6 h-6" />
                        <span>Xem vườn cây của tôi</span>
                    </Link>

                    {/* Secondary Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            href="/"
                            className="flex items-center justify-center gap-2 bg-white border-2 border-emerald-500 text-emerald-700 font-semibold py-3 px-6 rounded-xl hover:bg-emerald-50 transition-colors"
                        >
                            <Home className="w-5 h-5" />
                            <span>Về trang chủ</span>
                        </Link>
                        <Link
                            href="/quantity"
                            className="flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 font-semibold py-3 px-6 rounded-xl hover:bg-emerald-200 transition-colors"
                        >
                            <Trees className="w-5 h-5" />
                            <span>Mua thêm</span>
                        </Link>
                    </div>
                </motion.div>

                {/* Thank You Message */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3.5 }}
                    className="text-center text-gray-500 text-sm mt-8"
                >
                    Chúng tôi sẽ gửi email xác nhận và mã cây của bạn trong 24 giờ.
                </motion.p>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải...</p>
                    </div>
                </div>
            }
        >
            <SuccessContent />
        </Suspense>
    );
}
