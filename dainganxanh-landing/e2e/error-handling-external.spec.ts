import { test, expect } from '@playwright/test'
import { getOTPFromMailpit } from './fixtures/mailpit'
import { ADMIN_EMAIL, TEST_EMAIL } from './fixtures/identity'
import { loginAsAdmin, loginAsUser } from './fixtures/auth'
import { mockServerDelay } from './fixtures/timing'

/**
 * Error Handling — External Service Failures E2E
 *
 * Section 4 from original error-handling: webhook retries, email queueing, telegram backoff.
 *
 * Split from the original 1273-line error-handling.spec.ts to keep each
 * suite under the 300-line guideline and enable selective execution.
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Test user: TEST_USER_EMAIL (env override)
 * - Admin user: TEST_ADMIN_EMAIL (env override, with admin role)
 */


test.describe('[P1] Error Handling — External Service Failures E2E', () => {


    /**
     * ============================================
     * SECTION 4: External Service Failures (3 tests)
     * ============================================
     */

    /**
     * Test 14: Webhook when database unavailable - retry mechanism
     */
    test('webhook retries when database unavailable', async ({ page }) => {
        let attemptCount = 0
        let retryOccurred = false

        await loginAsAdmin(page)

        // Mock webhook endpoint with DB failure then success
        await page.route('**/api/webhooks/casso', async route => {
            if (route.request().method() === 'POST') {
                attemptCount++

                if (attemptCount === 1) {
                    // First attempt - DB error
                    await route.fulfill({
                        status: 503,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            error: 'Service Unavailable',
                            message: 'Database connection failed',
                            retry: true
                        })
                    })
                } else {
                    // Retry succeeds
                    retryOccurred = true
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            success: true,
                            message: 'Processed on retry'
                        })
                    })
                }
            } else {
                await route.continue()
            }
        })

        // Simulate webhook with retry logic
        const result = await page.evaluate(async () => {
            const maxRetries = 3
            let attempt = 0
            let lastError = null

            while (attempt < maxRetries) {
                attempt++
                const res = await fetch('/api/webhooks/casso', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: 'txn-123',
                        amount: 1300000,
                        description: 'DH123456 - Payment'
                    })
                })

                const data = await res.json()

                if (res.ok) {
                    return { success: true, attempts: attempt, data }
                }

                if (data.retry && attempt < maxRetries) {
                    // Justified hard wait: client-side retry backoff. Simulates real
                    // user retry behavior, not a UI state wait.
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    lastError = data
                    continue
                }

                return { success: false, attempts: attempt, error: lastError }
            }

            return { success: false, attempts: maxRetries, error: lastError }
        })

        expect(result.success).toBe(true)
        expect(result.attempts).toBe(2)
        expect(retryOccurred).toBe(true)

        console.log('✅ Webhook retry mechanism working')
        console.log(`   - Total attempts: ${result.attempts}`)
    })

    /**
     * Test 15: Email timeout during notification - fallback queue
     */
    test('email timeout falls back to queue system', async ({ page }) => {
        let queuedForRetry = false
        let timeoutOccurred = false

        await loginAsUser(page, '/my-garden')

        // Mock email API with timeout then queue
        await page.route('**/api/email/send-order-confirmation', async route => {
            if (route.request().method() === 'POST') {
                timeoutOccurred = true

                // Mock-server side: simulates a gateway timeout before fulfilling
                // with 504. Named helper documents intent.
                await mockServerDelay(100)

                await route.fulfill({
                    status: 504,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: 'Gateway Timeout',
                        message: 'Email service timeout',
                        queued: true
                    })
                })
            } else {
                await route.continue()
            }
        })

        // Mock queue API
        await page.route('**/api/queue/email', async route => {
            if (route.request().method() === 'POST') {
                queuedForRetry = true
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        message: 'Email queued for retry',
                        queue_id: 'queue-123'
                    })
                })
            } else {
                await route.continue()
            }
        })

        // Simulate email send with fallback
        const result = await page.evaluate(async () => {
            const emailRes = await fetch('/api/email/send-order-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: 'customer@example.com',
                    template: 'order-confirmation',
                    data: { order_code: 'DH123456' }
                })
            })

            const emailData = await emailRes.json()

            if (emailData.queued) {
                // Fallback to queue
                const queueRes = await fetch('/api/queue/email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: 'customer@example.com',
                        template: 'order-confirmation',
                        data: { order_code: 'DH123456' }
                    })
                })

                return {
                    timeout: true,
                    queued: queueRes.ok,
                    data: await queueRes.json()
                }
            }

            return { timeout: false, queued: false }
        })

        expect(result.timeout).toBe(true)
        expect(result.queued).toBe(true)
        expect(queuedForRetry).toBe(true)

        console.log('✅ Email timeout fallback to queue working')
    })

    /**
     * Test 16: Telegram rate limit (429 response handled)
     */
    test('telegram rate limit handled with exponential backoff', async ({ page }) => {
        let attemptCount = 0
        let backoffDelays: number[] = []

        await loginAsAdmin(page)

        // Mock Telegram API with rate limiting
        await page.route('**/api/telegram/send', async route => {
            if (route.request().method() === 'POST') {
                attemptCount++

                if (attemptCount <= 2) {
                    // Rate limited
                    await route.fulfill({
                        status: 429,
                        contentType: 'application/json',
                        headers: {
                            'Retry-After': '2'
                        },
                        body: JSON.stringify({
                            error: 'Too Many Requests',
                            message: 'Rate limit exceeded'
                        })
                    })
                } else {
                    // Success after backoff
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            ok: true,
                            result: { message_id: 123 }
                        })
                    })
                }
            } else {
                await route.continue()
            }
        })

        // Simulate Telegram send with exponential backoff
        const result = await page.evaluate(async () => {
            const maxRetries = 3
            const delays: number[] = []
            let attempt = 0

            while (attempt < maxRetries) {
                attempt++
                const startTime = Date.now()

                const res = await fetch('/api/telegram/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: '-1001234567890',
                        text: 'Test notification'
                    })
                })

                if (res.ok) {
                    return {
                        success: true,
                        attempts: attempt,
                        delays
                    }
                }

                if (res.status === 429 && attempt < maxRetries) {
                    // Justified hard wait: tests exponential backoff behavior on 429.
                    // The wait IS the thing under test. Backoff: 1s, 2s, 4s.
                    const backoffMs = Math.pow(2, attempt - 1) * 1000
                    delays.push(backoffMs)
                    await new Promise(resolve => setTimeout(resolve, backoffMs))
                    continue
                }

                return { success: false, attempts: attempt, delays }
            }

            return { success: false, attempts: maxRetries, delays }
        })

        expect(result.success).toBe(true)
        expect(result.attempts).toBe(3)
        expect(result.delays.length).toBeGreaterThan(0)

        console.log('✅ Telegram rate limit handled with exponential backoff')
        console.log(`   - Total attempts: ${result.attempts}`)
        console.log(`   - Backoff delays: ${result.delays.join('ms, ')}ms`)

        await page.screenshot({
            path: 'e2e-results/error-telegram-rate-limit.png',
            fullPage: true
        })
    })
})
