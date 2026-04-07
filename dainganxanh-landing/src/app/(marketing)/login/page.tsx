"use client";

import { Suspense, useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogIn, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { PhoneEmailInput } from "@/components/auth/PhoneEmailInput";
import { OTPInput } from "@/components/auth/OTPInput";
import Cookies from "js-cookie";

const DEFAULT_REF = "dainganxanh";

function RefCodeModal({ onDone }: { onDone: () => void }) {
    const [refInput, setRefInput] = useState("");
    const [refError, setRefError] = useState("");

    const handleSubmit = () => {
        const code = refInput.trim().toLowerCase() || DEFAULT_REF.toLowerCase();
        Cookies.set("ref", code, {
            expires: 90,
            path: "/",
            sameSite: "lax",
            secure: window.location.protocol === "https:",
        });
        onDone();
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Gift className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Nhập mã giới thiệu</h2>
                        <p className="text-xs text-gray-500">Ai đã giới thiệu bạn đến Đại Ngàn Xanh?</p>
                    </div>
                </div>

                <input
                    type="text"
                    value={refInput}
                    onChange={(e) => {
                        setRefInput(e.target.value.toLowerCase());
                        if (refError) setRefError("");
                    }}
                    placeholder="VD: dainganxanh"
                    maxLength={20}
                    autoFocus
                    className={`w-full border rounded-lg px-4 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        refError ? "border-red-400 bg-red-50" : "border-gray-300"
                    }`}
                />
                {refError && <p className="mt-1 text-xs text-red-600">{refError}</p>}

                {/* Hint */}
                <p className="mt-2 text-xs text-gray-500">
                    Chưa có mã?{" "}
                    <button
                        type="button"
                        onClick={() => {
                            setRefInput(DEFAULT_REF.toLowerCase());
                            setRefError("");
                        }}
                        className="text-emerald-600 font-semibold hover:underline focus:outline-none"
                    >
                        Bấm vào đây để dùng mã {DEFAULT_REF}
                    </button>
                </p>

                <div className="mt-5">
                    <button
                        onClick={handleSubmit}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors"
                    >
                        Xác nhận
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const quantity = searchParams.get("quantity") || "1";
    const explicitRedirect = searchParams.get("redirect");
    const redirectTo = explicitRedirect || (searchParams.get("quantity") ? `/checkout?quantity=${quantity}` : "/crm/my-garden");
    const [showRefModal, setShowRefModal] = useState(false);

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

    // Auto-redirect if already logged in — but check ref cookie first
    useEffect(() => {
        const checkSession = async () => {
            const supabase = createBrowserClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                if (!Cookies.get("ref")) {
                    setShowRefModal(true);
                } else {
                    window.location.href = redirectTo;
                }
            }
        };
        checkSession();
    }, [redirectTo]);

    const handleVerifyComplete = async (otpCode: string) => {
        try {
            await verifyOTP(otpCode);
            // After login, check if ref cookie exists
            if (!Cookies.get("ref")) {
                setShowRefModal(true);
            } else {
                window.location.href = redirectTo;
            }
        } catch (err) {
            console.error("Verification failed:", err);
        }
    };

    const handleRefDone = () => {
        setShowRefModal(false);
        window.location.href = redirectTo;
    };

    return (
        <div>
            <AnimatePresence>
                {showRefModal && <RefCodeModal onDone={handleRefDone} />}
            </AnimatePresence>

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
