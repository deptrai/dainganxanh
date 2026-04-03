'use client'

import { useEffect, useState } from 'react'
import { Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

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

export default function ProfilePage() {
    const [identity, setIdentity] = useState<IdentityData>(emptyIdentity)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [hasExisting, setHasExisting] = useState(false)

    useEffect(() => {
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Thông tin hợp đồng</h1>
                <p className="text-gray-600 mt-1">
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
        </div>
    )
}
