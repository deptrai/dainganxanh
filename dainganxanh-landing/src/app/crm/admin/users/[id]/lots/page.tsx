'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    fetchUserLotAssignments,
    assignLotToUser,
    removeLotFromUser,
    AdminUserLotAssignment,
} from '@/actions/adminUserLots'
import { LotScopedRole } from '@/types/admin'
import { fetchLots } from '@/actions/lots'

interface PageParams {
    id: string
}

interface LotOption {
    id: string
    name: string
    region: string
}

const ROLE_OPTIONS = [
    { value: 'resort_manager', label: 'Quản lý Resort (Resort Manager)' },
    { value: 'store_staff', label: 'Nhân viên Store (Store Staff)' },
]

export default function UserLotsPage({ params }: { params: Promise<PageParams> }) {
    const { id } = use(params)
    const router = useRouter()
    const [assignments, setAssignments] = useState<AdminUserLotAssignment[]>([])
    const [lots, setLots] = useState<LotOption[]>([])
    const [selectedLot, setSelectedLot] = useState('')
    const [selectedRole, setSelectedRole] = useState('resort_manager')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        const [assignmentsResult, lotsResult] = await Promise.all([
            fetchUserLotAssignments(id),
            fetchLots(),
        ])

        if (assignmentsResult.error) {
            setError(assignmentsResult.error)
        } else {
            setAssignments(assignmentsResult.assignments)
        }

        if (lotsResult.error) {
            setError((prev) => prev || lotsResult.error || null)
        } else {
            setLots((lotsResult.lots || []).map((lot: any) => ({ id: lot.id, name: lot.name, region: lot.region })))
        }

        setLoading(false)
    }, [id])

    useEffect(() => {
        load()
    }, [load])

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedLot) return

        setSubmitting(true)
        setError(null)
        setSuccess(null)

        const result = await assignLotToUser(id, selectedLot, selectedRole as LotScopedRole)
        setSubmitting(false)

        if (result.error) {
            setError(result.error)
        } else {
            setSuccess('✅ Đã gán quyền lô thành công')
            setSelectedLot('')
            await load()
        }
    }

    const handleRemove = async (lotId: string) => {
        if (!confirm('Bạn có chắc muốn xóa quyền lô này?')) return

        setSubmitting(true)
        setError(null)
        setSuccess(null)

        const result = await removeLotFromUser(id, lotId)
        setSubmitting(false)

        if (result.error) {
            setError(result.error)
        } else {
            setSuccess('✅ Đã xóa quyền lô')
            await load()
        }
    }

    const getRoleLabel = (role: string) => {
        return ROLE_OPTIONS.find((opt) => opt.value === role)?.label || role
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Phân quyền lô</h1>
                    <p className="mt-1 text-gray-600">Quản lý quyền lot-scoped cho người dùng {id}</p>
                </div>
                <button
                    onClick={() => router.push('/crm/admin/users')}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                    ← Quay lại
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm">❌ {error}</p>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-700 text-sm">{success}</p>
                </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Danh sách lô đã gán</h2>

                {loading ? (
                    <p className="text-gray-600">Đang tải...</p>
                ) : assignments.length === 0 ? (
                    <p className="text-gray-600">Chưa có lô nào được gán.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-700">Tên lô</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-700">Role</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-700">Ngày cập nhật</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {assignments.map((assignment) => (
                                <tr key={assignment.id}>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900">{assignment.lot_name}</p>
                                        <p className="text-xs text-gray-500">{assignment.lot_region}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {getRoleLabel(assignment.role)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {new Date(assignment.updated_at).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleRemove(assignment.lot_id)}
                                            disabled={submitting}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <form onSubmit={handleAssign} className="bg-white rounded-lg shadow p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Gán lô mới</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chọn lô</label>
                        <select
                            value={selectedLot}
                            onChange={(e) => setSelectedLot(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        >
                            <option value="">— Chọn lô —</option>
                            {lots.map((lot) => (
                                <option key={lot.id} value={lot.id}>
                                    {lot.name} ({lot.region})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={submitting || !selectedLot}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                            {submitting ? 'Đang gán...' : 'Gán quyền'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
