"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Copy, Check, Building2, Loader2, CheckCircle2, Clock } from "lucide-react";
import Cookies from "js-cookie";
import { createBrowserClient } from "@/lib/supabase/client";

interface BankingPaymentProps {
    orderCode: string;
    amount: number;
}

const BANK_INFO = {
    bank: process.env.NEXT_PUBLIC_BANK_NAME || "MB Bank",
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT || "771368999999",
    accountName: process.env.NEXT_PUBLIC_BANK_HOLDER || "CTY CP BIOCARE",
    branch: process.env.NEXT_PUBLIC_BANK_BRANCH || "TP HCM",
};

const POLL_INTERVAL = 5000; // 5 seconds
const POLL_TIMEOUT = 30 * 60 * 1000; // 30 minutes max

export function BankingPayment({ orderCode, amount }: BankingPaymentProps) {
    const router = useRouter();
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<"waiting" | "confirmed" | "error">("waiting");
    const [pendingCreated, setPendingCreated] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    // Pre-create pending order
    useEffect(() => {
        if (!orderCode || !amount) return;

        const createPendingOrder = async () => {
            try {
                const supabase = createBrowserClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const userName = user.user_metadata?.full_name || user.email?.split("@")[0];
                const DEFAULT_REF_CODE = "DNG895075";
                const refCookie = Cookies.get("ref") || DEFAULT_REF_CODE;
                let referredBy = null;

                const { data: referrer } = await supabase
                    .from("users")
                    .select("id")
                    .eq("referral_code", refCookie)
                    .single();
                if (referrer) referredBy = referrer.id;

                await fetch("/api/orders/pending", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        code: orderCode,
                        user_email: user.email,
                        user_name: userName,
                        quantity: Math.round(amount / 260000),
                        total_amount: amount,
                        payment_method: "banking",
                        referred_by: referredBy,
                    }),
                });
                setPendingCreated(true);
            } catch (err) {
                console.error("[pending-order] pre-create failed:", err);
                setPendingCreated(true); // Still allow polling even if pre-create fails
            }
        };

        createPendingOrder();
    }, [orderCode, amount]);

    // Poll order status
    const pollStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/orders/status?code=${orderCode}`);
            if (!res.ok) return;
            const data = await res.json();
            if (data.status === "completed") {
                setPaymentStatus("confirmed");
                // Stop polling
                if (pollRef.current) clearInterval(pollRef.current);
                if (timerRef.current) clearInterval(timerRef.current);

                // Get user info for redirect
                const supabase = createBrowserClient();
                const { data: { user } } = await supabase.auth.getUser();
                const quantity = Math.round(amount / 260000);
                const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";

                // Redirect after short delay for UX
                setTimeout(() => {
                    router.push(
                        `/checkout/success?orderCode=${orderCode}&quantity=${quantity}&name=${encodeURIComponent(userName)}`
                    );
                }, 2000);
            }
        } catch {
            // Silent fail — polling should not break UX
        }
    }, [orderCode, amount, router]);

    // Start polling when pending order is created
    useEffect(() => {
        if (!pendingCreated || !orderCode) return;

        startTimeRef.current = Date.now();

        // Poll every 5s
        pollRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            if (elapsed > POLL_TIMEOUT) {
                if (pollRef.current) clearInterval(pollRef.current);
                if (timerRef.current) clearInterval(timerRef.current);
                return;
            }
            pollStatus();
        }, POLL_INTERVAL);

        // Update elapsed timer every second
        timerRef.current = setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [pendingCreated, orderCode, pollStatus]);

    // Generate VietQR URL
    useEffect(() => {
        if (orderCode && amount) {
            const vietQRUrl = `https://img.vietqr.io/image/MB-${BANK_INFO.accountNumber}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(orderCode)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`;
            setQrCodeUrl(vietQRUrl);
        }
    }, [orderCode, amount]);

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    };

    const CopyButton = ({ text, field, label }: { text: string; field: string; label: string }) => {
        const isCopied = copiedField === field;
        return (
            <button
                onClick={() => copyToClipboard(text, field)}
                className="p-2 rounded-lg hover:bg-emerald-100 transition-colors"
                title={`Sao chép ${label}`}
                aria-label={`Sao chép ${label}`}
                aria-pressed={isCopied}
            >
                {isCopied ? (
                    <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                ) : (
                    <Copy className="w-4 h-4 text-gray-600" aria-hidden="true" />
                )}
                <span className="sr-only">{isCopied ? "Đã sao chép" : "Sao chép"}</span>
            </button>
        );
    };

    const formatElapsed = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m} phút ${s.toString().padStart(2, "0")} giây` : `${s} giây`;
    };

    // Payment confirmed state
    if (paymentStatus === "confirmed") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 bg-emerald-50 rounded-2xl p-8 shadow-xl border-2 border-emerald-300 text-center"
            >
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-emerald-900 mb-2">
                    Thanh toán thành công!
                </h3>
                <p className="text-emerald-700">
                    Đang chuyển hướng đến trang xác nhận...
                </p>
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto mt-4" />
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 bg-white rounded-2xl p-6 shadow-xl border border-emerald-100"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                    Thông tin chuyển khoản
                </h3>
            </div>

            {/* QR Code */}
            {qrCodeUrl && (
                <div className="mb-6 flex justify-center">
                    <div className="bg-white p-4 rounded-xl border-2 border-emerald-200">
                        <img
                            src={qrCodeUrl}
                            alt="QR Code thanh toan"
                            className="w-48 h-48"
                        />
                        <p className="text-center text-sm text-gray-600 mt-2">
                            Quét mã QR để thanh toán
                        </p>
                    </div>
                </div>
            )}

            {/* Bank Details */}
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p className="text-sm text-gray-600">Ngân hàng</p>
                        <p className="font-semibold text-gray-900">{BANK_INFO.bank}</p>
                    </div>
                    <CopyButton text={BANK_INFO.bank} field="bank" label="ngan hang" />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p className="text-sm text-gray-600">Số tài khoản</p>
                        <p className="font-mono font-semibold text-gray-900">{BANK_INFO.accountNumber}</p>
                    </div>
                    <CopyButton text={BANK_INFO.accountNumber} field="account" label="so tai khoan" />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p className="text-sm text-gray-600">Chủ tài khoản</p>
                        <p className="font-semibold text-gray-900">{BANK_INFO.accountName}</p>
                    </div>
                    <CopyButton text={BANK_INFO.accountName} field="name" label="chu tai khoan" />
                </div>

                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div>
                        <p className="text-sm text-emerald-700 font-semibold">Nội dung chuyển khoản</p>
                        <p className="font-mono font-bold text-emerald-900">{orderCode}</p>
                    </div>
                    <CopyButton text={orderCode} field="orderCode" label="noi dung chuyen khoan" />
                </div>

                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div>
                        <p className="text-sm text-emerald-700 font-semibold">Số tiền</p>
                        <p className="font-bold text-emerald-900 text-lg">{amount.toLocaleString("vi-VN")} VND</p>
                    </div>
                    <CopyButton text={amount.toString()} field="amount" label="so tien" />
                </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Hướng dẫn:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Mở ứng dụng ngân hàng của bạn</li>
                    <li>Quét mã QR hoặc nhập thông tin tài khoản</li>
                    <li><strong>Quan trọng:</strong> Nhập đúng nội dung chuyển khoản: <span className="font-mono font-bold">{orderCode}</span></li>
                    <li>Xác nhận chuyển khoản</li>
                    <li>Hệ thống sẽ tự động xác nhận trong vòng 1-5 phút</li>
                </ol>
            </div>

            {/* Waiting Status */}
            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Clock className="w-6 h-6 text-amber-600" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-amber-900">
                            Đang chờ xác nhận thanh toán...
                        </p>
                        <p className="text-sm text-amber-700">
                            Hệ thống tự động xác nhận khi nhận được chuyển khoản ({formatElapsed(elapsedSeconds)})
                        </p>
                    </div>
                    <Loader2 className="w-5 h-5 animate-spin text-amber-600 flex-shrink-0" />
                </div>
            </div>
        </motion.div>
    );
}
