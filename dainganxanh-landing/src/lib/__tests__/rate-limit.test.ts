/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import {
    rateLimit,
    rateLimitByKey,
    _resetRateLimitStore,
} from '@/lib/rate-limit'

describe('rate-limit helper', () => {
    beforeEach(() => {
        _resetRateLimitStore()
        jest.useRealTimers()
    })

    describe('rateLimitByKey', () => {
        it('allows requests within the limit and decreases remaining count', () => {
            const first = rateLimitByKey('user-1', { limit: 3, windowMs: 60_000 })
            expect(first.ok).toBe(true)
            expect(first.remaining).toBe(2)

            const second = rateLimitByKey('user-1', { limit: 3, windowMs: 60_000 })
            expect(second.ok).toBe(true)
            expect(second.remaining).toBe(1)

            const third = rateLimitByKey('user-1', { limit: 3, windowMs: 60_000 })
            expect(third.ok).toBe(true)
            expect(third.remaining).toBe(0)
        })

        it('blocks requests exceeding the limit and returns retryAfterSec', () => {
            for (let i = 0; i < 3; i++) {
                rateLimitByKey('user-2', { limit: 3, windowMs: 60_000 })
            }

            const blocked = rateLimitByKey('user-2', { limit: 3, windowMs: 60_000 })
            expect(blocked.ok).toBe(false)
            expect(blocked.remaining).toBe(0)
            expect(blocked.retryAfterSec).toBeGreaterThan(0)
            expect(blocked.retryAfterSec).toBeLessThanOrEqual(60)
        })

        it('isolates counters between different keys', () => {
            for (let i = 0; i < 2; i++) {
                rateLimitByKey('client-a', { limit: 2, windowMs: 60_000 })
            }

            expect(rateLimitByKey('client-a', { limit: 2, windowMs: 60_000 }).ok).toBe(false)
            expect(rateLimitByKey('client-b', { limit: 2, windowMs: 60_000 }).ok).toBe(true)
        })

        it('isolates counters between different keyPrefix values', () => {
            for (let i = 0; i < 2; i++) {
                rateLimitByKey('client-a', { limit: 2, windowMs: 60_000, keyPrefix: 'endpoint-1' })
            }

            expect(rateLimitByKey('client-a', { limit: 2, windowMs: 60_000, keyPrefix: 'endpoint-1' }).ok).toBe(false)
            expect(rateLimitByKey('client-a', { limit: 2, windowMs: 60_000, keyPrefix: 'endpoint-2' }).ok).toBe(true)
        })

        it('resets window after windowMs elapses', () => {
            jest.useFakeTimers()

            rateLimitByKey('client-temp', { limit: 1, windowMs: 10_000 })
            expect(rateLimitByKey('client-temp', { limit: 1, windowMs: 10_000 }).ok).toBe(false)

            jest.advanceTimersByTime(11_000)

            const afterExpiry = rateLimitByKey('client-temp', { limit: 1, windowMs: 10_000 })
            expect(afterExpiry.ok).toBe(true)
            expect(afterExpiry.remaining).toBe(0)
        })
    })

    describe('rateLimit (NextRequest wrapper)', () => {
        it('extracts client IP from x-forwarded-for header (first IP in list)', () => {
            const req = new NextRequest('http://localhost/api/test', {
                headers: {
                    'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
                },
            })

            const res1 = rateLimit(req, { limit: 1, windowMs: 60_000, keyPrefix: 'test-fwd' })
            expect(res1.ok).toBe(true)

            const res2 = rateLimit(req, { limit: 1, windowMs: 60_000, keyPrefix: 'test-fwd' })
            expect(res2.ok).toBe(false)
        })

        it('falls back to x-real-ip when x-forwarded-for is missing', () => {
            const req = new NextRequest('http://localhost/api/test', {
                headers: {
                    'x-real-ip': '198.51.100.4',
                },
            })

            const res = rateLimit(req, { limit: 1, windowMs: 60_000, keyPrefix: 'test-real' })
            expect(res.ok).toBe(true)
        })

        it('falls back to "unknown" when no IP header is present', () => {
            const req = new NextRequest('http://localhost/api/test')

            const res1 = rateLimit(req, { limit: 1, windowMs: 60_000, keyPrefix: 'test-none' })
            expect(res1.ok).toBe(true)

            const res2 = rateLimit(req, { limit: 1, windowMs: 60_000, keyPrefix: 'test-none' })
            expect(res2.ok).toBe(false)
        })

        it('defaults keyPrefix to req.nextUrl.pathname', () => {
            const req1 = new NextRequest('http://localhost/api/first', {
                headers: { 'x-real-ip': '1.2.3.4' },
            })
            const req2 = new NextRequest('http://localhost/api/second', {
                headers: { 'x-real-ip': '1.2.3.4' },
            })

            expect(rateLimit(req1, { limit: 1, windowMs: 60_000 }).ok).toBe(true)
            expect(rateLimit(req1, { limit: 1, windowMs: 60_000 }).ok).toBe(false)
            // req2 has different pathname, so it gets its own window
            expect(rateLimit(req2, { limit: 1, windowMs: 60_000 }).ok).toBe(true)
        })
    })

    describe('_resetRateLimitStore', () => {
        it('clears all rate limit state', () => {
            rateLimitByKey('reset-me', { limit: 1, windowMs: 60_000 })
            expect(rateLimitByKey('reset-me', { limit: 1, windowMs: 60_000 }).ok).toBe(false)

            _resetRateLimitStore()

            expect(rateLimitByKey('reset-me', { limit: 1, windowMs: 60_000 }).ok).toBe(true)
        })
    })
})
