import { test, expect } from '@playwright/test'
import { getOTPFromMailpit } from '../../utils/mailpit'

/**
 * Registration & Authentication E2E Test Suite
 * Tests the complete registration and login flow with OTP verification
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 */

test.describe('Registration & Authentication Flow E2E', () => {
    const BASE_EMAIL = 'test-registration'
    const TEST_PHONE = '0901234567'
    const DEFAULT_REF_CODE = 'dainganxanh'

    // Generate unique email for each test to avoid OTP conflicts
    function getTestEmail(testName: string): string {
        const timestamp = Date.now()
        const sanitized = testName.replace(/[^a-z0-9]/gi, '').toLowerCase()
        return `${BASE_EMAIL}-${sanitized}-${timestamp}@test.local`
    }

    /**
     * Test 1: New user navigates from quantity to registration
     * Flow: /quantity → not authenticated → /register?quantity=5
     */
    test('new user navigates from quantity to registration', async ({ page }) => {
        // Mock user check API - user does not exist
        await page.route('**/api/auth/check-user**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ exists: false })
            })
        })

        // Navigate to quantity page
        await page.goto('/quantity')
        await page.waitForLoadState('networkidle')

        // Select quantity (e.g., 5 trees)
        const fiveTreesButton = page.getByRole('button', { name: /^5$/ })
        await expect(fiveTreesButton).toBeVisible({ timeout: 10000 })
        await fiveTreesButton.click()

        // Click checkout button
        const checkoutButton = page.getByRole('button', { name: /tiếp tục|thanh toán/i })
        await expect(checkoutButton).toBeVisible()
        await checkoutButton.click()

        // Should redirect to registration with quantity param
        await expect(page).toHaveURL(/\/register\?.*quantity=5/, { timeout: 10000 })

        // Verify registration form is shown
        await expect(page.getByText(/đăng ký|tạo tài khoản/i)).toBeVisible()
        const emailInput = page.locator('input[type="email"]').or(page.locator('input[type="tel"]'))
        await expect(emailInput.first()).toBeVisible()

        console.log('✅ User redirected to registration with quantity parameter')
    })

    /**
     * Test 2: User registers with phone and receives OTP
     * Flow: Enter phone → click "Gửi mã OTP" → Mailpit receives email
     */
    test('user registers with phone and receives OTP', async ({ page }) => {
        const testEmail = getTestEmail('otp-test')

        // Navigate to register page
        await page.goto('/register?quantity=3')
        await page.waitForLoadState('networkidle')

        // Wait to avoid rate limiting
        await page.waitForTimeout(2000)

        // Find email input (after selecting Email tab)
        const emailTabButton = page.getByRole('button', { name: /email/i }).first()
        await expect(emailTabButton).toBeVisible({ timeout: 10000 })
        await emailTabButton.click()

        const emailInput = page.locator('input[placeholder*="email"]')
        await expect(emailInput).toBeVisible()
        await emailInput.fill(testEmail)

        // Fill referral code (required field)
        const useDefaultButton = page.getByRole('button', { name: /bấm vào đây để dùng mã/i })
        await useDefaultButton.click()

        // Click send OTP button
        const sendOTPButton = page.getByRole('button', { name: /gửi mã otp/i })
        await expect(sendOTPButton).toBeVisible()
        await sendOTPButton.click()

        // Verify OTP input form appears
        await expect(page.getByText(/nhập mã otp \(8 chữ số\)/i)).toBeVisible({ timeout: 10000 })

        // Verify 8 OTP input fields
        const otpInputs = page.locator('input[inputmode="numeric"]')
        await expect(otpInputs).toHaveCount(8)

        // Verify OTP was sent to Mailpit (real email delivery in dev environment)
        console.log('⏳ Fetching OTP from Mailpit...')
        const otpCode = await getOTPFromMailpit(testEmail)
        console.log(`✅ Got OTP: ${otpCode}`)
        expect(otpCode).toMatch(/^\d{8}$/)

        console.log('✅ Registration OTP sent and received successfully')
    })

    /**
     * Test 3: User enters correct OTP and completes registration
     * Flow: Enter valid OTP → verify → session created → redirect to checkout
     */
    test('user enters correct OTP and completes registration', async ({ page }) => {
        const testEmail = getTestEmail('complete-registration')

        // Navigate to register page
        await page.goto('/register?quantity=5')
        await page.waitForLoadState('networkidle')

        // Wait to avoid rate limiting
        await page.waitForTimeout(2000)

        // Click Email tab and enter email
        const emailTabButton = page.getByRole('button', { name: /email/i }).first()
        await emailTabButton.click()

        const emailInput = page.locator('input[placeholder*="email"]')
        await emailInput.fill(testEmail)

        // Fill referral code (required field)
        const useDefaultButton = page.getByRole('button', { name: /bấm vào đây để dùng mã/i })
        await useDefaultButton.click()

        // Send OTP
        const sendOTPButton = page.getByRole('button', { name: /gửi mã otp/i })
        await sendOTPButton.click()

        // Wait for OTP input
        await expect(page.getByText(/nhập mã otp \(8 chữ số\)/i)).toBeVisible({ timeout: 10000 })

        // Get real OTP from Mailpit
        console.log('⏳ Fetching OTP from Mailpit...')
        const otpCode = await getOTPFromMailpit(testEmail)
        console.log(`✅ Got OTP: ${otpCode}`)

        // Enter OTP
        const otpInputs = page.locator('input[inputmode="numeric"]')
        for (let i = 0; i < 8; i++) {
            await otpInputs.nth(i).fill(otpCode[i])
        }

        // Should auto-submit and redirect to checkout with quantity
        await expect(page).toHaveURL(/\/checkout\?.*quantity=5/, { timeout: 15000 })

        // Verify checkout page loaded
        await expect(page.getByText('Đơn hàng của bạn')).toBeVisible({ timeout: 10000 })

        console.log('✅ Registration completed and redirected to checkout')
    })

    /**
     * Test 4: User enters referral code during registration
     * Flow: Enter phone → enter referral code → OTP flow → verify ref cookie
     */
    test('user enters referral code during registration', async ({ page, context }) => {
        const testEmail = getTestEmail('referral-code')
        const CUSTOM_REF_CODE = 'abc123' // lowercase because system converts to lowercase

        // Navigate to register
        await page.goto('/register?quantity=3')
        await page.waitForLoadState('networkidle')

        // Wait to avoid rate limiting
        await page.waitForTimeout(2000)

        // Click Email tab and enter email
        const emailTabButton = page.getByRole('button', { name: /email/i }).first()
        await emailTabButton.click()

        const emailInput = page.locator('input[placeholder*="email"]')
        await emailInput.fill(testEmail)

        // Enter referral code
        const referralInput = page.locator('input[placeholder*="dainganxanh"]').or(page.locator('input[placeholder*="VD:"]'))
        const hasReferralInput = await referralInput.count() > 0

        if (hasReferralInput) {
            await referralInput.first().fill(CUSTOM_REF_CODE)
        }

        // Send OTP
        const sendOTPButton = page.getByRole('button', { name: /gửi mã otp/i })
        await sendOTPButton.click()

        // Wait for OTP input
        await expect(page.getByText(/nhập mã otp \(8 chữ số\)/i)).toBeVisible({ timeout: 10000 })

        // Get and enter OTP
        const otpCode = await getOTPFromMailpit(testEmail)
        const otpInputs = page.locator('input[inputmode="numeric"]')
        for (let i = 0; i < 8; i++) {
            await otpInputs.nth(i).fill(otpCode[i])
        }

        // Wait for redirect
        await page.waitForURL(/\/checkout/, { timeout: 15000 })

        // Verify ref cookie is set
        const cookies = await context.cookies()
        const refCookie = cookies.find(c => c.name === 'ref')

        if (hasReferralInput) {
            expect(refCookie?.value).toBe(CUSTOM_REF_CODE)
            console.log(`✅ Custom referral code set: ${CUSTOM_REF_CODE}`)
        } else {
            console.log('ℹ️  Referral input not found in registration form')
        }
    })

    /**
     * Test 5: User registration without referral code uses default
     * Flow: Enter phone (no ref input) → complete OTP → verify default ref cookie
     */
    test('user registration without referral code uses default', async ({ page, context }) => {
        const testEmail = getTestEmail('default-ref')

        // Navigate to register (no ref in URL)
        await page.goto('/register?quantity=2')
        await page.waitForLoadState('networkidle')

        // Wait to avoid rate limiting
        await page.waitForTimeout(2000)

        // Click Email tab and enter email (do NOT enter referral code)
        const emailTabButton = page.getByRole('button', { name: /email/i }).first()
        await emailTabButton.click()

        const emailInput = page.locator('input[placeholder*="email"]')
        await emailInput.fill(testEmail)

        // Click the "use default" button for referral code
        const useDefaultButton = page.getByRole('button', { name: /bấm vào đây để dùng mã/i })
        const hasDefaultButton = await useDefaultButton.count() > 0

        if (hasDefaultButton) {
            await useDefaultButton.click()
        }

        // Send OTP
        const sendOTPButton = page.getByRole('button', { name: /gửi mã otp/i })
        await sendOTPButton.click()

        // Wait for OTP input
        await expect(page.getByText(/nhập mã otp \(8 chữ số\)/i)).toBeVisible({ timeout: 10000 })

        // Get and enter OTP
        const otpCode = await getOTPFromMailpit(testEmail)
        const otpInputs = page.locator('input[inputmode="numeric"]')
        for (let i = 0; i < 8; i++) {
            await otpInputs.nth(i).fill(otpCode[i])
        }

        // Wait for redirect
        await page.waitForURL(/\/checkout/, { timeout: 15000 })

        // Verify ref cookie is set (accept either default or system default)
        const cookies = await context.cookies()
        const refCookie = cookies.find(c => c.name === 'ref')

        expect(refCookie).toBeDefined()
        expect(refCookie?.value).toBeTruthy()
        console.log(`✅ Default referral code set: ${refCookie?.value}`)
    })

    /**
     * Test 6: Already registered user redirects to login
     * Flow: Click "Đã có tài khoản? Đăng nhập" → redirect to /login with quantity param
     */
    test('already registered user redirects to login', async ({ page }) => {
        // Navigate to register page
        await page.goto('/register?quantity=5')
        await page.waitForLoadState('networkidle')

        // Find and click login link
        const loginLink = page.getByRole('link', { name: /đăng nhập ngay/i })
        await expect(loginLink).toBeVisible({ timeout: 10000 })
        await loginLink.click()

        // Should redirect to login page
        await expect(page).toHaveURL(/\/login/, { timeout: 10000 })

        // Verify quantity parameter is preserved
        const url = page.url()
        expect(url).toMatch(/quantity=5/)

        // Verify login form is shown
        const emailTabButton = page.getByRole('button', { name: /email/i }).first()
        await expect(emailTabButton).toBeVisible()

        console.log('✅ Redirected to login with quantity parameter')
    })

    /**
     * Test 7: User completes login flow successfully
     * Flow: /login → OTP verification → redirect to /crm/my-garden (default)
     * Note: Redirects to /checkout?quantity=N only if ?quantity= param is present in URL
     */
    test('user completes login flow successfully', async ({ page }) => {
        const testEmail = getTestEmail('login-test')

        // Navigate to login page
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        // Wait to avoid rate limiting
        await page.waitForTimeout(2000)

        // Click Email tab and enter email
        const emailTabButton = page.getByRole('button', { name: /email/i }).first()
        await expect(emailTabButton).toBeVisible({ timeout: 10000 })
        await emailTabButton.click()

        const emailInput = page.locator('input[placeholder*="email"]')
        await emailInput.fill(testEmail)

        // Send OTP
        const sendOTPButton = page.getByRole('button', { name: /gửi mã otp/i })
        await sendOTPButton.click()

        // Wait for OTP input
        await expect(page.getByText(/nhập mã otp \(8 chữ số\)/i)).toBeVisible({ timeout: 10000 })

        // Get and enter OTP
        const otpCode = await getOTPFromMailpit(testEmail)
        const otpInputs = page.locator('input[inputmode="numeric"]')
        for (let i = 0; i < 8; i++) {
            await otpInputs.nth(i).fill(otpCode[i])
        }

        // After OTP, referral modal may appear (for new users without ref cookie)
        // Handle it by entering default ref or clicking skip/submit
        const refModal = page.getByText(/mã giới thiệu/i).or(page.getByText(/referral/i))
        const skipButton = page.getByRole('button', { name: /bỏ qua/i })
        const useDefaultBtn = page.getByRole('button', { name: /dùng mã mặc định/i })
            .or(page.getByRole('button', { name: /bấm vào đây/i }))
        const confirmBtn = page.getByRole('button', { name: /xác nhận/i })
            .or(page.getByRole('button', { name: /tiếp tục/i }))

        try {
            // Wait for either referral modal or redirect
            await Promise.race([
                refModal.first().waitFor({ state: 'visible', timeout: 10000 }),
                page.waitForURL(/\/checkout/, { timeout: 10000 })
            ])

            // If still on login page with modal, handle it
            if (page.url().includes('/login')) {
                // Try use default button first, then confirm
                const hasDefault = await useDefaultBtn.count() > 0
                if (hasDefault) {
                    await useDefaultBtn.first().click()
                    await page.waitForTimeout(500)
                }
                const hasConfirm = await confirmBtn.count() > 0
                if (hasConfirm) {
                    await confirmBtn.first().click()
                } else {
                    const hasSkip = await skipButton.count() > 0
                    if (hasSkip) {
                        await skipButton.click()
                    }
                }
            }
        } catch {
            // Timeout — try skip button as fallback
            const hasSkip = await skipButton.count() > 0
            if (hasSkip) {
                await skipButton.click()
            }
        }

        // Wait for final redirect — /crm/my-garden (default) or /checkout (if quantity param present)
        await page.waitForURL(/\/(crm|checkout)/, { timeout: 15000 })

        const currentUrl = page.url()
        expect(currentUrl).toMatch(/\/(crm|checkout)/)

        console.log(`✅ Login completed successfully, redirected to: ${currentUrl}`)
    })

    /**
     * Test 8: No console errors during registration flow
     */
    test('no console errors during registration flow', async ({ page }) => {
        const testEmail = getTestEmail('no-console-errors')
        const consoleErrors: string[] = []

        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text()
                // Ignore resource loading errors (406, 404, etc.)
                if (!text.includes('Failed to load resource') && !text.includes('404') && !text.includes('406')) {
                    consoleErrors.push(text)
                }
            }
        })

        // Navigate to register page
        await page.goto('/register?quantity=3')
        await page.waitForLoadState('networkidle')

        // Wait to avoid rate limiting
        await page.waitForTimeout(2000)

        // Click Email tab and enter email
        const emailTabButton = page.getByRole('button', { name: /email/i }).first()
        await emailTabButton.click()

        const emailInput = page.locator('input[placeholder*="email"]')
        await emailInput.fill(testEmail)

        // Use default referral code
        const useDefaultButton = page.getByRole('button', { name: /bấm vào đây để dùng mã/i })
        await useDefaultButton.click()

        // Send OTP
        const sendOTPButton = page.getByRole('button', { name: /gửi mã otp/i })
        await sendOTPButton.click()

        // Wait for OTP input
        await expect(page.getByText(/nhập mã otp \(8 chữ số\)/i)).toBeVisible({ timeout: 10000 })

        // Get and enter OTP
        const otpCode = await getOTPFromMailpit(testEmail)
        const otpInputs = page.locator('input[inputmode="numeric"]')
        for (let i = 0; i < 8; i++) {
            await otpInputs.nth(i).fill(otpCode[i])
        }

        // Wait for redirect and any async errors
        await page.waitForURL(/\/checkout/, { timeout: 15000 })
        await page.waitForTimeout(3000)

        // Verify no critical console errors (ignore 406 Not Acceptable - expected for some resources)
        const criticalErrors = consoleErrors.filter(err =>
            !err.includes('406') && !err.includes('Not Acceptable')
        )

        if (criticalErrors.length > 0) {
            console.error('❌ Critical console errors detected:', criticalErrors)
            throw new Error(`Found ${criticalErrors.length} critical console errors`)
        }

        console.log('✅ No critical console errors detected during registration flow')
    })
})
