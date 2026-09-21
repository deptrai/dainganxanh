'use client'

import { useState, useEffect, useRef } from 'react'
import { XCircle, Loader2 } from 'lucide-react'

export interface CancelBookingButtonProps {
    bookingCode: string
    onCancel?: () => void
    className?: string
}

export default function CancelBookingButton({
    bookingCode,
    onCancel,
    className = '',
}: CancelBookingButtonProps) {
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [cancelling, setCancelling] = useState(false)
    const [cancelError, setCancelError] = useState('')
    const modalRef = useRef<HTMLDivElement>(null)
    const backButtonRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        if (!showCancelModal) return

        // Set initial focus
        const timer = setTimeout(() => {
            backButtonRef.current?.focus()
        }, 50)

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !cancelling) {
                setShowCancelModal(false)
                setCancelError('')
                return
            }

            if (e.key === 'Tab' && modalRef.current) {
                const focusable = modalRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                )
                if (focusable.length > 0) {
                    const first = focusable[0]
                    const last = focusable[focusable.length - 1]
                    if (e.shiftKey) {
                        if (document.activeElement === first) {
                            e.preventDefault()
                            last.focus()
                        }
                    } else {
                        if (document.activeElement === last) {
                            e.preventDefault()
                            first.focus()
                        }
                    }
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            clearTimeout(timer)
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [showCancelModal, cancelling])

    const executeCancel = async () => {
        setCancelling(true)
        setCancelError('')
        try {
            const res = await fetch('/api/bookings/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingCode, reason: 'Khách hủy từ CRM' }),
            })
            if (!res.ok) {
                let errorMsg = 'Có lỗi xảy ra khi hủy đặt phòng'
                try {
                    const data = await res.json()
                    if (data?.error) errorMsg = data.error
                } catch {
                    // Non-JSON response
                }
                throw new Error(errorMsg)
            }
            setShowCancelModal(false)
            onCancel?.()
        } catch (err) {
            setCancelError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
        } finally {
            setCancelling(false)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    setCancelError('')
                    setShowCancelModal(true)
                }}
                disabled={cancelling}
                className={`inline-flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
            >
                <XCircle className="w-4 h-4 shrink-0" />
                <span>Hủy đặt phòng</span>
            </button>

            {showCancelModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => !cancelling && setShowCancelModal(false)}
                >
                    <div
                        ref={modalRef}
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
                                <p className="text-xs text-gray-500">Mã đơn: {bookingCode}</p>
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
                                ref={backButtonRef}
                                type="button"
                                disabled={cancelling}
                                onClick={() => {
                                    setShowCancelModal(false)
                                    setCancelError('')
                                }}
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
        </>
    )
}

export { CancelBookingButton }
