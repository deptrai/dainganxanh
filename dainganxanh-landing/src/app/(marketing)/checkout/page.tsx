"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, Loader2, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { BankingPayment } from "@/components/checkout/BankingPayment";
import { CustomerIdentityForm, CustomerIdentityData } from "@/components/checkout/CustomerIdentityForm";
import { createBrowserClient } from "@/lib/supabase/client";
import Cookies from "js-cookie";

interface PendingOrder {
    id: string;
    code: string;
    quantity: number;
    total_amount: number;
    created_at: string;
    id_number?: string | null;
}

type CheckoutStep = "loading" | "identity" | "payment";

function OrderSummary({ quantity, unitPrice, orderCode, orderAmount }: {
    quantity: number;
    unitPrice: number;
    orderCode: string;
    orderAmount: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-xl border border-emerald-100 h-fit"
        >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
                Đơn hàng của bạn
            </h2>
            <div className="space-y-3 pb-4 border-b border-gray-200">
                <div className="flex justify-between">
                    <span className="text-gray-600">Số lượng cây:</span>
                    <span className="font-semibold">{quantity} cây</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Đơn giá:</span>
                    <span className="font-semibold">{unitPrice.toLocaleString("vi-VN")} ₫</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Mã đơn hàng:</span>
                    <span className="font-mono font-semibold text-emerald-600">{orderCode}</span>
                </div>
            </div>
            <div className="pt-4">
                <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                    <span className="text-2xl font-bold text-emerald-600">
                        {orderAmount.toLocaleString("vi-VN")} ₫
                    </span>
                </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Tác động của bạn:</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🌳</span>
                        <span className="text-gray-600">{quantity} cây Dó đen được trồng</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">💨</span>
                        <span className="text-gray-600">~{(quantity * 20).toLocaleString()} kg CO₂/năm</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🌍</span>
                        <span className="text-gray-600">Hỗ trợ cộng đồng bản địa</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const raw = parseInt(searchParams.get("quantity") || "1");
    const quantity = Math.max(1, Math.min(raw || 1, 1000));
    const unitPrice = 260000;
    const total = quantity * unitPrice;

    const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("loading");
    const [orderCode, setOrderCode] = useState("");
    const [orderAmount, setOrderAmount] = useState(total);
    const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState("");
    const [formError, setFormError] = useState("");

    const generateOrderCode = () =>
        `DH${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Check for existing pending order on mount
    useEffect(() => {
        const checkPending = async () => {
            try {
                const res = await fetch("/api/orders/pending");
                if (res.ok) {
                    const { order } = await res.json();
                    if (order) {
                        setPendingOrder(order);
                        setOrderCode(order.code);
                        setOrderAmount(Number(order.total_amount));
                        // Skip identity form if this order already has identity data
                        if (order.id_number) {
                            setCheckoutStep("payment");
                            return;
                        }
                    }
                }
            } catch {
                // fallback to new order code below
            }
            if (!orderCode) {
                setOrderCode(generateOrderCode());
                setOrderAmount(total);
            }
            setCheckoutStep("identity");
        };
        checkPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleIdentitySubmit = async (data: CustomerIdentityData) => {
        setFormError("");
        try {
            const supabase = createBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Chưa đăng nhập");

            const DEFAULT_REF_CODE = "DNG895075";
            const refCookie = Cookies.get("ref") || DEFAULT_REF_CODE;
            let referredBy: string | null = null;
            const { data: referrer } = await supabase
                .from("users")
                .select("id")
                .eq("referral_code", refCookie)
                .single();
            if (referrer) referredBy = referrer.id;

            const res = await fetch("/api/orders/pending", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: orderCode,
                    user_email: user.email,
                    user_name: data.full_name,
                    quantity: Math.round(orderAmount / unitPrice),
                    total_amount: orderAmount,
                    payment_method: "banking",
                    referred_by: referredBy,
                    // Identity fields
                    dob: data.dob,
                    nationality: data.nationality,
                    id_number: data.id_number,
                    id_issue_date: data.id_issue_date,
                    id_issue_place: data.id_issue_place,
                    address: data.address,
                    phone: data.phone,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Không thể tạo đơn hàng");
            }

            setCheckoutStep("payment");
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại");
            throw err; // re-throw so the form knows to stop loading
        }
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
                setCancelError("Không thể hủy đơn hàng. Vui lòng thử lại.");
                setCancelling(false);
                return;
            }
            router.push(`/quantity?quantity=${quantity}`);
        } catch {
            setCancelError("Lỗi kết nối. Vui lòng thử lại.");
            setCancelling(false);
        }
    };

    return (
        <div>
            <nav className="container mx-auto px-4 py-4">
                <Link
                    href={`/quantity?quantity=${quantity}`}
                    className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                </Link>
            </nav>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                        {checkoutStep === "identity" ? (
                            <FileText className="w-8 h-8 text-emerald-600" />
                        ) : (
                            <Shield className="w-8 h-8 text-emerald-600" />
                        )}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        {checkoutStep === "identity" ? "Thông tin hợp đồng" : "Thanh toán"}
                    </h1>
                    <p className="text-gray-600">
                        {checkoutStep === "identity"
                            ? "Điền thông tin để tạo hợp đồng đúng mẫu công ty"
                            : "Chuyển khoản để hoàn tất đơn hàng"}
                    </p>
                    {checkoutStep === "payment" && (
                        <div className="flex items-center justify-center gap-3 mt-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</span>
                                Thông tin hợp đồng
                            </span>
                            <span className="text-gray-300">→</span>
                            <span className="font-medium text-gray-800">Thanh toán</span>
                        </div>
                    )}
                </motion.div>

                {checkoutStep === "loading" && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    </div>
                )}

                {checkoutStep === "identity" && (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Left: Identity Form */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl p-6 shadow-xl border border-emerald-100"
                        >
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Thông tin cá nhân
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Thông tin này sẽ được sử dụng để tạo hợp đồng trồng cây đúng mẫu pháp lý.
                            </p>
                            <CustomerIdentityForm
                                onSubmit={handleIdentitySubmit}
                                error={formError}
                            />
                        </motion.div>

                        {/* Right: Order Summary */}
                        <OrderSummary
                            quantity={pendingOrder ? pendingOrder.quantity : quantity}
                            unitPrice={unitPrice}
                            orderCode={orderCode}
                            orderAmount={orderAmount}
                        />
                    </div>
                )}

                {checkoutStep === "payment" && (
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Left: Payment */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <button
                                onClick={() => setCheckoutStep("identity")}
                                className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 mb-3 transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Sửa thông tin cá nhân
                            </button>
                            <BankingPayment
                                orderCode={orderCode}
                                amount={orderAmount}
                                onCancel={handleCancel}
                                cancelling={cancelling}
                                cancelError={cancelError}
                            />
                        </motion.div>

                        {/* Right: Order Summary */}
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
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
