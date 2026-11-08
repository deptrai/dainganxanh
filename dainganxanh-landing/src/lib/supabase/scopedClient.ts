import { createServiceRoleClient } from '@/lib/supabase/server'
import { getImpersonationContext } from '@/lib/getImpersonationContext'

export interface ScopedCrmClient {
    client: ReturnType<typeof createServiceRoleClient>
    effectiveUserId: string
}

/**
 * Lấy service-role client và effectiveUserId cho user hiện tại (hỗ trợ admin impersonation).
 * Trả về null nếu người dùng chưa đăng nhập hoặc không xác thực được context.
 */
export async function getScopedCrmClient(): Promise<ScopedCrmClient | null> {
    const ctx = await getImpersonationContext()
    if (!ctx?.effectiveUserId) {
        return null
    }

    const client = createServiceRoleClient()
    return {
        client,
        effectiveUserId: ctx.effectiveUserId,
    }
}

/**
 * Kiểm tra quyền sở hữu userId (effectiveUserId phải khớp targetUserId).
 * Throw Error nếu không khớp để ngăn ngừa lỗ hổng IDOR.
 */
export function assertOwnsUserId(
    effectiveUserId: string | null | undefined,
    targetUserId: string | null | undefined
): asserts effectiveUserId is string {
    if (!effectiveUserId || !targetUserId || effectiveUserId !== targetUserId) {
        throw new Error('Forbidden: User ID mismatch')
    }
}
