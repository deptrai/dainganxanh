"use client"

import { useAdminOrders } from '@/hooks/useAdminOrders'
import OrderTable from '@/components/admin/OrderTable'
import OrderFilters from '@/components/admin/OrderFilters'

export default function OrdersPage() {
    const { orders, loading, error, filters, setFilters, pagination, setPage, verifyOrder, refundOrder, refetch } = useAdminOrders()

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">❌ {error}</p>
                <button
                    onClick={refetch}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Thử lại
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
                <p className="mt-2 text-gray-600">
                    Xác minh và quản lý đơn hàng mới
                </p>
            </div>

            {/* Filters */}
            <OrderFilters filters={filters} setFilters={setFilters} />

            {/* Orders Table */}
            {loading ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải đơn hàng...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-600">Không có đơn hàng nào</p>
                </div>
            ) : (
                <>
                    <OrderTable orders={orders} verifyOrder={verifyOrder} refundOrder={refundOrder} />

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between bg-white rounded-lg shadow px-6 py-4">
                        <div className="text-sm text-gray-700">
                            Hiển thị <span className="font-medium">{orders.length}</span> trong tổng số{' '}
                            <span className="font-medium">{pagination.totalCount}</span> đơn hàng
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-700">
                                Trang {pagination.page} / {pagination.totalPages || 1}
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
