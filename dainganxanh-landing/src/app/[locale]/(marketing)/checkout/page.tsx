"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from '@/i18n/navigation'
import { Shield, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { BankingPayment } from "@/components/checkout/BankingPayment";
import { PACKAGES, isValidPackageType, type PackageType } from "@/lib/constants";
import { createBrowserClient } from "@/lib/supabase/client";
import { formatCurrency, formatNumber } from "@/lib/format";
import Cookies from "js-cookie";
import { validateReferralCode } from "@/actions/validateReferralCode";

interface PendingOrder {
    id: string;
    code: string;
    quantity: number;
    total_amount: number;
    created_at: string;
}

type CheckoutStep = "loading" | "confirm" | "payment";

// validateReferralCode moved to server action (src/actions/validateReferralCode.ts)
// to bypass RLS on users table — browser client can only read own row

function OrderSummary({ quantity, unitPrice, orderCode, orderAmount }: {
    quantity: number;
    unitPrice: number;
    orderCode: string;
    orderAmount: number;
}) {
    const t = useTranslations('checkout');
    const locale = useLocale();

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-xl border border-emerald-100 h-fit"
        >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
                {t('order.summaryTitle')}
            </h2>
            <div className="space-y-3 pb-4 border-b border-gray-200">
                <div className="flex justify-between">
                    <span className="text-gray-600">{t('summary.treeCountLabel')}</span>
                    <span className="font-semibold">{formatNumber(quantity, locale)} {t('quantity.unit', { count: quantity })}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">{t('summary.unitPriceLabel')}</span>
                    <span className="font-semibold">{formatCurrency(unitPrice, locale)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">{t('summary.orderCodeLabel')}</span>
                    <span className="font-mono font-semibold text-emerald-600">{orderCode}</span>
                </div>
            </div>
            <div className="pt-4">
                <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">{t('summary.total')}</span>
                    <span className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(orderAmount, locale)}
                    </span>
                </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">{t('summary.yourImpact')}</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🌳</span>
                        <span className="text-gray-600">{t('summary.treesPlanted', { count: formatNumber(quantity, locale) })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">💨</span>
                        <span className="text-gray-600">{t('summary.co2PerYear', { amount: formatNumber(quantity * 20, locale) })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🌍</span>
                        <span className="text-gray-600">{t('summary.supportCommunity')}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const t = useTranslations('checkout');
    const tCommon = useTranslations('common');
    const locale = useLocale();

    const raw = parseInt(searchParams.get("quantity") || "1");
    const quantity = Math.max(1, Math.min(raw || 1, 1000000));
    const packageParam = searchParams.get("package") || "standard";
    const packageType: PackageType = isValidPackageType(packageParam) ? packageParam : "standard";
    const unitPrice = PACKAGES[packageType].price;
    const hasInsurance = PACKAGES[packageType].hasInsurance;
    const total = quantity * unitPrice;

    const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("loading");
    const [orderCode, setOrderCode] = useState("");
    const [orderAmount, setOrderAmount] = useState(total);
    const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState("");
    const [placing, setPlacing] = useState(false);

    const generateOrderCode = () =>
        `DH${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Check for existing pending/completed order on mount, then go straight to payment
    useEffect(() => {
        const checkPending = async () => {
            try {
                const res = await fetch("/api/orders/pending");
                if (res.ok) {
                    const { order } = await res.json();
                    if (order) {
                        const orderQty = Number(order.quantity);
                        // If URL quantity differs from pending order, update it
                        if (orderQty !== quantity) {
                            const newAmount = quantity * unitPrice;
                            await fetch(`/api/orders/pending?orderId=${order.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ quantity, total_amount: newAmount }),
                            });
                            setPendingOrder({ ...order, quantity, total_amount: newAmount });
                            setOrderCode(order.code);
                            setOrderAmount(newAmount);
                        } else {
                            setPendingOrder(order);
                            setOrderCode(order.code);
                            setOrderAmount(Number(order.total_amount));
                        }
                        setCheckoutStep("payment");
                        return;
                    }
                }
            } catch {
                // fallback below
            }
            // No pending order — check if user has a RECENT completed order (within 1 hour)
            // Older completed orders should NOT block new purchases
            try {
                const res = await fetch("/api/orders/status");
                if (res.ok) {
                    const { order } = await res.json();
                    if (order?.status === "completed" && order.created_at) {
                        const orderAge = Date.now() - new Date(order.created_at).getTime();
                        const ONE_HOUR = 60 * 60 * 1000;
                        if (orderAge < ONE_HOUR) {
                            const name = encodeURIComponent(order.user_name || "");
                            window.location.replace(
                                `/checkout/success?orderCode=${order.code}&quantity=${order.quantity}&name=${name}`
                            );
                            return;
                        }
                    }
                }
            } catch {
                // fallback to new order
            }
            // No pending order — show confirm step, let user explicitly place order
            setOrderCode(generateOrderCode());
            setOrderAmount(total);
            setCheckoutStep("confirm");
        };
        checkPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePlaceOrder = async () => {
        setPlacing(true);
        const supabase = createBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const DEFAULT_REF_CODE = "dainganxanh";
            const refCookie = Cookies.get("ref");
            let referredBy: string | null = null;

            if (refCookie) {
                referredBy = await validateReferralCode(refCookie);
            }

            if (!referredBy && refCookie?.toLowerCase() !== DEFAULT_REF_CODE.toLowerCase()) {
                referredBy = await validateReferralCode(DEFAULT_REF_CODE);
            }

            await fetch("/api/orders/pending", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: orderCode,
                    user_email: user.email,
                    user_name: user.user_metadata?.full_name ?? user.email?.split("@")[0],
                    quantity: Math.round(orderAmount / unitPrice),
                    total_amount: orderAmount,
                    unit_price: unitPrice,
                    has_insurance: hasInsurance,
                    payment_method: "banking",
                    referred_by: referredBy,
                }),
            });
        }
        setPlacing(false);
        setCheckoutStep("payment");
    };

    const handleCancel = async () => {
        if (!orderCode) return;
        setCancelling(true);
        setCancelError("");
        try {
            const body = pendingOrder
                ? { orderId: pendingOrder.id }
                : { orderCode };
            const res = await fetch("/api/orders/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                setCancelError(t('order.cancelFailed'));
                setCancelling(false);
                return;
            }
            router.push(`/quantity?quantity=${quantity}&package=${packageType}`);
        } catch {
            setCancelError(t('order.connectionError'));
            setCancelling(false);
        }
    };

    return (
        <div>
            <nav className="container mx-auto px-4 py-4">
                <Link
                    href={`/quantity?quantity=${quantity}&package=${packageType}`}
                    className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{tCommon('actions.back')}</span>
                </Link>
            </nav>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                        <Shield className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        {t('payment.title')}
                    </h1>
                    <p className="text-gray-600">
                        {t('payment.subtitle')}
                    </p>
                </motion.div>

                {checkoutStep === "loading" && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    </div>
                )}

                {checkoutStep === "confirm" && (
                    <div className="max-w-md mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl p-6 shadow-xl border border-emerald-100 space-y-4"
                        >
                            <h2 className="text-xl font-bold text-gray-900">{t('order.confirmTitle')}</h2>
                            <div className="space-y-3 text-sm text-gray-700">
                                <div className="flex justify-between">
                                    <span>{t('summary.treeCountLabel')}</span>
                                    <span className="font-semibold">{formatNumber(quantity, locale)} {t('quantity.unit', { count: quantity })}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('summary.unitPriceLabel')}</span>
                                    <span className="font-semibold">{formatCurrency(unitPrice, locale)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-3 text-base">
                                    <span className="font-semibold">{t('summary.total')}</span>
                                    <span className="font-bold text-emerald-600">{formatCurrency(orderAmount, locale)}</span>
                                </div>
                            </div>
                            <button
                                onClick={handlePlaceOrder}
                                disabled={placing}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {placing ? t('order.creatingOrder') : t('order.placeOrderNow')}
                            </button>
                            <Link
                                href={`/quantity?quantity=${quantity}&package=${packageType}`}
                                className="block text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                {t('order.backToQuantity')}
                            </Link>
                        </motion.div>
                    </div>
                )}

                {checkoutStep === "payment" && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <BankingPayment
                                orderCode={orderCode}
                                amount={orderAmount}
                                quantity={pendingOrder ? pendingOrder.quantity : quantity}
                                onCancel={handleCancel}
                                cancelling={cancelling}
                                cancelError={cancelError}
                            />
                        </motion.div>
                        <OrderSummary
                            quantity={pendingOrder ? pendingOrder.quantity : quantity}
                            unitPrice={unitPrice}
                            orderCode={orderCode}
                            orderAmount={orderAmount}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    const tCommon = useTranslations('common');
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">{tCommon('actions.loading')}</p>
                </div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
