"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthMode = "phone" | "email";

interface PhoneEmailInputProps {
    mode: AuthMode;
    value: string;
    onChange: (value: string) => void;
    onModeChange: (mode: AuthMode) => void;
    onSubmit: () => void;
    loading?: boolean;
    error?: string | null;
    className?: string;
}

export function PhoneEmailInput({
    mode,
    value,
    onChange,
    onModeChange,
    onSubmit,
    loading = false,
    error = null,
    className,
}: PhoneEmailInputProps) {
    const [validationError, setValidationError] = useState<string | null>(null);

    const validatePhone = (phone: string): boolean => {
        // Vietnam phone format: 0xxx-xxx-xxx or +84xxx-xxx-xxx
        const phoneRegex = /^(0|\+84)[0-9]{9}$/;
        return phoneRegex.test(phone.replace(/[-\s]/g, ""));
    };

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = () => {
        setValidationError(null);

        if (mode === "phone") {
            if (!validatePhone(value)) {
                setValidationError("Số điện thoại không hợp lệ (VD: 0912345678)");
                return;
            }
        } else {
            if (!validateEmail(value)) {
                setValidationError("Email không hợp lệ");
                return;
            }
        }

        onSubmit();
    };

    const displayError = error || validationError;

    return (
        <div className={cn("space-y-4", className)}>
            {/* Mode Toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                    type="button"
                    onClick={() => onModeChange("phone")}
                    className={cn(
                        "flex-1 py-2 px-4 rounded-lg font-medium transition-all",
                        "flex items-center justify-center gap-2",
                        mode === "phone"
                            ? "bg-white text-emerald-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                    )}
                >
                    <Phone className="w-4 h-4" />
                    <span>Số điện thoại</span>
                </button>
                <button
                    type="button"
                    onClick={() => onModeChange("email")}
                    className={cn(
                        "flex-1 py-2 px-4 rounded-lg font-medium transition-all",
                        "flex items-center justify-center gap-2",
                        mode === "email"
                            ? "bg-white text-emerald-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                    )}
                >
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                </button>
            </div>

            {/* Input Field */}
            <div className="space-y-2">
                <label htmlFor="identifier-input" className="block text-sm font-semibold text-gray-700">
                    {mode === "phone" ? "Số điện thoại" : "Địa chỉ email"}
                </label>
                <input
                    id="identifier-input"
                    type={mode === "phone" ? "tel" : "email"}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setValidationError(null);
                    }}
                    placeholder={mode === "phone" ? "0912345678" : "email@example.com"}
                    className={cn(
                        "w-full px-4 py-3 rounded-xl border-2 transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                        displayError
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200 hover:border-emerald-300"
                    )}
                    disabled={loading}
                    aria-invalid={!!displayError}
                    aria-describedby={displayError ? "identifier-error" : undefined}
                />

                {/* Error Message */}
                {displayError && (
                    <motion.p
                        id="identifier-error"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-600 flex items-center gap-1"
                        role="alert"
                    >
                        <span className="font-medium">⚠</span>
                        <span>{displayError}</span>
                    </motion.p>
                )}

                {/* Helper Text */}
                {!displayError && (
                    <p className="text-sm text-gray-500">
                        {mode === "phone"
                            ? "Nhập số điện thoại để nhận mã OTP qua SMS"
                            : "Nhập email để nhận mã OTP"}
                    </p>
                )}
            </div>

            {/* Submit Button */}
            <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !value}
                whileHover={!loading && value ? { scale: 1.02 } : {}}
                whileTap={!loading && value ? { scale: 0.98 } : {}}
                className={cn(
                    "w-full py-4 px-6 rounded-xl font-semibold text-white",
                    "shadow-lg transition-all duration-300",
                    "flex items-center justify-center gap-2",
                    loading || !value
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 hover:shadow-xl"
                )}
            >
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang gửi...</span>
                    </>
                ) : (
                    <span>Gửi mã OTP</span>
                )}
            </motion.button>
        </div>
    );
}
