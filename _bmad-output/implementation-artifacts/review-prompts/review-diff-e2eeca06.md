diff --git a/dainganxanh-landing/src/actions/__tests__/adminBookings.test.ts b/dainganxanh-landing/src/actions/__tests__/adminBookings.test.ts
new file mode 100644
index 00000000..234e2ba5
--- /dev/null
+++ b/dainganxanh-landing/src/actions/__tests__/adminBookings.test.ts
@@ -0,0 +1,145 @@
+/**
+ * Unit Tests: adminBookings.ts (fetchAdminBookings, fetchAdminBookingDetail, confirmBooking, adminCancelBooking)
+ */
+
+import { fetchAdminBookings, fetchAdminBookingDetail, confirmBooking, adminCancelBooking } from '../adminBookings'
+
+const mockServiceFrom = jest.fn()
+const mockServerFrom = jest.fn()
+const mockGetUser = jest.fn()
+
+const mockServerClient = {
+  auth: { getUser: mockGetUser },
+  from: mockServerFrom,
+}
+
+const mockServiceClient = {
+  from: mockServiceFrom,
+}
+
+jest.mock('@/lib/supabase/server', () => ({
+  createServerClient: jest.fn(() => Promise.resolve(mockServerClient)),
+  createServiceRoleClient: jest.fn(() => mockServiceClient),
+}))
+
+jest.mock('next/cache', () => ({
+  revalidatePath: jest.fn(),
+}))
+
+jest.mock('@/lib/monitoring', () => ({
+  captureError: jest.fn(),
+}))
+
+function makeQueryChain(resolveValue: any) {
+  const chain: any = {
+    select: jest.fn(() => chain),
+    eq: jest.fn(() => chain),
+    gte: jest.fn(() => chain),
+    lte: jest.fn(() => chain),
+    in: jest.fn(() => chain),
+    or: jest.fn(() => chain),
+    ilike: jest.fn(() => chain),
+    not: jest.fn(() => chain),
+    order: jest.fn(() => chain),
+    range: jest.fn(() => chain),
+    single: jest.fn(() => Promise.resolve(resolveValue)),
+    update: jest.fn(() => chain),
+    then: (resolve: any, reject: any) => Promise.resolve(resolveValue).then(resolve, reject),
+    catch: (reject: any) => Promise.resolve(resolveValue).catch(reject),
+  }
+  return chain
+}
+
+describe('adminBookings', () => {
+  beforeEach(() => {
+    jest.clearAllMocks()
+  })
+
+  it('returns unauthorized when not authenticated', async () => {
+    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
+    const result = await fetchAdminBookings({}, 1, 20)
+    expect(result.error).toBe('Unauthorized')
+    expect(result.bookings).toHaveLength(0)
+  })
+
+  it('returns forbidden when user lacks admin role', async () => {
+    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
+    mockServiceFrom.mockReturnValueOnce(makeQueryChain({ data: { role: 'user' }, error: null }))
+    const result = await fetchAdminBookings({}, 1, 20)
+    expect(result.error).toBe('Forbidden: admin role required')
+  })
+
+  it('returns bookings for admin role', async () => {
+    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
+    mockServiceFrom
+      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
+      .mockReturnValueOnce(makeQueryChain({ count: 1, data: null, error: null }))
+      .mockReturnValueOnce(makeQueryChain({
+        data: [{
+          id: 'b1', code: 'BK1', guest_name: 'Test', guest_phone: '090',
+          check_in_date: '2026-09-15', check_out_date: '2026-09-16',
+          guests_count: 2, total_amount: 1000000, status: 'pending',
+          rooms: { name: 'Deluxe', lot_id: 'l1', lots: { name: 'Ba Vì', region: 'MB', description: 'desc' } }
+        }],
+        error: null
+      }))
+
+    const result = await fetchAdminBookings({}, 1, 20)
+    expect(result.error).toBeUndefined()
+    expect(result.totalCount).toBe(1)
+    expect(result.bookings[0].code).toBe('BK1')
+    expect(result.bookings[0].lotName).toBe('Ba Vì')
+  })
+
+  it('fetchAdminBookingDetail returns booking detail', async () => {
+    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
+    mockServiceFrom
+      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
+      .mockReturnValueOnce(makeQueryChain({
+        data: {
+          id: 'b1', code: 'BK1', guest_name: 'Test', guest_phone: '090',
+          check_in_date: '2026-09-15', check_out_date: '2026-09-16',
+          guests_count: 2, total_amount: 1000000, status: 'pending',
+          rooms: { name: 'Deluxe', lot_id: 'l1', lots: { name: 'Ba Vì', region: 'MB', description: 'desc' } }
+        },
+        error: null
+      }))
+
+    const result = await fetchAdminBookingDetail('b1')
+    expect(result.error).toBeUndefined()
+    expect(result.booking.code).toBe('BK1')
+    expect(result.booking.lotName).toBe('Ba Vì')
+  })
+
+  it('confirmBooking updates pending booking', async () => {
+    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
+    mockServiceFrom
+      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
+      .mockReturnValueOnce(makeQueryChain({ data: { id: 'b1', status: 'pending' }, error: null }))
+      .mockReturnValueOnce(makeQueryChain({ data: [{ id: 'b1' }], error: null }))
+
+    const result = await confirmBooking('b1')
+    expect(result.error).toBeUndefined()
+  })
+
+  it('adminCancelBooking updates pending booking', async () => {
+    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
+    mockServiceFrom
+      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
+      .mockReturnValueOnce(makeQueryChain({ data: { id: 'b1', status: 'pending' }, error: null }))
+      .mockReturnValueOnce(makeQueryChain({ data: [{ id: 'b1' }], error: null }))
+
+    const result = await adminCancelBooking('b1', 'No room available')
+    expect(result.error).toBeUndefined()
+  })
+
+  it('adminCancelBooking rejects non-pending/confirmed', async () => {
+    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
+    mockServiceFrom
+      .mockReturnValueOnce(makeQueryChain({ data: { role: 'admin' }, error: null }))
+      .mockReturnValueOnce(makeQueryChain({ data: { id: 'b1', status: 'cancelled' }, error: null }))
+
+    const result = await adminCancelBooking('b1')
+    expect(result.error).toBe('Chỉ có thể hủy đơn đang chờ hoặc đã xác nhận')
+  })
+})
diff --git a/dainganxanh-landing/src/actions/adminBookings.ts b/dainganxanh-landing/src/actions/adminBookings.ts
new file mode 100644
index 00000000..82e4036a
--- /dev/null
+++ b/dainganxanh-landing/src/actions/adminBookings.ts
@@ -0,0 +1,290 @@
+'use server'
+
+import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
+import { revalidatePath } from 'next/cache'
+import { captureError } from '@/lib/monitoring'
+
+const ADMIN_ROLES = new Set(['admin', 'super_admin', 'resort_manager'])
+
+async function verifyAdminRole() {
+    const supabase = await createServerClient()
+    const { data: { user }, error: authError } = await supabase.auth.getUser()
+
+    if (authError || !user) {
+        return { user: null, error: 'Unauthorized' }
+    }
+
+    const serviceSupabase = createServiceRoleClient()
+    const { data: profile } = await serviceSupabase
+        .from('users')
+        .select('role')
+        .eq('id', user.id)
+        .single()
+
+    if (!profile || !ADMIN_ROLES.has(profile.role)) {
+        return { user: null, error: 'Forbidden: admin role required' }
+    }
+
+    return { user, error: null }
+}
+
+export interface AdminBookingFilters {
+    status?: string
+    search?: string
+    dateFrom?: string
+    dateTo?: string
+    lotId?: string
+}
+
+export interface FetchBookingsResult {
+    bookings: any[]
+    totalCount: number
+    error?: string
+}
+
+export async function fetchAdminBookings(
+    filters: AdminBookingFilters,
+    page: number,
+    pageSize: number
+): Promise<FetchBookingsResult> {
+    const { user, error: authError } = await verifyAdminRole()
+    if (authError || !user) {
+        return { bookings: [], totalCount: 0, error: authError || 'Unauthorized' }
+    }
+
+    const serviceSupabase = createServiceRoleClient()
+
+    try {
+        // Count query
+        let countQuery = serviceSupabase
+            .from('room_bookings')
+            .select('id', { count: 'exact', head: true })
+
+        // Data query
+        let query = serviceSupabase
+            .from('room_bookings')
+            .select(`
+                id, code, guest_name, guest_phone, guest_email,
+                check_in_date, check_out_date, guests_count, total_amount,
+                status, payment_method, special_requests, cancellation_reason,
+                expires_at, created_at, updated_at,
+                rooms(name, lot_id, lots(name, region, description))
+            `)
+            .order('created_at', { ascending: false })
+            .range((page - 1) * pageSize, page * pageSize - 1)
+
+        // Apply filters
+        if (filters.status && filters.status !== 'all') {
+            countQuery = countQuery.eq('status', filters.status)
+            query = query.eq('status', filters.status)
+        }
+        if (filters.dateFrom) {
+            countQuery = countQuery.gte('check_in_date', filters.dateFrom)
+            query = query.gte('check_in_date', filters.dateFrom)
+        }
+        if (filters.dateTo) {
+            countQuery = countQuery.lte('check_in_date', filters.dateTo)
+            query = query.lte('check_in_date', filters.dateTo)
+        }
+        if (filters.lotId) {
+            countQuery = countQuery.eq('rooms.lots.id', filters.lotId)
+            query = query.eq('rooms.lots.id', filters.lotId)
+        }
+        if (filters.search) {
+            const searchTerm = filters.search.trim()
+            countQuery = countQuery.or(`code.ilike.%${searchTerm}%,guest_name.ilike.%${searchTerm}%,guest_phone.ilike.%${searchTerm}%,guest_email.ilike.%${searchTerm}%`)
+            query = query.or(`code.ilike.%${searchTerm}%,guest_name.ilike.%${searchTerm}%,guest_phone.ilike.%${searchTerm}%,guest_email.ilike.%${searchTerm}%`)
+        }
+
+        const { count } = await countQuery
+        const totalCount = count || 0
+
+        const { data: bookings, error: queryError } = await query
+
+        if (queryError) {
+            console.error('fetchAdminBookings error:', queryError)
+            captureError(queryError, { route: 'fetchAdminBookings' })
+            return { bookings: [], totalCount: 0, error: 'Failed to fetch bookings' }
+        }
+
+        // Map to safe output
+        const mapped = (bookings || []).map((row: any) => {
+            const roomData = row.rooms
+            const lotData = roomData?.lots
+
+            return {
+                id: row.id,
+                code: row.code,
+                guestName: row.guest_name,
+                guestPhone: row.guest_phone,
+                guestEmail: row.guest_email,
+                roomName: roomData?.name || '',
+                lotName: (Array.isArray(lotData) ? lotData[0]?.name : lotData?.name) || '',
+                lotId: roomData?.lot_id || null,
+                checkInDate: row.check_in_date,
+                checkOutDate: row.check_out_date,
+                guestsCount: row.guests_count,
+                totalAmount: row.total_amount,
+                status: row.status,
+                paymentMethod: row.payment_method,
+                specialRequests: row.special_requests,
+                cancellationReason: row.cancellation_reason,
+                expiresAt: row.expires_at,
+                createdAt: row.created_at,
+                updatedAt: row.updated_at,
+            }
+        })
+
+        return { bookings: mapped, totalCount }
+    } catch (err) {
+        console.error('fetchAdminBookings exception:', err)
+        captureError(err, { route: 'fetchAdminBookings' })
+        return { bookings: [], totalCount: 0, error: 'Internal server error' }
+    }
+}
+
+export async function fetchAdminBookingDetail(bookingId: string) {
+    const { user, error: authError } = await verifyAdminRole()
+    if (authError || !user) {
+        return { booking: null, error: authError || 'Unauthorized' }
+    }
+
+    const serviceSupabase = createServiceRoleClient()
+
+    const { data: booking, error } = await serviceSupabase
+        .from('room_bookings')
+        .select(`
+            id, code, guest_name, guest_phone, guest_email,
+            check_in_date, check_out_date, guests_count, total_amount,
+            status, payment_method, special_requests, cancellation_reason,
+            expires_at, created_at, updated_at, user_id,
+            rooms(name, lot_id, lots(name, region, description))
+        `)
+        .eq('id', bookingId)
+        .single()
+
+    if (error || !booking) {
+        return { booking: null, error: 'Booking not found' }
+    }
+
+    const roomData = booking.rooms as unknown as {
+        name?: string
+        lot_id?: string
+        lots?: { name?: string; region?: string; description?: string | null } | Array<{ name?: string; region?: string; description?: string | null }> | null
+    } | null
+    const lotData = roomData?.lots
+
+    return {
+        booking: {
+            id: booking.id,
+            code: booking.code,
+            guestName: booking.guest_name,
+            guestPhone: booking.guest_phone,
+            guestEmail: booking.guest_email,
+            roomName: roomData?.name || '',
+            lotName: (Array.isArray(lotData) ? lotData[0]?.name : lotData?.name) || '',
+            lotId: roomData?.lot_id || null,
+            checkInDate: booking.check_in_date,
+            checkOutDate: booking.check_out_date,
+            guestsCount: booking.guests_count,
+            totalAmount: booking.total_amount,
+            status: booking.status,
+            paymentMethod: booking.payment_method,
+            specialRequests: booking.special_requests,
+            cancellationReason: booking.cancellation_reason,
+            expiresAt: booking.expires_at,
+            createdAt: booking.created_at,
+            updatedAt: booking.updated_at,
+            userId: booking.user_id,
+        }
+    }
+}
+
+export async function confirmBooking(bookingId: string): Promise<{ error?: string }> {
+    const { user, error: authError } = await verifyAdminRole()
+    if (authError || !user) {
+        return { error: authError || 'Unauthorized' }
+    }
+
+    const serviceSupabase = createServiceRoleClient()
+
+    const { data: booking, error: fetchError } = await serviceSupabase
+        .from('room_bookings')
+        .select('id, status, room_id')
+        .eq('id', bookingId)
+        .single()
+
+    if (fetchError || !booking) {
+        return { error: 'Booking not found' }
+    }
+
+    if (booking.status !== 'pending') {
+        return { error: 'Chỉ có thể xác nhận đơn đang chờ thanh toán' }
+    }
+
+    const { error: updateError } = await serviceSupabase
+        .from('room_bookings')
+        .update({
+            status: 'confirmed',
+            payment_claimed_at: new Date().toISOString(),
+        })
+        .eq('id', bookingId)
+        .eq('status', 'pending')
+
+    if (updateError) {
+        console.error('[Admin Booking] Confirm error:', updateError)
+        captureError(updateError, { route: 'confirmBooking', bookingId })
+        return { error: 'Không thể xác nhận đặt phòng' }
+    }
+
+    revalidatePath('/crm/admin/bookings')
+    revalidatePath(`/crm/admin/bookings/${bookingId}`)
+    return {}
+}
+
+export async function adminCancelBooking(
+    bookingId: string,
+    reason?: string
+): Promise<{ error?: string }> {
+    const { user, error: authError } = await verifyAdminRole()
+    if (authError || !user) {
+        return { error: authError || 'Unauthorized' }
+    }
+
+    const serviceSupabase = createServiceRoleClient()
+
+    const { data: booking, error: fetchError } = await serviceSupabase
+        .from('room_bookings')
+        .select('id, status, room_id')
+        .eq('id', bookingId)
+        .single()
+
+    if (fetchError || !booking) {
+        return { error: 'Booking not found' }
+    }
+
+    if (!['pending', 'confirmed'].includes(booking.status)) {
+        return { error: 'Chỉ có thể hủy đơn đang chờ hoặc đã xác nhận' }
+    }
+
+    const cancellationReason = reason || 'Admin hủy đặt phòng'
+
+    const { error: updateError } = await serviceSupabase
+        .from('room_bookings')
+        .update({
+            status: 'cancelled',
+            cancellation_reason: cancellationReason,
+        })
+        .eq('id', bookingId)
+        .in('status', ['pending', 'confirmed'])
+
+    if (updateError) {
+        console.error('[Admin Booking] Cancel error:', updateError)
+        captureError(updateError, { route: 'adminCancelBooking', bookingId })
+        return { error: 'Không thể hủy đặt phòng' }
+    }
+
+    revalidatePath('/crm/admin/bookings')
+    revalidatePath(`/crm/admin/bookings/${bookingId}`)
+    return {}
+}
diff --git a/dainganxanh-landing/src/app/crm/admin/bookings/[bookingId]/page.tsx b/dainganxanh-landing/src/app/crm/admin/bookings/[bookingId]/page.tsx
new file mode 100644
index 00000000..631c2457
--- /dev/null
+++ b/dainganxanh-landing/src/app/crm/admin/bookings/[bookingId]/page.tsx
@@ -0,0 +1,90 @@
+import type { Metadata } from 'next'
+import { redirect, notFound } from 'next/navigation'
+import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
+import AdminBookingDetailClient from '@/components/admin/AdminBookingDetailClient'
+
+export const metadata: Metadata = {
+    title: 'Chi tiết đặt phòng | Admin',
+    robots: { index: false },
+}
+
+export default async function AdminBookingDetailPage({
+    params,
+}: {
+    params: Promise<{ bookingId: string }>
+}) {
+    const { bookingId } = await params
+
+    const supabase = await createServerClient()
+    const { data: { user }, error: userError } = await supabase.auth.getUser()
+
+    if (userError || !user) {
+        redirect('/auth/login')
+    }
+
+    const serviceSupabase = createServiceRoleClient()
+    const { data: profile } = await serviceSupabase
+        .from('users')
+        .select('role')
+        .eq('id', user.id)
+        .single()
+
+    const allowedRoles = new Set(['admin', 'super_admin', 'resort_manager'])
+    if (!profile || !allowedRoles.has(profile.role)) {
+        redirect('/crm/my-bookings')
+    }
+
+    const { data: booking, error } = await serviceSupabase
+        .from('room_bookings')
+        .select(`
+            id, code, room_id, guest_name, guest_phone, guest_email,
+            check_in_date, check_out_date, guests_count, nights_count, total_amount,
+            status, payment_method, special_requests, cancellation_reason,
+            expires_at, created_at, updated_at,
+            rooms(name, lot_id, lots(name, region, description))
+        `)
+        .eq('id', bookingId)
+        .single()
+
+    if (error || !booking) {
+        notFound()
+    }
+
+    const roomData = booking.rooms as unknown as {
+        name?: string
+        lot_id?: string
+        lots?: { name?: string; region?: string; description?: string | null } | Array<{ name?: string; region?: string; description?: string | null }> | null
+    } | null
+    const lotData = roomData?.lots
+    const lot = Array.isArray(lotData) ? lotData[0] : lotData
+
+    return (
+        <AdminBookingDetailClient
+            booking={{
+                id: booking.id,
+                code: booking.code,
+                roomId: booking.room_id,
+                roomName: roomData?.name || '',
+                lotId: roomData?.lot_id,
+                lotName: lot?.name || '',
+                lotRegion: lot?.region || '',
+                lotDescription: lot?.description || '',
+                guestName: booking.guest_name,
+                guestPhone: booking.guest_phone,
+                guestEmail: booking.guest_email,
+                checkInDate: booking.check_in_date,
+                checkOutDate: booking.check_out_date,
+                guestsCount: booking.guests_count,
+                nightsCount: booking.nights_count,
+                totalAmount: booking.total_amount,
+                paymentMethod: booking.payment_method,
+                status: booking.status,
+                specialRequests: booking.special_requests,
+                cancellationReason: booking.cancellation_reason,
+                expiresAt: booking.expires_at,
+                createdAt: booking.created_at,
+                updatedAt: booking.updated_at,
+            }}
+        />
+    )
+}
diff --git a/dainganxanh-landing/src/app/crm/admin/bookings/page.tsx b/dainganxanh-landing/src/app/crm/admin/bookings/page.tsx
new file mode 100644
index 00000000..0e042597
--- /dev/null
+++ b/dainganxanh-landing/src/app/crm/admin/bookings/page.tsx
@@ -0,0 +1,51 @@
+import type { Metadata } from 'next'
+import { redirect } from 'next/navigation'
+import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
+import AdminBookingClient from '@/components/admin/AdminBookingClient'
+
+export const metadata: Metadata = {
+    title: 'Quản lý đặt phòng | Admin',
+    robots: { index: false },
+}
+
+export default async function AdminBookingsPage({
+    searchParams,
+}: {
+    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
+}) {
+    const supabase = await createServerClient()
+    const { data: { user }, error: userError } = await supabase.auth.getUser()
+
+    if (userError || !user) {
+        redirect('/auth/login')
+    }
+
+    const serviceSupabase = createServiceRoleClient()
+    const { data: profile } = await serviceSupabase
+        .from('users')
+        .select('role')
+        .eq('id', user.id)
+        .single()
+
+    const allowedRoles = new Set(['admin', 'super_admin', 'resort_manager'])
+    if (!profile || !allowedRoles.has(profile.role)) {
+        redirect('/crm/my-bookings')
+    }
+
+    const { page, status, search, dateFrom, dateTo, lotId } = await searchParams
+    const initialFilters = {
+        status: typeof status === 'string' ? status : undefined,
+        search: typeof search === 'string' ? search : undefined,
+        dateFrom: typeof dateFrom === 'string' ? dateFrom : undefined,
+        dateTo: typeof dateTo === 'string' ? dateTo : undefined,
+        lotId: typeof lotId === 'string' ? lotId : undefined,
+    }
+
+    return (
+        <AdminBookingClient
+            userId={user.id}
+            initialPage={Number(page) || 1}
+            initialFilters={initialFilters}
+        />
+    )
+}
diff --git a/dainganxanh-landing/src/components/admin/AdminBookingClient.tsx b/dainganxanh-landing/src/components/admin/AdminBookingClient.tsx
new file mode 100644
index 00000000..b6564085
--- /dev/null
+++ b/dainganxanh-landing/src/components/admin/AdminBookingClient.tsx
@@ -0,0 +1,152 @@
+'use client'
+
+import { useState, useEffect, useCallback } from 'react'
+import { useRouter, useSearchParams } from 'next/navigation'
+import { fetchAdminBookings, AdminBookingFilters } from '@/actions/adminBookings'
+import AdminBookingTable from './AdminBookingTable'
+import BookingFilterBar from './BookingFilterBar'
+
+interface AdminBookingClientProps {
+    userId: string
+    initialPage: number
+    initialFilters: AdminBookingFilters
+}
+
+export default function AdminBookingClient({
+    userId,
+    initialPage,
+    initialFilters,
+}: AdminBookingClientProps) {
+    const router = useRouter()
+    const searchParams = useSearchParams()
+    const [bookings, setBookings] = useState<any[]>([])
+    const [loading, setLoading] = useState(true)
+    const [error, setError] = useState<string | null>(null)
+    const [page, setPage] = useState(initialPage)
+    const [filters, setFilters] = useState<AdminBookingFilters>(initialFilters)
+    const [totalCount, setTotalCount] = useState(0)
+    const [totalPages, setTotalPages] = useState(0)
+
+    const pageSize = 20
+
+    const loadBookings = useCallback(async () => {
+        setLoading(true)
+        setError(null)
+        try {
+            const result = await fetchAdminBookings(filters, page, pageSize)
+            if (result.error) {
+                setError(result.error)
+            } else {
+                setBookings(result.bookings)
+                setTotalCount(result.totalCount)
+                setTotalPages(Math.ceil(result.totalCount / pageSize))
+            }
+        } catch (err) {
+            setError('Failed to load bookings')
+        } finally {
+            setLoading(false)
+        }
+    }, [filters, page, pageSize])
+
+    useEffect(() => {
+        loadBookings()
+    }, [loadBookings])
+
+    const handleFilterChange = (newFilters: AdminBookingFilters) => {
+        setFilters(newFilters)
+        setPage(1)
+        const params = new URLSearchParams(searchParams.toString())
+        if (newFilters.status) params.set('status', newFilters.status)
+        else params.delete('status')
+        if (newFilters.search) params.set('search', newFilters.search)
+        else params.delete('search')
+        if (newFilters.dateFrom) params.set('dateFrom', newFilters.dateFrom)
+        else params.delete('dateFrom')
+        if (newFilters.dateTo) params.set('dateTo', newFilters.dateTo)
+        else params.delete('dateTo')
+        if (newFilters.lotId) params.set('lotId', newFilters.lotId)
+        else params.delete('lotId')
+        params.delete('page')
+        router.replace(`/crm/admin/bookings?${params.toString()}`)
+    }
+
+    const handlePageChange = (newPage: number) => {
+        setPage(newPage)
+        const params = new URLSearchParams(searchParams.toString())
+        params.set('page', String(newPage))
+        router.replace(`/crm/admin/bookings?${params.toString()}`)
+    }
+
+    if (error) {
+        return (
+            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
+                <p className="text-red-800">❌ {error}</p>
+                <button
+                    onClick={loadBookings}
+                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
+                >
+                    Thử lại
+                </button>
+            </div>
+        )
+    }
+
+    return (
+        <div className="space-y-6">
+            <div>
+                <h1 className="text-3xl font-bold text-gray-900">Quản lý đặt phòng</h1>
+                <p className="mt-2 text-gray-600">
+                    Xem và quản lý tất cả đơn đặt phòng
+                </p>
+            </div>
+
+            <BookingFilterBar filters={filters} onFiltersChange={handleFilterChange} />
+
+            {loading ? (
+                <div className="bg-white rounded-lg shadow p-8 text-center">
+                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
+                    <p className="mt-4 text-gray-600">Đang tải đơn đặt phòng...</p>
+                </div>
+            ) : bookings.length === 0 ? (
+                <div className="bg-white rounded-lg shadow p-8 text-center">
+                    <p className="text-gray-600">Không có đơn đặt phòng nào</p>
+                </div>
+            ) : (
+                <>
+                    <AdminBookingTable bookings={bookings} />
+
+                    {/* Pagination */}
+                    {totalPages > 1 && (
+                        <div className="flex items-center justify-between bg-white rounded-lg shadow px-6 py-4">
+                            <div className="text-sm text-gray-700">
+                                Hiển thị <span className="font-medium">{bookings.length}</span> trong tổng số{' '}
+                                <span className="font-medium">{totalCount}</span> đơn
+                            </div>
+                            <div className="flex items-center gap-4">
+                                <span className="text-sm text-gray-700">
+                                    Trang {page} / {totalPages}
+                                </span>
+                                <div className="flex gap-2">
+                                    <button
+                                        onClick={() => handlePageChange(page - 1)}
+                                        disabled={page <= 1}
+                                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
+                                    >
+                                        Trước
+                                    </button>
+                                    <button
+                                        onClick={() => handlePageChange(page + 1)}
+                                        disabled={page >= totalPages}
+                                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
+                                    >
+                                        Sau
+                                    </button>
+                                </div>
+                            </div>
+                        </div>
+                    )}
+                </>
+            )}
+        </div>
+    )
+}
diff --git a/dainganxanh-landing/src/components/admin/AdminBookingDetailClient.tsx b/dainganxanh-landing/src/components/admin/AdminBookingDetailClient.tsx
new file mode 100644
index 00000000..623336b7
--- /dev/null
+++ b/dainganxanh-landing/src/components/admin/AdminBookingDetailClient.tsx
@@ -0,0 +1,126 @@
+'use client'
+
+import { useState, useTransition } from 'react'
+import Link from 'next/link'
+import { useRouter } from 'next/navigation'
+import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
+import BookingStatusBadge from '@/components/crm/BookingStatusBadge'
+import BookingDetail from '@/components/crm/BookingDetail'
+import { confirmBooking, adminCancelBooking } from '@/actions/adminBookings'
+
+interface AdminBookingDetailClientProps {
+    booking: any
+}
+
+export default function AdminBookingDetailClient({ booking }: AdminBookingDetailClientProps) {
+    const router = useRouter()
+    const [isPending, startTransition] = useTransition()
+    const [error, setError] = useState<string | null>(null)
+    const [showCancelModal, setShowCancelModal] = useState(false)
+    const [cancelReason, setCancelReason] = useState('')
+
+    const canConfirm = booking.status === 'pending'
+    const canCancel = ['pending', 'confirmed'].includes(booking.status)
+
+    const handleConfirm = async () => {
+        setError(null)
+        startTransition(async () => {
+            const result = await confirmBooking(booking.id)
+            if (result.error) {
+                setError(result.error)
+            } else {
+                router.refresh()
+            }
+        })
+    }
+
+    const handleCancel = async () => {
+        setError(null)
+        startTransition(async () => {
+            const result = await adminCancelBooking(booking.id, cancelReason)
+            if (result.error) {
+                setError(result.error)
+            } else {
+                setShowCancelModal(false)
+                router.refresh()
+            }
+        })
+    }
+
+    return (
+        <div className="space-y-4">
+            <div className="flex items-center justify-between">
+                <Link
+                    href="/crm/admin/bookings"
+                    className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
+                >
+                    <ArrowLeft className="w-4 h-4" />
+                    <span>Quay lại danh sách</span>
+                </Link>
+
+                <div className="flex items-center gap-2">
+                    {canConfirm && (
+                        <button
+                            onClick={handleConfirm}
+                            disabled={isPending}
+                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
+                        >
+                            <CheckCircle className="w-4 h-4" />
+                            <span>Xác nhận</span>
+                        </button>
+                    )}
+                    {canCancel && (
+                        <button
+                            onClick={() => setShowCancelModal(true)}
+                            disabled={isPending}
+                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
+                        >
+                            <XCircle className="w-4 h-4" />
+                            <span>Hủy đặt phòng</span>
+                        </button>
+                    )}
+                </div>
+            </div>
+
+            {error && (
+                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm">
+                    {error}
+                </div>
+            )}
+
+            <BookingDetail booking={booking} hideCustomerActions hideCheckInInstructions />
+
+            {showCancelModal && (
+                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
+                    <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
+                        <h2 className="text-lg font-bold text-gray-900">Hủy đặt phòng</h2>
+                        <p className="text-sm text-gray-600">
+                            Vui lòng nhập lý do hủy đặt phòng <strong>{booking.code}</strong>.
+                        </p>
+                        <textarea
+                            value={cancelReason}
+                            onChange={(e) => setCancelReason(e.target.value)}
+                            placeholder="Lý do hủy..."
+                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent min-h-[100px]"
+                        />
+                        <div className="flex gap-3 justify-end">
+                            <button
+                                onClick={() => setShowCancelModal(false)}
+                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
+                            >
+                                Đóng
+                            </button>
+                            <button
+                                onClick={handleCancel}
+                                disabled={isPending}
+                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors"
+                            >
+                                {isPending ? 'Đang hủy...' : 'Xác nhận hủy'}
+                            </button>
+                        </div>
+                    </div>
+                </div>
+            )}
+        </div>
+    )
+}
diff --git a/dainganxanh-landing/src/components/admin/AdminBookingTable.tsx b/dainganxanh-landing/src/components/admin/AdminBookingTable.tsx
new file mode 100644
index 00000000..180b445d
--- /dev/null
+++ b/dainganxanh-landing/src/components/admin/AdminBookingTable.tsx
@@ -0,0 +1,99 @@
+'use client'
+
+import Link from 'next/link'
+import { Bed, ArrowRight } from 'lucide-react'
+import BookingStatusBadge from '@/components/crm/BookingStatusBadge'
+import { formatDateVN, formatVND } from '@/lib/date'
+
+export interface AdminBooking {
+    id: string
+    code: string
+    guestName?: string
+    guestPhone?: string
+    guestEmail?: string
+    roomName: string
+    lotName: string
+    checkInDate: string
+    checkOutDate: string
+    guestsCount?: number
+    totalAmount: number
+    status: string
+    paymentMethod?: string
+    createdAt?: string
+}
+
+export interface AdminBookingTableProps {
+    bookings: AdminBooking[]
+}
+
+export default function AdminBookingTable({ bookings }: AdminBookingTableProps) {
+    if (!bookings || bookings.length === 0) {
+        return (
+            <div className="bg-white rounded-2xl border border-emerald-100 p-12 text-center shadow-sm">
+                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
+                    <Bed className="w-8 h-8" />
+                </div>
+                <h3 className="text-lg font-bold text-gray-900 mb-2">Không có đơn đặt phòng nào</h3>
+                <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
+                    Thử điều chỉnh bộ lọc hoặc quay lại sau.
+                </p>
+            </div>
+        )
+    }
+
+    return (
+        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
+            <div className="overflow-x-auto">
+                <table className="w-full text-left text-sm">
+                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
+                        <tr>
+                            <th scope="col" className="px-6 py-4">Mã đặt phòng</th>
+                            <th scope="col" className="px-6 py-4">Khách</th>
+                            <th scope="col" className="px-6 py-4">Phòng</th>
+                            <th scope="col" className="px-6 py-4">Khu vườn</th>
+                            <th scope="col" className="px-6 py-4">Nhận phòng</th>
+                            <th scope="col" className="px-6 py-4">Trả phòng</th>
+                            <th scope="col" className="px-6 py-4">Trạng thái</th>
+                            <th scope="col" className="px-6 py-4 text-right">Tổng tiền</th>
+                        </tr>
+                    </thead>
+                    <tbody className="divide-y divide-gray-100">
+                        {bookings.map((booking) => (
+                            <tr
+                                key={booking.id}
+                                className="hover:bg-gray-50 transition-colors"
+                            >
+                                <td className="px-6 py-4">
+                                    <Link
+                                        href={`/crm/admin/bookings/${booking.id}`}
+                                        className="font-mono font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
+                                    >
+                                        {booking.code}
+                                    </Link>
+                                </td>
+                                <td className="px-6 py-4">
+                                    <div className="space-y-0.5">
+                                        <p className="font-medium text-gray-900">{booking.guestName || 'Không tên'}</p>
+                                        {booking.guestPhone && (
+                                            <p className="text-xs text-gray-500">{booking.guestPhone}</p>
+                                        )}
+                                    </div>
+                                </td>
+                                <td className="px-6 py-4 text-gray-900">{booking.roomName}</td>
+                                <td className="px-6 py-4 text-gray-700">{booking.lotName}</td>
+                                <td className="px-6 py-4 text-gray-900">{formatDateVN(booking.checkInDate)}</td>
+                                <td className="px-6 py-4 text-gray-900">{formatDateVN(booking.checkOutDate)}</td>
+                                <td className="px-6 py-4">
+                                    <BookingStatusBadge status={booking.status} />
+                                </td>
+                                <td className="px-6 py-4 text-right font-semibold text-gray-900">
+                                    {formatVND(booking.totalAmount)}
+                                </td>
+                            </tr>
+                        ))}
+                    </tbody>
+                </table>
+            </div>
+        </div>
+    )
+}
diff --git a/dainganxanh-landing/src/components/admin/AdminSidebar.tsx b/dainganxanh-landing/src/components/admin/AdminSidebar.tsx
index 3b0a0276..40a7122b 100644
--- a/dainganxanh-landing/src/components/admin/AdminSidebar.tsx
+++ b/dainganxanh-landing/src/components/admin/AdminSidebar.tsx
@@ -17,10 +17,12 @@ import {
     UserPlusIcon,
     Bars3Icon,
     XMarkIcon,
+    CalendarIcon,
 } from '@heroicons/react/24/outline'
 
 const navigation = [
     { name: 'Orders', href: '/crm/admin/orders', icon: ClipboardDocumentListIcon },
+    { name: 'Đặt phòng', href: '/crm/admin/bookings', icon: CalendarIcon },
     { name: 'Người dùng', href: '/crm/admin/users', icon: UsersIcon },
     { name: 'Lô cây', href: '/crm/admin/lots', icon: RectangleGroupIcon },
     { name: 'Hoa hồng', href: '/crm/admin/referrals', icon: GiftIcon },
diff --git a/dainganxanh-landing/src/components/admin/BookingFilterBar.tsx b/dainganxanh-landing/src/components/admin/BookingFilterBar.tsx
new file mode 100644
index 00000000..3f845131
--- /dev/null
+++ b/dainganxanh-landing/src/components/admin/BookingFilterBar.tsx
@@ -0,0 +1,99 @@
+'use client'
+
+import { useState, useEffect } from 'react'
+import { AdminBookingFilters } from '@/actions/adminBookings'
+import { useDebounce } from '@/hooks/useDebounce'
+
+interface BookingFilterBarProps {
+    filters: AdminBookingFilters
+    onFiltersChange: (filters: AdminBookingFilters) => void
+}
+
+const statusOptions = [
+    { value: 'all', label: 'Tất cả' },
+    { value: 'pending', label: 'Chờ thanh toán' },
+    { value: 'confirmed', label: 'Đã xác nhận' },
+    { value: 'cancelled', label: 'Đã hủy' },
+    { value: 'completed', label: 'Hoàn thành' },
+    { value: 'no_show', label: 'Khách không đến' },
+]
+
+export default function BookingFilterBar({ filters, onFiltersChange }: BookingFilterBarProps) {
+    const [localFilters, setLocalFilters] = useState(filters)
+    const debouncedSearch = useDebounce(localFilters.search || '', 300)
+
+    useEffect(() => {
+        if (debouncedSearch !== filters.search) {
+            onFiltersChange({ ...localFilters, search: debouncedSearch || undefined })
+        }
+    }, [debouncedSearch])
+
+    const handleChange = (key: keyof AdminBookingFilters, value: string | undefined) => {
+        const newFilters = { ...localFilters, [key]: value }
+        setLocalFilters(newFilters)
+
+        if (key !== 'search') {
+            onFiltersChange(newFilters)
+        }
+    }
+
+    return (
+        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
+            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
+                <div>
+                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
+                        Trạng thái
+                    </label>
+                    <select
+                        value={localFilters.status || 'all'}
+                        onChange={(e) => handleChange('status', e.target.value === 'all' ? undefined : e.target.value)}
+                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
+                    >
+                        {statusOptions.map((option) => (
+                            <option key={option.value} value={option.value}>
+                                {option.label}
+                            </option>
+                        ))}
+                    </select>
+                </div>
+
+                <div>
+                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
+                        Tìm kiếm
+                    </label>
+                    <input
+                        type="text"
+                        placeholder="Mã, tên khách, SĐT, email"
+                        value={localFilters.search || ''}
+                        onChange={(e) => handleChange('search', e.target.value || undefined)}
+                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
+                    />
+                </div>
+
+                <div>
+                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
+                        Từ ngày
+                    </label>
+                    <input
+                        type="date"
+                        value={localFilters.dateFrom || ''}
+                        onChange={(e) => handleChange('dateFrom', e.target.value || undefined)}
+                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
+                    />
+                </div>
+
+                <div>
+                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
+                        Đến ngày
+                    </label>
+                    <input
+                        type="date"
+                        value={localFilters.dateTo || ''}
+                        onChange={(e) => handleChange('dateTo', e.target.value || undefined)}
+                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
+                    />
+                </div>
+            </div>
+        </div>
+    )
+}
diff --git a/dainganxanh-landing/src/components/crm/BookingDetail.tsx b/dainganxanh-landing/src/components/crm/BookingDetail.tsx
index cfd373bc..51b53289 100644
--- a/dainganxanh-landing/src/components/crm/BookingDetail.tsx
+++ b/dainganxanh-landing/src/components/crm/BookingDetail.tsx
@@ -49,9 +49,13 @@ export interface MyBookingDetail {
 
 export interface BookingDetailProps {
     booking: MyBookingDetail
+    /** Ẩn action của khách (tiếp tục thanh toán / hủy) — dùng trong admin view. */
+    hideCustomerActions?: boolean
+    /** Ẩn hướng dẫn nhận phòng — dùng trong admin view. */
+    hideCheckInInstructions?: boolean
 }
 
-export default function BookingDetail({ booking }: BookingDetailProps) {
+export default function BookingDetail({ booking, hideCustomerActions = false, hideCheckInInstructions = false }: BookingDetailProps) {
     const router = useRouter()
 
     const [now, setNow] = useState(Date.now())
@@ -112,7 +116,7 @@ export default function BookingDetail({ booking }: BookingDetailProps) {
                 </div>
 
                 {/* Conditional Pending/Confirmed Actions */}
-                {showPaymentAction && (
+                {showPaymentAction && !hideCustomerActions && (
                     <div className="flex flex-wrap items-center gap-3 pt-2 md:pt-0">
                         {isPending && (
                             <CancelBookingButton
@@ -168,7 +172,7 @@ export default function BookingDetail({ booking }: BookingDetailProps) {
             )}
 
             {/* Check-in instructions when confirmed or completed */}
-            {isConfirmedOrCompleted && (
+            {isConfirmedOrCompleted && !hideCheckInInstructions && (
                 <CheckInInstructions
                     roomName={booking.roomName}
                     lotName={booking.lotName}
