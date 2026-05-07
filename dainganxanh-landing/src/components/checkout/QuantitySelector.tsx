"use client";

import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
    quantity: number;
    onIncrement: () => void;
    onDecrement: () => void;
    onInputChange: (value: string) => void;
    error: string | null;
    min?: number;
    max?: number;
    className?: string;
}

export function QuantitySelector({
    quantity,
    onIncrement,
    onDecrement,
    onInputChange,
    error,
    min = 1,
    max = 1000000,
    className,
}: QuantitySelectorProps) {
    const isMinReached = quantity <= min;
    const isMaxReached = quantity >= max;

    return (
        <div className={cn("space-y-3", className)}>
            {/* Label */}
            <label htmlFor="quantity-input" className="block text-sm font-semibold text-gray-700">
                Số lượng cây muốn trồng
            </label>

            {/* Input Group */}
            <div className="flex items-center gap-3">
                {/* Decrement Button */}
                <motion.button
                    type="button"
                    aria-label="Giảm số lượng"
                    onClick={onDecrement}
                    disabled={isMinReached}
                    whileHover={!isMinReached ? { scale: 1.05 } : {}}
                    whileTap={!isMinReached ? { scale: 0.95 } : {}}
                    className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                        "border-2 shadow-sm",
                        isMinReached
                            ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
                            : "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
                    )}
                >
                    <Minus className="w-5 h-5" />
                </motion.button>

                {/* Number Input */}
                <div className="flex-1 relative">
                    <input
                        id="quantity-input"
                        type="number"
                        step="1"
                        value={quantity}
                        onChange={(e) => onInputChange(e.target.value)}
                        min={min}
                        max={max}
                        className={cn(
                            "w-full px-4 py-3 text-center text-2xl font-bold rounded-xl",
                            "border-2 transition-all",
                            "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                            error
                                ? "border-red-300 bg-red-50 text-red-900"
                                : "border-emerald-200 bg-white text-gray-900 hover:border-emerald-300"
                        )}
                        aria-invalid={!!error}
                        aria-describedby={error ? "quantity-error" : undefined}
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <span className="text-sm text-gray-500">cây</span>
                    </div>
                </div>

                {/* Increment Button */}
                <motion.button
                    type="button"
                    aria-label="Tăng số lượng"
                    onClick={onIncrement}
                    disabled={isMaxReached}
                    whileHover={!isMaxReached ? { scale: 1.05 } : {}}
                    whileTap={!isMaxReached ? { scale: 0.95 } : {}}
                    className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                        "border-2 shadow-sm",
                        isMaxReached
                            ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
                            : "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
                    )}
                >
                    <Plus className="w-5 h-5" />
                </motion.button>
            </div>

            {/* Helper Text / Error */}
            <div className="min-h-[20px]">
                {error ? (
                    <motion.p
                        id="quantity-error"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-600 flex items-center gap-1"
                        role="alert"
                    >
                        <span className="font-medium">⚠</span>
                        <span>{error}</span>
                    </motion.p>
                ) : (
                    <p className="text-sm text-gray-500">
                        Tối thiểu {min.toLocaleString('vi-VN')} - Tối đa {max.toLocaleString('vi-VN')} cây
                    </p>
                )}
            </div>
        </div>
    );
}
