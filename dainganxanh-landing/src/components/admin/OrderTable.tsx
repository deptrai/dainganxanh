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
    refundOrder?: (orderId: string) => Promise<void>
}

type SortField = 'created_at' | 'total_amount' | 'quantity'
type SortDirection = 'asc' | 'desc'

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    manual_payment_claimed: 'bg-sky-100 text-sky-800',
    paid: 'bg-blue-100 text-blue-800',
    verified: 'bg-green-100 text-green-800',
    assigned: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    cancelled_refunded: 'bg-orange-100 text-orange-800',
}

const statusLabels = {
    pending: 'Chờ thanh toán',
    manual_payment_claimed: 'Khách báo đã chuyển',
    paid: 'Đã thanh toán',
    verified: 'Đã xác minh',
    assigned: 'Đã gán cây',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    cancelled_refunded: 'Hoàn tiền',
}

export default function OrderTable({ orders, verifyOrder, refundOrder }: OrderTableProps) {
    const [sortField, setSortField] = useState<SortField>('created_at')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
    const [expandedRow, setExpandedRow] = useState<string | null>(null)
    const [assigningOrder, setAssigningOrder] = useState<Order | null>(null)
    const [assignError, setAssignError] = useState<string | null>(null)
    const [refundingOrderId, setRefundingOrderId] = useState<string | null>(null)
    const [refundConfirmOrder, setRefundConfirmOrder] = useState<Order | null>(null)
    const [refundConfirmInput, setRefundConfirmInput] = useState('')
    const [refundError, setRefundError] = useState<string | null>(null)

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

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hành động
                        </th>
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
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {sortedOrders.map((order) => (
                        <Fragment key={order.id}>
                            <tr
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => setExpandedRow(expandedRow === order.id ? null : order.id)}
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex gap-2">
                                        {order.status === 'pending' || order.status === 'manual_payment_claimed' || order.status === 'paid' ? (
                                            <VerifyOrderButton orderId={order.id} verifyOrder={verifyOrder} />
                                        ) : order.status === 'verified' || order.status === 'completed' ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setAssigningOrder(order)
                                                    }}
                                                    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
                                                >
                                                    Gán lô cây
                                                </button>
                                                {order.status === 'completed' && refundOrder && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setRefundConfirmOrder(order)
                                                            setRefundConfirmInput('')
                                                            setRefundError(null)
                                                        }}
                                                        disabled={refundingOrderId === order.id}
                                                        className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs disabled:opacity-50"
                                                    >
                                                        {refundingOrderId === order.id ? '...' : 'Hoàn tiền'}
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {order.order_code || `PKG-${new Date(order.created_at).getFullYear()}-${order.id.slice(0, 6).toUpperCase()}`}
                                    {order.is_phantom && (
                                        <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded">
                                            Phantom
                                        </span>
                                    )}
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
                            </tr>
                            {expandedRow === order.id && (
                                <tr>
                                    <td colSpan={9} className="px-6 py-4 bg-gray-50">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div><strong>Full Order ID:</strong> {order.id}</div>
                                                <div><strong>User ID:</strong> {order.user_id}</div>
                                                {order.verified_at && (
                                                    <div><strong>Verified At:</strong> {formatDate(order.verified_at)}</div>
                                                )}
                                                <div><strong>Contract:</strong> {order.contract_url ? 'Yes' : 'No'}</div>
                                            </div>

                                            {/* Contract Actions */}
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
                                    </td>
                                </tr>
                            )}
                        </Fragment>
                    ))}
                </tbody>
            </table>
            </div>

            {/* Assignment Modal */}
            {
                assigningOrder && (
                    <LotAssignmentModal
                        orderId={assigningOrder.id}
                        quantity={assigningOrder.quantity}
                        onClose={() => {
                            setAssigningOrder(null)
                            setAssignError(null)
                        }}
                        onAssign={handleAssignToLot}
                    />
                )
            }

            {/* Refund confirmation modal — requires typing the order code to prevent misclicks on money flow */}
            {refundConfirmOrder && refundOrder && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => {
                        if (refundingOrderId) return
                        setRefundConfirmOrder(null)
                    }}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Xác nhận hoàn tiền đơn hàng
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Hành động này sẽ chuyển đơn hàng sang trạng thái{' '}
                            <span className="font-semibold text-orange-700">Hoàn tiền</span>.
                            Nhập mã đơn hàng{' '}
                            <code className="px-1 py-0.5 bg-gray-100 text-orange-700 rounded font-mono text-xs">
                                {refundConfirmOrder.order_code || refundConfirmOrder.id}
                            </code>{' '}
                            để xác nhận.
                        </p>
                        <input
                            type="text"
                            value={refundConfirmInput}
                            onChange={(e) => setRefundConfirmInput(e.target.value)}
                            placeholder="Nhập mã đơn hàng"
                            autoFocus
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            disabled={!!refundingOrderId}
                        />
                        {refundError && (
                            <p className="mt-2 text-sm text-red-600">{refundError}</p>
                        )}
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={() => setRefundConfirmOrder(null)}
                                disabled={!!refundingOrderId}
                                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={async () => {
                                    const expected = refundConfirmOrder.order_code || refundConfirmOrder.id
                                    if (refundConfirmInput !== expected) {
                                        setRefundError('Mã đơn hàng không khớp')
                                        return
                                    }
                                    setRefundingOrderId(refundConfirmOrder.id)
                                    setRefundError(null)
                                    try {
                                        await refundOrder(refundConfirmOrder.id)
                                        setRefundConfirmOrder(null)
                                    } catch (err) {
                                        setRefundError(err instanceof Error ? err.message : 'Lỗi không xác định')
                                    } finally {
                                        setRefundingOrderId(null)
                                    }
                                }}
                                disabled={
                                    !!refundingOrderId ||
                                    refundConfirmInput !== (refundConfirmOrder.order_code || refundConfirmOrder.id)
                                }
                                className="px-4 py-2 text-sm text-white bg-orange-600 rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {refundingOrderId ? 'Đang xử lý...' : 'Xác nhận hoàn tiền'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}
