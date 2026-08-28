'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Copy, Check, Loader2, CheckCircle2, Clock, Truck, Banknote, ShoppingBag } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  stock_quantity: number
  images: string[]
}

const BANK_INFO = {
  bank: process.env.NEXT_PUBLIC_BANK_NAME || 'MB Bank',
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '796333999',
  accountName: process.env.NEXT_PUBLIC_BANK_HOLDER || 'CONG TY CO PHAN DAI NGAN XANH GROUP',
}

const POLL_INTERVAL = 5000
const POLL_TIMEOUT = 15 * 60 * 1000

function formatPrice(amount: number) {
  return amount.toLocaleString('vi-VN') + 'đ'
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m} phút ${s.toString().padStart(2, '0')} giây` : `${s} giây`
}

export function StoreCheckoutClient({ product, quantity }: { product: Product; quantity: number }) {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'payment' | 'cod-confirm' | 'confirmed'>('form')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    shipping_address: '',
    shipping_province: '',
    shipping_note: '',
    payment_method: 'banking' as 'banking' | 'cod',
  })

  const [order, setOrder] = useState<{
    orderId: string
    orderCode: string
    totalAmount: number
    paymentMethod: string
    expiresAt: string | null
  } | null>(null)

  const [qrUrl, setQrUrl] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const subtotal = product.price * quantity
  const shippingFee = 0
  const total = subtotal + shippingFee

  const handlePlaceOrder = async () => {
    if (!form.customer_name || !form.customer_phone || !form.shipping_address || !form.shipping_province) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc.')
      return
    }

    const phoneRegex = /^0\d{9}$/
    if (!phoneRegex.test(form.customer_phone)) {
      setError('Số điện thoại không hợp lệ.')
      return
    }

    setPlacing(true)
    setError('')

    try {
      const res = await fetch('/api/store/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_slug: product.slug,
          quantity,
          ...form,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Không thể tạo đơn hàng')
      }

      setOrder(data)

      if (data.paymentMethod === 'cod') {
        setStep('cod-confirm')
      } else {
        setStep('payment')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setPlacing(false)
    }
  }

  const pollStatus = useCallback(async () => {
    if (!order) return
    try {
      const res = await fetch(`/api/store/orders/status?code=${order.orderCode}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.status === 'confirmed') {
        setStep('confirmed')
        if (pollRef.current) clearInterval(pollRef.current)
        if (timerRef.current) clearInterval(timerRef.current)
        setTimeout(() => {
          router.push(`/store/checkout/success?code=${order.orderCode}&total=${order.totalAmount}`)
        }, 2000)
      }
    } catch {
      // Silent fail
    }
  }, [order, router])

  useEffect(() => {
    if (step === 'payment' && order) {
      const vietQRUrl = `https://img.vietqr.io/image/MB-${BANK_INFO.accountNumber}-compact.png?amount=${order.totalAmount}&addInfo=${encodeURIComponent(order.orderCode)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`
      setQrUrl(vietQRUrl)

      const start = Date.now()
      pollRef.current = setInterval(() => {
        const elapsed = Date.now() - start
        if (elapsed > POLL_TIMEOUT) {
          if (pollRef.current) clearInterval(pollRef.current)
          if (timerRef.current) clearInterval(timerRef.current)
          return
        }
        pollStatus()
      }, POLL_INTERVAL)

      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000))
      }, 1000)

      return () => {
        if (pollRef.current) clearInterval(pollRef.current)
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
  }, [step, order, pollStatus])

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch { /* */ }
  }

  const CopyBtn = ({ text, field, label }: { text: string; field: string; label: string }) => (
    <button
      onClick={() => copyToClipboard(text, field)}
      className="p-1.5 rounded hover:bg-gray-200 transition-colors shrink-0"
      title={`Sao chép ${label}`}
      aria-label={`Sao chép ${label}`}
    >
      {copiedField === field ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
    </button>
  )

  if (step === 'confirmed') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-50 rounded-2xl p-8 shadow-xl border-2 border-emerald-300 text-center max-w-md"
        >
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-emerald-900 mb-2">Thanh toán thành công!</h3>
          <p className="text-emerald-700">Đang chuyển hướng đến trang xác nhận...</p>
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto mt-4" />
        </motion.div>
      </div>
    )
  }

  if (step === 'cod-confirm') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-xl border border-emerald-100 text-center max-w-md"
        >
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h3>
          <p className="text-gray-600 mb-4">Mã đơn: <span className="font-mono font-bold text-emerald-700">{order?.orderCode}</span></p>
          <p className="text-sm text-gray-500 mb-6">Bạn sẽ thanh toán khi nhận hàng. Chúng tôi sẽ liên hệ để xác nhận.</p>
          <button
            onClick={() => router.push(`/store/checkout/success?code=${order?.orderCode}&total=${order?.totalAmount}`)}
            className="w-full py-3 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-colors"
          >
            Xem xác nhận đơn hàng
          </button>
        </motion.div>
      </div>
    )
  }

  if (step === 'payment' && order) {
    return (
      <div className="min-h-screen bg-stone-50">
        <nav className="container mx-auto px-4 py-4">
          <Link href="/store" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800">
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại cửa hàng</span>
          </Link>
        </nav>

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden"
          >
            {qrUrl && (
              <div className="flex justify-center p-6 bg-gradient-to-br from-amber-50 to-orange-50">
                <img src={qrUrl} alt="QR thanh toán" className="w-52 h-52 rounded-xl" />
              </div>
            )}

            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Thanh toán chuyển khoản</h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="text-gray-500">Ngân hàng</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{BANK_INFO.bank}</span>
                    <CopyBtn text={BANK_INFO.bank} field="bank" label="ngân hàng" />
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="text-gray-500">Số tài khoản</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{BANK_INFO.accountNumber}</span>
                    <CopyBtn text={BANK_INFO.accountNumber} field="account" label="số tài khoản" />
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="text-gray-500">Chủ tài khoản</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{BANK_INFO.accountName}</span>
                    <CopyBtn text={BANK_INFO.accountName} field="name" label="chủ tài khoản" />
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="text-gray-500">Nội dung CK</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-700">{order.orderCode}</span>
                    <CopyBtn text={order.orderCode} field="orderCode" label="nội dung CK" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-gray-500">Số tiền</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700 text-lg">{formatPrice(order.totalAmount)}</span>
                    <CopyBtn text={order.totalAmount.toString()} field="amount" label="số tiền" />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-900">
                    Đang chờ xác nhận... ({formatElapsed(elapsed)})
                  </p>
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  Vui lòng chuyển khoản đúng số tiền và nội dung. Hệ thống tự động xác nhận trong ít phút.
                </p>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="container mx-auto px-4 py-4">
        <Link href={`/store/${product.slug}`} className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800">
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại sản phẩm</span>
        </Link>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-3 gap-6"
        >
          <div className="md:col-span-2 bg-white rounded-2xl shadow-xl border border-stone-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Thông tin đơn hàng</h1>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={e => setForm({ ...form, customer_name: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={form.customer_phone}
                    onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="0912345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.customer_email}
                    onChange={e => setForm({ ...form, customer_email: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng <span className="text-red-500">*</span></label>
                <textarea
                  value={form.shipping_address}
                  onChange={e => setForm({ ...form, shipping_address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                  placeholder="Số nhà, đường, phường/xã, quận/huyện"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh / Thành phố <span className="text-red-500">*</span></label>
                <select
                  value={form.shipping_province}
                  onChange={e => setForm({ ...form, shipping_province: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Hải Phòng">Hải Phòng</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <input
                  type="text"
                  value={form.shipping_note}
                  onChange={e => setForm({ ...form, shipping_note: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="Ghi chú về giao hàng (không bắt buộc)"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Phương thức thanh toán</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setForm({ ...form, payment_method: 'banking' })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                      form.payment_method === 'banking'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-stone-200 hover:border-emerald-300'
                    }`}
                  >
                    <Banknote className="w-6 h-6" />
                    <span className="font-semibold text-sm">Chuyển khoản</span>
                  </button>
                  <button
                    onClick={() => setForm({ ...form, payment_method: 'cod' })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                      form.payment_method === 'cod'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-stone-200 hover:border-emerald-300'
                    }`}
                  >
                    <Truck className="w-6 h-6" />
                    <span className="font-semibold text-sm">COD</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full mt-6 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {placing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
              {placing ? 'Đang xử lý...' : 'Đặt hàng'}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-6 h-fit">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>
            <div className="flex gap-3 mb-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-2xl">🌿</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                <p className="text-sm text-gray-500">SL: {quantity}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm border-t border-stone-100 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Tạm tính</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phí vận chuyển</span>
                <span className="font-semibold">{formatPrice(shippingFee)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-100">
                <span className="font-bold text-gray-900">Tổng cộng</span>
                <span className="font-bold text-emerald-700 text-lg">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
