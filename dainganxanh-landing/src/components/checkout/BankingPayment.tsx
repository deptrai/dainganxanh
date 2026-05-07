"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Copy, Check, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

interface BankingPaymentProps {
    orderCode: string;
    amount: number;
    quantity: number;
    onCancel?: () => void;
    cancelling?: boolean;
    cancelError?: string;
}

const BANK_INFO = {
    bank: process.env.NEXT_PUBLIC_BANK_NAME || "MB Bank",
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT || "796333999",
    accountName: process.env.NEXT_PUBLIC_BANK_HOLDER || "CONG TY CO PHAN DAI NGAN XANH GROUP",
};

const POLL_INTERVAL = 5000;
const POLL_TIMEOUT = 30 * 60 * 1000;

export function BankingPayment({ orderCode, amount, quantity, onCancel, cancelling, cancelError }: BankingPaymentProps) {
    const router = useRouter();
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<"waiting" | "confirmed" | "error">("waiting");
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [claimingPayment, setClaimingPayment] = useState(false);
    const [claimError, setClaimError] = useState("");
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(Date.now());


    // Poll order status
    const pollStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/orders/status?code=${orderCode}`);
            if (!res.ok) return;
            const data = await res.json();
            if (data.status === "completed") {
                setPaymentStatus("confirmed");
                if (pollRef.current) clearInterval(pollRef.current);
                if (timerRef.current) clearInterval(timerRef.current);

                const supabase = createBrowserClient();
                const { data: { user } } = await supabase.auth.getUser();
                const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";

                setTimeout(() => {
                    router.push(
                        `/checkout/success?orderCode=${orderCode}&quantity=${quantity}&amount=${amount}&name=${encodeURIComponent(userName)}`
                    );
                }, 2000);
            }
        } catch {
            // Silent fail
        }
    }, [orderCode, amount, router]);

    useEffect(() => {
        if (!orderCode) return;
        startTimeRef.current = Date.now();

        pollRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            if (elapsed > POLL_TIMEOUT) {
                if (pollRef.current) clearInterval(pollRef.current);
                if (timerRef.current) clearInterval(timerRef.current);
                return;
            }
            pollStatus();
        }, POLL_INTERVAL);

        timerRef.current = setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [orderCode, pollStatus]);

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
        } catch { /* */ }
    };

    const handleClaimPayment = async () => {
        setClaimingPayment(true);
        setClaimError("");
        try {
            const res = await fetch("/api/orders/claim-manual-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderCode }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || "Có lỗi xảy ra");
            }

            // Stop polling
            if (pollRef.current) clearInterval(pollRef.current);
            if (timerRef.current) clearInterval(timerRef.current);

            // Redirect to waiting page
            setTimeout(() => {
                router.push(
                    `/checkout/waiting?orderCode=${orderCode}&quantity=${quantity}`
                );
            }, 500);
        } catch (err) {
            setClaimError(err instanceof Error ? err.message : "Có lỗi xảy ra");
        } finally {
            setClaimingPayment(false);
        }
    };

    const CopyBtn = ({ text, field, label }: { text: string; field: string; label: string }) => (
        <button
            onClick={() => copyToClipboard(text, field)}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors shrink-0"
            title={`Sao chép ${label}`}
            aria-label={`Sao chép ${label}`}
        >
            {copiedField === field
                ? <Check className="w-3.5 h-3.5 text-emerald-600" />
                : <Copy className="w-3.5 h-3.5 text-gray-400" />
            }
        </button>
    );

    const formatElapsed = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m} phút ${s.toString().padStart(2, "0")} giây` : `${s} giây`;
    };

    if (paymentStatus === "confirmed") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 rounded-2xl p-8 shadow-xl border-2 border-emerald-300 text-center"
            >
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-emerald-900 mb-2">Thanh toán thành công!</h3>
                <p className="text-emerald-700">Đang chuyển hướng...</p>
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto mt-4" />
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden"
        >
            {/* QR Code */}
            {qrCodeUrl && (
                <div className="flex justify-center p-4 pb-2">
                    <img src={qrCodeUrl} alt="QR Code thanh toan" className="w-44 h-44 rounded-lg" />
                </div>
            )}

            {/* Compact bank info */}
            <div className="px-4 pb-3">
                <table className="w-full text-sm">
                    <tbody>
                        <tr className="border-b border-gray-100">
                            <td className="text-gray-500 py-1.5 w-28">Ngân hàng</td>
                            <td className="font-semibold py-1.5">{BANK_INFO.bank}</td>
                            <td className="w-8"><CopyBtn text={BANK_INFO.bank} field="bank" label="ngân hàng" /></td>
                        </tr>
                        <tr className="border-b border-gray-100">
                            <td className="text-gray-500 py-1.5">Số TK</td>
                            <td className="font-mono font-semibold py-1.5">{BANK_INFO.accountNumber}</td>
                            <td><CopyBtn text={BANK_INFO.accountNumber} field="account" label="số tài khoản" /></td>
                        </tr>
                        <tr className="border-b border-gray-100">
                            <td className="text-gray-500 py-1.5">Chủ TK</td>
                            <td className="font-semibold py-1.5">{BANK_INFO.accountName}</td>
                            <td><CopyBtn text={BANK_INFO.accountName} field="name" label="chủ tài khoản" /></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Highlighted: order code + amount */}
            <div className="mx-4 mb-3 grid grid-cols-2 gap-2">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase text-emerald-600 font-semibold tracking-wide">Nội dung CK</p>
                        <p className="font-mono font-bold text-emerald-900">{orderCode}</p>
                    </div>
                    <CopyBtn text={orderCode} field="orderCode" label="nội dung CK" />
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase text-emerald-600 font-semibold tracking-wide">Số tiền</p>
                        <p className="font-bold text-emerald-900">{amount.toLocaleString("vi-VN")} ₫</p>
                    </div>
                    <CopyBtn text={amount.toString()} field="amount" label="số tiền" />
                </div>
            </div>

            {/* Waiting status */}
            <div className="mx-4 mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-900">Đang chờ xác nhận thanh toán...</p>
                        <p className="text-xs text-amber-700">
                            Tự động xác nhận khi nhận CK ({formatElapsed(elapsedSeconds)})
                        </p>
                    </div>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                </div>
            </div>

            {/* Claim Payment + Cancel buttons */}
            <div className="px-4 pb-4 space-y-2">
                {claimError && (
                    <p className="text-sm text-red-600 text-center">{claimError}</p>
                )}
                {cancelError && (
                    <p className="text-sm text-red-600 text-center">{cancelError}</p>
                )}

                {/* Claim Payment Button */}
                <button
                    onClick={handleClaimPayment}
                    disabled={claimingPayment || cancelling}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {claimingPayment ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang xử lý...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-4 h-4" />
                            Đã chuyển tiền thành công
                        </>
                    )}
                </button>

                {/* Cancel Button */}
                {onCancel && (
                    <button
                        onClick={onCancel}
                        disabled={cancelling || claimingPayment}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {cancelling
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <XCircle className="w-4 h-4" />
                        }
                        Hủy đơn hàng
                    </button>
                )}
            </div>
        </motion.div>
    );
}
