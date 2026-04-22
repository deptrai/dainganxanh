/**
 * Simple in-memory rate limiter (sliding window counter).
 *
 * Suitable for single-server Dokploy deployment. If the app ever scales to
 * multiple replicas, replace this with an upstash/redis-based limiter.
 *
 * Usage:
 *   import { rateLimit } from '@/lib/rate-limit'
 *
 *   const result = rateLimit(req, { limit: 10, windowMs: 60_000 })
 *   if (!result.ok) {
 *     return NextResponse.json({ error: 'Too many requests' }, {
 *       status: 429,
 *       headers: { 'Retry-After': String(result.retryAfterSec) },
 *     })
 *   }
 */

import { NextRequest } from 'next/server'

interface RateLimitOptions {
    /** Maximum requests allowed within `windowMs`. Default: 20 */
    limit?: number
    /** Window duration in milliseconds. Default: 60_000 (1 min) */
    windowMs?: number
    /** Key prefix to namespace different limiters. Default: route pathname */
    keyPrefix?: string
}

interface RateLimitResult {
    ok: boolean
    remaining: number
    /** Seconds to wait before retrying (only present when ok=false) */
    retryAfterSec?: number
}

interface WindowEntry {
    count: number
    windowStart: number
}

// Module-level store — survives across requests within the same Node.js process.
// A Map is sufficient; GC happens via TTL cleanup in the hit function.
const store = new Map<string, WindowEntry>()

// Cleanup entries older than 2× the window to bound memory growth.
// Called on every request — O(1) amortized because we only delete the checked key.
function evict(key: string, windowMs: number): void {
    const entry = store.get(key)
    if (entry && Date.now() - entry.windowStart > windowMs * 2) {
        store.delete(key)
    }
}

/**
 * Extract a stable client identifier from the request.
 * Priority: X-Forwarded-For (behind proxy) → remoteAddress → fallback.
 */
function getClientKey(req: NextRequest, prefix: string): string {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : (req.headers.get('x-real-ip') ?? 'unknown')
    return `rl:${prefix}:${ip}`
}

export function rateLimit(req: NextRequest, options: RateLimitOptions = {}): RateLimitResult {
    const { limit = 20, windowMs = 60_000, keyPrefix } = options
    const prefix = keyPrefix ?? req.nextUrl.pathname

    const key = getClientKey(req, prefix)
    evict(key, windowMs)

    const now = Date.now()
    const entry = store.get(key)

    if (!entry || now - entry.windowStart > windowMs) {
        // Start new window
        store.set(key, { count: 1, windowStart: now })
        return { ok: true, remaining: limit - 1 }
    }

    if (entry.count >= limit) {
        const retryAfterSec = Math.ceil((entry.windowStart + windowMs - now) / 1000)
        return { ok: false, remaining: 0, retryAfterSec }
    }

    entry.count++
    return { ok: true, remaining: limit - entry.count }
}
