"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Copy, Check, Building2, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import Cookies from "js-cookie";
import { createBrowserClient } from "@/lib/supabase/client";

interface BankingPaymentProps {
    orderCode: string;
    amount: number;
}

const BANK_INFO = {
    bank: "MB Bank",
    accountNumber: "771368999999",
    accountName: "CTY CP BIOCARE",
    branch: "TP HCM",
};

export function BankingPayment({ orderCode, amount }: BankingPaymentProps) {
    const router = useRouter();
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Handle payment confirmation
    const handleConfirmPayment = async () => {
        const supabase = createBrowserClient();
        try {
            setIsProcessing(true);
            setError(null);

            // Get current user with token validation
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                setError("Vui lòng đăng nhập để tiếp tục");
                router.push("/login");
                return;
            }

            // Get session for access token (we already validated user above)
            const { data: { session } } = await supabase.auth.getSession();

            // Calculate quantity from amount
            const unitPrice = 260000;
            const quantity = Math.round(amount / unitPrice);
            const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Khách hàng";

            // Read ref cookie to get referrer (using safe cookie parser)
            const refCookie = Cookies.get('ref');

            let referrerId = null;
            if (refCookie) {
                // Find referrer by referral code with error handling
                const { data: referrer, error: referrerError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('referral_code', refCookie)
                    .single();

                if (referrerError) {
                    console.error('Referral lookup failed:', referrerError);
                    // Don't block checkout, but log the error
                } else if (referrer) {
                    referrerId = referrer.id;
                }
            }

            // Call process-payment Edge Function with explicit JWT token
            const { data, error: paymentError } = await supabase.functions.invoke("process-payment", {
                body: {
                    userId: user.id,
                    userEmail: user.email,
                    userName: userName,
                    orderCode: orderCode,
                    quantity: quantity,
                    totalAmount: amount,
                    paymentMethod: "banking",
                    referredBy: referrerId, // Add referrer ID
                },
                headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                }
            });

            if (paymentError) {
                console.error("Payment error:", paymentError);
                setError(paymentError.message || "Có lỗi xảy ra khi xử lý thanh toán");
                return;
            }

            // Success - redirect to success page with quantity and name for correct display
            router.push(`/checkout/success?orderCode=${orderCode}&quantity=${quantity}&name=${encodeURIComponent(userName)}`);
        } catch (err) {
            console.error("Payment confirmation error:", err);
            setError("Có lỗi xảy ra. Vui lòng thử lại sau.");
        } finally {
            setIsProcessing(false);
        }
    };


    // Generate VietQR code - FIXED: Use VietQR image URL directly
    useEffect(() => {
        // VietQR format: https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-{TEMPLATE}.png?amount={AMOUNT}&addInfo={INFO}
        const vietQRUrl = `https://img.vietqr.io/image/MB-${BANK_INFO.accountNumber}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(orderCode)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`;

        if (orderCode && amount) {
            setQrCodeUrl(vietQRUrl); // Use VietQR image directly, not QR code of URL!
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
                            alt="QR Code thanh toán"
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
                    <CopyButton text={BANK_INFO.bank} field="bank" label="ngân hàng" />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p className="text-sm text-gray-600">Số tài khoản</p>
                        <p className="font-mono font-semibold text-gray-900">{BANK_INFO.accountNumber}</p>
                    </div>
                    <CopyButton text={BANK_INFO.accountNumber} field="account" label="số tài khoản" />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p className="text-sm text-gray-600">Chủ tài khoản</p>
                        <p className="font-semibold text-gray-900">{BANK_INFO.accountName}</p>
                    </div>
                    <CopyButton text={BANK_INFO.accountName} field="name" label="chủ tài khoản" />
                </div>

                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div>
                        <p className="text-sm text-emerald-700 font-semibold">Nội dung chuyển khoản</p>
                        <p className="font-mono font-bold text-emerald-900">{orderCode}</p>
                    </div>
                    <CopyButton text={orderCode} field="orderCode" label="nội dung chuyển khoản" />
                </div>

                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div>
                        <p className="text-sm text-emerald-700 font-semibold">Số tiền</p>
                        <p className="font-bold text-emerald-900 text-lg">{amount.toLocaleString('vi-VN')} ₫</p>
                    </div>
                    <CopyButton text={amount.toString()} field="amount" label="số tiền" />
                </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">📝 Hướng dẫn:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Mở ứng dụng ngân hàng của bạn</li>
                    <li>Quét mã QR hoặc nhập thông tin tài khoản</li>
                    <li><strong>Quan trọng:</strong> Nhập đúng nội dung chuyển khoản: <span className="font-mono font-bold">{orderCode}</span></li>
                    <li>Xác nhận chuyển khoản</li>
                    <li>Chúng tôi sẽ xác nhận đơn hàng trong vòng 5 phút</li>
                </ol>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Manual Confirmation Button */}
            <button
                className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                onClick={handleConfirmPayment}
                disabled={isProcessing}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Đang xử lý...</span>
                    </>
                ) : (
                    "Tôi đã chuyển khoản"
                )}
            </button>
        </motion.div>
    );
}
