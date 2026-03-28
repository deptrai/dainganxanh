'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchAdminUsers, updateUserRole, AdminUser, UserFilters } from '@/actions/adminUsers'

const PAGE_SIZE = 20

export function useAdminUsers() {
    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFilters] = useState<UserFilters>({})
    const [pagination, setPagination] = useState({ page: 1, totalCount: 0, totalPages: 1 })
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const loadUsers = useCallback(async (f: UserFilters, page: number) => {
        setLoading(true)
        setError(null)
        const result = await fetchAdminUsers(f, page, PAGE_SIZE)
        if (result.error) {
            setError(result.error)
        } else {
            setUsers(result.users)
            setPagination({
                page,
                totalCount: result.totalCount,
                totalPages: Math.max(1, Math.ceil(result.totalCount / PAGE_SIZE)),
            })
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        loadUsers(filters, 1)
    }, [filters, loadUsers])

    const setPage = (page: number) => {
        loadUsers(filters, page)
    }

    const changeRole = async (userId: string, newRole: 'user' | 'admin' | 'super_admin') => {
        setUpdatingId(userId)
        const result = await updateUserRole(userId, newRole)
        setUpdatingId(null)
        if (result.error) {
            return { error: result.error }
        }
        // Optimistic update
        setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        )
        return {}
    }

    const refetch = () => loadUsers(filters, pagination.page)

    return { users, loading, error, filters, setFilters, pagination, setPage, changeRole, updatingId, refetch }
}
