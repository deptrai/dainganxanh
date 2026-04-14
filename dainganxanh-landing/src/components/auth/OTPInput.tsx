"use client";

import { useRef, useState, KeyboardEvent, ClipboardEvent, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OTPInputProps {
    length?: number;
    onComplete: (code: string) => void;
    onResend: () => void;
    countdown: number;
    canResend: boolean;
    loading?: boolean;
    error?: string | null;
    className?: string;
}

export function OTPInput({
    length = 6,
    onComplete,
    onResend,
    countdown,
    canResend,
    loading = false,
    error = null,
    className,
}: OTPInputProps) {
    const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when complete
        if (newOtp.every((digit) => digit !== "") && !loading) {
            onComplete(newOtp.join(""));
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        // Backspace: clear current and focus previous
        if (e.key === "Backspace") {
            e.preventDefault();
            const newOtp = [...otp];

            if (otp[index]) {
                newOtp[index] = "";
                setOtp(newOtp);
            } else if (index > 0) {
                newOtp[index - 1] = "";
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
            }
        }

        // Arrow keys navigation
        if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === "ArrowRight" && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text/plain").slice(0, length);

        // Only allow digits
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = pastedData.split("").concat(Array(length).fill("")).slice(0, length);
        setOtp(newOtp);

        // Focus last filled input
        const lastFilledIndex = Math.min(pastedData.length, length - 1);
        inputRefs.current[lastFilledIndex]?.focus();

        // Auto-submit if complete
        if (pastedData.length === length && !loading) {
            onComplete(pastedData);
        }
    };

    return (
        <div className={cn("space-y-6", className)}>
            {/* OTP Input Boxes */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Nhập mã OTP (6 chữ số)
                </label>
                <div className="grid grid-cols-6 gap-2 sm:gap-3">
                    {otp.map((digit, index) => (
                        <motion.input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            disabled={loading}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                                "w-9 h-9 sm:w-11 sm:h-11 text-center text-lg sm:text-xl font-bold rounded-xl",
                                "border-2 transition-all",
                                "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                                error
                                    ? "border-red-300 bg-red-50 text-red-900"
                                    : digit
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                                        : "border-gray-200 hover:border-emerald-300",
                                loading && "opacity-50 cursor-not-allowed"
                            )}
                            aria-label={`Digit ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 text-sm text-red-600 text-center flex items-center justify-center gap-1"
                        role="alert"
                    >
                        <span className="font-medium">⚠</span>
                        <span>{error}</span>
                    </motion.p>
                )}
            </div>

            {/* Resend Button */}
            <div className="text-center">
                {countdown > 0 ? (
                    <p className="text-sm text-gray-600">
                        Gửi lại mã sau <span className="font-semibold text-emerald-600">{countdown}s</span>
                    </p>
                ) : (
                    <button
                        type="button"
                        onClick={onResend}
                        disabled={!canResend || loading}
                        className={cn(
                            "text-sm font-medium transition-colors",
                            canResend && !loading
                                ? "text-emerald-600 hover:text-emerald-700 underline"
                                : "text-gray-400 cursor-not-allowed"
                        )}
                    >
                        Gửi lại mã OTP
                    </button>
                )}
            </div>

            {/* Loading Indicator */}
            {loading && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <span>Đang xác thực...</span>
                </div>
            )}
        </div>
    );
}
