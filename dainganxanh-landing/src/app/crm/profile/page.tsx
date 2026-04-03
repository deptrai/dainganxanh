'use client'

import { useEffect, useState } from 'react'
import { Save, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp, FileText, Download, Package } from 'lucide-react'

interface IdentityData {
    full_name: string
    dob: string
    nationality: string
    id_number: string
    id_issue_date: string
    id_issue_place: string
    address: string
    phone: string
}

interface UserOrder {
    id: string
    code?: string
    order_code?: string
    quantity: number
    total_amount: number
    payment_method: string
    status: string
    created_at: string
    verified_at?: string | null
    contract_url?: string | null
    user_name?: string
    user_email?: string
}

const emptyIdentity: IdentityData = {
    full_name: '',
    dob: '',
    nationality: 'Việt Nam',
    id_number: '',
    id_issue_date: '',
    id_issue_place: '',
    address: '',
    phone: '',
}

const statusLabels: Record<string, string> = {
    pending: 'Chờ xác minh',
    paid: 'Đã thanh toán',
    manual_payment_claimed: 'Chờ duyệt thanh toán',
    verified: 'Đã xác minh',
    assigned: 'Đã gán cây',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
}

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    manual_payment_claimed: 'bg-orange-100 text-orange-800',
    verified: 'bg-green-100 text-green-800',
    assigned: 'bg-purple-100 text-purple-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
}

export default function ProfilePage() {
    const [identity, setIdentity] = useState<IdentityData>(emptyIdentity)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [hasExisting, setHasExisting] = useState(false)

    // Orders state
    const [orders, setOrders] = useState<UserOrder[]>([])
    const [ordersLoading, setOrdersLoading] = useState(true)
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

    // Active tab
    const [activeTab, setActiveTab] = useState<'identity' | 'orders'>('orders')

    useEffect(() => {
        // Fetch identity
        fetch('/api/profile/identity')
            .then(res => res.json())
            .then(data => {
                if (data.hasIdentity && data.identity) {
                    setIdentity(data.identity)
                    setHasExisting(true)
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false))

        // Fetch orders
        fetch('/api/profile/orders')
            .then(res => res.json())
            .then(data => {
                if (data.orders) {
                    setOrders(data.orders)
                }
            })
            .catch(() => {})
            .finally(() => setOrdersLoading(false))
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        try {
            const res = await fetch('/api/profile/identity', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(identity),
            })
            const data = await res.json()

            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' })
                return
            }

            setMessage({ type: 'success', text: data.message || 'Đã cập nhật thành công' })
            setHasExisting(true)
        } catch {
            setMessage({ type: 'error', text: 'Không thể kết nối server' })
        } finally {
            setSaving(false)
        }
    }

    const updateField = (field: keyof IdentityData, value: string) => {
        setIdentity(prev => ({ ...prev, [field]: value }))
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN')
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount)
    }

    const getOrderCode = (order: UserOrder) => {
        return order.order_code || order.code || `PKG-${new Date(order.created_at).getFullYear()}-${order.id.slice(0, 6).toUpperCase()}`
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Hồ sơ</h1>
                <p className="text-gray-600 mt-1">
                    Quản lý thông tin cá nhân và đơn hàng của bạn
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'orders'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Đơn hàng ({orders.length})
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('identity')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'identity'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Thông tin hợp đồng
                    </span>
                </button>
            </div>

            {/* Orders Tab */}
            {activeTab === 'orders' && (
                <div className="space-y-4">
                    {ordersLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Bạn chưa có đơn hàng nào</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                {/* Order summary row */}
                                <button
                                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-gray-900 text-sm">
                                                    {getOrderCode(order)}
                                                </span>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                                                    {statusLabels[order.status] || order.status}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {formatDate(order.created_at)}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="font-semibold text-gray-900 text-sm">
                                                {formatCurrency(order.total_amount)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {order.quantity} cây
                                            </div>
                                        </div>
                                    </div>
                                    {expandedOrderId === order.id ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
                                    )}
                                </button>

                                {/* Expanded details */}
                                {expandedOrderId === order.id && (
                                    <div className="px-5 pb-4 border-t border-gray-100">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Mã đơn:</span>{' '}
                                                <span className="font-medium">{getOrderCode(order)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Phương thức thanh toán:</span>{' '}
                                                <span className="font-medium">{order.payment_method || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Số lượng:</span>{' '}
                                                <span className="font-medium">{order.quantity} cây</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Tổng tiền:</span>{' '}
                                                <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Ngày tạo:</span>{' '}
                                                <span className="font-medium">{formatDate(order.created_at)}</span>
                                            </div>
                                            {order.verified_at && (
                                                <div>
                                                    <span className="text-gray-500">Ngày xác minh:</span>{' '}
                                                    <span className="font-medium">{formatDate(order.verified_at)}</span>
                                                </div>
                                            )}
                                            {order.user_name && (
                                                <div>
                                                    <span className="text-gray-500">Người mua:</span>{' '}
                                                    <span className="font-medium">{order.user_name}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Contract section */}
                                        {order.contract_url ? (
                                            <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-5 h-5 text-emerald-600" />
                                                        <span className="text-sm font-medium text-emerald-800">
                                                            Hợp đồng đã sẵn sàng
                                                        </span>
                                                    </div>
                                                    <a
                                                        href={order.contract_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Xem hợp đồng
                                                    </a>
                                                </div>
                                            </div>
                                        ) : order.status === 'completed' || order.status === 'verified' ? (
                                            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                                                    <span className="text-sm text-yellow-800">
                                                        Hợp đồng đang được tạo. Vui lòng kiểm tra lại sau.
                                                    </span>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Identity Tab */}
            {activeTab === 'identity' && (
                <>
                    <div className="mb-4">
                        <p className="text-gray-600 text-sm">
                            {hasExisting
                                ? 'Cập nhật thông tin CCCD để tạo hợp đồng trồng cây. Thay đổi sẽ áp dụng cho tất cả đơn hàng.'
                                : 'Điền thông tin CCCD để tạo hợp đồng trồng cây. Bạn chỉ cần điền 1 lần.'}
                        </p>
                    </div>

                    {message && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                            <span className="text-sm">{message.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                            <h2 className="font-semibold text-gray-800">Thông tin cá nhân</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Họ và tên <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={identity.full_name}
                                    onChange={e => updateField('full_name', e.target.value)}
                                    placeholder="Nguyễn Văn A"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày sinh <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={identity.dob}
                                        onChange={e => updateField('dob', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quốc tịch
                                    </label>
                                    <input
                                        type="text"
                                        value={identity.nationality}
                                        onChange={e => updateField('nationality', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Số điện thoại <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={identity.phone}
                                    onChange={e => updateField('phone', e.target.value)}
                                    placeholder="0912345678"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Địa chỉ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={identity.address}
                                    onChange={e => updateField('address', e.target.value)}
                                    placeholder="123 Đường ABC, Quận 1, TP.HCM"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                            <h2 className="font-semibold text-gray-800">Thông tin CCCD</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Số CCCD <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={identity.id_number}
                                    onChange={e => updateField('id_number', e.target.value.replace(/\D/g, '').slice(0, 12))}
                                    placeholder="012345678901"
                                    maxLength={12}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    required
                                />
                                {identity.id_number && identity.id_number.length !== 12 && (
                                    <p className="text-xs text-amber-600 mt-1">Số CCCD phải có 12 chữ số ({identity.id_number.length}/12)</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ngày cấp <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={identity.id_issue_date}
                                        onChange={e => updateField('id_issue_date', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nơi cấp <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={identity.id_issue_place}
                                        onChange={e => updateField('id_issue_place', e.target.value)}
                                        placeholder="Cục CS QLHC về TTXH"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    {hasExisting ? 'Cập nhật thông tin' : 'Lưu thông tin'}
                                </>
                            )}
                        </button>
                    </form>
                </>
            )}
        </div>
    )
}
