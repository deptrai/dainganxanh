'use server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function checkUserExists(identifier: string, mode: 'email' | 'phone'): Promise<boolean> {
    const supabase = createServiceRoleClient()
    const field = mode === 'email' ? 'email' : 'phone'
    const { data } = await supabase
        .from('users')
        .select('id')
        .eq(field, identifier.trim().toLowerCase())
        .maybeSingle()
    return !!data
}
