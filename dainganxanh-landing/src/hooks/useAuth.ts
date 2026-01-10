"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

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
    verifyOTP: (code: string) => Promise<void>;
    resendOTP: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    const [mode, setMode] = useState<AuthMode>("phone");
    const [step, setStep] = useState<OTPStep>("input");
    const [identifier, setIdentifier] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0);

    const canResend = countdown === 0 && step === "verify";

    const sendOTP = useCallback(async () => {
        setLoading(true);
        setError(null);

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

    const verifyOTP = useCallback(async (code: string) => {
        setLoading(true);
        setError(null);

        try {
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

            // Success - session created, user profile auto-created by trigger
            console.log("OTP verified successfully", data);
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
    }, [mode, identifier]);

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
