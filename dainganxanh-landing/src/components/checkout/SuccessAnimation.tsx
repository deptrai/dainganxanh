"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

interface SuccessAnimationProps {
    treeCount: number;
}

export function SuccessAnimation({ treeCount }: SuccessAnimationProps) {
    const hasPlayedConfetti = useRef(false);

    useEffect(() => {
        if (hasPlayedConfetti.current) return;
        hasPlayedConfetti.current = true;

        // Fire confetti from both sides
        const duration = 3000;
        const end = Date.now() + duration;

        const colors = ["#2E8B57", "#1A3320", "#FFD700", "#90EE90"];

        (function frame() {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.7 },
                colors: colors,
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.7 },
                colors: colors,
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        })();
    }, []);

    return (
        <div className="text-center py-8">
            {/* Celebration Emoji */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.3,
                }}
                className="text-7xl mb-4"
                aria-label="Chúc mừng! Thanh toán thành công"
                role="img"
            >
                🎉
            </motion.div>

            {/* Tree Growing Animation */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 150,
                    damping: 12,
                    delay: 0.8,
                }}
                className="flex justify-center gap-2 my-6"
            >
                {Array.from({ length: Math.min(treeCount, 10) }).map((_, i) => (
                    <motion.span
                        key={i}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{
                            delay: 1 + i * 0.1,
                            duration: 0.5,
                            type: "spring",
                        }}
                        className="text-4xl"
                    >
                        🌳
                    </motion.span>
                ))}
                {treeCount > 10 && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="text-2xl text-emerald-600 font-bold self-center"
                    >
                        +{treeCount - 10}
                    </motion.span>
                )}
            </motion.div>

            {/* Typewriter Effect Text */}
            <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-3xl md:text-4xl font-bold text-emerald-700 mb-2"
            >
                <TypewriterText text="🌱 Cây đang được gieo mầm..." />
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.5 }}
                className="text-gray-600 text-lg"
            >
                Cảm ơn bạn đã chung tay bảo vệ Mẹ Thiên Nhiên!
            </motion.p>
        </div>
    );
}

function TypewriterText({ text }: { text: string }) {
    // Use [...text] instead of text.split("") to correctly handle Unicode/emoji characters
    const chars = [...text];
    return (
        <motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            suppressHydrationWarning
        >
            {chars.map((char, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                        delay: 1.5 + i * 0.05,
                        duration: 0.1,
                    }}
                    suppressHydrationWarning
                >
                    {char}
                </motion.span>
            ))}
        </motion.span>
    );
}
