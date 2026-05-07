"use client";

import { useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { devBypassOTP } from "@/actions/dev-auth";
import { ensureUserProfile } from "@/actions/ensureUserProfile";

type AuthMode = "phone" | "email";
type OTPStep = "input" | "verify";

interface UseAuthReturn {
    mode: AuthMode;
    step: OTPStep;
    identifier: string;
    loading: boolean;
    error: string | null;
    countdown: number;
    canResend: boolean;
    setMode: (mode: AuthMode) => void;
    setIdentifier: (value: string) => void;
    sendOTP: () => Promise<void>;
    verifyOTP: (code: string, referralCode?: string) => Promise<void>;
    resendOTP: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    const [mode, setMode] = useState<AuthMode>("email");
    const [step, setStep] = useState<OTPStep>("input");
    const [identifier, setIdentifier] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0);

    const canResend = countdown === 0 && step === "verify";

    const sendOTP = useCallback(async () => {
        setLoading(true);
        setError(null);
        const supabase = createBrowserClient();

        try {
            const { error: otpError } = await supabase.auth.signInWithOtp(
                mode === "phone"
                    ? { phone: identifier, options: { shouldCreateUser: true } }
                    : { email: identifier, options: { shouldCreateUser: true } }
            );

            if (otpError) {
                throw otpError;
            }

            setStep("verify");
            setCountdown(30); // 30 second cooldown

            // Start countdown
            const interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err) {
            console.error("Send OTP error:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Không thể gửi OTP. Vui lòng thử lại."
            );
        } finally {
            setLoading(false);
        }
    }, [mode, identifier]);

    const verifyOTP = useCallback(async (code: string, referralCode?: string) => {
        setLoading(true);
        setError(null);
        const supabase = createBrowserClient();

        try {
            // DEV BYPASS: Accept "123456" as universal test OTP (development only)
            if (process.env.NODE_ENV === "development" && code === "123456") {
                console.warn("⚠️ DEV BYPASS: Using test OTP");
                const result = await devBypassOTP(identifier, mode, code);

                if (result.error) {
                    throw new Error(result.error);
                }

                if (result.emailOtp) {
                    const email = mode === "email" ? identifier : `${identifier.replace(/\+/g, "")}@phone.dev`;
                    const { data: bypassData, error: bypassError } = await supabase.auth.verifyOtp({
                        email,
                        token: result.emailOtp,
                        type: "email",
                    });

                    if (bypassError) throw bypassError;
                    if (!bypassData.session) throw new Error("Không thể tạo phiên đăng nhập");

                    await supabase.auth.setSession({
                        access_token: bypassData.session.access_token,
                        refresh_token: bypassData.session.refresh_token,
                    });

                    if (bypassData.user) {
                        await ensureUserProfile(bypassData.user.id, bypassData.user.email ?? email, bypassData.user.phone, referralCode).catch(() => {});
                    }

                    console.log("DEV BYPASS: Session created successfully");
                    return;
                }
            }

            const verifyParams = mode === "phone"
                ? { phone: identifier, token: code, type: "sms" as const }
                : { email: identifier, token: code, type: "email" as const };

            const { data, error: verifyError } = await supabase.auth.verifyOtp(verifyParams);

            if (verifyError) {
                throw verifyError;
            }

            if (!data.session) {
                throw new Error("Không thể tạo phiên đăng nhập");
            }

            await supabase.auth.setSession({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
            });

            const { data: { session: savedSession } } = await supabase.auth.getSession();
            if (!savedSession) {
                throw new Error("Session không được lưu. Vui lòng thử lại.");
            }

            if (data.user) {
                await ensureUserProfile(data.user.id, data.user.email ?? identifier, data.user.phone, referralCode).catch(() => {});
            }

            console.log("OTP verified successfully, session persisted", savedSession);
        } catch (err) {
            console.error("Verify OTP error:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Mã OTP không hợp lệ hoặc đã hết hạn"
            );
            throw err;
        } finally {
            setLoading(false);
        }
    }, [mode, identifier]);;

    const resendOTP = useCallback(async () => {
        if (!canResend) return;
        await sendOTP();
    }, [canResend, sendOTP]);

    return {
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
    };
}
