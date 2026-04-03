import { test, expect } from '@playwright/test'

/**
 * Referral System E2E Test Suite
 * Tests the referral code sharing and tracking system
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Test user: phanquochoipt@gmail.com (with referral code setup)
 */

test.describe('Referral System Flow E2E', () => {
    const TEST_EMAIL = 'test@test.com'
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

        // Wait a bit to avoid rate limiting
        await page.waitForTimeout(2000)

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
     * Test: View referral page with code and stats
     */
    test('view referral page with code and stats', async ({ page }) => {
        // ============================================
        // Phase 1: Login
        // ============================================
        await loginWithOTP(page)

        // ============================================
        // Phase 2: Navigate to Referrals page
        // ============================================
        await page.goto('/crm/referrals')
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 3: Verify page header and description
        // ============================================
        await expect(page.getByText(/giới thiệu bạn bè/i)).toBeVisible({ timeout: 10000 })
        // Use first() to avoid strict mode violation since text appears multiple times
        await expect(page.getByText(/chia sẻ link giới thiệu/i).first()).toBeVisible()
        await expect(page.getByText(/hoa hồng 10%/i).first()).toBeVisible()

        // ============================================
        // Phase 4: Verify stats cards are displayed
        // ============================================
        // Stats should show total clicks, conversions, commission, conversion rate
        const statsSection = page.locator('div').filter({ hasText: /tổng.*|lượt.*|hoa hồng/i })
        await expect(statsSection.first()).toBeVisible({ timeout: 10000 })

        // ============================================
        // Phase 5: Verify referral code is displayed
        // ============================================
        await expect(page.locator('main').getByText(/mã giới thiệu/i).first()).toBeVisible()
        await expect(page.locator('main').getByText(/link giới thiệu của bạn/i).first()).toBeVisible()

        // Verify referral code format (should be visible in font-mono)
        const referralCode = page.locator('.font-mono').filter({ hasText: /[A-Z0-9]{6,}/ })
        await expect(referralCode.first()).toBeVisible()

        // ============================================
        // Phase 6: Take screenshot
        // ============================================
        await page.screenshot({
            path: 'e2e-results/referral-system-page.png',
            fullPage: true
        })

        console.log(`✅ Referral page loaded with code and stats`)
    })

    /**
     * Test: Copy referral link functionality
     */
    test('copy referral link to clipboard', async ({ page, context }) => {
        // Grant clipboard permissions
        await context.grantPermissions(['clipboard-read', 'clipboard-write'])

        // Login
        await loginWithOTP(page)

        // Navigate to referrals page
        await page.goto('/crm/referrals')
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 1: Find copy button
        // ============================================
        const copyButton = page.getByRole('button', { name: /sao chép|copy/i })
        await expect(copyButton).toBeVisible({ timeout: 10000 })

        // ============================================
        // Phase 2: Click copy button
        // ============================================
        await copyButton.click()

        // Wait a bit for clipboard operation
        await page.waitForTimeout(1000)

        // ============================================
        // Phase 3: Verify success feedback
        // ============================================
        // Check for success icon or text change (either toast or button text change)
        try {
            const successIndicator = page.locator('text=/đã sao chép|copied/i')
            await expect(successIndicator).toBeVisible({ timeout: 5000 })
        } catch {
            // Fallback: Verify clipboard content directly
            const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
            expect(clipboardText).toMatch(/\?ref=/)
            console.log('✅ Verified via clipboard content (no UI feedback found)')
        }

        console.log(`✅ Referral link copied to clipboard`)
    })

    /**
     * Test: View referral QR code
     */
    test('view referral QR code', async ({ page }) => {
        // Login
        await loginWithOTP(page)

        // Navigate to referrals page
        await page.goto('/crm/referrals')
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 1: Verify QR code section exists
        // ============================================
        // QR code should be in a canvas or SVG element
        const qrCanvas = page.locator('canvas').or(page.locator('svg[viewBox]'))
        await expect(qrCanvas.first()).toBeVisible({ timeout: 10000 })

        // ============================================
        // Phase 2: Take screenshot with QR code
        // ============================================
        await page.screenshot({
            path: 'e2e-results/referral-qr-code.png',
            fullPage: true
        })

        console.log(`✅ Referral QR code displayed`)
    })

    /**
     * Test: View conversions list (or empty state)
     */
    test('view referral conversions list or empty state', async ({ page }) => {
        // Login
        await loginWithOTP(page)

        // Navigate to referrals page
        await page.goto('/crm/referrals')
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 1: Wait for page to fully load
        // ============================================
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        // ============================================
        // Phase 2: Check for either conversions table or empty state
        // ============================================
        // Try to find either the table or empty state heading
        const hasTable = await page.locator('table').isVisible().catch(() => false)
        const hasEmptyState = await page.getByText(/chưa có chuyển đổi/i).isVisible().catch(() => false)

        if (hasTable) {
            // ============================================
            // Phase 3A: Verify conversions table structure
            // ============================================
            await expect(page.getByText(/lịch sử chuyển đổi/i)).toBeVisible()
            await expect(page.getByText(/mã đơn/i).first()).toBeVisible()
            await expect(page.getByText(/khách hàng/i).first()).toBeVisible()
            await expect(page.getByText(/giá trị đơn/i)).toBeVisible()
            await expect(page.getByText(/hoa hồng/i).first()).toBeVisible()

            console.log(`✅ Conversions table displayed`)
        } else if (hasEmptyState) {
            // ============================================
            // Phase 3B: Verify empty state
            // ============================================
            await expect(page.getByText(/chưa có chuyển đổi/i)).toBeVisible()

            console.log(`✅ Empty state displayed (no conversions yet)`)
        } else {
            throw new Error('Neither conversions table nor empty state found')
        }
    })

    /**
     * Test: No console errors on referrals page
     */
    test('no console errors on referrals page', async ({ page }) => {
        const consoleErrors: string[] = []

        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text())
            }
        })

        // Login
        await loginWithOTP(page)

        // Navigate to referrals page
        await page.goto('/crm/referrals')
        await page.waitForLoadState('networkidle')

        // Wait for page to fully render
        await expect(page.getByText(/giới thiệu bạn bè/i)).toBeVisible({ timeout: 10000 })
        await page.waitForTimeout(3000)

        // Verify no console errors
        if (consoleErrors.length > 0) {
            console.error('❌ Console errors detected:', consoleErrors)
            throw new Error(`Found ${consoleErrors.length} console errors`)
        }

        console.log(`✅ No console errors detected`)
    })
})
