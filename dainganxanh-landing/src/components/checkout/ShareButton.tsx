"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Check, MessageCircle, Facebook } from "lucide-react";

interface ShareButtonProps {
    treeCount: number;
    orderCode: string;
    userName?: string;
}

export function ShareButton({ treeCount, orderCode, userName }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);
    const [showFallback, setShowFallback] = useState(false);
    const [shareError, setShareError] = useState<string | null>(null);

    // FIXED: Use env var for base URL instead of hardcoded domain
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://dainganxanh.com.vn');
    const shareUrl = `${baseUrl}/ref/${orderCode}`;
    const shareText = `🌳 Tôi vừa trồng ${treeCount} cây cho Mẹ Thiên Nhiên! Cùng tham gia Đại Ngàn Xanh để bảo vệ rừng Việt Nam nhé! 🌿`;
    const shareTitle = `${userName || "Tôi"} đã trồng ${treeCount} cây!`;

    const handleShare = async () => {
        setShareError(null);
        // Check if Web Share API is available
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
            } catch (error) {
                // User cancelled or share failed
                if ((error as Error).name !== "AbortError") {
                    // FIXED: Show error message to user
                    setShareError("Không thể chia sẻ. Vui lòng thử lại hoặc sử dụng các tùy chọn bên dưới.");
                    setShowFallback(true);
                }
            }
        } else {
            // Fallback for browsers without Web Share API
            setShowFallback(true);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            // FIXED: Show error to user instead of just console.error
            setShareError("Không thể sao chép. Vui lòng thử lại.");
            setTimeout(() => setShareError(null), 3000);
        }
    };

    const shareToFacebook = () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(facebookUrl, "_blank", "width=600,height=400");
    };

    const shareToZalo = () => {
        const zaloUrl = `https://zalo.me/share?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
        window.open(zaloUrl, "_blank");
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5 }}
            className="mt-6"
        >
            {/* Main Share Button */}
            <button
                onClick={handleShare}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
            >
                <Share2 className="w-5 h-5" />
                <span>Chia sẻ thành tựu</span>
            </button>

            {/* Error Message */}
            {shareError && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-center text-red-600 text-sm"
                >
                    ⚠️ {shareError}
                </motion.p>
            )}

            {/* Fallback Share Options */}
            {showFallback && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 p-4 bg-gray-50 rounded-xl"
                >
                    <p className="text-sm text-gray-600 mb-3 text-center">
                        Chia sẻ qua:
                    </p>
                    <div className="flex justify-center gap-3">
                        {/* Facebook */}
                        <button
                            onClick={shareToFacebook}
                            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                            aria-label="Chia sẻ lên Facebook"
                        >
                            <Facebook className="w-5 h-5" />
                        </button>

                        {/* Zalo */}
                        <button
                            onClick={shareToZalo}
                            className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                            aria-label="Chia sẻ lên Zalo"
                        >
                            <MessageCircle className="w-5 h-5" />
                        </button>

                        {/* Copy Link */}
                        <button
                            onClick={copyToClipboard}
                            className="p-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
                            aria-label="Sao chép link"
                        >
                            {copied ? (
                                <Check className="w-5 h-5" />
                            ) : (
                                <Copy className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    {copied && (
                        <p className="text-center text-emerald-600 text-sm mt-2">
                            ✓ Đã sao chép!
                        </p>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
}
