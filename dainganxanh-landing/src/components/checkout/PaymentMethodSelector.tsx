"use client";

import { motion } from "framer-motion";
import { Banknote, Wallet } from "lucide-react";

interface PaymentMethodSelectorProps {
    selected: "banking" | "usdt";
    onChange: (method: "banking" | "usdt") => void;
}

export function PaymentMethodSelector({ selected, onChange }: PaymentMethodSelectorProps) {
    const methods = [
        {
            id: "banking" as const,
            name: "Chuyển khoản ngân hàng",
            description: "Nhanh chóng, an toàn",
            icon: Banknote,
            available: true,
        },
        {
            id: "usdt" as const,
            name: "USDT (Crypto)",
            description: "Đang phát triển",
            icon: Wallet,
            available: false,
        },
    ];

    return (
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-emerald-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
                Phương thức thanh toán
            </h2>

            <div className="space-y-3">
                {methods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = selected === method.id;
                    const isDisabled = !method.available;

                    return (
                        <motion.button
                            key={method.id}
                            whileHover={!isDisabled ? { scale: 1.02 } : {}}
                            whileTap={!isDisabled ? { scale: 0.98 } : {}}
                            onClick={() => !isDisabled && onChange(method.id)}
                            disabled={isDisabled}
                            className={`
                                w-full p-4 rounded-xl border-2 transition-all text-left
                                ${isSelected
                                    ? "border-emerald-500 bg-emerald-50"
                                    : isDisabled
                                        ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                                        : "border-gray-200 hover:border-emerald-300"
                                }
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center
                                    ${isSelected
                                        ? "bg-emerald-500 text-white"
                                        : isDisabled
                                            ? "bg-gray-300 text-gray-500"
                                            : "bg-gray-200 text-gray-600"
                                    }
                                `}>
                                    <Icon className="w-6 h-6" />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className={`font-semibold ${isSelected ? "text-emerald-900" : "text-gray-900"}`}>
                                            {method.name}
                                        </h3>
                                        {!method.available && (
                                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                                Sắp ra mắt
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-sm ${isSelected ? "text-emerald-700" : "text-gray-600"}`}>
                                        {method.description}
                                    </p>
                                </div>

                                {isSelected && (
                                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
