"use client";

import { Suspense, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { createBrowserClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from '@/i18n/navigation'
import { ArrowLeft, Shield, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { PhoneEmailInput } from "@/components/auth/PhoneEmailInput";
import { OTPInput } from "@/components/auth/OTPInput";
import { PACKAGES, isValidPackageType, type PackageType } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import Cookies from "js-cookie";
import { checkUserExists } from "@/actions/checkUserExists";

const DEFAULT_REF = "dainganxanh";

function RegisterContent() {
    const t = useTranslations('auth.register');
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const quantity = searchParams.get("quantity") || "1";
    const hasQuantityParam = !!searchParams.get("quantity");
    const packageParam = searchParams.get("package") || "standard";
    const packageType: PackageType = isValidPackageType(packageParam) ? packageParam : "standard";
    const unitPrice = PACKAGES[packageType].price;
    const refFromUrl = searchParams.get("ref") || "";
    const [refInput, setRefInput] = useState(refFromUrl.toLowerCase());
    const [refError, setRefError] = useState("");
    const [accountExists, setAccountExists] = useState(false);

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

    // Pre-fill from URL param first, then cookie as fallback
    useEffect(() => {
        if (refFromUrl) {
            setRefInput(refFromUrl.toLowerCase());
        } else {
            const existing = Cookies.get("ref");
            if (existing) setRefInput(existing.toLowerCase());
        }
    }, [refFromUrl]);

    // Auto-redirect if already logged in
    useEffect(() => {
        const checkSession = async () => {
            const supabase = createBrowserClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Set ref cookie trước khi redirect để ensureUserProfile có thể đọc
                const refToSave = refFromUrl.toLowerCase() || Cookies.get('ref') || '';
                if (refToSave) {
                    Cookies.set('ref', refToSave, { expires: 30, path: '/', sameSite: 'lax', secure: window.location.protocol === 'https:' });
                    // Gọi ensureUserProfile để update referrer nếu chưa có
                    const { ensureUserProfile } = await import('@/actions/ensureUserProfile');
                    await ensureUserProfile(session.user.id, session.user.email ?? '', session.user.phone ?? null, refToSave).catch(() => {});
                }
                router.replace(hasQuantityParam ? `/checkout?quantity=${quantity}&package=${packageType}` : '/crm/my-garden');
            }
        };
        checkSession();
    }, [router, quantity, refFromUrl]);

    const handleSendOTP = async () => {
        // Validate referral code is entered
        const code = refInput.trim().toLowerCase();
        if (!code) {
            setRefError(t('refRequired'));
            return;
        }
        setRefError("");

        // Check duplicate user before sending OTP
        const exists = await checkUserExists(identifier, mode);
        if (exists) {
            setAccountExists(true);
            return;
        }
        setAccountExists(false);

        sendOTP();
    };

    const handleVerifyComplete = async (otpCode: string) => {
        try {
            // Preserve first-touch attribution from an existing affiliate cookie unless
            // user explicitly entered a different referral code in this session.
            const existingRef = Cookies.get("ref")?.toLowerCase() ?? null;
            const enteredRef = refInput.trim().toLowerCase();
            const refToUse = enteredRef || existingRef || DEFAULT_REF.toLowerCase();

            if (refToUse) {
                Cookies.set("ref", refToUse, {
                    expires: 30,
                    path: "/",
                    sameSite: "lax",
                    secure: window.location.protocol === "https:",
                });
            }

            await verifyOTP(otpCode, refToUse);
            router.push(`/checkout?quantity=${quantity}&package=${packageType}`);
        } catch (err) {
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
                    <span>{t('back')}</span>
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
                        {step === "input" ? t('title') : t('otpTitle')}
                    </h1>
                    <p className="text-gray-600">
                        {step === "input"
                            ? t('inputDesc')
                            : t('otpDesc', { identifier })}
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
                        <>
                            <PhoneEmailInput
                                mode={mode}
                                value={identifier}
                                onChange={(val) => {
                                    setIdentifier(val);
                                    if (accountExists) setAccountExists(false);
                                }}
                                onModeChange={(m) => {
                                    setMode(m);
                                    if (accountExists) setAccountExists(false);
                                }}
                                onSubmit={handleSendOTP}
                                loading={loading}
                                error={error}
                            />

                            {/* Account already exists warning */}
                            {accountExists && (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                                    {t('accountExists')}{" "}
                                    <Link
                                        href={`/login?quantity=${quantity}&package=${packageType}`}
                                        className="font-semibold text-amber-900 underline hover:text-amber-700"
                                    >
                                        {t('loginLink')}
                                    </Link>
                                    .
                                </div>
                            )}

                            {/* Referral code — REQUIRED */}
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-4 pt-4 border-t border-gray-100"
                            >
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    <Gift className="inline w-4 h-4 mr-1 text-emerald-500" />
                                    {t('refCodeLabel')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={refInput}
                                    onChange={(e) => {
                                        setRefInput(e.target.value.toLowerCase());
                                        if (refError) setRefError("");
                                    }}
                                    placeholder={t('refPlaceholder')}
                                    maxLength={20}
                                    className={`w-full border rounded-lg px-4 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                                        refError ? "border-red-400 bg-red-50" : "border-gray-300"
                                    }`}
                                />
                                {refError && (
                                    <p className="mt-1 text-xs text-red-600">{refError}</p>
                                )}
                                {/* Hint: optional helper text */}
                            </motion.div>
                        </>
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
                            {t('haveAccount')}{" "}
                            <Link
                                href={`/login?quantity=${quantity}&package=${packageType}`}
                                className="text-emerald-600 font-semibold hover:underline"
                            >
                                {t('loginNow')}
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
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                        <h3 className="font-semibold text-gray-900 mb-2">{t('yourOrder')}</h3>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{t('treeQuantity')}</span>
                            <span className="font-semibold text-gray-900">{t('treeCount', { quantity })}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-gray-600">{t('totalAmount')}</span>
                            <span className="font-semibold text-emerald-600">
                                {formatCurrency(parseInt(quantity, 10) * unitPrice, locale)}
                            </span>
                        </div>
                    </div>

                    <div className="text-center text-sm text-gray-600">
                        <p>{t('securityNote')}</p>
                        <p className="mt-1">{t('otpExpiryNote')}</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function RegisterFallback() {
    const t = useTranslations('auth.register');
    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">{t('loading')}</p>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<RegisterFallback />}>
            <RegisterContent />
        </Suspense>
    );
}
