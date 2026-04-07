/**
 * Supabase Admin Client for E2E test cleanup
 * - Dùng Postgres trực tiếp (port 54332) để bypass JWT auth issue với local GoTrue
 * - Service role key cho REST/PostgREST API (orders, users tables)
 */
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

function loadEnvFile(filename: string): Record<string, string> {
    const envPath = path.resolve(__dirname, '../..', filename)
    if (!fs.existsSync(envPath)) return {}
    const content = fs.readFileSync(envPath, 'utf8')
    const vars: Record<string, string> = {}
    for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx === -1) continue
        vars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1)
    }
    return vars
}

const envE2E = loadEnvFile('.env.e2e')
const envLocal = loadEnvFile('.env.local')

const SUPABASE_URL = envE2E.NEXT_PUBLIC_SUPABASE_URL
    || process.env.NEXT_PUBLIC_SUPABASE_URL
    || envLocal.NEXT_PUBLIC_SUPABASE_URL
    || 'http://127.0.0.1:54331'

const SERVICE_ROLE_KEY = envE2E.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || envLocal.SUPABASE_SERVICE_ROLE_KEY
    || ''

export const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
})

/**
 * Lấy user ID từ bảng public.users (không cần auth admin API)
 */
export async function getTestUserId(email: string): Promise<string | null> {
    // Thử qua public.users table trước (dùng service role)
    const { data } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

    if (data?.id) return data.id

    // Fallback: tìm qua auth.users nếu public.users chưa có profile
    const { data: authData } = await supabase
        .from('users')
        .select('id, email')
        .ilike('email', email)
        .limit(1)

    return authData?.[0]?.id ?? null
}

/**
 * Clean up orders so checkout shows confirm step (not redirect to success).
 * - Cancel all pending/claimed/paid orders
 * - Push completed orders' created_at back 2h so checkout ignores them
 */
export async function cleanupOrdersForUser(userId: string): Promise<void> {
    await supabase.from('orders')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
        .in('status', ['pending', 'manual_payment_claimed', 'paid'])

    const twoHoursAgo = new Date(Date.now() - 2 * 3600_000).toISOString()
    await supabase.from('orders')
        .update({ created_at: twoHoursAgo })
        .eq('user_id', userId)
        .eq('status', 'completed')

    console.log(`🧹 Cleaned up orders for user ${userId}`)
}
