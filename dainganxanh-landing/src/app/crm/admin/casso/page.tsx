import { createServerClient } from '@/lib/supabase/server'
import CassoTransactionTable from './CassoTransactionTable'

export const dynamic = 'force-dynamic'

export interface CassoTransaction {
    id: string
    casso_id: number | null
    casso_tid: string
    amount: number
    description: string | null
    bank_account: string | null
    transaction_at: string | null
    status: string
    note: string | null
    order_id: string | null
    created_at: string
}

interface PageProps {
    searchParams: Promise<{
        page?: string
        status?: string
        from?: string
        to?: string
    }>
}

const PAGE_SIZE = 20

export default async function CassoAdminPage({ searchParams }: PageProps) {
    const params = await searchParams
    const page = Math.max(1, parseInt(params.page || '1', 10))
    const statusFilter = params.status || ''
    const fromDate = params.from || ''
    const toDate = params.to || ''

    const offset = (page - 1) * PAGE_SIZE
    const supabase = await createServerClient()

    let query = supabase
        .from('casso_transactions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

    if (statusFilter) {
        query = query.eq('status', statusFilter)
    }

    if (fromDate) {
        query = query.gte('created_at', new Date(fromDate).toISOString())
    }

    if (toDate) {
        // Include the full end day
        const endOfDay = new Date(toDate)
        endOfDay.setHours(23, 59, 59, 999)
        query = query.lte('created_at', endOfDay.toISOString())
    }

    const { data: transactions, count, error } = await query

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Lỗi tải dữ liệu: {error.message}</p>
            </div>
        )
    }

    const totalCount = count ?? 0
    const totalPages = Math.ceil(totalCount / PAGE_SIZE)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Casso Transaction Logs</h1>
                <p className="mt-2 text-gray-600">
                    Lịch sử tất cả giao dịch Casso — bao gồm cả không khớp
                </p>
            </div>

            <CassoTransactionTable
                transactions={(transactions ?? []) as CassoTransaction[]}
                totalCount={totalCount}
                totalPages={totalPages}
                currentPage={page}
                statusFilter={statusFilter}
                fromDate={fromDate}
                toDate={toDate}
            />
        </div>
    )
}
