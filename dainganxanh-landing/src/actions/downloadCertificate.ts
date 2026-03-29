'use server'

import { createServerClient } from '@/lib/supabase/server'

export async function downloadCertificate(orderId: string): Promise<{
    success: boolean
    pdfUrl?: string
    error?: string
}> {
    try {
        const supabase = await createServerClient()

        // Check authentication
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Chưa đăng nhập' }
        }

        // Fetch order with auth check (RLS automatic)
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                id,
                order_code,
                quantity,
                created_at,
                user_id,
                users!inner (full_name, email),
                lots (name, region),
                trees (code, planted_at)
            `)
            .eq('id', orderId)
            .eq('user_id', user.id)
            .single()

        if (orderError || !order) {
            console.error('Order fetch error:', orderError)
            return { success: false, error: 'Không tìm thấy đơn hàng' }
        }

        // Prepare tree codes
        const treeCodes = order.trees?.map((t: any) => t.code) || []
        const plantedAt = order.trees?.[0]?.planted_at

        // Call Edge Function
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!baseUrl || !serviceKey) {
            return { success: false, error: 'Cấu hình hệ thống không hợp lệ' }
        }

        const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dainganxanh.com.vn'}/crm/my-garden/${orderId}?verify=true`

        const response = await fetch(`${baseUrl}/functions/v1/generate-certificate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
                orderId: order.id,
                orderCode: order.order_code,
                userName: (order.users as any).full_name,
                userEmail: (order.users as any).email,
                quantity: order.quantity,
                treeCodes,
                lotName: order.lots?.name,
                lotRegion: order.lots?.region,
                plantedAt,
                verifyUrl,
                userId: user.id,
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Edge function error:', errorData)
            return { success: false, error: 'Không thể tạo chứng chỉ' }
        }

        const { filePath } = await response.json()

        // Generate signed URL (24h expiry)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('certificates')
            .createSignedUrl(filePath, 86400) // 24 hours

        if (signedUrlError || !signedUrlData) {
            console.error('Signed URL error:', signedUrlError)
            return { success: false, error: 'Không thể tạo liên kết tải xuống' }
        }

        return { success: true, pdfUrl: signedUrlData.signedUrl }
    } catch (error) {
        console.error('Download certificate error:', error)
        return {
            success: false,
            error: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
        }
    }
}
