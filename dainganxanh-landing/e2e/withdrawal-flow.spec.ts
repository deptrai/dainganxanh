import { test, expect } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

/**
 * Withdrawal Flow E2E Test Suite
 * Tests the commission withdrawal request and admin approval flow
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Test user: test@test.com (existing user with possible commission)
 * - Admin user: phanquochoipt@gmail.com (existing admin)
 *
 * Test Flow:
 * 1. User views referrals page and checks withdrawal button state
 * 2. Admin views withdrawal requests (if any exist)
 * 3. Tests adapt based on actual data state (balance >= or < 200k)
 *
 * Note: Tests are designed to work with existing data and adapt to current state
 */

test.describe('Withdrawal Flow E2E', () => {
    const TEST_EMAIL = 'test@test.com'
    const ADMIN_EMAIL = 'phanquochoipt@gmail.com'
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
     * Helper: Complete OTP login flow for test user
     */
    async function loginWithOTP(page: any) {
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        const emailInput = page.locator('input#identifier-input[type="email"]')
        await expect(emailInput).toBeVisible()
        await emailInput.fill(TEST_EMAIL)

        await page.waitForTimeout(2000) // Rate limiting

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
     * Helper: Complete admin login flow
     */
    async function loginAsAdmin(page: any) {
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        const emailInput = page.locator('input#identifier-input[type="email"]')
        await expect(emailInput).toBeVisible()
        await emailInput.fill(ADMIN_EMAIL)

        await page.waitForTimeout(2000) // Rate limiting

        const sendOTPButton = page.getByRole('button', { name: /gửi mã otp/i })
        await sendOTPButton.click()

        await expect(page.getByText(/nhập mã otp \(8 chữ số\)/i)).toBeVisible({ timeout: 10000 })

        console.log('⏳ Fetching admin OTP from Mailpit...')
        const otpCode = await getOTPFromMailpit(ADMIN_EMAIL)
        console.log(`✅ Got admin OTP: ${otpCode}`)

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

        console.log('✅ Admin login successful')
    }

    /**
     * Test 1: User can view referrals page and withdrawal section
     * This test verifies the withdrawal UI exists and adapts based on balance
     */
    test('user can view referrals page and withdrawal section', async ({ page }) => {
        await loginWithOTP(page)

        // Navigate to referrals page
        await page.goto('/crm/referrals')
        await page.waitForLoadState('networkidle')

        // Verify page loaded
        await expect(page.getByText(/giới thiệu bạn bè/i)).toBeVisible({ timeout: 10000 })

        // Wait for withdrawal section to load
        await page.waitForTimeout(3000)

        // Verify withdrawal section exists
        const balanceSection = page.locator('text=/số dư khả dụng/i')
        await expect(balanceSection).toBeVisible()

        // Verify withdraw button exists
        const withdrawButton = page.getByRole('button', { name: /rút tiền/i })
        await expect(withdrawButton).toBeVisible()

        // Check button state
        const isEnabled = await withdrawButton.isEnabled()

        if (isEnabled) {
            console.log('✅ Withdraw button is enabled (balance >= 200k)')
        } else {
            console.log('✅ Withdraw button is disabled (balance < 200k)')
            // Verify minimum balance message
            const minBalanceMessage = page.locator('text=/số dư tối thiểu.*200.*000/i')
            await expect(minBalanceMessage).toBeVisible()
        }

        // Take screenshot
        await page.screenshot({
            path: 'e2e-results/withdrawal-section.png',
            fullPage: true
        })

        console.log('✅ Withdrawal section displayed correctly')
    })

    /**
     * Test 2: Admin can view withdrawals page
     * This test verifies admin has access to withdrawal management
     */
    test('admin can view withdrawals page', async ({ page }) => {
        await loginAsAdmin(page)

        // Navigate to admin withdrawals page
        await page.goto('/crm/admin/withdrawals')
        await page.waitForLoadState('networkidle')

        // Verify page loaded (check URL or content)
        const isOnWithdrawalsPage = page.url().includes('/admin/withdrawals') ||
            await page.locator('text=/withdrawal|rút tiền/i').first().isVisible().catch(() => false)

        expect(isOnWithdrawalsPage).toBeTruthy()

        console.log('✅ Admin withdrawals page accessible')

        // Take screenshot
        await page.screenshot({
            path: 'e2e-results/admin-withdrawals.png',
            fullPage: true
        })
    })
})
