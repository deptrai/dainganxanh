import { test, expect, request as playwrightRequest } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { envConfig } from '../../config/env'

/**
 * Multi-Package Orders API Test Suite
 * Tests /api/orders/pending POST với unit_price / has_insurance cho cả 2 gói:
 *   - standard: unit_price=260000, has_insurance=false
 *   - insurance: unit_price=410000, has_insurance=true
 *
 * Also tests server-side tamper protection (reject invalid unit_price).
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running
 * - storagestate/admin.json must be populated (run auth.setup.ts first)
 */

test.describe('[P0] Multi-Package Orders API', () => {
    const BASE_URL = envConfig.BASE_URL
    let authCookies: string = ''

    test.beforeAll(async () => {
        const storageStatePath = path.resolve(__dirname, '../../storagestate/admin.json')
        const storageState = JSON.parse(fs.readFileSync(storageStatePath, 'utf-8'))
        const cookies: Array<{ name: string; value: string }> = storageState.cookies || []
        authCookies = cookies.map(c => `${c.name}=${c.value}`).join('; ')
    })

    const randomCode = () => 'DH' + Math.random().toString(36).substring(2, 8).toUpperCase()

    // ============================================
    // Standard package (260k, no insurance)
    // ============================================

    test.describe('Gói Standard (260.000đ)', () => {

        test('[P0] creates standard order with unit_price=260000, has_insurance=false', async ({ request }) => {
            const code = randomCode()
            const quantity = 3
            const res = await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: {
                    code,
                    quantity,
                    total_amount: quantity * 260000,
                    payment_method: 'banking',
                    unit_price: 260000,
                    has_insurance: false,
                },
            })
            expect(res.status()).toBe(200)
            const body = await res.json()
            expect(body).toHaveProperty('orderCode', code)
            console.log(`[Standard] Created order ${code}: unit_price=260000, has_insurance=false`)
        })

        test('[P1] omitting unit_price defaults to 260000 (backward compat)', async ({ request }) => {
            const code = randomCode()
            const quantity = 2
            const res = await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: {
                    code,
                    quantity,
                    total_amount: quantity * 260000,
                    payment_method: 'banking',
                    // unit_price intentionally omitted
                },
            })
            expect(res.status()).toBe(200)
        })

        test('[P0] rejects total_amount mismatch for standard package', async ({ request }) => {
            const code = randomCode()
            const res = await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: {
                    code,
                    quantity: 5,
                    total_amount: 5 * 410000, // wrong: insurance price for standard order
                    payment_method: 'banking',
                    unit_price: 260000,
                },
            })
            expect(res.status()).toBe(400)
            const body = await res.json()
            expect(body.error).toMatch(/invalid total_amount/i)
        })
    })

    // ============================================
    // Insurance package (410k, has_insurance=true)
    // ============================================

    test.describe('Gói Bảo Hiểm (410.000đ)', () => {

        test('[P0] creates insurance order with unit_price=410000, has_insurance=true', async ({ request }) => {
            const code = randomCode()
            const quantity = 2
            const res = await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: {
                    code,
                    quantity,
                    total_amount: quantity * 410000,
                    payment_method: 'banking',
                    unit_price: 410000,
                    has_insurance: true,
                },
            })
            expect(res.status()).toBe(200)
            const body = await res.json()
            expect(body).toHaveProperty('orderCode', code)
            console.log(`[Insurance] Created order ${code}: unit_price=410000, has_insurance=true`)
        })

        test('[P0] rejects total_amount mismatch for insurance package', async ({ request }) => {
            const code = randomCode()
            const res = await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: {
                    code,
                    quantity: 5,
                    total_amount: 5 * 260000, // wrong: standard price for insurance order
                    payment_method: 'banking',
                    unit_price: 410000,
                },
            })
            expect(res.status()).toBe(400)
            const body = await res.json()
            expect(body.error).toMatch(/invalid total_amount/i)
        })
    })

    // ============================================
    // Tamper protection (security P0)
    // ============================================

    test.describe('[P0] Tamper Protection — unit_price validation', () => {

        test('rejects unit_price=100000 (not in VALID_UNIT_PRICES)', async ({ request }) => {
            const code = randomCode()
            const res = await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: {
                    code,
                    quantity: 5,
                    total_amount: 5 * 100000,
                    payment_method: 'banking',
                    unit_price: 100000,
                },
            })
            expect(res.status()).toBe(400)
            const body = await res.json()
            expect(body.error).toMatch(/invalid unit_price/i)
        })

        test('rejects unit_price=0', async ({ request }) => {
            const code = randomCode()
            const res = await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: {
                    code,
                    quantity: 5,
                    total_amount: 0,
                    payment_method: 'banking',
                    unit_price: 0,
                },
            })
            expect(res.status()).toBe(400)
        })

        test('rejects unit_price=999999 (arbitrary large value)', async ({ request }) => {
            const code = randomCode()
            const res = await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: {
                    code,
                    quantity: 1,
                    total_amount: 999999,
                    payment_method: 'banking',
                    unit_price: 999999,
                },
            })
            expect(res.status()).toBe(400)
            const body = await res.json()
            expect(body.error).toMatch(/invalid unit_price/i)
        })

        test('rejects when total_amount manipulated to not match quantity * unit_price', async ({ request }) => {
            const code = randomCode()
            // Valid unit_price=410000 but manipulated total_amount
            const res = await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: authCookies, 'Content-Type': 'application/json' },
                data: {
                    code,
                    quantity: 10,
                    total_amount: 1, // tampered
                    payment_method: 'banking',
                    unit_price: 410000,
                },
            })
            expect(res.status()).toBe(400)
            const body = await res.json()
            expect(body.error).toMatch(/invalid total_amount/i)
        })
    })

    // ============================================
    // Unauthenticated requests
    // ============================================

    test.describe('Auth enforcement', () => {

        test('[P0] POST without auth returns 401', async () => {
            const freshCtx = await playwrightRequest.newContext()
            const code = randomCode()
            const res = await freshCtx.post(`${BASE_URL}/api/orders/pending`, {
                data: {
                    code,
                    quantity: 5,
                    total_amount: 5 * 410000,
                    payment_method: 'banking',
                    unit_price: 410000,
                    has_insurance: true,
                },
            })
            expect(res.status()).toBe(401)
            await freshCtx.dispose()
        })
    })
})
