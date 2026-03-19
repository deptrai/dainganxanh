"use client"

import { useState, useCallback, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

export interface Order {
    id: string
    user_id: string
    quantity: number
    total_amount: number
    payment_method: string
    status: 'pending' | 'paid' | 'verified' | 'assigned' | 'completed' | 'cancelled'
    verified_at: string | null
    created_at: string
    // Joined from users table
    user_email?: string
    user_phone?: string
    contract_url?: string | null
    order_code?: string
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
        const supabase = createBrowserClient()

        try {
            // If searching by email, find matching user_ids first
            let searchUserIds: string[] | null = null
            if (filters.search) {
                const searchTerm = filters.search.trim()
                // Check if it looks like an email (contains @)
                if (searchTerm.includes('@')) {
                    const { data: matchedUsers } = await supabase
                        .from('users')
                        .select('id')
                        .ilike('email', `%${searchTerm}%`)
                    searchUserIds = (matchedUsers || []).map((u: any) => u.id)
                }
            }

            // First, get total count
            let countQuery = supabase
                .from('orders')
                .select('id', { count: 'exact', head: true })

            if (filters.status && filters.status !== 'all') {
                countQuery = countQuery.eq('status', filters.status)
            }
            if (filters.dateFrom) {
                countQuery = countQuery.gte('created_at', filters.dateFrom)
            }
            if (filters.dateTo) {
                countQuery = countQuery.lte('created_at', filters.dateTo)
            }
            if (filters.search) {
                const searchTerm = filters.search.trim()
                if (searchUserIds !== null) {
                    // Email search: filter by matched user_ids
                    if (searchUserIds.length > 0) {
                        countQuery = countQuery.in('user_id', searchUserIds)
                    } else {
                        // No users matched, force zero results
                        countQuery = countQuery.eq('user_id', 'no-match')
                    }
                } else {
                    // Order ID / order_code search
                    countQuery = countQuery.or(`id.ilike.%${searchTerm}%,order_code.ilike.%${searchTerm}%`)
                }
            }

            const { count } = await countQuery

            // Calculate pagination
            const totalCount = count || 0
            const totalPages = Math.ceil(totalCount / PAGE_SIZE)

            // Fetch paginated orders data
            let query = supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .range(
                    (pagination.page - 1) * PAGE_SIZE,
                    pagination.page * PAGE_SIZE - 1
                )

            // Apply status filter
            if (filters.status && filters.status !== 'all') {
                query = query.eq('status', filters.status)
            }

            // Apply search filter
            if (filters.search) {
                const searchTerm = filters.search.trim()
                if (searchUserIds !== null) {
                    // Email search: filter by matched user_ids
                    if (searchUserIds.length > 0) {
                        query = query.in('user_id', searchUserIds)
                    } else {
                        // No users matched, force zero results
                        query = query.eq('user_id', 'no-match')
                    }
                } else {
                    // Order ID / order_code search
                    query = query.or(`id.ilike.%${searchTerm}%,order_code.ilike.%${searchTerm}%`)
                }
            }

            // Apply date range filters
            if (filters.dateFrom) {
                query = query.gte('created_at', filters.dateFrom)
            }
            if (filters.dateTo) {
                query = query.lte('created_at', filters.dateTo)
            }

            const { data: ordersData, error: fetchError } = await query

            if (fetchError) {
                throw fetchError
            }

            // Fetch user details separately
            const userIds = [...new Set((ordersData || []).map((order: any) => order.user_id).filter(Boolean))]
            let usersMap: Record<string, { email?: string; phone?: string }> = {}

            if (userIds.length > 0) {
                const { data: usersData } = await supabase
                    .from('users')
                    .select('id, email, phone')
                    .in('id', userIds)

                usersMap = (usersData || []).reduce((acc: any, user: any) => {
                    acc[user.id] = { email: user.email, phone: user.phone }
                    return acc
                }, {})
            }

            // Transform data to include user info
            const transformedOrders: Order[] = (ordersData || []).map((order: any) => ({
                ...order,
                user_email: usersMap[order.user_id]?.email,
                user_phone: usersMap[order.user_id]?.phone,
            }))

            setOrders(transformedOrders)
            setPagination(prev => ({
                ...prev,
                totalCount,
                totalPages,
            }))
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
        const supabase = createBrowserClient()

        try {
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: 'verified',
                    verified_at: new Date().toISOString(),
                })
                .eq('id', orderId)

            if (updateError) {
                throw updateError
            }

            // Optimistic update
            setOrders((prev) =>
                prev.map((order) =>
                    order.id === orderId
                        ? { ...order, status: 'verified', verified_at: new Date().toISOString() }
                        : order
                )
            )
        } catch (err) {
            console.error('Verify order error:', err)
            throw err
        }
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
