'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Copy, Check, Loader2, Clock, XCircle } from 'lucide-react'
import { BookingResponse } from '@/app/(marketing)/eco-tourism/[lotId]/book/BookingPageClient'

interface VietQRDisplayProps {
    booking: BookingResponse
    onSuccess: () => void
    onExpired: () => void
    onCancel: () => void
    lotId: string
}

const BANK_INFO = {
    bank: process.env.NEXT_PUBLIC_BANK_NAME || 'MB Bank',
    accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '796333999',
    accountName: process.env.NEXT_PUBLIC_BANK_HOLDER || 'CONG TY CO PHAN DAI NGAN XANH GROUP',
}

export function VietQRDisplay({ booking, onSuccess, onExpired, onCancel, lotId }: VietQRDisplayProps) {
    const [remaining, setRemaining] = useState(0)
    const [copiedField, setCopiedField] = useState<string | null>(null)
    const [claiming, setClaiming] = useState(false)
    const [claimMessage, setClaimMessage] = useState('')
    const [cancelling, setCancelling] = useState(false)
    const [cancelError, setCancelError] = useState('')
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [qrUrl, setQrUrl] = useState('')

    const expiresAtRef = useRef(new Date(booking.expiresAt).getTime())
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const hasExpiredRef = useRef(false)
    const isCancellingRef = useRef(false)

    useEffect(() => {
        const url = `https://img.vietqr.io/image/MB-${BANK_INFO.accountNumber}-compact.png?amount=${booking.totalAmount}&addInfo=${encodeURIComponent(booking.bookingCode)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`
        setQrUrl(url)
    }, [booking.totalAmount, booking.bookingCode])

    const updateRemaining = useCallback(() => {
        const now = Date.now()
        const diff = Math.max(0, Math.floor((expiresAtRef.current - now) / 1000))
        setRemaining(diff)
        if (diff <= 0 && !hasExpiredRef.current) {
            hasExpiredRef.current = true
            if (pollRef.current) clearInterval(pollRef.current)
            if (timerRef.current) clearInterval(timerRef.current)
            onExpired()
        }
    }, [onExpired])

    const pollStatus = useCallback(async () => {
        // Do not poll while a cancellation request is in-flight
        if (isCancellingRef.current) return
        try {
            const res = await fetch(`/api/bookings/status?code=${booking.bookingCode}`)
            if (!res.ok) return
            const data = await res.json()
            if (data.status === 'confirmed') {
                if (pollRef.current) {
                    clearInterval(pollRef.current)
                    pollRef.current = null
                }
                if (timerRef.current) {
                    clearInterval(timerRef.current)
                    timerRef.current = null
                }
                onSuccess()
            } else if (data.status === 'cancelled' || data.status === 'expired') {
                if (pollRef.current) {
                    clearInterval(pollRef.current)
                    pollRef.current = null
                }
                if (timerRef.current) {
                    clearInterval(timerRef.current)
                    timerRef.current = null
                }
                onExpired()
            }
        } catch {
            // silent fail
        }
    }, [booking.bookingCode, onSuccess, onExpired])

    useEffect(() => {
        updateRemaining()
        timerRef.current = setInterval(updateRemaining, 1000)
        pollRef.current = setInterval(pollStatus, 5000)
        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [updateRemaining, pollStatus])

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedField(field)
            setTimeout(() => setCopiedField(null), 2000)
        } catch {}
    }

    const handleClaim = async () => {
        setClaiming(true)
        setClaimMessage('')
        try {
            const res = await fetch('/api/bookings/claim-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingCode: booking.bookingCode }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra')
            setClaimMessage('Đã ghi nhận. Chúng tôi sẽ xác nhận trong ít phút.')
        } catch (err) {
            setClaimMessage(err instanceof Error ? err.message : 'Có lỗi xảy ra')
        } finally {
            setClaiming(false)
        }
    }

    // Close cancel modal on Escape key
    useEffect(() => {
        if (!showCancelModal) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !cancelling) {
                setShowCancelModal(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showCancelModal, cancelling])

    const executeCancel = async () => {
        isCancellingRef.current = true
        setCancelling(true)
        setCancelError('')
        // Stop polling/timer immediately to prevent onExpired() firing mid-cancel
        if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
        }
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
        try {
            const res = await fetch('/api/bookings/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingCode: booking.bookingCode }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra')
            setShowCancelModal(false)
            onCancel()
        } catch (err) {
            isCancellingRef.current = false
            setCancelError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
        } finally {
            setCancelling(false)
        }
    }

    const CopyBtn = ({ text, field, label }: { text: string; field: string; label: string }) => (
        <button
            onClick={() => copyToClipboard(text, field)}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors shrink-0"
            title={`Sao chép ${label}`}
            aria-label={`Sao chép ${label}`}
        >
            {copiedField === field ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
                <Copy className="w-3.5 h-3.5 text-gray-400" />
            )}
        </button>
    )

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const formatVND = (value: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Thời gian giữ chỗ còn lại</span>
                </div>
                <span className="text-lg font-bold text-amber-700">{formatTime(remaining)}</span>
            </div>

            <div className="px-4 py-4 border-b border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Mã đặt phòng</span>
                    <span className="font-mono font-bold text-emerald-600">{booking.bookingCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phòng</span>
                    <span className="font-medium">{booking.roomName}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Nhận phòng</span>
                    <span className="font-medium">{booking.checkInDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Trả phòng</span>
                    <span className="font-medium">{booking.checkOutDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Số đêm</span>
                    <span className="font-medium">{booking.nightsCount} đêm</span>
                </div>
            </div>

            {qrUrl && (
                <div className="flex justify-center p-4 pb-2">
                    <img src={qrUrl} alt="QR Code thanh toán" className="w-48 h-48 rounded-lg" />
                </div>
            )}

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
                        <tr className="border-b border-gray-100">
                            <td className="text-gray-500 py-1.5">Số tiền</td>
                            <td className="font-bold text-emerald-600 py-1.5">{formatVND(booking.totalAmount)}</td>
                            <td><CopyBtn text={booking.totalAmount.toString()} field="amount" label="số tiền" /></td>
                        </tr>
                        <tr className="border-b border-gray-100">
                            <td className="text-gray-500 py-1.5">Nội dung CK</td>
                            <td className="font-mono font-semibold py-1.5">{booking.bookingCode}</td>
                            <td><CopyBtn text={booking.bookingCode} field="code" label="nội dung CK" /></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mx-4 mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-900">Đang chờ xác nhận thanh toán...</p>
                        <p className="text-xs text-amber-700">Tự động xác nhận khi nhận CK</p>
                    </div>
                </div>
            </div>

            <div className="px-4 pb-4 space-y-2">
                {claimMessage && (
                    <p className={`text-sm text-center ${claimMessage.includes('Đã ghi nhận') ? 'text-emerald-600' : 'text-red-600'}`}>
                        {claimMessage}
                    </p>
                )}
                {!showCancelModal && cancelError && (
                    <p className="text-sm text-red-600 text-center">{cancelError}</p>
                )}

                <button
                    onClick={handleClaim}
                    disabled={claiming || cancelling}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {claiming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    Đã chuyển tiền thành công
                </button>

                <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    disabled={cancelling || claiming}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <XCircle className="w-4 h-4" />
                    Hủy đặt phòng
                </button>
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => !cancelling && setShowCancelModal(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cancel-dialog-title"
                        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 id="cancel-dialog-title" className="text-lg font-bold text-gray-900">
                                    Xác nhận hủy đặt phòng
                                </h3>
                                <p className="text-xs text-gray-500">Mã đơn: {booking.bookingCode}</p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 leading-relaxed">
                            Bạn có chắc chắn muốn hủy đơn đặt phòng này? Phòng sẽ được giải phóng ngay lập tức cho khách hàng khác.
                        </p>

                        {cancelError && (
                            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{cancelError}</p>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                disabled={cancelling}
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Không, quay lại
                            </button>
                            <button
                                type="button"
                                disabled={cancelling}
                                onClick={executeCancel}
                                className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Xác nhận hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
