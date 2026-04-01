"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Trees, FileText, CheckCircle } from "lucide-react";
import { SuccessAnimation } from "@/components/checkout/SuccessAnimation";
import { ShareCardPreview } from "@/components/checkout/ShareCardPreview";
import { ShareButton } from "@/components/shared/ShareButton";
import { CustomerIdentityForm, CustomerIdentityData } from "@/components/checkout/CustomerIdentityForm";

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orderCode, setOrderCode] = useState(searchParams.get("orderCode") || "");
    const quantity = parseInt(searchParams.get("quantity") || "1");
    const userName = searchParams.get("name") || "";

    const [identityDone, setIdentityDone] = useState<boolean | null>(null); // null = loading
    const [identitySubmitting, setIdentitySubmitting] = useState(false);
    const [identityError, setIdentityError] = useState("");
    const [identitySuccess, setIdentitySuccess] = useState(false);

    // FIXED: Generate orderCode in useEffect to avoid hydration mismatch
    useEffect(() => {
        if (!searchParams.get("orderCode")) {
            const code = `DH${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            setOrderCode(code);
            const params = new URLSearchParams(searchParams.toString());
            params.set("orderCode", code);
            router.replace(`/checkout/success?${params.toString()}`, { scroll: false });
        }
    }, [searchParams, router]);

    // Check if order already has identity data, auto-fill from user profile if available
    useEffect(() => {
        if (!orderCode) return;
        fetch(`/api/orders/auto-fill-identity?orderCode=${orderCode}`)
            .then((r) => r.ok ? r.json() : null)
            .then((data) => {
                if (data?.hasIdentity) {
                    setIdentityDone(true);
                    // If auto-filled from saved profile, show success message
                    if (data?.autoFilled) {
                        setIdentitySuccess(true);
                    }
                } else {
                    setIdentityDone(false);
                }
            })
            .catch(() => setIdentityDone(false));
    }, [orderCode]);

    const handleIdentitySubmit = async (data: CustomerIdentityData) => {
        setIdentitySubmitting(true);
        setIdentityError("");
        try {
            const res = await fetch("/api/orders/identity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderCode, ...data }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Có lỗi xảy ra");
            }
            setIdentityDone(true);
            setIdentitySuccess(true);
        } catch (err) {
            setIdentityError(err instanceof Error ? err.message : "Có lỗi xảy ra");
            throw err;
        } finally {
            setIdentitySubmitting(false);
        }
    };

    // Calculate impact
    const co2Impact = quantity * 20;
    const totalAmount = quantity * 260000;

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

                {/* Identity Form — shown after payment, before contract generation */}
                {identityDone === false && !identitySuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.3 }}
                        className="bg-white rounded-2xl p-6 shadow-xl border border-amber-200 my-8"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-6 h-6 text-amber-600" />
                            <h2 className="text-lg font-bold text-gray-900">Thông tin để tạo hợp đồng</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            Điền thông tin CCCD để chúng tôi tạo hợp đồng trồng cây đúng mẫu pháp lý. Bạn có thể bỏ qua và điền sau.
                        </p>
                        <CustomerIdentityForm
                            onSubmit={handleIdentitySubmit}
                            isLoading={identitySubmitting}
                            error={identityError}
                        />
                        <button
                            onClick={() => setIdentityDone(true)}
                            className="mt-3 w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Bỏ qua, điền sau →
                        </button>
                    </motion.div>
                )}

                {/* Identity saved confirmation */}
                {identitySuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 my-8 flex items-center gap-3"
                    >
                        <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-emerald-800">Đã lưu thông tin hợp đồng!</p>
                            <p className="text-sm text-emerald-600">Hợp đồng sẽ được gửi qua email trong 24 giờ.</p>
                        </div>
                    </motion.div>
                )}

                {/* Share Card Preview */}
                <ShareCardPreview
                    userName={userName}
                    treeCount={quantity}
                    orderCode={orderCode}
                />

                {/* Share Button */}
                <ShareButton
                    context="purchase"
                    data={{
                        trees: quantity,
                        refCode: orderCode,
                        userName: userName
                    }}
                />

                {/* Navigation Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 3 }}
                    className="mt-8 space-y-4"
                >
                    <Link
                        href="/crm/my-garden"
                        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-4 px-6 rounded-xl hover:from-emerald-700 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all"
                    >
                        <Trees className="w-6 h-6" />
                        <span>Xem vườn cây của tôi</span>
                    </Link>

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
