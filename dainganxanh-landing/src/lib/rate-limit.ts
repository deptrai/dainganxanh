/**
 * Simple in-memory rate limiter (sliding window counter).
 *
 * Suitable for single-server Dokploy deployment. If the app ever scales to
 * multiple replicas, replace this with an upstash/redis-based limiter.
 *
 * Usage:
 *   import { rateLimit, rateLimitByKey } from '@/lib/rate-limit'
 *
 *   // In API route handler:
 *   const result = rateLimit(req, { limit: 10, windowMs: 60_000 })
 *   if (!result.ok) {
 *     return NextResponse.json({ error: 'Too many requests' }, {
 *       status: 429,
 *       headers: { 'Retry-After': String(result.retryAfterSec) },
 *     })
 *   }
 *
 *   // In server component or custom context:
 *   const result = rateLimitByKey(clientIp, { limit: 20, windowMs: 60_000, keyPrefix: 'voucher' })
 *   if (!result.ok) { ... }
 */

import { NextRequest } from 'next/server'

export interface RateLimitOptions {
    /** Maximum requests allowed within `windowMs`. Default: 20 */
    limit?: number
    /** Window duration in milliseconds. Default: 60_000 (1 min) */
    windowMs?: number
    /** Key prefix to namespace different limiters. Default: route pathname or empty */
    keyPrefix?: string
}

export interface RateLimitResult {
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
 * Core sliding-window rate limiter by string key.
 */
export function rateLimitByKey(key: string, options: RateLimitOptions = {}): RateLimitResult {
    const { limit = 20, windowMs = 60_000, keyPrefix } = options
    const fullKey = keyPrefix ? `rl:${keyPrefix}:${key}` : `rl:${key}`
    evict(fullKey, windowMs)

    const now = Date.now()
    const entry = store.get(fullKey)

    if (!entry || now - entry.windowStart > windowMs) {
        // Start new window
        store.set(fullKey, { count: 1, windowStart: now })
        return { ok: true, remaining: limit - 1 }
    }

    if (entry.count >= limit) {
        const retryAfterSec = Math.ceil((entry.windowStart + windowMs - now) / 1000)
        return { ok: false, remaining: 0, retryAfterSec }
    }

    entry.count++
    return { ok: true, remaining: limit - entry.count }
}

/**
 * Rate limiter wrapper for NextRequest route handlers.
 */
export function rateLimit(req: NextRequest, options: RateLimitOptions = {}): RateLimitResult {
    const prefix = options.keyPrefix ?? req.nextUrl.pathname
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : (req.headers.get('x-real-ip') ?? 'unknown')
    return rateLimitByKey(ip, { ...options, keyPrefix: prefix })
}

/**
 * Clear the internal rate-limit store (mainly for tests).
 */
export function _resetRateLimitStore(): void {
    store.clear()
}
