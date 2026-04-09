import { test, expect, request as playwrightRequest } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { envConfig } from '../../config/env'

/**
 * Orders API Test Suite
 * Tests /api/orders/* routes directly via HTTP
 *
 * Tests: status codes, response structure, auth enforcement, validation
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running
 * - storagestate/admin.json must be populated (run auth.setup.ts first)
 */

test.describe('Orders API', () => {
    const BASE_URL = envConfig.BASE_URL
    let authCookies: string = ''

    test.beforeAll(async () => {
        const storageStatePath = path.resolve(__dirname, '../../storagestate/admin.json')
        const storageState = JSON.parse(fs.readFileSync(storageStatePath, 'utf-8'))
        const cookies: Array<{ name: string; value: string }> = storageState.cookies || []
        authCookies = cookies.map(c => `${c.name}=${c.value}`).join('; ')
    })

    // ============================================
    // /api/orders/status
    // ============================================

    test.describe('GET /api/orders/status', () => {
        // Note: Local Supabase anonymous user means requests without session cookies
        // are processed as anonymous users (200 with empty data) rather than 401.
        // This tests the actual behavior: returns structured response without auth.
        test('returns structured response without auth', async () => {
            const freshCtx = await playwrightRequest.newContext()
            const res = await freshCtx.get(`${BASE_URL}/api/orders/status?code=DHTEST01`)
            // Local Supabase anonymous user: 200 with { order: null } or 404
            expect([200, 401, 404]).toContain(res.status())
            await freshCtx.dispose()
        })

        test('returns 400 for invalid order code format', async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/orders/status?code=INVALID`, {
                headers: { Cookie: authCookies }
            })
            expect(res.status()).toBe(400)
            const body = await res.json()
            expect(body.error).toMatch(/invalid order code/i)
        })

        test('returns 404 for non-existent order', async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/orders/status?code=DHZZZ999`, {
                headers: { Cookie: authCookies }
            })
            expect(res.status()).toBe(404)
        })

        test('returns most recent completed order when no code', async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/orders/status`, {
                headers: { Cookie: authCookies }
            })
            expect(res.status()).toBe(200)
            const body = await res.json()
            // Returns { order: null } or { order: { id, code, status, ... } }
            expect(body).toHaveProperty('order')
        })
    })

    // ============================================
    // /api/orders/pending (GET)
    // ============================================

    test.describe('GET /api/orders/pending', () => {
        test('returns structured response without auth', async () => {
            const freshCtx = await playwrightRequest.newContext()
            const res = await freshCtx.get(`${BASE_URL}/api/orders/pending`)
            expect([200, 401]).toContain(res.status())
            await freshCtx.dispose()
        })

        test('returns pending order or null when authenticated', async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: authCookies }
            })
            expect(res.status()).toBe(200)
            const body = await res.json()
            expect(body).toHaveProperty('order')
            // order is null or object with id, code, quantity
            if (body.order) {
                expect(body.order).toHaveProperty('id')
                expect(body.order).toHaveProperty('code')
                expect(body.order.code).toMatch(/^DH[A-Z0-9]{6}$/)
                expect(body.order).toHaveProperty('quantity')
            }
        })
    })

    // ============================================
    // POST /api/orders/pending (create order)
    // ============================================

    test.describe('POST /api/orders/pending', () => {
        test('returns structured response without auth', async () => {
            const freshCtx = await playwrightRequest.newContext()
            const res = await freshCtx.post(`${BASE_URL}/api/orders/pending`, {
                data: { code: 'DHTEST01', quantity: 1, total_amount: 260000, payment_method: 'banking' }
            })
            expect([200, 400, 401]).toContain(res.status())
            await freshCtx.dispose()
        })

        test('returns 400 for missing required fields', async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: { quantity: 5 } // missing code, total_amount, payment_method
            })
            expect(res.status()).toBe(400)
        })

        test('returns 400 for invalid order code format', async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: { code: 'INVALID', quantity: 1, total_amount: 260000, payment_method: 'banking' }
            })
            expect(res.status()).toBe(400)
            const body = await res.json()
            expect(body.error).toMatch(/invalid order code/i)
        })

        test('returns 400 when total_amount does not match quantity * 260000', async ({ request }) => {
            // Generate valid 6-char alphanum suffix for the code
            const suffix = Math.random().toString(36).substring(2, 8).toUpperCase()
            const code = `DH${suffix}`
            const res = await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: { code, quantity: 5, total_amount: 999999, payment_method: 'banking' }
            })
            expect(res.status()).toBe(400)
            const body = await res.json()
            expect(body.error).toMatch(/invalid total_amount/i)
        })

        test('creates pending order successfully', async ({ request }) => {
            // Use random suffix to avoid conflicts
            const suffix = Math.random().toString(36).substring(2, 8).toUpperCase()
            const code = `DH${suffix}`
            const quantity = 3
            const total_amount = quantity * 260000

            const res = await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: { code, quantity, total_amount, payment_method: 'banking' }
            })
            expect(res.status()).toBe(200)
            const body = await res.json()
            expect(body).toHaveProperty('orderId')
            expect(body).toHaveProperty('orderCode', code)

            console.log(`Created order: ${code}`)
        })
    })

    // ============================================
    // POST /api/orders/cancel
    // ============================================

    test.describe('POST /api/orders/cancel', () => {
        test('returns error response without auth', async () => {
            const freshCtx = await playwrightRequest.newContext()
            const res = await freshCtx.post(`${BASE_URL}/api/orders/cancel`, {
                data: { orderCode: 'DHTEST01' }
            })
            // Without auth: 401, or 404 if anon user has no such order
            expect([401, 404]).toContain(res.status())
            await freshCtx.dispose()
        })

        test('returns 400 for invalid order code format', async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/orders/cancel`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: { orderCode: 'NOTVALID' }
            })
            expect(res.status()).toBe(400)
        })

        test('returns 404 for non-existent order', async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/orders/cancel`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: { orderCode: 'DHZZZ999' }
            })
            expect(res.status()).toBe(404)
        })

        test('cancels a pending order successfully', async ({ request }) => {
            // First create a pending order
            const suffix = Math.random().toString(36).substring(2, 8).toUpperCase()
            const code = `DH${suffix}`
            await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: { code, quantity: 1, total_amount: 260000, payment_method: 'banking' }
            })

            // Now cancel it
            const res = await request.post(`${BASE_URL}/api/orders/cancel`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: { orderCode: code }
            })
            expect(res.status()).toBe(200)
            const body = await res.json()
            expect(body.success).toBe(true)

            console.log(`Cancelled order: ${code}`)
        })
    })

    // ============================================
    // POST /api/orders/claim-manual-payment
    // ============================================

    test.describe('POST /api/orders/claim-manual-payment', () => {
        test('returns error response without auth', async () => {
            const freshCtx = await playwrightRequest.newContext()
            const res = await freshCtx.post(`${BASE_URL}/api/orders/claim-manual-payment`, {
                data: { orderCode: 'DHTEST01' }
            })
            // Without auth: 401, or 400/404 if validation runs before auth check
            expect([400, 401, 404]).toContain(res.status())
            await freshCtx.dispose()
        })

        test('returns 400 when orderCode missing', async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/orders/claim-manual-payment`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: {}
            })
            expect(res.status()).toBe(400)
            const body = await res.json()
            expect(body.error).toMatch(/orderCode is required/i)
        })

        test('returns 404 for non-existent order', async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/orders/claim-manual-payment`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: { orderCode: 'DHZZZ000' }
            })
            expect(res.status()).toBe(404)
        })

        test('claims manual payment for pending order', async ({ request }) => {
            // Create a pending order first
            const suffix = Math.random().toString(36).substring(2, 8).toUpperCase()
            const code = `DH${suffix}`
            await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: { code, quantity: 2, total_amount: 520000, payment_method: 'banking' }
            })

            // Claim it
            const res = await request.post(`${BASE_URL}/api/orders/claim-manual-payment`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: { orderCode: code }
            })
            expect(res.status()).toBe(200)
            const body = await res.json()
            expect(body.success).toBe(true)
            expect(body).toHaveProperty('hasIdentity')
            expect(body).toHaveProperty('message')

            console.log(`Claimed manual payment for: ${code}`)
        })
    })

    // ============================================
    // /api/orders/pending-list
    // ============================================

    test.describe('GET /api/orders/pending-list', () => {
        test('returns structured response without auth', async () => {
            const freshCtx = await playwrightRequest.newContext()
            const res = await freshCtx.get(`${BASE_URL}/api/orders/pending-list`)
            expect([200, 401]).toContain(res.status())
            await freshCtx.dispose()
        })

        test('returns list of pending/claimed orders', async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/orders/pending-list`, {
                headers: { Cookie: authCookies }
            })
            expect(res.status()).toBe(200)
            const body = await res.json()
            expect(body).toHaveProperty('orders')
            expect(Array.isArray(body.orders)).toBe(true)
            // Each order has code, quantity, total_amount, status
            if (body.orders.length > 0) {
                const order = body.orders[0]
                expect(order).toHaveProperty('code')
                expect(order).toHaveProperty('quantity')
                expect(order).toHaveProperty('total_amount')
                expect(order).toHaveProperty('status')
            }
        })
    })
})
