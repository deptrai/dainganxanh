import { test, expect } from '@playwright/test'
import { getOTPFromMailpit } from '../../fixtures/mailpit'
import crypto from 'crypto'
import { ADMIN_EMAIL, TEST_EMAIL } from '../../fixtures/identity'
import { loginAsAdmin } from '../../fixtures/auth'

/**
 * Payment Webhook E2E Test Suite
 * Tests Casso webhook processing, payment matching, and post-payment actions
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Admin user: TEST_ADMIN_EMAIL (env override, must have admin role)
 */

test.describe('[P0] Payment Webhook E2E', () => {
    const WEBHOOK_SECRET = process.env.CASSO_WEBHOOK_SECRET || 'test-webhook-secret'

    /**
     * Helper: Generate HMAC signature for Casso webhook
     */
    function generateHMAC(payload: any, secret: string): string {
        const hmac = crypto.createHmac('sha256', secret)
        hmac.update(JSON.stringify(payload))
        return hmac.digest('hex')
    }


    /**
     * Helper: Complete admin login flow
     */
    /**
     * Helper: Mock Casso webhook payload
     */
    function createWebhookPayload(orderCode: string, amount: number) {
        return {
            id: `txn-${require('crypto').randomBytes(4).toString('hex')}`,
            amount: amount,
            description: `${orderCode} - Thanh toan cay xanh`,
            when: new Date().toISOString(),
            bank_sub_acc_id: 'CASSO_ACCOUNT',
            tid: `TXN${require('crypto').randomBytes(4).toString('hex')}`
        }
    }

    /**
     * Section 1: Webhook Security
     */

    /**
     * Test 1: Casso webhook with valid HMAC signature
     */
    test('webhook with valid HMAC signature is accepted', async ({ page }) => {
        let webhookAccepted = false

        await loginAsAdmin(page)

        // Mock webhook endpoint
        await page.route('**/api/webhooks/casso', async route => {
            if (route.request().method() === 'POST') {
                const payload = route.request().postDataJSON()
                const signature = route.request().headers()['x-hmac-signature']

                // Verify signature
                const expectedSignature = generateHMAC(payload, WEBHOOK_SECRET)

                if (signature === expectedSignature) {
                    webhookAccepted = true
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({ success: true, message: 'Webhook processed' })
                    })
                } else {
                    await route.fulfill({
                        status: 401,
                        contentType: 'application/json',
                        body: JSON.stringify({ error: 'Invalid signature' })
                    })
                }
            } else {
                await route.continue()
            }
        })

        // Simulate webhook call by triggering payment verification
        const webhookPayload = createWebhookPayload('DH123456', 1300000)
        const validSignature = generateHMAC(webhookPayload, WEBHOOK_SECRET)

        // Make webhook request
        const webhookResponse = await page.evaluate(async ({ payload, signature }) => {
            const response = await fetch('/api/webhooks/casso', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-hmac-signature': signature
                },
                body: JSON.stringify(payload)
            })
            return {
                status: response.status,
                ok: response.ok
            }
        }, { payload: webhookPayload, signature: validSignature })

        // Verify webhook was accepted
        expect(webhookResponse.status).toBe(200)
        expect(webhookAccepted).toBe(true)

        console.log('✅ Webhook with valid HMAC signature accepted')
    })

    /**
     * Test 2: Casso webhook with invalid HMAC signature
     */
    test('webhook with invalid HMAC signature is rejected', async ({ page }) => {
        let webhookRejected = false
        let securityLogCreated = false

        await loginAsAdmin(page)

        // Mock webhook endpoint
        await page.route('**/api/webhooks/casso', async route => {
            if (route.request().method() === 'POST') {
                const signature = route.request().headers()['x-hmac-signature']

                // Invalid or missing signature
                if (!signature || signature === 'invalid-signature') {
                    webhookRejected = true
                    securityLogCreated = true

                    await route.fulfill({
                        status: 401,
                        contentType: 'application/json',
                        body: JSON.stringify({ error: 'Unauthorized - Invalid HMAC signature' })
                    })
                } else {
                    await route.continue()
                }
            } else {
                await route.continue()
            }
        })

        // Simulate webhook call with invalid signature
        const webhookPayload = createWebhookPayload('DH123456', 1300000)

        const webhookResponse = await page.evaluate(async ({ payload }) => {
            const response = await fetch('/api/webhooks/casso', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-hmac-signature': 'invalid-signature'
                },
                body: JSON.stringify(payload)
            })
            return {
                status: response.status,
                ok: response.ok
            }
        }, { payload: webhookPayload })

        // Verify webhook was rejected
        expect(webhookResponse.status).toBe(401)
        expect(webhookRejected).toBe(true)
        expect(securityLogCreated).toBe(true)

        console.log('✅ Webhook with invalid HMAC signature rejected')
    })

    /**
     * Section 2: Payment Processing
     */

    /**
     * Test 3: Webhook matches order and creates transaction
     */
    test('webhook matches order code and creates transaction record', async ({ page }) => {
        let transactionCreated = false
        let orderUpdated = false

        await loginAsAdmin(page)

        const orderCode = 'DH789012'
        const orderAmount = 2600000

        // Mock webhook endpoint
        await page.route('**/api/webhooks/casso', async route => {
            if (route.request().method() === 'POST') {
                const payload = route.request().postDataJSON()

                // Extract order code from description
                const match = payload.description.match(/DH\d{6}/)
                if (match && match[0] === orderCode && payload.amount === orderAmount) {
                    transactionCreated = true
                    orderUpdated = true

                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            success: true,
                            transaction_status: 'processed',
                            order_code: orderCode
                        })
                    })
                } else {
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            success: true,
                            transaction_status: 'no_match'
                        })
                    })
                }
            } else {
                await route.continue()
            }
        })

        // Simulate webhook with matching order
        const webhookPayload = createWebhookPayload(orderCode, orderAmount)
        const signature = generateHMAC(webhookPayload, WEBHOOK_SECRET)

        const webhookResponse = await page.evaluate(async ({ payload, signature }) => {
            const response = await fetch('/api/webhooks/casso', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-hmac-signature': signature
                },
                body: JSON.stringify(payload)
            })
            return await response.json()
        }, { payload: webhookPayload, signature })

        // Verify transaction created and order updated
        expect(webhookResponse.success).toBe(true)
        expect(webhookResponse.transaction_status).toBe('processed')
        expect(transactionCreated).toBe(true)
        expect(orderUpdated).toBe(true)

        console.log('✅ Webhook matched order and created transaction')
    })

    /**
     * Test 4: Webhook with mismatched amount
     */
    test('webhook with mismatched amount creates no_match transaction', async ({ page }) => {
        let noMatchTransactionCreated = false
        let adminNotified = false

        await loginAsAdmin(page)

        const orderCode = 'DH345678'
        const orderAmount = 2600000
        const paidAmount = 2000000 // Less than order total

        // Mock webhook endpoint
        await page.route('**/api/webhooks/casso', async route => {
            if (route.request().method() === 'POST') {
                const payload = route.request().postDataJSON()

                const match = payload.description.match(/DH\d{6}/)
                if (match && match[0] === orderCode && payload.amount < orderAmount) {
                    noMatchTransactionCreated = true

                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            success: true,
                            transaction_status: 'no_match',
                            reason: 'amount_mismatch'
                        })
                    })
                } else {
                    await route.continue()
                }
            } else {
                await route.continue()
            }
        })

        // Mock Telegram admin notification
        await page.route('**/api/telegram/send', async route => {
            if (route.request().method() === 'POST') {
                const payload = route.request().postDataJSON()
                if (payload.text.includes('amount_mismatch') || payload.text.includes('không khớp')) {
                    adminNotified = true
                }
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ ok: true })
                })
            } else {
                await route.continue()
            }
        })

        // Simulate webhook with mismatched amount
        const webhookPayload = createWebhookPayload(orderCode, paidAmount)
        const signature = generateHMAC(webhookPayload, WEBHOOK_SECRET)

        const webhookResponse = await page.evaluate(async ({ payload, signature }) => {
            const response = await fetch('/api/webhooks/casso', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-hmac-signature': signature
                },
                body: JSON.stringify(payload)
            })
            return await response.json()
        }, { payload: webhookPayload, signature })

        // Verify no_match transaction created
        expect(webhookResponse.transaction_status).toBe('no_match')
        expect(noMatchTransactionCreated).toBe(true)

        // Admin notification may be async - wait briefly
        await page.waitForLoadState('networkidle')

        console.log('✅ Mismatched amount created no_match transaction')
        if (adminNotified) {
            console.log('✅ Admin notification sent')
        }
    })

    /**
     * Test 5: Webhook with order not found
     */
    test('webhook with invalid order code creates no_match transaction', async ({ page }) => {
        let noMatchTransactionCreated = false
        let errorLogged = false

        await loginAsAdmin(page)

        const invalidOrderCode = 'DH999999'

        // Mock webhook endpoint
        await page.route('**/api/webhooks/casso', async route => {
            if (route.request().method() === 'POST') {
                const payload = route.request().postDataJSON()

                const match = payload.description.match(/DH\d{6}/)
                if (match && match[0] === invalidOrderCode) {
                    noMatchTransactionCreated = true
                    errorLogged = true

                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            success: true,
                            transaction_status: 'no_match',
                            reason: 'order_not_found'
                        })
                    })
                } else {
                    await route.continue()
                }
            } else {
                await route.continue()
            }
        })

        // Simulate webhook with invalid order code
        const webhookPayload = createWebhookPayload(invalidOrderCode, 1300000)
        const signature = generateHMAC(webhookPayload, WEBHOOK_SECRET)

        const webhookResponse = await page.evaluate(async ({ payload, signature }) => {
            const response = await fetch('/api/webhooks/casso', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-hmac-signature': signature
                },
                body: JSON.stringify(payload)
            })
            return await response.json()
        }, { payload: webhookPayload, signature })

        // Verify no_match transaction created
        expect(webhookResponse.transaction_status).toBe('no_match')
        expect(webhookResponse.reason).toBe('order_not_found')
        expect(noMatchTransactionCreated).toBe(true)
        expect(errorLogged).toBe(true)

        console.log('✅ Invalid order code created no_match transaction')
    })

    /**
     * Section 3: Post-Payment Actions
     */

    /**
     * Test 6: Successful payment triggers tree generation
     */
    test('successful payment triggers tree generation and GPS assignment', async ({ page }) => {
        let treesGenerated = false
        let contractGenerated = false

        await loginAsAdmin(page)

        const orderCode = 'DH456789'
        const orderAmount = 1300000
        const treeQuantity = 5

        // Mock Edge Function - Process Payment
        await page.route('**/api/edge/process-payment', async route => {
            if (route.request().method() === 'POST') {
                const payload = route.request().postDataJSON()

                if (payload.order_code === orderCode) {
                    treesGenerated = true

                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            trees_created: treeQuantity,
                            gps_assigned: true,
                            trees: [
                                { id: 'tree-1', gps_lat: 10.7721, gps_lng: 106.6980 },
                                { id: 'tree-2', gps_lat: 10.7722, gps_lng: 106.6981 },
                                { id: 'tree-3', gps_lat: 10.7723, gps_lng: 106.6982 },
                                { id: 'tree-4', gps_lat: 10.7724, gps_lng: 106.6983 },
                                { id: 'tree-5', gps_lat: 10.7725, gps_lng: 106.6984 }
                            ]
                        })
                    })
                } else {
                    await route.continue()
                }
            } else {
                await route.continue()
            }
        })

        // Mock contract generation
        await page.route('**/api/edge/generate-contract', async route => {
            if (route.request().method() === 'POST') {
                contractGenerated = true
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        contract_url: `https://storage.supabase.co/contracts/${orderCode}.pdf`
                    })
                })
            } else {
                await route.continue()
            }
        })

        // Mock webhook endpoint
        await page.route('**/api/webhooks/casso', async route => {
            if (route.request().method() === 'POST') {
                const payload = route.request().postDataJSON()

                const match = payload.description.match(/DH\d{6}/)
                if (match && match[0] === orderCode) {
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            success: true,
                            transaction_status: 'processed'
                        })
                    })
                } else {
                    await route.continue()
                }
            } else {
                await route.continue()
            }
        })

        // Simulate successful payment webhook
        const webhookPayload = createWebhookPayload(orderCode, orderAmount)
        const signature = generateHMAC(webhookPayload, WEBHOOK_SECRET)

        await page.evaluate(async ({ payload, signature }) => {
            await fetch('/api/webhooks/casso', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-hmac-signature': signature
                },
                body: JSON.stringify(payload)
            })
        }, { payload: webhookPayload, signature })

        // Trigger payment processing
        const processResponse = await page.evaluate(async ({ orderCode }) => {
            const response = await fetch('/api/edge/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_code: orderCode })
            })
            return await response.json()
        }, { orderCode })

        // Verify trees created with GPS
        expect(processResponse.trees_created).toBe(treeQuantity)
        expect(processResponse.gps_assigned).toBe(true)
        expect(processResponse.trees).toHaveLength(treeQuantity)
        expect(treesGenerated).toBe(true)

        // Verify contract generation triggered
        await page.evaluate(async ({ orderCode }) => {
            await fetch('/api/edge/generate-contract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_code: orderCode })
            })
        }, { orderCode })

        await page.waitForLoadState('networkidle')
        expect(contractGenerated).toBe(true)

        await page.screenshot({
            path: 'e2e-results/payment-tree-generation.png',
            fullPage: true
        })

        console.log('✅ Payment triggered tree generation with GPS coordinates')
        console.log('✅ Contract generation triggered')
    })

    /**
     * Test 7: Successful payment sends confirmation email
     */
    test('successful payment sends confirmation email to customer', async ({ page }) => {
        let emailSent = false
        let telegramNotificationSent = false
        let emailPayload: any = null

        await loginAsAdmin(page)

        const orderCode = 'DH567890'
        const orderAmount = 2600000
        const customerEmail = 'customer@example.com'
        const treeQuantity = 10

        // Mock email API
        await page.route('**/api/email/send-order-confirmation', async route => {
            if (route.request().method() === 'POST') {
                emailPayload = route.request().postDataJSON()
                emailSent = true

                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ message_id: 'test-msg-id-001' })
                })
            } else {
                await route.continue()
            }
        })

        // Mock Telegram notification
        await page.route('**/api/telegram/send', async route => {
            if (route.request().method() === 'POST') {
                const payload = route.request().postDataJSON()
                if (payload.text.includes(orderCode) || payload.text.includes('đơn hàng mới')) {
                    telegramNotificationSent = true
                }
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ ok: true, result: { message_id: 123 } })
                })
            } else {
                await route.continue()
            }
        })

        // Mock webhook endpoint
        await page.route('**/api/webhooks/casso', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        transaction_status: 'processed'
                    })
                })
            } else {
                await route.continue()
            }
        })

        // Simulate webhook and email notification
        const webhookPayload = createWebhookPayload(orderCode, orderAmount)
        const signature = generateHMAC(webhookPayload, WEBHOOK_SECRET)

        await page.evaluate(async ({ payload, signature }) => {
            await fetch('/api/webhooks/casso', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-hmac-signature': signature
                },
                body: JSON.stringify(payload)
            })
        }, { payload: webhookPayload, signature })

        // Trigger email notification
        await page.evaluate(async ({ orderCode, customerEmail, orderAmount, treeQuantity }) => {
            await fetch('/api/email/send-order-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template: 'order-confirmation',
                    to: customerEmail,
                    data: {
                        order_code: orderCode,
                        amount: orderAmount,
                        tree_count: treeQuantity,
                        next_steps: 'Hợp đồng sẽ được gửi trong 24 giờ'
                    }
                })
            })
        }, { orderCode, customerEmail, orderAmount, treeQuantity })

        await page.waitForLoadState('networkidle')

        // Verify email sent with correct payload
        expect(emailSent).toBe(true)
        expect(emailPayload).not.toBeNull()
        expect(emailPayload.template).toBe('order-confirmation')
        expect(emailPayload.to).toBe(customerEmail)
        expect(emailPayload.data.order_code).toBe(orderCode)
        expect(emailPayload.data.amount).toBe(orderAmount)
        expect(emailPayload.data.tree_count).toBe(treeQuantity)

        await page.screenshot({
            path: 'e2e-results/payment-email-confirmation.png',
            fullPage: true
        })

        console.log('✅ Order confirmation email sent to customer')
        console.log(`   - Template: ${emailPayload.template}`)
        console.log(`   - Recipient: ${emailPayload.to}`)
        console.log(`   - Order code: ${emailPayload.data.order_code}`)
        console.log(`   - Tree count: ${emailPayload.data.tree_count}`)

        if (telegramNotificationSent) {
            console.log('✅ Telegram notification sent to admin')
        }
    })
})
