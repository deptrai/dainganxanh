/**
 * Admin / permission related types.
 */

export type AdminRole = 'user' | 'admin' | 'super_admin' | 'resort_manager' | 'store_staff'

export type LotScopedRole = 'resort_manager' | 'store_staff' | 'super_admin'

export interface AdminUserLot {
  id: string
  user_id: string
  lot_id: string
  role: LotScopedRole
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AdminUserLotWithLot extends AdminUserLot {
  lot?: {
    id: string
    name: string
    region: string
  }
}
