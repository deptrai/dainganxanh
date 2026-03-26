'use client'

import { useState } from 'react'
import { submitReceiveProduct, type ShippingAddress } from '@/actions/harvest'

interface HarvestReceiveProductProps {
    orderId: string
    orderCode?: string
}

const PRODUCTS = [
    {
        id: 'tinh-dau-tram-huong',
        name: 'Tinh dầu trầm hương',
        description: 'Tinh dầu nguyên chất chiết xuất từ gỗ trầm hương, hương thơm tự nhiên, thư giãn tinh thần.',
        emoji: '🫧',
    },
    {
        id: 'go-tram-tho',
        name: 'Gỗ trầm thô',
        description: 'Khúc gỗ trầm hương nguyên khối, phù hợp làm đồ phong thủy hoặc sưu tầm.',
        emoji: '🪵',
    },
    {
        id: 'vong-tay-tram-huong',
        name: 'Vòng tay trầm hương',
        description: 'Vòng tay thủ công từ gỗ trầm hương tự nhiên, đẹp và có ý nghĩa phong thủy.',
        emoji: '📿',
    },
    {
        id: 'nhang-tram',
        name: 'Nhang trầm',
        description: 'Nhang trầm hương cao cấp, không hóa chất, thích hợp thờ cúng và thiền định.',
        emoji: '🕯️',
    },
]

type Step = 'select-product' | 'shipping-info' | 'confirm' | 'success'

export default function HarvestReceiveProduct({ orderId, orderCode }: HarvestReceiveProductProps) {
    const [step, setStep] = useState<Step>('select-product')
    const [selectedProduct, setSelectedProduct] = useState<string>('')
    const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
        fullName: '',
        phone: '',
        address: '',
        city: '',
        district: '',
        ward: '',
        notes: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string>('')

    const selectedProductData = PRODUCTS.find(p => p.id === selectedProduct)

    const validateShippingForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!shippingAddress.fullName.trim()) {
            newErrors.fullName = 'Vui lòng nhập họ tên'
        }
        if (!shippingAddress.phone.trim()) {
            newErrors.phone = 'Vui lòng nhập số điện thoại'
        } else {
            const phoneRegex = /^(0|\+84)\d{9,10}$/
            if (!phoneRegex.test(shippingAddress.phone.replace(/\s/g, ''))) {
                newErrors.phone = 'Số điện thoại không hợp lệ'
            }
        }
        if (!shippingAddress.address.trim()) {
            newErrors.address = 'Vui lòng nhập địa chỉ'
        }
        if (!shippingAddress.city.trim()) {
            newErrors.city = 'Vui lòng nhập tỉnh/thành phố'
        }
        if (!shippingAddress.district.trim()) {
            newErrors.district = 'Vui lòng nhập quận/huyện'
        }
        if (!shippingAddress.ward.trim()) {
            newErrors.ward = 'Vui lòng nhập phường/xã'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleContinueToShipping = () => {
        if (!selectedProduct) return
        setStep('shipping-info')
    }

    const handleContinueToConfirm = () => {
        if (validateShippingForm()) {
            setStep('confirm')
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        setSubmitError('')

        try {
            const result = await submitReceiveProduct(orderId, selectedProduct, shippingAddress)
            if (result.success) {
                setStep('success')
            } else {
                setSubmitError(result.error || 'Có lỗi xảy ra. Vui lòng thử lại.')
            }
        } catch {
            setSubmitError('Có lỗi xảy ra. Vui lòng thử lại sau.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const updateField = (field: keyof ShippingAddress, value: string) => {
        setShippingAddress(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => {
                const next = { ...prev }
                delete next[field]
                return next
            })
        }
    }

    // --- Success State ---
    if (step === 'success') {
        return (
            <div className="border-2 border-emerald-400 rounded-lg p-6 bg-emerald-50">
                <div className="text-center">
                    <span className="text-5xl block mb-4">✅</span>
                    <h3 className="text-xl font-bold text-emerald-800 mb-2">Yêu cầu đã được ghi nhận!</h3>
                    <p className="text-gray-600 mb-4">
                        Chúng tôi đã nhận yêu cầu nhận sản phẩm <strong>{selectedProductData?.name}</strong> cho
                        đơn hàng <strong>{orderCode || orderId}</strong>.
                    </p>
                    <div className="bg-white rounded-lg p-4 text-left mb-4 border border-emerald-200">
                        <h4 className="font-semibold text-gray-800 mb-2">Thông tin giao hàng</h4>
                        <p className="text-sm text-gray-600">{shippingAddress.fullName}</p>
                        <p className="text-sm text-gray-600">{shippingAddress.phone}</p>
                        <p className="text-sm text-gray-600">
                            {shippingAddress.address}, {shippingAddress.ward}, {shippingAddress.district}, {shippingAddress.city}
                        </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            📦 <strong>Thời gian giao hàng dự kiến:</strong> 7-14 ngày làm việc.
                            Chúng tôi sẽ liên hệ qua số điện thoại để xác nhận trước khi giao.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="border-2 border-emerald-400 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📦</span>
                <h3 className="text-xl font-bold text-gray-800">Nhận sản phẩm từ cây</h3>
            </div>
            <p className="text-gray-600 mb-6">
                Chọn sản phẩm bạn muốn nhận từ cây trầm hương đã thu hoạch.
            </p>

            {/* Step indicators */}
            <div className="flex items-center gap-2 mb-6 text-sm">
                <span className={`px-3 py-1 rounded-full font-medium ${step === 'select-product' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                    1. Chọn sản phẩm
                </span>
                <span className="text-gray-300">→</span>
                <span className={`px-3 py-1 rounded-full font-medium ${step === 'shipping-info' ? 'bg-emerald-600 text-white' : step === 'confirm' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                    2. Địa chỉ giao hàng
                </span>
                <span className="text-gray-300">→</span>
                <span className={`px-3 py-1 rounded-full font-medium ${step === 'confirm' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    3. Xác nhận
                </span>
            </div>

            {/* Step 1: Product Selection */}
            {step === 'select-product' && (
                <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {PRODUCTS.map((product) => (
                            <button
                                key={product.id}
                                type="button"
                                onClick={() => setSelectedProduct(product.id)}
                                className={`text-left p-4 rounded-lg border-2 transition-all ${
                                    selectedProduct === product.id
                                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                                        : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                                        {product.emoji}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">{product.name}</h4>
                                        <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                                    </div>
                                </div>
                                {selectedProduct === product.id && (
                                    <div className="mt-2 text-right">
                                        <span className="text-emerald-600 text-sm font-medium">✓ Đã chọn</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={handleContinueToShipping}
                        disabled={!selectedProduct}
                        className="w-full py-3 px-6 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Tiếp tục →
                    </button>
                </div>
            )}

            {/* Step 2: Shipping Address */}
            {step === 'shipping-info' && (
                <div>
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                            <input
                                type="text"
                                value={shippingAddress.fullName}
                                onChange={(e) => updateField('fullName', e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${errors.fullName ? 'border-red-400' : 'border-gray-300'}`}
                                placeholder="Nguyễn Văn A"
                            />
                            {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                            <input
                                type="tel"
                                value={shippingAddress.phone}
                                onChange={(e) => updateField('phone', e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${errors.phone ? 'border-red-400' : 'border-gray-300'}`}
                                placeholder="0901234567"
                            />
                            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ *</label>
                            <input
                                type="text"
                                value={shippingAddress.address}
                                onChange={(e) => updateField('address', e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${errors.address ? 'border-red-400' : 'border-gray-300'}`}
                                placeholder="Số nhà, tên đường"
                            />
                            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố *</label>
                                <input
                                    type="text"
                                    value={shippingAddress.city}
                                    onChange={(e) => updateField('city', e.target.value)}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${errors.city ? 'border-red-400' : 'border-gray-300'}`}
                                    placeholder="TP. Hồ Chí Minh"
                                />
                                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện *</label>
                                <input
                                    type="text"
                                    value={shippingAddress.district}
                                    onChange={(e) => updateField('district', e.target.value)}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${errors.district ? 'border-red-400' : 'border-gray-300'}`}
                                    placeholder="Quận 1"
                                />
                                {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã *</label>
                                <input
                                    type="text"
                                    value={shippingAddress.ward}
                                    onChange={(e) => updateField('ward', e.target.value)}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${errors.ward ? 'border-red-400' : 'border-gray-300'}`}
                                    placeholder="Phường Bến Nghé"
                                />
                                {errors.ward && <p className="text-red-500 text-sm mt-1">{errors.ward}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                            <textarea
                                value={shippingAddress.notes}
                                onChange={(e) => updateField('notes', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                rows={3}
                                placeholder="Ghi chú thêm cho đơn vị vận chuyển (nếu có)"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setStep('select-product')}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            ← Quay lại
                        </button>
                        <button
                            type="button"
                            onClick={handleContinueToConfirm}
                            className="flex-1 py-3 px-6 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                        >
                            Tiếp tục →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 'confirm' && (
                <div>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Sản phẩm đã chọn</h4>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-xl">
                                {selectedProductData?.emoji}
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">{selectedProductData?.name}</p>
                                <p className="text-sm text-gray-500">{selectedProductData?.description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h4 className="font-semibold text-gray-800 mb-3">Địa chỉ giao hàng</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Người nhận:</strong> {shippingAddress.fullName}</p>
                            <p><strong>Điện thoại:</strong> {shippingAddress.phone}</p>
                            <p><strong>Địa chỉ:</strong> {shippingAddress.address}, {shippingAddress.ward}, {shippingAddress.district}, {shippingAddress.city}</p>
                            {shippingAddress.notes && <p><strong>Ghi chú:</strong> {shippingAddress.notes}</p>}
                        </div>
                    </div>

                    {submitError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{submitError}</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setStep('shipping-info')}
                            disabled={isSubmitting}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            ← Quay lại
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 py-3 px-6 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận nhận sản phẩm'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
