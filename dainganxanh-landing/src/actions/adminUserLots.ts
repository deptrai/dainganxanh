'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { LotScopedRole } from '@/types/admin'
import { getAdminUserLots } from '@/lib/admin/permissions'

export interface AdminUserLotAssignment {
    id: string
    user_id: string
    lot_id: string
    lot_name: string
    lot_region: string
    role: LotScopedRole
    created_at: string
    updated_at: string
}

export interface AssignLotResult {
    success: boolean
    error?: string
}

async function requireSuperAdmin(userId: string): Promise<{ error?: string }> {
    const serviceClient = createServiceRoleClient()
    const { data: profile, error } = await serviceClient
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

    if (error || !profile) {
        return { error: 'Không thể xác minh quyền truy cập' }
    }

    if (profile.role !== 'super_admin') {
        return { error: 'Chỉ super_admin mới có quyền quản lý phân quyền lô' }
    }

    return {}
}

async function auditAssign(
    adminId: string,
    action: 'lot_assign' | 'lot_remove',
    targetUserId: string,
    metadata: Record<string, unknown>
) {
    const serviceClient = createServiceRoleClient()
    const { error } = await serviceClient.from('admin_audit_log').insert({
        admin_id: adminId,
        action,
        target_id: targetUserId,
        metadata,
    })

    if (error) {
        console.error('Failed to write admin audit log:', error)
    }
}

export async function fetchUserLotAssignments(userId: string): Promise<{
    assignments: AdminUserLotAssignment[]
    error?: string
}> {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { assignments: [], error: 'Unauthorized' }
    }

    const requireResult = await requireSuperAdmin(user.id)
    if (requireResult.error) {
        return { assignments: [], error: requireResult.error }
    }

    const assignments = await getAdminUserLots(userId)
    const lotIds = assignments.map((a) => a.lot_id)

    let lotMap: Record<string, { name: string; region: string }> = {}
    if (lotIds.length > 0) {
        const serviceClient = createServiceRoleClient()
        const { data: lots } = await serviceClient.from('lots').select('id, name, region').in('id', lotIds)
        ;(lots || []).forEach((lot: any) => {
            lotMap[lot.id] = { name: lot.name, region: lot.region }
        })
    }

    return {
        assignments: assignments.map((a) => ({
            ...a,
            lot_name: lotMap[a.lot_id]?.name || '—',
            lot_region: lotMap[a.lot_id]?.region || '—',
        })) as AdminUserLotAssignment[],
    }
}

export async function assignLotToUser(
    targetUserId: string,
    lotId: string,
    role: LotScopedRole
): Promise<AssignLotResult> {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { success: false, error: 'Unauthorized' }
    }

    const requireResult = await requireSuperAdmin(user.id)
    if (requireResult.error) {
        return { success: false, error: requireResult.error }
    }

    if (!['resort_manager', 'store_staff', 'super_admin'].includes(role)) {
        return { success: false, error: 'Role không hợp lệ' }
    }

    const serviceClient = createServiceRoleClient()

    const { data: targetUser } = await serviceClient
        .from('users')
        .select('id')
        .eq('id', targetUserId)
        .single()

    if (!targetUser) {
        return { success: false, error: 'Người dùng không tồn tại' }
    }

    const { data: lot } = await serviceClient.from('lots').select('id').eq('id', lotId).single()
    if (!lot) {
        return { success: false, error: 'Lô không tồn tại' }
    }

    // Check for existing assignment to preserve created_by on role change
    const { data: existingAssignment } = await serviceClient
        .from('admin_user_lots')
        .select('id, created_by')
        .eq('user_id', targetUserId)
        .eq('lot_id', lotId)
        .single()

    const assignData: Record<string, unknown> = {
        user_id: targetUserId,
        lot_id: lotId,
        role,
        updated_at: new Date().toISOString(),
    }

    // Only set created_by on insert, not on role change
    if (!existingAssignment) {
        assignData.created_by = user.id
    }

    const { error: upsertError } = await serviceClient.from('admin_user_lots').upsert(
        assignData,
        { onConflict: 'user_id,lot_id', ignoreDuplicates: false }
    )

    if (upsertError) {
        console.error('assignLotToUser error:', upsertError)
        return { success: false, error: upsertError.message || 'Không thể gán lô' }
    }

    await auditAssign(user.id, 'lot_assign', targetUserId, {
        lot_id: lotId,
        role,
        assigned_by: user.id,
    })

    return { success: true }
}

export async function removeLotFromUser(
    targetUserId: string,
    lotId: string
): Promise<AssignLotResult> {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { success: false, error: 'Unauthorized' }
    }

    const requireResult = await requireSuperAdmin(user.id)
    if (requireResult.error) {
        return { success: false, error: requireResult.error }
    }

    const serviceClient = createServiceRoleClient()

    const { data: existing } = await serviceClient
        .from('admin_user_lots')
        .select('role')
        .eq('user_id', targetUserId)
        .eq('lot_id', lotId)
        .single()

    if (!existing) {
        return { success: false, error: 'Phân quyền lô không tồn tại' }
    }

    const { error: deleteError } = await serviceClient
        .from('admin_user_lots')
        .delete()
        .match({ user_id: targetUserId, lot_id: lotId })

    if (deleteError) {
        console.error('removeLotFromUser error:', deleteError)
        return { success: false, error: deleteError.message || 'Không thể xóa phân quyền lô' }
    }

    await auditAssign(user.id, 'lot_remove', targetUserId, {
        lot_id: lotId,
        role: existing.role,
        removed_by: user.id,
    })

    return { success: true }
}
