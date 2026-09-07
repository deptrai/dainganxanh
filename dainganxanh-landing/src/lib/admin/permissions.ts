import { createServiceRoleClient } from '@/lib/supabase/server'
import { AdminUserLot, LotScopedRole } from '@/types/admin'

const ROLE_RANK: Record<string, number> = {
  super_admin: 4,
  admin: 3,
  resort_manager: 2,
  store_staff: 1,
  user: 0,
}

/**
 * Fetch all lot-scoped role assignments for a user.
 * Uses service role to bypass RLS and read the mapping table.
 */
export async function getAdminUserLots(userId: string): Promise<AdminUserLot[]> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('admin_user_lots')
    .select('id, user_id, lot_id, role, created_by, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch admin_user_lots:', error)
    return []
  }

  return (data || []) as AdminUserLot[]
}

/**
 * Check whether a user can access a specific lot.
 * Global admin/super_admin always return true. Otherwise check admin_user_lots.
 */
export async function canAccessLot(
  userId: string,
  lotId: string,
  requiredRole?: LotScopedRole
): Promise<boolean> {
  const supabase = createServiceRoleClient()

  // Global admin / super_admin bypass lot scoping
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (userError) {
    console.error('Failed to fetch user role for lot access check:', userError)
    return false
  }

  if (user?.role === 'admin' || user?.role === 'super_admin') {
    return true
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from('admin_user_lots')
    .select('role')
    .eq('user_id', userId)
    .eq('lot_id', lotId)
    .single()

  if (assignmentError || !assignment) {
    return false
  }

  if (requiredRole) return assignment.role === requiredRole
  return true
}

/**
 * Return the highest effective role for a user.
 * Global roles take precedence over lot-scoped roles; among lot-scoped
 * roles, the highest ranked role wins (super_admin > resort_manager > store_staff).
 */
export async function getUserHighestRole(userId: string): Promise<string> {
  const supabase = createServiceRoleClient()
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (userError) {
    console.error('Failed to fetch user role:', userError)
    return 'user'
  }

  if (user?.role === 'super_admin') return 'super_admin'
  if (user?.role === 'admin') return 'admin'

  const lots = await getAdminUserLots(userId)
  if (lots.length === 0) return user?.role || 'user'

  // Pick the highest-ranked lot-scoped role, not just the most recent
  const highest = lots.reduce((best, lot) => {
    return (ROLE_RANK[lot.role] || 0) > (ROLE_RANK[best.role] || 0) ? lot : best
  }, lots[0])

  return highest.role
}

/**
 * Verify access for a lot-scoped action.
 * Returns { userId, error } matching the pattern used by existing verifyAdminRole.
 */
export async function verifyLotAccess(
  userId: string,
  lotId: string,
  requiredRole?: LotScopedRole
): Promise<{ userId: string | null; error: string | null }> {
  const allowed = await canAccessLot(userId, lotId, requiredRole)
  if (!allowed) {
    return { userId: null, error: 'Bạn không có quyền thực hiện hành động này trên lô này' }
  }
  return { userId, error: null }
}
