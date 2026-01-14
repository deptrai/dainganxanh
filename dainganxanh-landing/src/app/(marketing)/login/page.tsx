"use client";

import { Suspense, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { PhoneEmailInput } from "@/components/auth/PhoneEmailInput";
import { OTPInput } from "@/components/auth/OTPInput";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const quantity = searchParams.get("quantity") || "1";
    const redirectTo = searchParams.get("redirect") || `/checkout?quantity=${quantity}`;

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
                window.location.href = redirectTo;
            }
        };
        checkSession();
    }, [redirectTo]);

    const handleVerifyComplete = async (code: string) => {
        try {
            await verifyOTP(code);
            // Use window.location.href instead of router.push() to force hard redirect
            // This ensures cookies are properly synced for server-side session validation
            window.location.href = redirectTo;
        } catch (err) {
            // Error handled by useAuth
            console.error("Verification failed:", err);
        }
    };

    return (
        <div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 max-w-md">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                        <LogIn className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        {step === "input" ? "Đăng nhập" : "Xác thực OTP"}
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

                    {/* Register Link */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-center text-sm text-gray-600">
                            Chưa có tài khoản?{" "}
                            <Link
                                href={`/register?quantity=${quantity}`}
                                className="text-emerald-600 font-semibold hover:underline"
                            >
                                Đăng ký ngay
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

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
