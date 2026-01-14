"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Check, MessageCircle, Facebook, Mail, Twitter, Linkedin } from "lucide-react";
import { getShareMessage, ShareContext, ShareMessageData } from "@/lib/shareMessages";
import { trackShareInitiated, trackShareCompleted, ShareSource } from "@/lib/analytics/tracking";

interface ShareButtonProps {
    context: ShareContext;
    data: ShareMessageData;
    source?: ShareSource;
    className?: string;
    onShareComplete?: (method: string) => void;
}

export function ShareButton({ context, data, source = 'success_screen', className = "", onShareComplete }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);
    const [showFallback, setShowFallback] = useState(false);
    const [shareError, setShareError] = useState<string | null>(null);

    const shareMessage = getShareMessage(context, data);

    const handleShare = async () => {
        setShareError(null);

        // Simple mobile detection to prefer custom UI on desktop
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Check if Web Share API is available AND request is from mobile
        if (navigator.share && isMobile) {
            // Track share initiated
            trackShareInitiated({
                source,
                method: 'native',
                trees: data.trees,
                refCode: data.refCode,
                context,
            });

            try {
                await navigator.share({
                    title: shareMessage.title,
                    text: shareMessage.text,
                    url: shareMessage.url,
                });

                // Track completion
                trackShareCompleted({
                    source,
                    method: 'native',
                    trees: data.trees,
                    refCode: data.refCode,
                    context,
                });

                onShareComplete?.('native');
            } catch (error) {
                // User cancelled or share failed
                if ((error as Error).name !== "AbortError") {
                    setShareError("Không thể chia sẻ. Vui lòng thử lại hoặc sao chép link.");
                    // Fallback to custom UI on error
                    setShowFallback(true);
                }
            }
        } else {
            // Desktop or no Web Share API -> Show Custom Switch
            // Toggle fallback UI
            setShowFallback((prev) => {
                // If we are about to show the fallback UI, track the initiation
                if (!prev) {
                    trackShareInitiated({
                        source,
                        method: 'custom_ui',
                        trees: data.trees,
                        refCode: data.refCode,
                        context,
                    });
                }
                return !prev;
            });
        }
    };

    const copyToClipboard = async () => {
        trackShareInitiated({
            source,
            method: 'copy',
            trees: data.trees,
            refCode: data.refCode,
            context,
        });

        try {
            await navigator.clipboard.writeText(`${shareMessage.text}\n\n${shareMessage.url}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);

            trackShareCompleted({
                source,
                method: 'copy',
                trees: data.trees,
                refCode: data.refCode,
                context,
            });

            onShareComplete?.('copy');
        } catch (error) {
            setShareError("Không thể sao chép. Vui lòng thử lại.");
            setTimeout(() => setShareError(null), 3000);
        }
    };

    const shareToFacebook = () => {
        trackShareInitiated({
            source,
            method: 'facebook',
            trees: data.trees,
            refCode: data.refCode,
            context,
        });

        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareMessage.url)}&quote=${encodeURIComponent(shareMessage.text)}`;
        window.open(facebookUrl, "_blank", "width=600,height=400");

        trackShareCompleted({
            source,
            method: 'facebook',
            trees: data.trees,
            refCode: data.refCode,
            context,
        });

        onShareComplete?.('facebook');
    };

    const shareToZalo = () => {
        trackShareInitiated({
            source,
            method: 'zalo',
            trees: data.trees,
            refCode: data.refCode,
            context,
        });

        const zaloUrl = `https://zalo.me/share?url=${encodeURIComponent(shareMessage.url)}&title=${encodeURIComponent(shareMessage.text)}`;
        window.open(zaloUrl, "_blank");

        trackShareCompleted({
            source,
            method: 'zalo',
            trees: data.trees,
            refCode: data.refCode,
            context,
        });

        onShareComplete?.('zalo');
    };

    const shareToTwitter = () => {
        trackShareInitiated({
            source,
            method: 'twitter',
            trees: data.trees,
            refCode: data.refCode,
            context,
        });

        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage.text)}&url=${encodeURIComponent(shareMessage.url)}`;
        window.open(twitterUrl, "_blank", "width=600,height=400");

        trackShareCompleted({
            source,
            method: 'twitter',
            trees: data.trees,
            refCode: data.refCode,
            context,
        });

        onShareComplete?.('twitter');
    };

    const shareToLinkedIn = () => {
        trackShareInitiated({
            source,
            method: 'linkedin',
            trees: data.trees,
            refCode: data.refCode,
            context,
        });

        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareMessage.url)}`;
        window.open(linkedInUrl, "_blank", "width=600,height=400");

        trackShareCompleted({
            source,
            method: 'linkedin',
            trees: data.trees,
            refCode: data.refCode,
            context,
        });

        onShareComplete?.('linkedin');
    };

    const shareViaEmail = () => {
        trackShareInitiated({
            source,
            method: 'email',
            trees: data.trees,
            refCode: data.refCode,
            context,
        });

        const subject = encodeURIComponent(shareMessage.title);
        const body = encodeURIComponent(`${shareMessage.text}\n\n${shareMessage.url}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;

        trackShareCompleted({
            source,
            method: 'email',
            trees: data.trees,
            refCode: data.refCode,
            context,
        });

        onShareComplete?.('email');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={className}
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
                    <div className="grid grid-cols-4 gap-3 mb-3">
                        {/* Facebook */}
                        <button
                            onClick={shareToFacebook}
                            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center"
                            aria-label="Chia sẻ lên Facebook"
                        >
                            <Facebook className="w-5 h-5" />
                        </button>

                        {/* Zalo */}
                        <button
                            onClick={shareToZalo}
                            className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center justify-center"
                            aria-label="Chia sẻ lên Zalo"
                        >
                            <MessageCircle className="w-5 h-5" />
                        </button>

                        {/* Twitter */}
                        <button
                            onClick={shareToTwitter}
                            className="p-3 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors flex items-center justify-center"
                            aria-label="Chia sẻ lên Twitter"
                        >
                            <Twitter className="w-5 h-5" />
                        </button>

                        {/* LinkedIn */}
                        <button
                            onClick={shareToLinkedIn}
                            className="p-3 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors flex items-center justify-center"
                            aria-label="Chia sẻ lên LinkedIn"
                        >
                            <Linkedin className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Email */}
                        <button
                            onClick={shareViaEmail}
                            className="p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                            aria-label="Chia sẻ qua Email"
                        >
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">Email</span>
                        </button>

                        {/* Copy Link */}
                        <button
                            onClick={copyToClipboard}
                            className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                            aria-label="Sao chép link"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span className="text-sm">Đã copy!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span className="text-sm">Copy link</span>
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
