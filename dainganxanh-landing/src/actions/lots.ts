'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

interface LotData {
    name: string
    region: string
    description?: string | null
    total_trees: number
    location_lat?: number | null
    location_lng?: number | null
}

interface LotActionResult {
    success: boolean
    error?: string
}

async function verifyAdminRole(): Promise<{ userId: string | null; error: string | null }> {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { userId: null, error: 'Unauthorized' }
    }

    const serviceClient = createServiceRoleClient()
    const { data: profile, error: profileError } = await serviceClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        return { userId: null, error: 'Không thể xác minh quyền truy cập' }
    }

    if (!['admin', 'super_admin'].includes(profile.role)) {
        return { userId: null, error: 'Bạn không có quyền thực hiện hành động này' }
    }

    return { userId: user.id, error: null }
}

export async function createLot(data: LotData): Promise<LotActionResult> {
    const { userId, error: authError } = await verifyAdminRole()
    if (!userId) {
        return { success: false, error: authError ?? 'Unauthorized' }
    }

    const serviceClient = createServiceRoleClient()

    const lotData: Record<string, unknown> = {
        name: data.name.trim(),
        region: data.region.trim(),
        description: data.description?.trim() || null,
        total_trees: data.total_trees,
        planted: 0,
    }

    if (data.location_lat != null && data.location_lng != null) {
        lotData.location_lat = data.location_lat
        lotData.location_lng = data.location_lng
    }

    const { error: insertError } = await serviceClient
        .from('lots')
        .insert([lotData])

    if (insertError) {
        console.error('Error creating lot:', insertError)
        return { success: false, error: insertError.message || 'Không thể tạo lô cây' }
    }

    return { success: true }
}

export async function updateLot(lotId: string, data: LotData): Promise<LotActionResult> {
    const { userId, error: authError } = await verifyAdminRole()
    if (!userId) {
        return { success: false, error: authError ?? 'Unauthorized' }
    }

    const serviceClient = createServiceRoleClient()

    const lotData: Record<string, unknown> = {
        name: data.name.trim(),
        region: data.region.trim(),
        description: data.description?.trim() || null,
        total_trees: data.total_trees,
    }

    if (data.location_lat != null && data.location_lng != null) {
        lotData.location_lat = data.location_lat
        lotData.location_lng = data.location_lng
    } else {
        lotData.location_lat = null
        lotData.location_lng = null
    }

    const { error: updateError } = await serviceClient
        .from('lots')
        .update(lotData)
        .eq('id', lotId)

    if (updateError) {
        console.error('Error updating lot:', updateError)
        return { success: false, error: updateError.message || 'Không thể cập nhật lô cây' }
    }

    return { success: true }
}

