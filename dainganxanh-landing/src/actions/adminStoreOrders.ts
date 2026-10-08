'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { captureError } from '@/lib/monitoring'
import { StoreOrderStatus } from '@/lib/store-order-status'

const ALLOWED_TRANSITIONS: Record<StoreOrderStatus, StoreOrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
}

/**
 * Verify current user has admin or super_admin role
 */
export async function verifyAdmin() {
    const supabase = await createServerClient()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        throw new Error('Unauthorized')
    }

    const serviceSupabase = createServiceRoleClient()
    const { data: profile, error: profileError } = await serviceSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
        throw new Error('Forbidden')
    }

    return { user, profile }
}

export interface UpdateStoreOrderStatusOptions {
    trackingNumber?: string
    cancellationReason?: string
}

/**
 * Transition store order status with validation, concurrency check, and stock ops
 */
export async function updateStoreOrderStatus(
    orderId: string,
    nextStatus: StoreOrderStatus,
    opts?: UpdateStoreOrderStatusOptions
): Promise<{ success: boolean; error?: string }> {
    try {
        await verifyAdmin()
    } catch {
        return { success: false, error: 'Bạn không có quyền thực hiện thao tác này' }
    }

    try {
        const serviceSupabase = createServiceRoleClient()

        // 1. Fetch current order
        const { data: order, error: fetchError } = await serviceSupabase
            .from('store_orders')
            .select('id, status')
            .eq('id', orderId)
            .maybeSingle()

        if (fetchError || !order) {
            return { success: false, error: 'Không tìm thấy đơn hàng' }
        }

        const currentStatus = order.status as StoreOrderStatus
        const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || []

        if (!allowedNext.includes(nextStatus)) {
            return { success: false, error: 'Chuyển trạng thái không hợp lệ' }
        }

        // 2. Validate tracking number for shipped
        if (nextStatus === 'shipped') {
            const tracking = opts?.trackingNumber?.trim()
            if (!tracking) {
                return { success: false, error: 'Vui lòng nhập mã vận đơn' }
            }
        }

        // 3. Pre-fetch items if stock operations are needed
        let items: { product_id: string; quantity: number }[] | null = null
        if (nextStatus === 'confirmed' || nextStatus === 'cancelled') {
            const { data: fetchedItems, error: itemsError } = await serviceSupabase
                .from('store_order_items')
                .select('product_id, quantity')
                .eq('store_order_id', orderId)

            if (itemsError) {
                return { success: false, error: 'Không thể đọc chi tiết đơn hàng' }
            }
            items = fetchedItems
        }

        // 4. Build update payload
        const updatePayload: Record<string, any> = {
            status: nextStatus,
            updated_at: new Date().toISOString(),
        }

        if (nextStatus === 'shipped') {
            updatePayload.tracking_number = opts!.trackingNumber!.trim()
        }

        if (nextStatus === 'cancelled') {
            updatePayload.cancellation_reason = opts?.cancellationReason?.trim() || 'Admin hủy đơn'
        }

        // 5. Conditional update to prevent race conditions
        const { data: updatedRows, error: updateError } = await serviceSupabase
            .from('store_orders')
            .update(updatePayload)
            .eq('id', orderId)
            .eq('status', currentStatus)
            .select('id')

        if (updateError) {
            return { success: false, error: updateError.message }
        }

        if (!updatedRows || updatedRows.length === 0) {
            return { success: false, error: 'Trạng thái đơn hàng đã thay đổi' }
        }

        // 6. Stock operations (post-flip)
        if (nextStatus === 'confirmed' && items && items.length > 0) {
            for (const item of items) {
                const { error: stockError } = await serviceSupabase.rpc('confirm_product_stock', {
                    p_product_id: item.product_id,
                    p_qty: item.quantity,
                })
                if (stockError) {
                    const errMsg = (stockError as any)?.message || String(stockError)
                    captureError(
                        stockError instanceof Error ? stockError : new Error(errMsg),
                        {
                            route: 'updateStoreOrderStatus',
                            orderId,
                            action: 'confirm_product_stock',
                            productId: item.product_id,
                        }
                    )
                }
            }
        }

        if (nextStatus === 'cancelled' && items && items.length > 0) {
            for (const item of items) {
                const { error: stockError } = await serviceSupabase.rpc('release_product_stock', {
                    p_product_id: item.product_id,
                    p_qty: item.quantity,
                })
                if (stockError) {
                    const errMsg = (stockError as any)?.message || String(stockError)
                    captureError(
                        stockError instanceof Error ? stockError : new Error(errMsg),
                        {
                            route: 'updateStoreOrderStatus',
                            orderId,
                            action: 'release_product_stock',
                            productId: item.product_id,
                        }
                    )
                }
            }
        }

        // 7. Revalidate paths
        try {
            revalidatePath('/crm/admin/store-orders')
            revalidatePath('/crm/my-store-orders')
        } catch {
            // best-effort
        }

        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message || 'Lỗi hệ thống khi cập nhật trạng thái đơn hàng' }
    }
}
