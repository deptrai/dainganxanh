import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * GET /api/health
 * Lightweight liveness + readiness probe for Dokploy healthcheck and uptime monitors.
 *
 * Returns 200 if DB is reachable, 503 otherwise.
 * Response is intentionally small — no auth required.
 */
export async function GET() {
    const start = Date.now()

    try {
        const supabase = createServiceRoleClient()

        // Minimal DB probe — single lightweight query
        const { error } = await supabase
            .from('orders')
            .select('id')
            .limit(1)
            .single()

        // PGRST116 = "no rows" — DB is up, table exists, just empty query result
        const dbOk = !error || error.code === 'PGRST116'

        const latencyMs = Date.now() - start

        if (!dbOk) {
            console.error('[Health] DB probe failed:', error?.message)
            return NextResponse.json(
                {
                    status: 'degraded',
                    db: 'error',
                    error: error?.message,
                    latencyMs,
                },
                { status: 503 }
            )
        }

        return NextResponse.json(
            {
                status: 'ok',
                db: 'ok',
                latencyMs,
                version: process.env.npm_package_version ?? 'unknown',
            },
            {
                status: 200,
                headers: {
                    // Do not cache health responses
                    'Cache-Control': 'no-store, no-cache',
                },
            }
        )
    } catch (err) {
        console.error('[Health] Unexpected error:', err)
        return NextResponse.json(
            { status: 'error', latencyMs: Date.now() - start },
            { status: 503 }
        )
    }
}
