"use client"

import { useState, useCallback, useEffect } from 'react'
import { fetchAdminOrders, verifyAdminOrder } from '@/actions/adminOrders'

export interface Order {
    id: string
    user_id: string
    quantity: number
    total_amount: number
    payment_method: string
    status: 'pending' | 'paid' | 'manual_payment_claimed' | 'verified' | 'assigned' | 'completed' | 'cancelled'
    verified_at: string | null
    claimed_at?: string | null
    created_at: string
    // Joined from users table
    user_email?: string
    user_phone?: string
    contract_url?: string | null
    order_code?: string
    referred_by?: string | null
    referrer?: {
        email?: string
        referral_code?: string
    } | null
}

export interface OrderFilters {
    status?: string
    search?: string
    dateFrom?: string
    dateTo?: string
}

export interface PaginationInfo {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
}

interface UseAdminOrdersReturn {
    orders: Order[]
    loading: boolean
    error: string | null
    filters: OrderFilters
    setFilters: (filters: OrderFilters) => void
    pagination: PaginationInfo
    setPage: (page: number) => void
    verifyOrder: (orderId: string) => Promise<void>
    refetch: () => Promise<void>
}

const PAGE_SIZE = 20

export function useAdminOrders(): UseAdminOrdersReturn {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFilters] = useState<OrderFilters>({
        status: 'pending', // Default to pending verification
    })
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        pageSize: PAGE_SIZE,
        totalCount: 0,
        totalPages: 0,
    })

    const fetchOrders = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const result = await fetchAdminOrders(filters, pagination.page, PAGE_SIZE)

            if (result.error) {
                setError(result.error)
            } else {
                setOrders(result.orders)
                setPagination(prev => ({
                    ...prev,
                    totalCount: result.totalCount,
                    totalPages: Math.ceil(result.totalCount / PAGE_SIZE),
                }))
            }
        } catch (err) {
            console.error('Fetch orders error:', err)
            setError(
                err instanceof Error
                    ? err.message
                    : 'Không thể tải danh sách đơn hàng'
            )
        } finally {
            setLoading(false)
        }
    }, [filters, pagination.page])

    const setPage = useCallback((newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }))
    }, [])

    const handleSetFilters = useCallback((newFilters: OrderFilters) => {
        setFilters(newFilters)
        // Reset to page 1 when filters change
        setPagination(prev => ({ ...prev, page: 1 }))
    }, [])

    const verifyOrder = useCallback(async (orderId: string) => {
        const result = await verifyAdminOrder(orderId)

        if (result.error) {
            throw new Error(result.error)
        }

        // Optimistic update
        setOrders((prev) =>
            prev.map((order) =>
                order.id === orderId
                    ? { ...order, status: 'verified' as const, verified_at: new Date().toISOString() }
                    : order
            )
        )
    }, [])

    const refetch = useCallback(async () => {
        await fetchOrders()
    }, [fetchOrders])

    // Fetch orders on mount and when filters/page change
    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    return {
        orders,
        loading,
        error,
        filters,
        setFilters: handleSetFilters,
        pagination,
        setPage,
        verifyOrder,
        refetch,
    }
}
