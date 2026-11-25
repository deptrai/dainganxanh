"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Clock, CheckCircle, FileText, Trees, Loader2, ShoppingCart } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { CustomerIdentityForm, CustomerIdentityData } from "@/components/checkout/CustomerIdentityForm";
import { formatCurrency, formatNumber } from "@/lib/format";

const POLL_INTERVAL = 5000;

interface PendingOrder {
    code: string;
    quantity: number;
    total_amount: number;
    status: string;
    created_at: string;
}

function WaitingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('checkout');
    const locale = useLocale();

    const orderCode = searchParams.get("orderCode") || "";
    const quantity = parseInt(searchParams.get("quantity") || "1");

    const [identityDone, setIdentityDone] = useState<boolean | null>(null); // null = loading
    const [identitySubmitting, setIdentitySubmitting] = useState(false);
    const [identityError, setIdentityError] = useState("");
    const [orderStatus, setOrderStatus] = useState("manual_payment_claimed");
    const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);

    // Get total_amount from fetched order data; fallback to URL quantity * standard price
    const currentOrder = pendingOrders.find((o) => o.code === orderCode);
    const totalAmount = currentOrder ? Number(currentOrder.total_amount) : null;

    // Check identity status from server on mount
    useEffect(() => {
        if (!orderCode) return;
        fetch(`/api/orders/auto-fill-identity?orderCode=${orderCode}`)
            .then((r) => r.ok ? r.json() : null)
            .then((data) => {
                setIdentityDone(data?.hasIdentity ?? false);
            })
            .catch(() => setIdentityDone(false));
    }, [orderCode]);

    // Fetch all pending/manual_payment_claimed orders for this user
    useEffect(() => {
        fetch("/api/orders/pending-list")
            .then((r) => r.ok ? r.json() : null)
            .then((data) => {
                if (data?.orders) setPendingOrders(data.orders);
            })
            .catch(() => {});
    }, []);

    // Poll order status
    const pollStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/orders/status?code=${orderCode}`);
            if (!res.ok) return;
            const data = await res.json();
            setOrderStatus(data.status);
            if (data.status === "completed") {
                setTimeout(() => {
                    router.push(
                        `/checkout/success?orderCode=${orderCode}&quantity=${quantity}`
                    );
                }, 2000);
            }
        } catch {
            // Silent fail
        }
    }, [orderCode, quantity, router]);

    useEffect(() => {
        if (!orderCode || orderStatus === "completed") return;
        const interval = setInterval(pollStatus, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [orderCode, orderStatus, pollStatus]);

    const handleIdentitySubmit = async (data: CustomerIdentityData) => {
        setIdentitySubmitting(true);
        setIdentityError("");
        try {
            const res = await fetch("/api/orders/identity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderCode, ...data }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || t('banking.genericError'));
            }
            setIdentityDone(true);
        } catch (err) {
            setIdentityError(err instanceof Error ? err.message : t('banking.genericError'));
            throw err;
        } finally {
            setIdentitySubmitting(false);
        }
    };

    if (!orderCode) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50 flex items-center justify-center">
                <p className="text-gray-600">{t('waiting.orderNotFound')}</p>
            </div>
        );
    }

    // Order approved — show success transition
    if (orderStatus === "completed") {
        return (
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-8"
                >
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-emerald-900 mb-2">{t('waiting.orderApproved')}</h2>
                    <p className="text-emerald-700">{t('banking.redirecting')}</p>
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto mt-4" />
                </motion.div>
            </div>
        );
    }

    // Other pending orders (exclude current)
    const otherPendingOrders = pendingOrders.filter((o) => o.code !== orderCode);

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50">
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Order Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-xl border border-amber-100 mb-6"
                >
                    <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
                        {t('success.orderDetails')}
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">{t('summary.orderCodeLabel')}</span>
                            <span className="font-mono font-semibold text-amber-600">{orderCode}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">{t('summary.treeCountLabel')}</span>
                            <span className="font-semibold">{formatNumber(quantity, locale)} {t('quantity.unit', { count: quantity })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">{t('summary.total')}</span>
                            <span className="font-semibold text-amber-600">
                                {totalAmount ? formatCurrency(totalAmount, locale) : "—"}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Identity Form — loading state */}
                {identityDone === null && (
                    <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 mb-6">
                        <div className="animate-pulse space-y-3">
                            <div className="h-5 bg-gray-200 rounded w-2/3" />
                            <div className="h-4 bg-gray-200 rounded w-full" />
                            <div className="h-10 bg-gray-200 rounded" />
                        </div>
                    </div>
                )}

                {/* Identity Form — only if user hasn't filled identity yet */}
                {identityDone === false && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-6 shadow-xl border border-amber-200 mb-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-6 h-6 text-amber-600" />
                            <h2 className="text-lg font-bold text-gray-900">{t('success.contractInfoTitle')}</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            {t('waiting.contractInfoDesc')}
                        </p>
                        <CustomerIdentityForm
                            onSubmit={handleIdentitySubmit}
                            isLoading={identitySubmitting}
                            error={identityError}
                        />
                    </motion.div>
                )}

                {/* Identity saved confirmation */}
                {identityDone === true && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 mb-6 flex items-center gap-3"
                    >
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <p className="text-sm font-semibold text-emerald-800">{t('waiting.contractSaved')}</p>
                    </motion.div>
                )}

                {/* Waiting for admin approval */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: identityDone ? 0.2 : 0.4 }}
                    className="bg-amber-50 rounded-2xl p-6 shadow-xl border border-amber-200"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-amber-100 rounded-full">
                            <Clock className="w-8 h-8 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-amber-900">{t('waiting.waitingApproval')}</h2>
                            <p className="text-sm text-amber-700">
                                {t('waiting.checkingTransfer')}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm text-amber-800">
                        <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-amber-700">1</span>
                            </div>
                            <p>{t('waiting.step1')}</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-amber-700">2</span>
                            </div>
                            <p>{t('waiting.step2')}</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-amber-700">3</span>
                            </div>
                            <p>{t('waiting.step3')}</p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-amber-600">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>{t('waiting.autoChecking')}</span>
                    </div>
                </motion.div>

                {/* Other pending orders list */}
                {otherPendingOrders.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mt-6 bg-white rounded-2xl p-6 shadow-xl border border-gray-100"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <ShoppingCart className="w-5 h-5 text-gray-600" />
                            <h3 className="text-base font-bold text-gray-900">
                                {t('waiting.otherOrders', { count: otherPendingOrders.length })}
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {otherPendingOrders.map((order) => (
                                <div
                                    key={order.code}
                                    className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 ${
                                        order.status === "pending" ? "cursor-pointer hover:bg-gray-100 transition-colors" : ""
                                    }`}
                                    onClick={() => {
                                        if (order.status === "pending") {
                                            router.push(`/checkout?quantity=${order.quantity}`);
                                        }
                                    }}
                                >
                                    <div>
                                        <p className="font-mono font-semibold text-sm text-gray-900">{order.code}</p>
                                        <p className="text-xs text-gray-500">
                                            {formatNumber(order.quantity, locale)} {t('quantity.unit', { count: order.quantity })} — {formatCurrency(Number(order.total_amount), locale)}
                                        </p>
                                    </div>
                                    {order.status === "pending" ? (
                                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                                            {t('waiting.payNow')}
                                        </span>
                                    ) : (
                                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-amber-100 text-amber-700">
                                            {t('waiting.awaitingAdmin')}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Action buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 space-y-4"
                >
                    <button
                        onClick={() => router.push("/quantity")}
                        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-4 px-6 rounded-xl hover:from-emerald-700 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all"
                    >
                        <Trees className="w-5 h-5" />
                        <span>{t('waiting.buyMoreTrees')}</span>
                    </button>
                </motion.div>

                <p className="text-center text-gray-500 text-sm mt-6">
                    {t('waiting.canLeaveNotice')}
                </p>
            </div>
        </div>
    );
}

export default function WaitingPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <WaitingContent />
        </Suspense>
    );
}
