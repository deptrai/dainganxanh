"use client";

import { Suspense, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { PhoneEmailInput } from "@/components/auth/PhoneEmailInput";
import { OTPInput } from "@/components/auth/OTPInput";

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const quantity = searchParams.get("quantity") || "1";

    const {
        mode,
        step,
        identifier,
        loading,
        error,
        countdown,
        canResend,
        setMode,
        setIdentifier,
        sendOTP,
        verifyOTP,
        resendOTP,
    } = useAuth();

    // Auto-redirect if already logged in
    useEffect(() => {
        const checkSession = async () => {
            const supabase = createBrowserClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.replace(`/checkout?quantity=${quantity}`);
            }
        };
        checkSession();
    }, [router, quantity]);

    const handleVerifyComplete = async (code: string) => {
        try {
            await verifyOTP(code);
            // Redirect to checkout with quantity
            router.push(`/checkout?quantity=${quantity}`);
        } catch (err) {
            // Error handled by useAuth
            console.error("Verification failed:", err);
        }
    };

    return (
        <div>
            {/* Navigation */}
            <nav className="container mx-auto px-4 py-4">
                <Link
                    href={`/quantity?quantity=${quantity}`}
                    className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                </Link>
            </nav>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 max-w-md">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                        <Shield className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        {step === "input" ? "Đăng ký nhanh" : "Xác thực OTP"}
                    </h1>
                    <p className="text-gray-600">
                        {step === "input"
                            ? "Nhập số điện thoại hoặc email để nhận mã OTP"
                            : `Mã OTP đã được gửi đến ${identifier}`}
                    </p>
                </motion.div>

                {/* Form Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-8 shadow-xl border border-emerald-100"
                >
                    {step === "input" ? (
                        <PhoneEmailInput
                            mode={mode}
                            value={identifier}
                            onChange={setIdentifier}
                            onModeChange={setMode}
                            onSubmit={sendOTP}
                            loading={loading}
                            error={error}
                        />
                    ) : (
                        <OTPInput
                            onComplete={handleVerifyComplete}
                            onResend={resendOTP}
                            countdown={countdown}
                            canResend={canResend}
                            loading={loading}
                            error={error}
                        />
                    )}

                    {/* Login Link */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-center text-sm text-gray-600">
                            Đã có tài khoản?{" "}
                            <Link
                                href={`/login?quantity=${quantity}`}
                                className="text-emerald-600 font-semibold hover:underline"
                            >
                                Đăng nhập ngay
                            </Link>
                        </p>
                    </div>
                </motion.div>

                {/* Info Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 space-y-4"
                >
                    {/* Order Summary */}
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                        <h3 className="font-semibold text-gray-900 mb-2">Đơn hàng của bạn:</h3>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Số lượng cây:</span>
                            <span className="font-semibold text-gray-900">{quantity} cây</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-gray-600">Tổng tiền:</span>
                            <span className="font-semibold text-emerald-600">
                                {(parseInt(quantity) * 260000).toLocaleString('vi-VN')} ₫
                            </span>
                        </div>
                    </div>

                    {/* Security Note */}
                    <div className="text-center text-sm text-gray-600">
                        <p>🔒 Thông tin của bạn được bảo mật tuyệt đối</p>
                        <p className="mt-1">Mã OTP có hiệu lực trong 5 phút</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        }>
            <RegisterContent />
        </Suspense>
    );
}
