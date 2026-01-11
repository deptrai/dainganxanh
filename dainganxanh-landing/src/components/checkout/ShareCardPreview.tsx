"use client";

import { motion } from "framer-motion";

interface ShareCardPreviewProps {
    userName: string;
    treeCount: number;
    orderCode: string;
}

export function ShareCardPreview({ userName, treeCount, orderCode }: ShareCardPreviewProps) {
    const co2Impact = treeCount * 20;
    // FIXED: Use env var for base URL instead of hardcoded domain
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://dainganxanh.com.vn');
    const refLink = `${baseUrl}/ref/${orderCode}`.replace('https://', '').replace('http://', '');

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="mx-auto max-w-md"
        >
            <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">
                Thẻ chia sẻ của bạn
            </h3>

            {/* Share Card Preview */}
            <div
                className="relative rounded-2xl overflow-hidden shadow-2xl"
                style={{
                    aspectRatio: "1200/630",
                    background: "linear-gradient(135deg, #2E8B57 0%, #1A3320 100%)",
                }}
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-6">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🌿</span>
                        <span className="text-white font-bold text-lg">Đại Ngàn Xanh</span>
                    </div>

                    {/* Main Content */}
                    <div className="text-center">
                        <p className="text-white/80 text-sm mb-1">
                            {userName || "Người hùng xanh"} đã trồng
                        </p>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-5xl md:text-6xl font-bold text-yellow-400">
                                {treeCount}
                            </span>
                            <span className="text-white text-xl">cây</span>
                        </div>
                        <p className="text-emerald-200 text-sm">
                            Giảm ~{co2Impact.toLocaleString()} kg CO₂/năm 🌍
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-end">
                        <div className="text-white/60 text-xs">
                            {refLink}
                        </div>
                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(treeCount, 5) }).map((_, i) => (
                                <span key={i} className="text-lg">🌳</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-center text-gray-500 text-sm mt-3">
                Chia sẻ để inspire bạn bè cùng tham gia!
            </p>
        </motion.div>
    );
}
