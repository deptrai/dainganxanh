import { test, expect } from '@playwright/test'

/**
 * Checkout & Payment Flow E2E Test Suite
 * Tests the complete revenue-critical flow from checkout to payment confirmation
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Test user: phanquochoipt@gmail.com
 */

test.describe('Checkout & Payment Flow E2E', () => {
    const TEST_EMAIL = 'phanquochoipt@gmail.com'
    const MAILPIT_URL = 'http://127.0.0.1:54334'

    /**
     * Helper: Fetch OTP code from Mailpit
     */
    async function getOTPFromMailpit(email: string): Promise<string> {
        await new Promise(resolve => setTimeout(resolve, 2000))

        const response = await fetch(`${MAILPIT_URL}/api/v1/messages`)
        const data = await response.json()

        const messages = data.messages || []
        const latestMessage = messages.find((msg: any) =>
            msg.To && msg.To.some((to: any) => to.Address === email)
        )

        if (!latestMessage) {
            throw new Error(`No email found for ${email} in Mailpit`)
        }

        const msgResponse = await fetch(`${MAILPIT_URL}/api/v1/message/${latestMessage.ID}`)
        const msgData = await msgResponse.json()

        const text = msgData.Text || ''
        const otpMatch = text.match(/\b\d{8}\b/)

        if (!otpMatch) {
            throw new Error(`Could not extract OTP from email: ${text}`)
        }

        return otpMatch[0]
    }

    /**
     * Helper: Complete OTP login flow
     */
    async function loginWithOTP(page: any) {
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        const emailInput = page.locator('input#identifier-input[type="email"]')
        await expect(emailInput).toBeVisible()
        await emailInput.fill(TEST_EMAIL)

        const sendOTPButton = page.getByRole('button', { name: /gửi mã otp/i })
        await sendOTPButton.click()

        await expect(page.getByText(/nhập mã otp \(8 chữ số\)/i)).toBeVisible({ timeout: 10000 })

        console.log('⏳ Fetching OTP from Mailpit...')
        const otpCode = await getOTPFromMailpit(TEST_EMAIL)
        console.log(`✅ Got OTP: ${otpCode}`)

        const otpInputs = page.locator('input[inputmode="numeric"]')
        await expect(otpInputs).toHaveCount(8)

        for (let i = 0; i < 8; i++) {
            await otpInputs.nth(i).fill(otpCode[i])
        }

        const skipButton = page.getByRole('button', { name: /bỏ qua/i })
        try {
            await skipButton.waitFor({ state: 'visible', timeout: 10000 })
            await skipButton.click()
            await page.waitForLoadState('networkidle')
        } catch {
            await page.waitForLoadState('networkidle')
        }

        console.log('✅ Login successful')
    }

    /**
     * Test: Complete checkout flow with QR payment
     */
    test('complete flow: login → checkout → view QR → wait for payment', async ({ page }) => {
        // ============================================
        // Phase 1: Login
        // ============================================
        await loginWithOTP(page)

        // Navigate to checkout explicitly
        await page.goto('/checkout')
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 2: Verify checkout page loaded
        // ============================================
        // Check order summary is visible
        await expect(page.getByText('Đơn hàng của bạn')).toBeVisible({ timeout: 10000 })

        // Verify quantity is displayed
        const quantityText = page.locator('text=/\\d+ cây/i')
        await expect(quantityText).toBeVisible()

        // Verify total amount is displayed
        const totalAmount = page.locator('text=/\\d+\\.?\\d* ₫/i').last()
        await expect(totalAmount).toBeVisible()

        // ============================================
        // Phase 3: Verify order code generated
        // ============================================
        const orderCodeElement = page.locator('span.font-mono.font-semibold.text-emerald-600')
        await expect(orderCodeElement).toBeVisible({ timeout: 5000 })
        const orderCode = await orderCodeElement.textContent()
        expect(orderCode).toMatch(/^DH[A-Z0-9]{6}$/)
        console.log(`✅ Order code generated: ${orderCode}`)

        // ============================================
        // Phase 4: Verify payment section (QR code)
        // ============================================
        // Wait for payment component to load
        await expect(page.getByText('Quét mã QR để thanh toán')).toBeVisible({ timeout: 10000 })

        // Verify QR code is displayed (canvas element)
        const qrCanvas = page.locator('canvas')
        await expect(qrCanvas).toBeVisible({ timeout: 5000 })

        // Verify bank info is displayed
        await expect(page.getByText(/ngân hàng:/i)).toBeVisible()
        await expect(page.getByText(/số tài khoản:/i)).toBeVisible()
        await expect(page.getByText(/nội dung:/i)).toBeVisible()

        // Verify order code appears in payment description
        const paymentDescription = page.locator(`text=${orderCode}`)
        await expect(paymentDescription).toBeVisible()

        // ============================================
        // Phase 5: Verify polling status UI
        // ============================================
        // Check for "Đang chờ thanh toán" status
        await expect(page.locator('text=/đang chờ thanh toán|chờ xác nhận/i')).toBeVisible({ timeout: 5000 })

        // ============================================
        // Phase 6: Take screenshot
        // ============================================
        await page.screenshot({
            path: 'e2e-results/checkout-payment-qr.png',
            fullPage: true
        })

        console.log(`✅ Checkout & Payment flow verified - QR displayed, polling active`)
    })

    /**
     * Test: Cancel pending order flow
     */
    test('cancel pending order during payment', async ({ page }) => {
        // Login
        await loginWithOTP(page)

        // Navigate to checkout explicitly
        await page.goto('/checkout')
        await page.waitForLoadState('networkidle')

        // Wait for checkout page to load
        await expect(page.getByText('Đơn hàng của bạn')).toBeVisible({ timeout: 10000 })

        // Find and click cancel button
        const cancelButton = page.getByRole('button', { name: /hủy đơn/i })
        await expect(cancelButton).toBeVisible({ timeout: 5000 })
        await cancelButton.click()

        // Confirm cancellation in dialog (if exists)
        const confirmButton = page.getByRole('button', { name: /xác nhận|đồng ý/i })
        if (await confirmButton.isVisible()) {
            await confirmButton.click()
        }

        // Verify redirect to home or login
        await page.waitForURL(/\/$|\/login/, { timeout: 10000 })

        console.log(`✅ Order cancelled successfully`)
    })

    /**
     * Test: Returning to checkout with existing pending order
     */
    test('returning user sees existing pending order', async ({ page, context }) => {
        // Login
        await loginWithOTP(page)
        await expect(page).toHaveURL(/checkout/, { timeout: 5000 })

        // Wait for first checkout page load
        await expect(page.getByText('Đơn hàng của bạn')).toBeVisible({ timeout: 10000 })

        // Get the order code
        const orderCodeElement = page.locator('span.font-mono.font-semibold.text-emerald-600')
        await expect(orderCodeElement).toBeVisible({ timeout: 5000 })
        const firstOrderCode = await orderCodeElement.textContent()

        // Navigate away
        await page.goto('/')

        // Navigate back to checkout
        await page.goto('/checkout')
        await page.waitForLoadState('networkidle')

        // Verify same order code appears (existing pending order reused)
        await expect(page.getByText('Đơn hàng của bạn')).toBeVisible({ timeout: 10000 })
        const secondOrderCodeElement = page.locator('span.font-mono.font-semibold.text-emerald-600')
        await expect(secondOrderCodeElement).toBeVisible({ timeout: 5000 })
        const secondOrderCode = await secondOrderCodeElement.textContent()

        expect(secondOrderCode).toBe(firstOrderCode)

        console.log(`✅ Existing pending order reused: ${firstOrderCode}`)
    })

    /**
     * Test: Checkout with different quantities
     */
    test('checkout updates total for different quantities', async ({ page }) => {
        // Login
        await loginWithOTP(page)
        await expect(page).toHaveURL(/checkout/, { timeout: 5000 })

        // Test with quantity = 5
        await page.goto('/checkout?quantity=5')
        await page.waitForLoadState('networkidle')

        await expect(page.getByText('Đơn hàng của bạn')).toBeVisible({ timeout: 10000 })

        // Verify quantity = 5
        await expect(page.getByText('5 cây')).toBeVisible()

        // Verify total = 5 * 260000 = 1,300,000
        const expectedTotal = (5 * 260000).toLocaleString('vi-VN')
        await expect(page.locator(`text=${expectedTotal} ₫`)).toBeVisible()

        // Verify CO2 impact = 5 * 20 = 100 kg
        await expect(page.getByText('~100 kg CO₂/năm')).toBeVisible()

        console.log(`✅ Checkout quantity calculation correct`)
    })

    /**
     * Test: No console errors during checkout
     */
    test('no console errors during checkout flow', async ({ page }) => {
        const consoleErrors: string[] = []

        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text())
            }
        })

        // Login and checkout
        await loginWithOTP(page)
        await expect(page).toHaveURL(/checkout/, { timeout: 5000 })

        // Wait for checkout page to fully load
        await expect(page.getByText('Đơn hàng của bạn')).toBeVisible({ timeout: 10000 })
        await expect(page.getByText('Quét mã QR để thanh toán')).toBeVisible({ timeout: 10000 })

        // Wait a bit for any async errors
        await page.waitForTimeout(3000)

        // Verify no console errors
        if (consoleErrors.length > 0) {
            console.error('❌ Console errors detected:', consoleErrors)
            throw new Error(`Found ${consoleErrors.length} console errors`)
        }

        console.log(`✅ No console errors detected`)
    })
})
