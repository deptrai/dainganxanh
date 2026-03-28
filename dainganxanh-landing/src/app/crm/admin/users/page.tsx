'use client'

import { useState } from 'react'
import { useAdminUsers } from '@/hooks/useAdminUsers'
import UserTable from '@/components/admin/UserTable'

const ROLE_OPTIONS = [
    { value: 'all', label: 'Tất cả role' },
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' },
    { value: 'super_admin', label: 'Super Admin' },
]

export default function UsersPage() {
    const { users, loading, error, filters, setFilters, pagination, setPage, changeRole, updatingId, refetch } = useAdminUsers()
    const [searchInput, setSearchInput] = useState('')

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setFilters({ ...filters, search: searchInput.trim() || undefined })
    }

    const handleRoleFilter = (role: string) => {
        setFilters({ ...filters, role: role === 'all' ? undefined : role })
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">❌ {error}</p>
                <button onClick={refetch} className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                    Thử lại
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
                <p className="mt-2 text-gray-600">Xem và quản lý tài khoản người dùng</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Tìm theo email, tên, số điện thoại..."
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                        Tìm
                    </button>
                    {filters.search && (
                        <button
                            type="button"
                            onClick={() => { setSearchInput(''); setFilters({ ...filters, search: undefined }) }}
                            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                        >
                            Xoá
                        </button>
                    )}
                </form>

                {/* Role filter */}
                <div className="flex gap-2 flex-wrap">
                    {ROLE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => handleRoleFilter(opt.value)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                (filters.role || 'all') === opt.value
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
                    <p className="mt-4 text-gray-600">Đang tải người dùng...</p>
                </div>
            ) : users.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-600">Không tìm thấy người dùng nào</p>
                </div>
            ) : (
                <>
                    <UserTable users={users} changeRole={changeRole} updatingId={updatingId} />

                    {/* Pagination */}
                    <div className="flex items-center justify-between bg-white rounded-lg shadow px-6 py-4">
                        <p className="text-sm text-gray-700">
                            Hiển thị <span className="font-medium">{users.length}</span> trong{' '}
                            <span className="font-medium">{pagination.totalCount}</span> người dùng
                        </p>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-700">
                                Trang {pagination.page} / {pagination.totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Trước
                                </button>
                                <button
                                    onClick={() => setPage(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
