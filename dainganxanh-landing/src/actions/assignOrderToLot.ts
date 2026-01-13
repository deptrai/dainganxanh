'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateTreeCodes } from '@/lib/utils/treeCode'

interface AssignOrderToLotResult {
    success: boolean
    error?: string
    treeCodes?: string[]
}

/**
 * Assign a verified order to a lot
 * - Generates tree codes
 * - Creates trees records
 * - Updates order status to 'assigned'
 * - Updates lot planted count
 */
export async function assignOrderToLot(
    orderId: string,
    lotId: string
): Promise<AssignOrderToLotResult> {
    try {
        const supabase = createServiceRoleClient()

        // 1. Fetch order details
        console.log('[assignOrderToLot] Querying order:', orderId)
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, quantity, user_id, status')
            .eq('id', orderId)
            .single()

        console.log('[assignOrderToLot] Order query result:', { order, orderError })

        if (orderError || !order) {
            console.error('[assignOrderToLot] Order not found:', { orderId, orderError })
            return { success: false, error: 'Không tìm thấy đơn hàng' }
        }

        // Validate order status (must be completed or verified)
        if (!['completed', 'verified'].includes(order.status)) {
            return {
                success: false,
                error: 'Đơn hàng chưa được xác minh',
            }
        }

        // 2. Fetch lot details and check capacity
        const { data: lot, error: lotError } = await supabase
            .from('lots')
            .select('id, name, region, description, location_lat, location_lng, total_trees, planted')
            .eq('id', lotId)
            .single()

        if (lotError || !lot) {
            return { success: false, error: 'Không tìm thấy lô cây' }
        }

        const availableSpace = lot.total_trees - lot.planted
        if (availableSpace < order.quantity) {
            return {
                success: false,
                error: `Lô ${lot.name} không đủ sức chứa. Còn trống: ${availableSpace} cây, cần: ${order.quantity} cây`,
            }
        }

        // 3. Generate tree codes
        const treeCodes = generateTreeCodes(order.id, order.quantity)

        // 4. Create trees records
        const treesData = treeCodes.map((code) => ({
            code,
            order_id: order.id,
            user_id: order.user_id,
            status: 'active',
        }))

        const { error: treesError } = await supabase
            .from('trees')
            .insert(treesData)

        if (treesError) {
            console.error('Error creating trees:', treesError)
            console.error('Trees data:', treesData)
            console.error('Order user_id:', order.user_id)
            return {
                success: false,
                error: `Không thể tạo mã cây: ${treesError.message || treesError.code || 'Unknown error'}`,
            }
        }

        // 5. Update order status and lot_id
        const { error: updateOrderError } = await supabase
            .from('orders')
            .update({
                status: 'assigned',
                lot_id: lotId,
                tree_status: 'assigned',
            })
            .eq('id', orderId)

        if (updateOrderError) {
            console.error('Error updating order:', updateOrderError)
            return {
                success: false,
                error: 'Không thể cập nhật đơn hàng',
            }
        }

        // 6. Update lot planted count
        const { error: updateLotError } = await supabase
            .from('lots')
            .update({
                planted: lot.planted + order.quantity,
            })
            .eq('id', lotId)

        if (updateLotError) {
            console.error('Error updating lot:', updateLotError)
            // Note: This is a critical error but trees and order are already updated
            // In production, we should use database transactions
            return {
                success: false,
                error: 'Không thể cập nhật sức chứa lô',
            }
        }

        // 7. Send email notification to user
        try {
            // Fetch user email
            const { data: userData } = await supabase
                .from('users')
                .select('email, full_name')
                .eq('id', order.user_id)
                .single()

            if (userData?.email) {
                // Call Supabase Edge Function to send email
                const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-tree-assignment-email`

                await fetch(functionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                    },
                    body: JSON.stringify({
                        orderId: order.id,
                        userId: order.user_id,
                        userEmail: userData.email,
                        userName: userData.full_name || 'Bạn',
                        treeCodes,
                        lotName: lot.name,
                        lotRegion: lot.region,
                        lotDescription: lot.description,
                        lotLocationLat: lot.location_lat,
                        lotLocationLng: lot.location_lng,
                    }),
                })
            }
        } catch (emailError) {
            // Log but don't fail the assignment if email fails
            console.error('Failed to send email notification:', emailError)
        }

        return {
            success: true,
            treeCodes,
        }
    } catch (error) {
        console.error('Assignment error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Lỗi không xác định',
        }
    }
}
