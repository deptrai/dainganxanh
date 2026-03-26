'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function submitSellBack(orderId: string) {
    // Verify the user is authenticated and owns this order
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Bạn chưa đăng nhập.' }
    }

    // Verify ownership
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, user_id, total_amount, status, code, created_at')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single()

    if (orderError || !order) {
        return { success: false, error: 'Không tìm thấy đơn hàng.' }
    }

    if (['harvested', 'harvested_sellback', 'harvested_receive_product', 'keep_growing'].includes(order.status)) {
        return { success: false, error: 'Đơn hàng này đã được thu hoạch hoặc đang tiếp tục nuôi.' }
    }

    // Calculate buyback price (2x original for 5-year trees)
    const buybackMultiplier = 2
    const buybackPrice = Math.round(Number(order.total_amount) * buybackMultiplier)

    // Use service role to bypass RLS for the update
    const adminSupabase = createServiceRoleClient()

    // Update order status
    const { error: updateError } = await adminSupabase
        .from('orders')
        .update({
            status: 'harvested_sellback',
            updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

    if (updateError) {
        console.error('Error updating order for sell back:', updateError)
        return { success: false, error: 'Có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại.' }
    }

    // Create a harvest record in the orders metadata or a separate log
    // We insert a record into a harvest_requests table if it exists,
    // otherwise we just rely on the order status change
    try {
        await adminSupabase
            .from('harvest_requests')
            .insert({
                order_id: orderId,
                user_id: user.id,
                type: 'sell_back',
                buyback_price: buybackPrice,
                original_amount: Number(order.total_amount),
                status: 'pending_payment',
                created_at: new Date().toISOString(),
            })
    } catch {
        // Table may not exist yet — the order status update is the primary record
        console.warn('harvest_requests table insert skipped (table may not exist)')
    }

    return {
        success: true,
        buybackPrice,
        message: 'Yêu cầu bán lại đã được ghi nhận. Đại Ngàn Xanh sẽ thanh toán trong vòng 30 ngày.',
    }
}

// --- Story 2.7: Keep Growing ---

export async function submitKeepGrowing(orderId: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Bạn cần đăng nhập để thực hiện thao tác này.' }
    }

    // Verify ownership
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, user_id, status')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single()

    if (orderError || !order) {
        return { success: false, error: 'Không tìm thấy đơn hàng.' }
    }

    if (order.status === 'keep_growing') {
        return { success: false, error: 'Cây này đã được đăng ký tiếp tục nuôi.' }
    }

    if (order.status === 'harvested' || order.status === 'harvested_sellback' || order.status === 'harvested_receive_product') {
        return { success: false, error: 'Đơn hàng này đã được thu hoạch.' }
    }

    const adminSupabase = createServiceRoleClient()

    // Update trees for this order
    const { error: treeError } = await adminSupabase
        .from('trees')
        .update({
            status: 'keep_growing',
            updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)

    if (treeError) {
        console.error('Error updating tree status for keep growing:', treeError)
        return { success: false, error: 'Không thể cập nhật trạng thái cây. Vui lòng thử lại.' }
    }

    // Update order status
    const { error: updateError } = await adminSupabase
        .from('orders')
        .update({
            status: 'keep_growing',
            updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

    if (updateError) {
        console.error('Error updating order for keep growing:', updateError)
        return { success: false, error: 'Không thể cập nhật đơn hàng. Vui lòng thử lại.' }
    }

    // Create harvest request record
    try {
        await adminSupabase
            .from('harvest_requests')
            .insert({
                order_id: orderId,
                user_id: user.id,
                type: 'keep_growing',
                status: 'confirmed',
                created_at: new Date().toISOString(),
            })
    } catch {
        // Table may not exist yet — the order status update is the primary record
        console.warn('harvest_requests table insert skipped (table may not exist)')
    }

    return { success: true }
}

// --- Story 2.8: Receive Product ---

export interface ShippingAddress {
    fullName: string
    phone: string
    address: string
    city: string
    district: string
    ward: string
    notes?: string
}

export async function submitReceiveProduct(
    orderId: string,
    productType: string,
    shippingAddress: ShippingAddress
) {
    const supabase = await createServerClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'Bạn cần đăng nhập để thực hiện thao tác này.' }
    }

    // Verify the order belongs to the user
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, user_id, status, code')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single()

    if (orderError || !order) {
        return { success: false, error: 'Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.' }
    }

    if (['harvested', 'harvested_receive_product', 'harvested_sellback', 'keep_growing'].includes(order.status)) {
        return { success: false, error: 'Đơn hàng này đã được thu hoạch hoặc đang tiếp tục nuôi.' }
    }

    // Validate product type
    const validProducts = ['tinh-dau-tram-huong', 'go-tram-tho', 'vong-tay-tram-huong', 'nhang-tram']
    if (!validProducts.includes(productType)) {
        return { success: false, error: 'Loại sản phẩm không hợp lệ.' }
    }

    // Validate shipping address
    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address ||
        !shippingAddress.city || !shippingAddress.district || !shippingAddress.ward) {
        return { success: false, error: 'Vui lòng điền đầy đủ thông tin giao hàng.' }
    }

    // Validate phone number format
    const phoneRegex = /^(0|\+84)\d{9,10}$/
    if (!phoneRegex.test(shippingAddress.phone.replace(/\s/g, ''))) {
        return { success: false, error: 'Số điện thoại không hợp lệ.' }
    }

    const adminSupabase = createServiceRoleClient()

    // Update order status
    const { error: updateError } = await adminSupabase
        .from('orders')
        .update({
            status: 'harvested_receive_product',
            updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

    if (updateError) {
        console.error('Error updating order for receive product:', updateError)
        return { success: false, error: 'Có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại.' }
    }

    // Create harvest request record
    try {
        await adminSupabase
            .from('harvest_requests')
            .insert({
                order_id: orderId,
                user_id: user.id,
                type: 'receive_product',
                product_type: productType,
                shipping_address: shippingAddress,
                status: 'pending_fulfillment',
                created_at: new Date().toISOString(),
            })
    } catch {
        // Table may not exist yet — the order status update is the primary record
        console.warn('harvest_requests table insert skipped (table may not exist)')
    }

    return {
        success: true,
        message: 'Yêu cầu nhận sản phẩm đã được ghi nhận thành công! Chúng tôi sẽ liên hệ bạn trong vòng 3-5 ngày làm việc.',
    }
}
