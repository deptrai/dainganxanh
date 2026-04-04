import { test, expect } from '@playwright/test'
import { getOTPFromMailpit } from '../../utils/mailpit'
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
 * - Test user: phanquochoipt@gmail.com
 */

test.describe('Orders API', () => {
    const BASE_URL = envConfig.BASE_URL

    /**
     * Helper: Get auth cookies by going through OTP login
     */
    async function getAuthCookies(page: any): Promise<string> {
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        const emailInput = page.locator('input#identifier-input[type="email"]')
        await expect(emailInput).toBeVisible()
        await emailInput.fill(envConfig.ADMIN_EMAIL)

        await page.getByRole('button', { name: /gửi mã otp/i }).click()
        await expect(page.getByText(/nhập mã otp \(8 chữ số\)/i)).toBeVisible({ timeout: 10000 })

        const otp = await getOTPFromMailpit(envConfig.ADMIN_EMAIL)
        const otpInputs = page.locator('input[inputmode="numeric"]')
        for (let i = 0; i < 8; i++) {
            await otpInputs.nth(i).fill(otp[i])
        }

        const skipBtn = page.getByRole('button', { name: /bỏ qua/i })
        try {
            await skipBtn.waitFor({ state: 'visible', timeout: 5000 })
            await skipBtn.click()
        } catch { /* no modal */ }
        await page.waitForLoadState('networkidle')

        // Return cookies as header string
        const cookies = await page.context().cookies()
        return cookies.map(c => `${c.name}=${c.value}`).join('; ')
    }

    // ============================================
    // /api/orders/status
    // ============================================

    test.describe('GET /api/orders/status', () => {
        test('returns 401 without auth', async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/orders/status?code=DHTEST01`)
            expect(res.status()).toBe(401)
            const body = await res.json()
            expect(body).toHaveProperty('error')
        })

        test('returns 400 for invalid order code format', async ({ page, request }) => {
            const cookies = await getAuthCookies(page)
            const res = await request.get(`${BASE_URL}/api/orders/status?code=INVALID`, {
                headers: { Cookie: cookies }
            })
            expect(res.status()).toBe(400)
            const body = await res.json()
            expect(body.error).toMatch(/invalid order code/i)
        })

        test('returns 404 for non-existent order', async ({ page, request }) => {
            const cookies = await getAuthCookies(page)
            const res = await request.get(`${BASE_URL}/api/orders/status?code=DHZZZ999`, {
                headers: { Cookie: cookies }
            })
            expect(res.status()).toBe(404)
        })

        test('returns most recent completed order when no code', async ({ page, request }) => {
            const cookies = await getAuthCookies(page)
            const res = await request.get(`${BASE_URL}/api/orders/status`, {
                headers: { Cookie: cookies }
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
        test('returns 401 without auth', async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/orders/pending`)
            expect(res.status()).toBe(401)
        })

        test('returns pending order or null when authenticated', async ({ page, request }) => {
            const cookies = await getAuthCookies(page)
            const res = await request.get(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: cookies }
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
        test('returns 401 without auth', async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/orders/pending`, {
                data: { code: 'DHTEST01', quantity: 1, total_amount: 260000, payment_method: 'banking' }
            })
            expect(res.status()).toBe(401)
        })

        test('returns 400 for missing required fields', async ({ page, request }) => {
            const cookies = await getAuthCookies(page)
            const res = await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: cookies, 'Content-Type': 'application/json' },
                data: { quantity: 5 } // missing code, total_amount, payment_method
            })
            expect(res.status()).toBe(400)
        })

        test('returns 400 for invalid order code format', async ({ page, request }) => {
            const cookies = await getAuthCookies(page)
            const res = await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: cookies, 'Content-Type': 'application/json' },
                data: { code: 'INVALID', quantity: 1, total_amount: 260000, payment_method: 'banking' }
            })
            expect(res.status()).toBe(400)
            const body = await res.json()
            expect(body.error).toMatch(/invalid order code/i)
        })

        test('returns 400 when total_amount does not match quantity * 260000', async ({ page, request }) => {
            const cookies = await getAuthCookies(page)
            // Generate valid 6-char alphanum suffix for the code
            const suffix = Math.random().toString(36).substring(2, 8).toUpperCase()
            const code = `DH${suffix}`
            const res = await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: cookies, 'Content-Type': 'application/json' },
                data: { code, quantity: 5, total_amount: 999999, payment_method: 'banking' }
            })
            expect(res.status()).toBe(400)
            const body = await res.json()
            expect(body.error).toMatch(/invalid total_amount/i)
        })

        test('creates pending order successfully', async ({ page, request }) => {
            const cookies = await getAuthCookies(page)
            // Use random suffix to avoid conflicts
            const suffix = Math.random().toString(36).substring(2, 8).toUpperCase()
            const code = `DH${suffix}`
            const quantity = 3
            const total_amount = quantity * 260000

            const res = await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: cookies, 'Content-Type': 'application/json' },
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
        test('returns 401 without auth', async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/orders/cancel`, {
                data: { orderCode: 'DHTEST01' }
            })
            expect(res.status()).toBe(401)
        })

        test('returns 400 for invalid order code format', async ({ page, request }) => {
            const cookies = await getAuthCookies(page)
            const res = await request.post(`${BASE_URL}/api/orders/cancel`, {
                headers: { Cookie: cookies, 'Content-Type': 'application/json' },
                data: { orderCode: 'NOTVALID' }
            })
            expect(res.status()).toBe(400)
        })

        test('returns 404 for non-existent order', async ({ page, request }) => {
            const cookies = await getAuthCookies(page)
            const res = await request.post(`${BASE_URL}/api/orders/cancel`, {
                headers: { Cookie: cookies, 'Content-Type': 'application/json' },
                data: { orderCode: 'DHZZZ999' }
            })
            expect(res.status()).toBe(404)
        })

        test('cancels a pending order successfully', async ({ page, request }) => {
            const cookies = await getAuthCookies(page)

            // First create a pending order
            const suffix = Math.random().toString(36).substring(2, 8).toUpperCase()
            const code = `DH${suffix}`
            await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: cookies, 'Content-Type': 'application/json' },
                data: { code, quantity: 1, total_amount: 260000, payment_method: 'banking' }
            })

            // Now cancel it
            const res = await request.post(`${BASE_URL}/api/orders/cancel`, {
                headers: { Cookie: cookies, 'Content-Type': 'application/json' },
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
        test('returns 401 without auth', async ({ request }) => {
            const res = await request.post(`${BASE_URL}/api/orders/claim-manual-payment`, {
                data: { orderCode: 'DHTEST01' }
            })
            expect(res.status()).toBe(401)
        })

        test('returns 400 when orderCode missing', async ({ page, request }) => {
            const cookies = await getAuthCookies(page)
            const res = await request.post(`${BASE_URL}/api/orders/claim-manual-payment`, {
                headers: { Cookie: cookies, 'Content-Type': 'application/json' },
                data: {}
            })
            expect(res.status()).toBe(400)
            const body = await res.json()
            expect(body.error).toMatch(/orderCode is required/i)
        })

        test('returns 404 for non-existent order', async ({ page, request }) => {
            const cookies = await getAuthCookies(page)
            const res = await request.post(`${BASE_URL}/api/orders/claim-manual-payment`, {
                headers: { Cookie: cookies, 'Content-Type': 'application/json' },
                data: { orderCode: 'DHZZZ000' }
            })
            expect(res.status()).toBe(404)
        })

        test('claims manual payment for pending order', async ({ page, request }) => {
            const cookies = await getAuthCookies(page)

            // Create a pending order first
            const suffix = Math.random().toString(36).substring(2, 8).toUpperCase()
            const code = `DH${suffix}`
            await request.post(`${BASE_URL}/api/orders/pending`, {
                headers: { Cookie: cookies, 'Content-Type': 'application/json' },
                data: { code, quantity: 2, total_amount: 520000, payment_method: 'banking' }
            })

            // Claim it
            const res = await request.post(`${BASE_URL}/api/orders/claim-manual-payment`, {
                headers: { Cookie: cookies, 'Content-Type': 'application/json' },
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
        test('returns 401 without auth', async ({ request }) => {
            const res = await request.get(`${BASE_URL}/api/orders/pending-list`)
            expect(res.status()).toBe(401)
        })

        test('returns list of pending/claimed orders', async ({ page, request }) => {
            const cookies = await getAuthCookies(page)
            const res = await request.get(`${BASE_URL}/api/orders/pending-list`, {
                headers: { Cookie: cookies }
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
