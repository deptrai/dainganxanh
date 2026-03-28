'use client'

import { useState } from 'react'
import { AdminUser } from '@/actions/adminUsers'

interface UserTableProps {
    users: AdminUser[]
    changeRole: (userId: string, newRole: 'user' | 'admin' | 'super_admin') => Promise<{ error?: string }>
    updatingId: string | null
}

const ROLE_STYLES: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-800',
    admin: 'bg-blue-100 text-blue-800',
    user: 'bg-gray-100 text-gray-700',
}

const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    user: 'User',
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    })
}

export default function UserTable({ users, changeRole, updatingId }: UserTableProps) {
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [confirmChange, setConfirmChange] = useState<{
        userId: string
        userName: string
        newRole: 'user' | 'admin' | 'super_admin'
    } | null>(null)

    const handleRoleChange = (user: AdminUser, newRole: 'user' | 'admin' | 'super_admin') => {
        if (newRole === user.role) return
        setConfirmChange({
            userId: user.id,
            userName: user.full_name || user.email || user.id,
            newRole,
        })
    }

    const confirmRoleChange = async () => {
        if (!confirmChange) return
        setErrorMsg(null)
        const result = await changeRole(confirmChange.userId, confirmChange.newRole)
        if (result.error) setErrorMsg(result.error)
        setConfirmChange(null)
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            {errorMsg && (
                <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between">
                    <p className="text-red-700 text-sm">❌ {errorMsg}</p>
                    <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 text-lg leading-none">×</button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left font-medium text-gray-600">Email</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-600">Họ tên</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-600">Điện thoại</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-600">Mã giới thiệu</th>
                            <th className="px-6 py-3 text-center font-medium text-gray-600">Đơn hàng</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-600">Ngày tạo</th>
                            <th className="px-6 py-3 text-left font-medium text-gray-600">Role</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((user) => {
                            const isUpdating = updatingId === user.id
                            return (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-gray-900 font-medium">{user.email || '—'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">
                                        {user.full_name || <span className="text-gray-400">Chưa cập nhật</span>}
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">
                                        {user.phone || <span className="text-gray-400">—</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{user.referral_code}</code>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`font-semibold ${(user.orders_count || 0) > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                                            {user.orders_count || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-sm">
                                        {formatDate(user.created_at)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[user.role] || ROLE_STYLES.user}`}>
                                                {ROLE_LABELS[user.role] || user.role}
                                            </span>
                                            <select
                                                value={user.role}
                                                disabled={isUpdating}
                                                onChange={(e) => handleRoleChange(user, e.target.value as 'user' | 'admin' | 'super_admin')}
                                                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                                <option value="super_admin">Super Admin</option>
                                            </select>
                                            {isUpdating && (
                                                <svg className="animate-spin w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                </svg>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Confirm modal */}
            {confirmChange && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận thay đổi role</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Bạn muốn đổi role của <strong>{confirmChange.userName}</strong> thành{' '}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[confirmChange.newRole]}`}>
                                {ROLE_LABELS[confirmChange.newRole]}
                            </span>?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setConfirmChange(null)}
                                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Huỷ
                            </button>
                            <button
                                onClick={confirmRoleChange}
                                className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
