"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, CheckCircle, FileText, Trees, Loader2, ShoppingCart } from "lucide-react";
import { CustomerIdentityForm, CustomerIdentityData } from "@/components/checkout/CustomerIdentityForm";

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
    const orderCode = searchParams.get("orderCode") || "";
    const quantity = parseInt(searchParams.get("quantity") || "1");

    const [identityDone, setIdentityDone] = useState<boolean | null>(null); // null = loading
    const [identitySubmitting, setIdentitySubmitting] = useState(false);
    const [identityError, setIdentityError] = useState("");
    const [orderStatus, setOrderStatus] = useState("manual_payment_claimed");
    const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);

    // Get total_amount from fetched order data, fallback to URL quantity * unit price
    const currentOrder = pendingOrders.find((o) => o.code === orderCode);
    const totalAmount = currentOrder ? Number(currentOrder.total_amount) : quantity * 260000;

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
                throw new Error(err.error || "Có lỗi xảy ra");
            }
            setIdentityDone(true);
        } catch (err) {
            setIdentityError(err instanceof Error ? err.message : "Có lỗi xảy ra");
            throw err;
        } finally {
            setIdentitySubmitting(false);
        }
    };

    if (!orderCode) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50 flex items-center justify-center">
                <p className="text-gray-600">Không tìm thấy đơn hàng.</p>
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
                    <h2 className="text-2xl font-bold text-emerald-900 mb-2">Đơn hàng đã được duyệt!</h2>
                    <p className="text-emerald-700">Đang chuyển hướng...</p>
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
                        Chi tiết đơn hàng
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Mã đơn hàng:</span>
                            <span className="font-mono font-semibold text-amber-600">{orderCode}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Số cây:</span>
                            <span className="font-semibold">{quantity} cây</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tổng tiền:</span>
                            <span className="font-semibold text-amber-600">
                                {totalAmount.toLocaleString("vi-VN")} VND
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
                            <h2 className="text-lg font-bold text-gray-900">Thông tin để tạo hợp đồng</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            Điền thông tin CCCD để chúng tôi tạo hợp đồng trồng cây. Bạn chỉ cần điền 1 lần, các lần mua sau sẽ tự động điền.
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
                        <p className="text-sm font-semibold text-emerald-800">Thông tin hợp đồng đã được lưu!</p>
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
                            <h2 className="text-lg font-bold text-amber-900">Đang chờ xác nhận</h2>
                            <p className="text-sm text-amber-700">
                                Chúng tôi đang kiểm tra giao dịch chuyển khoản của bạn
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm text-amber-800">
                        <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-amber-700">1</span>
                            </div>
                            <p>Bạn đã báo chuyển tiền thành công</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-amber-700">2</span>
                            </div>
                            <p>Admin đang kiểm tra giao dịch (thường trong vòng 1-24 giờ)</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-amber-700">3</span>
                            </div>
                            <p>Khi được duyệt, đơn hàng sẽ tự động hoàn tất</p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-amber-600">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Tự động kiểm tra trạng thái...</span>
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
                                Đơn hàng khác đang chờ ({otherPendingOrders.length})
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
                                            {order.quantity} cây — {Number(order.total_amount).toLocaleString("vi-VN")} VND
                                        </p>
                                    </div>
                                    {order.status === "pending" ? (
                                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                                            Thanh toán →
                                        </span>
                                    ) : (
                                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-amber-100 text-amber-700">
                                            Chờ admin duyệt
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
                        <span>Mua thêm cây</span>
                    </button>
                </motion.div>

                <p className="text-center text-gray-500 text-sm mt-6">
                    Bạn có thể rời trang này. Chúng tôi sẽ gửi email khi đơn hàng được duyệt.
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
