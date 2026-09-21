import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getImpersonationContext } from '@/lib/getImpersonationContext'
import { BookingsList } from '@/components/crm/BookingsList'
import { captureError } from '@/lib/monitoring'

export const metadata: Metadata = {
    title: 'Lịch sử đặt phòng | Đại Ngàn Xanh',
    robots: { index: false },
}

interface MyBookingsPageProps {
    searchParams: Promise<{ page?: string; cancelled?: string }>
}

export default async function MyBookingsPage({ searchParams }: MyBookingsPageProps) {
    const ctx = await getImpersonationContext()

    if (!ctx) {
        redirect('/login?redirect=/crm/my-bookings')
    }

    const { effectiveUserId } = ctx
    const { page: pageParam, cancelled } = await searchParams
    const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
    const pageSize = 20
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1

    const serviceClient = createServiceRoleClient()

    const {
        data: bookings,
        error,
        count,
    } = await serviceClient
        .from('room_bookings')
        .select(
            `
            id,
            code,
            check_in_date,
            check_out_date,
            guests_count,
            nights_count,
            total_amount,
            payment_method,
            status,
            expires_at,
            created_at,
            rooms(name, lots(name, region, description))
        `,
            { count: 'exact' }
        )
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false })
        .range(start, end)

    if (error) {
        console.error('Error fetching my bookings:', error.message)
        captureError(new Error(error.message), { context: 'MyBookingsPage', effectiveUserId })
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">Không thể tải danh sách đặt phòng. Vui lòng thử lại sau.</p>
                </div>
            </div>
        )
    }

    const formattedBookings = (bookings || []).map((row) => ({
        id: row.id,
        code: row.code,
        roomName: (row.rooms as unknown as { name: string } | null)?.name || '',
        lotName: (() => {
          const room = row.rooms as unknown as { lots?: { name?: string } | { name?: string }[] | null } | null
          const lotData = room?.lots
          const lot = Array.isArray(lotData) ? lotData[0] : lotData
          return lot?.name || ''
        })(),
        lotRegion: (() => {
          const room = row.rooms as unknown as { lots?: { region?: string } | { region?: string }[] | null } | null
          const lotData = room?.lots
          const lot = Array.isArray(lotData) ? lotData[0] : lotData
          return lot?.region || ''
        })(),
        lotDescription: (() => {
          const room = row.rooms as unknown as { lots?: { description?: string | null } | { description?: string | null }[] | null } | null
          const lotData = room?.lots
          const lot = Array.isArray(lotData) ? lotData[0] : lotData
          return lot?.description || ''
        })(),
        checkInDate: row.check_in_date,
        checkOutDate: row.check_out_date,
        guestsCount: row.guests_count,
        nightsCount: row.nights_count,
        totalAmount: row.total_amount,
        paymentMethod: row.payment_method,
        status: row.status,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
    }))

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / pageSize)

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Lịch sử đặt phòng</h1>
            <p className="text-gray-600 mb-6">Theo dõi và quản lý các đơn đặt phòng của bạn</p>

            <BookingsList
                    bookings={formattedBookings}
                page={page}
                pageSize={pageSize}
                totalCount={totalCount}
                totalPages={totalPages}
                cancelled={cancelled === '1'}
            />
        </div>
    )
}
