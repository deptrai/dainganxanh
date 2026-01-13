'use server'

import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server'

interface PrintQueueResult {
    success: boolean
    error?: string
    queueId?: string
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Validate UUID format
 */
function isValidUUID(id: string): boolean {
    return UUID_REGEX.test(id)
}

/**
 * Sanitize tracking number - only allow alphanumeric and dash
 */
function sanitizeTrackingNumber(trackingNumber: string): string {
    return trackingNumber.replace(/[^a-zA-Z0-9-]/g, '').substring(0, 50)
}

/**
 * Check if current user is admin
 * @returns true if user is admin, false otherwise
 */
async function requireAdminAuth(): Promise<{ isAdmin: boolean; error?: string }> {
    try {
        const supabase = await createServerClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { isAdmin: false, error: 'Bạn cần đăng nhập để thực hiện hành động này' }
        }

        // Check if user has admin role in users table
        const serviceClient = createServiceRoleClient()
        const { data: profile, error: profileError } = await serviceClient
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            return { isAdmin: false, error: 'Không thể xác minh quyền truy cập' }
        }

        if (profile.role !== 'admin') {
            return { isAdmin: false, error: 'Bạn không có quyền thực hiện hành động này' }
        }

        return { isAdmin: true }
    } catch (error) {
        console.error('Admin auth check error:', error)
        return { isAdmin: false, error: 'Lỗi xác thực' }
    }
}

/**
 * Mark an order for physical printing and postal delivery
 */
export async function markOrderForPrint(orderId: string): Promise<PrintQueueResult> {
    try {
        // Validate UUID format
        if (!orderId || !isValidUUID(orderId)) {
            return { success: false, error: 'ID đơn hàng không hợp lệ' }
        }

        // Check admin authorization
        const authResult = await requireAdminAuth()
        if (!authResult.isAdmin) {
            return { success: false, error: authResult.error }
        }

        const supabase = createServiceRoleClient()

        // Check if order exists and has contract
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, contract_url, status')
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            return { success: false, error: 'Không tìm thấy đơn hàng' }
        }

        if (!order.contract_url) {
            return { success: false, error: 'Đơn hàng chưa có hợp đồng' }
        }

        // Check if already in print queue
        const { data: existing } = await supabase
            .from('print_queue')
            .select('id')
            .eq('order_id', orderId)
            .single()

        if (existing) {
            return { success: false, error: 'Đơn hàng đã có trong hàng đợi in' }
        }

        // Add to print queue
        const { data: queue, error: queueError } = await supabase
            .from('print_queue')
            .insert({
                order_id: orderId,
                status: 'pending',
            })
            .select('id')
            .single()

        if (queueError) {
            console.error('Error adding to print queue:', queueError)
            return { success: false, error: 'Không thể thêm vào hàng đợi in' }
        }

        return {
            success: true,
            queueId: queue.id,
        }
    } catch (error) {
        console.error('markOrderForPrint error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
        }
    }
}

/**
 * Resend contract email to user (reuses existing send-email Edge Function)
 */
export async function resendContract(orderId: string): Promise<PrintQueueResult> {
    try {
        // Validate UUID format
        if (!orderId || !isValidUUID(orderId)) {
            return { success: false, error: 'ID đơn hàng không hợp lệ' }
        }

        // Check admin authorization
        const authResult = await requireAdminAuth()
        if (!authResult.isAdmin) {
            return { success: false, error: authResult.error }
        }

        const supabase = createServiceRoleClient()

        // Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, user_id, order_code, quantity, total_amount, contract_url')
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            return { success: false, error: 'Không tìm thấy đơn hàng' }
        }

        if (!order.contract_url) {
            return { success: false, error: 'Đơn hàng chưa có hợp đồng' }
        }

        // Get user details
        const { data: user } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', order.user_id)
            .single()

        if (!user?.email) {
            return { success: false, error: 'Không tìm thấy email người dùng' }
        }

        // Get tree codes
        const { data: trees } = await supabase
            .from('trees')
            .select('code')
            .eq('order_id', orderId)

        const treeCodes = trees?.map(t => t.code) || []

        // Call send-email Edge Function
        const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`

        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
                orderId: order.id,
                userId: order.user_id,
                userEmail: user.email,
                userName: user.full_name || 'Bạn',
                orderCode: order.order_code,
                quantity: order.quantity,
                totalAmount: order.total_amount,
                treeCodes,
                contractPdfUrl: order.contract_url,
            }),
        })

        if (!response.ok) {
            return { success: false, error: 'Không thể gửi email' }
        }

        return { success: true }
    } catch (error) {
        console.error('resendContract error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
        }
    }
}

/**
 * Update print queue status
 */
export async function updatePrintStatus(
    queueId: string,
    status: 'pending' | 'printed' | 'shipped',
    trackingNumber?: string
): Promise<PrintQueueResult> {
    try {
        // Validate UUID format
        if (!queueId || !isValidUUID(queueId)) {
            return { success: false, error: 'ID không hợp lệ' }
        }

        // Validate status
        const validStatuses = ['pending', 'printed', 'shipped']
        if (!validStatuses.includes(status)) {
            return { success: false, error: 'Trạng thái không hợp lệ' }
        }

        // Check admin authorization
        const authResult = await requireAdminAuth()
        if (!authResult.isAdmin) {
            return { success: false, error: authResult.error }
        }

        const supabase = createServiceRoleClient()

        interface UpdateData {
            status: string
            printed_at?: string
            shipped_at?: string
            tracking_number?: string
        }

        const updateData: UpdateData = { status }

        if (status === 'printed') {
            updateData.printed_at = new Date().toISOString()
        } else if (status === 'shipped') {
            updateData.shipped_at = new Date().toISOString()
            if (trackingNumber) {
                // Sanitize tracking number
                updateData.tracking_number = sanitizeTrackingNumber(trackingNumber)
            }
        }

        const { error } = await supabase
            .from('print_queue')
            .update(updateData)
            .eq('id', queueId)

        if (error) {
            console.error('Error updating print status:', error)
            return { success: false, error: 'Không thể cập nhật trạng thái' }
        }

        return { success: true }
    } catch (error) {
        console.error('updatePrintStatus error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
        }
    }
}

/**
 * Get pending print queue items
 */
export async function getPrintQueue() {
    try {
        // Check admin authorization
        const authResult = await requireAdminAuth()
        if (!authResult.isAdmin) {
            return { success: false, error: authResult.error, data: [] }
        }

        const supabase = createServiceRoleClient()

        // Fetch print queue with orders
        const { data: queueData, error: queueError } = await supabase
            .from('print_queue')
            .select(`
                id,
                order_id,
                status,
                printed_at,
                shipped_at,
                tracking_number,
                created_at
            `)
            .order('created_at', { ascending: false })

        if (queueError) {
            console.error('Error fetching print queue:', queueError)
            return { success: false, error: 'Không thể tải hàng đợi in', data: [] }
        }

        if (!queueData || queueData.length === 0) {
            return { success: true, data: [] }
        }

        // Get unique order IDs
        const orderIds = [...new Set(queueData.map(item => item.order_id))]

        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('id, order_code, quantity, total_amount, contract_url, user_id')
            .in('id', orderIds)

        if (ordersError) {
            console.error('Error fetching orders:', ordersError)
            return { success: false, error: 'Không thể tải thông tin đơn hàng', data: [] }
        }

        // Get unique user IDs
        const userIds = [...new Set(ordersData?.map(order => order.user_id).filter(Boolean) || [])]

        // Fetch users
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, full_name, email')
            .in('id', userIds)

        if (usersError) {
            console.error('Error fetching users:', usersError)
            // Continue without user data rather than failing completely
        }

        // Create lookup maps
        const usersMap = (usersData || []).reduce((acc, user) => {
            acc[user.id] = user
            return acc
        }, {} as Record<string, any>)

        const ordersMap = (ordersData || []).reduce((acc, order) => {
            acc[order.id] = {
                ...order,
                users: usersMap[order.user_id] || { full_name: 'N/A', email: 'N/A' }
            }
            return acc
        }, {} as Record<string, any>)

        // Combine data
        const result = queueData.map(item => ({
            ...item,
            orders: ordersMap[item.order_id] || {
                order_code: 'N/A',
                quantity: 0,
                total_amount: 0,
                contract_url: null,
                users: { full_name: 'N/A', email: 'N/A' }
            }
        }))

        return { success: true, data: result }
    } catch (error) {
        console.error('getPrintQueue error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
            data: [],
        }
    }
}
