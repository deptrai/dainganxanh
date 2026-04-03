"use client"

import { useState, Fragment } from 'react'
import { Order } from '@/hooks/useAdminOrders'
import VerifyOrderButton from './VerifyOrderButton'
import LotAssignmentModal from './LotAssignmentModal'
import { assignOrderToLot } from '@/actions/assignOrderToLot'
import { ContractActions } from '@/components/admin/ContractActions'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

interface OrderTableProps {
    orders: Order[]
    verifyOrder: (orderId: string) => Promise<void>
    approveOrder?: (orderId: string) => Promise<void>
}

type SortField = 'created_at' | 'total_amount' | 'quantity'
type SortDirection = 'asc' | 'desc'

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    manual_payment_claimed: 'bg-orange-100 text-orange-800',
    verified: 'bg-green-100 text-green-800',
    assigned: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
}

const statusLabels = {
    pending: 'Chờ xác minh',
    paid: 'Đã thanh toán',
    manual_payment_claimed: 'Chờ duyệt thanh toán thủ công',
    verified: 'Đã xác minh',
    assigned: 'Đã gán cây',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
}

export default function OrderTable({ orders, verifyOrder, approveOrder }: OrderTableProps) {
    const [sortField, setSortField] = useState<SortField>('created_at')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
    const [expandedRow, setExpandedRow] = useState<string | null>(null)
    const [assigningOrder, setAssigningOrder] = useState<Order | null>(null)
    const [assignError, setAssignError] = useState<string | null>(null)
    const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null)
    const [approveConfirmId, setApproveConfirmId] = useState<string | null>(null)

    const handleAssignToLot = async (lotId: string) => {
        if (!assigningOrder) return

        try {
            const result = await assignOrderToLot(assigningOrder.id, lotId)
            if (!result.success) {
                throw new Error(result.error || 'Assignment failed')
            }
            // Refresh orders list
            window.location.reload()
        } catch (error) {
            setAssignError(error instanceof Error ? error.message : 'Unknown error')
            throw error
        }
    }

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('desc')
        }
    }

    const sortedOrders = [...orders].sort((a, b) => {
        const aValue = a[sortField]
        const bValue = b[sortField]

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
    })

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN')
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount)
    }

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null
        return sortDirection === 'asc' ? (
            <ChevronUpIcon className="w-4 h-4 inline ml-1" />
        ) : (
            <ChevronDownIcon className="w-4 h-4 inline ml-1" />
        )
    }

    const renderActionButtons = (order: Order) => (
        <div className="flex gap-2 flex-wrap">
            {(order.status === 'pending' || order.status === 'paid' || order.status === 'manual_payment_claimed') ? (
                <>
                    {approveOrder && (
                        approveConfirmId === order.id ? (
                            <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
                                <span className="text-xs text-red-600 font-medium">Xác nhận?</span>
                                <button
                                    disabled={approvingOrderId === order.id}
                                    onClick={async (e) => {
                                        e.stopPropagation()
                                        setApprovingOrderId(order.id)
                                        try {
                                            await approveOrder(order.id)
                                            window.location.reload()
                                        } catch (err) {
                                            setAssignError(err instanceof Error ? err.message : 'Duyệt thanh toán thất bại')
                                        } finally {
                                            setApprovingOrderId(null)
                                            setApproveConfirmId(null)
                                        }
                                    }}
                                    className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs disabled:opacity-50"
                                >
                                    {approvingOrderId === order.id ? '...' : 'Duyệt'}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setApproveConfirmId(null)
                                    }}
                                    className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-xs"
                                >
                                    Hủy
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setApproveConfirmId(order.id)
                                }}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
                            >
                                Duyệt thanh toán
                            </button>
                        )
                    )}
                    <VerifyOrderButton orderId={order.id} verifyOrder={verifyOrder} />
                </>
            ) : order.status === 'verified' || order.status === 'completed' ? (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setAssigningOrder(order)
                    }}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs font-medium"
                >
                    Gán lô cây
                </button>
            ) : (
                <span className="text-gray-400">-</span>
            )}
        </div>
    )

    const renderExpandedDetails = (order: Order) => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><strong>Full Order ID:</strong> {order.id}</div>
                <div><strong>User ID:</strong> {order.user_id}</div>
                {order.verified_at && (
                    <div><strong>Verified At:</strong> {formatDate(order.verified_at)}</div>
                )}
                {(order as any).claimed_at && (
                    <div><strong>Claimed At:</strong> {formatDate((order as any).claimed_at)}</div>
                )}
                <div><strong>Contract:</strong> {order.contract_url ? 'Yes' : 'No'}</div>
            </div>
            {order.contract_url && (
                <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-2">Hợp Đồng & In Ấn</h4>
                    <ContractActions
                        orderId={order.id}
                        contractUrl={order.contract_url}
                        orderCode={order.order_code || order.id.substring(0, 8)}
                    />
                </div>
            )}
        </div>
    )

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Error Toast */}
            {assignError && (
                <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between">
                    <p className="text-red-800 text-sm">{assignError}</p>
                    <button
                        onClick={() => setAssignError(null)}
                        className="text-red-600 hover:text-red-800"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Mobile Card View */}
            <div className="block lg:hidden divide-y divide-gray-200">
                {sortedOrders.map((order) => (
                    <div key={order.id} className="p-4 space-y-3">
                        {/* Header: Order code + Status */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900">
                                {order.order_code || `PKG-${new Date(order.created_at).getFullYear()}-${order.id.slice(0, 6).toUpperCase()}`}
                            </span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>
                                {statusLabels[order.status]}
                            </span>
                        </div>

                        {/* Info rows */}
                        <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex justify-between">
                                <span>User:</span>
                                <span className="text-gray-900 font-medium truncate ml-2">{order.user_email || order.user_phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Số lượng:</span>
                                <span className="text-gray-900">{order.quantity} cây</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tổng tiền:</span>
                                <span className="text-gray-900 font-medium">{formatCurrency(order.total_amount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Ngày tạo:</span>
                                <span className="text-gray-500">{formatDate(order.created_at)}</span>
                            </div>
                            {order.referrer && (
                                <div className="flex justify-between">
                                    <span>Giới thiệu:</span>
                                    <span className="text-gray-900">{order.referrer.referral_code}</span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons - always visible */}
                        <div className="pt-2 border-t border-gray-100">
                            {renderActionButtons(order)}
                        </div>

                        {/* Expand for details */}
                        <button
                            onClick={() => setExpandedRow(expandedRow === order.id ? null : order.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                        >
                            {expandedRow === order.id ? 'Thu gọn' : 'Xem chi tiết'}
                        </button>
                        {expandedRow === order.id && (
                            <div className="bg-gray-50 rounded-lg p-3">
                                {renderExpandedDetails(order)}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Người Giới Thiệu
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('quantity')}
                            >
                                Số lượng <SortIcon field="quantity" />
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('total_amount')}
                            >
                                Tổng tiền <SortIcon field="total_amount" />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thanh toán
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Trạng thái
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('created_at')}
                            >
                                Ngày tạo <SortIcon field="created_at" />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Hành động
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedOrders.map((order) => (
                            <Fragment key={order.id}>
                                <tr
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setExpandedRow(expandedRow === order.id ? null : order.id)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {order.order_code || `PKG-${new Date(order.created_at).getFullYear()}-${order.id.slice(0, 6).toUpperCase()}`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div>{order.user_email || order.user_phone || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {order.referrer ? (
                                            <div>
                                                <span className="font-medium">{order.referrer.referral_code}</span>
                                                <br />
                                                <span className="text-xs text-gray-500">{order.referrer.email}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">Không có</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {order.quantity} cây
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatCurrency(order.total_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {order.payment_method}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[order.status]}`}>
                                            {statusLabels[order.status]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(order.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {renderActionButtons(order)}
                                    </td>
                                </tr>
                                {expandedRow === order.id && (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-4 bg-gray-50">
                                            {renderExpandedDetails(order)}
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Assignment Modal */}
            {assigningOrder && (
                <LotAssignmentModal
                    orderId={assigningOrder.id}
                    quantity={assigningOrder.quantity}
                    onClose={() => {
                        setAssigningOrder(null)
                        setAssignError(null)
                    }}
                    onAssign={handleAssignToLot}
                />
            )}
        </div>
    )
}
