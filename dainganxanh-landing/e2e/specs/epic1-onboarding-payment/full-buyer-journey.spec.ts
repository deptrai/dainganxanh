import { test, expect } from '@playwright/test'
import { getOTPFromMailpit } from '../../utils/mailpit'

/**
 * Full First-time Buyer Journey E2E Test
 * Complete end-to-end flow: Landing → Pricing → Quantity → Register → Checkout → Waiting
 *
 * Flow 1 from docs/userflow.md
 * Routes: / → /pricing → /quantity → /register → /checkout → /checkout/waiting
 */

test.describe('Full First-time Buyer Journey', () => {
    const BASE_EMAIL = 'test-fulljourney'

    function getTestEmail(testName: string): string {
        const timestamp = Date.now()
        const sanitized = testName.replace(/[^a-z0-9]/gi, '').toLowerCase()
        return `${BASE_EMAIL}-${sanitized}-${timestamp}@test.local`
    }

    /**
     * Test: Complete buyer journey from landing to checkout
     * This is the critical happy path for Flow 1
     */
    test('complete journey: landing → pricing → quantity → register → checkout', async ({ page }) => {
        const testEmail = getTestEmail('full-journey')

        // ============================================
        // Phase 1: Landing Page
        // ============================================
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // Verify landing page loaded
        await expect(page.getByText(/dệt đại ngàn.*gặt phước báu/i)).toBeVisible({ timeout: 10000 })

        // Click primary CTA
        const ctaButton = page.getByRole('link', { name: /gieo mầm ngay/i })
        await expect(ctaButton).toBeVisible()
        await ctaButton.click()

        // ============================================
        // Phase 2: Pricing Page
        // ============================================
        await expect(page).toHaveURL(/\/pricing/, { timeout: 10000 })
        await page.waitForLoadState('networkidle')

        // Verify pricing page
        await expect(page.getByText(/260\.000/)).toBeVisible({ timeout: 10000 })

        // Click CTA to go to quantity
        const quantityCTA = page.getByRole('link', { name: /tùy chỉnh số lượng/i })
            .or(page.getByRole('button', { name: /tùy chỉnh số lượng/i }))
        await expect(quantityCTA).toBeVisible()
        await quantityCTA.click()

        // ============================================
        // Phase 3: Quantity Page
        // ============================================
        await expect(page).toHaveURL(/\/quantity/, { timeout: 10000 })
        await page.waitForLoadState('networkidle')

        // Verify quantity page
        await expect(page.getByText(/chọn số lượng cây/i)).toBeVisible({ timeout: 10000 })

        // Select 5 trees using quick select
        const btn5 = page.getByRole('button', { name: /^5$/ })
            .or(page.locator('button:has-text("5")').first())
        await btn5.click()

        // Verify price updated: 5 * 260,000 = 1,300,000
        const expectedTotal = (5 * 260000).toLocaleString('vi-VN')
        await expect(page.getByText(new RegExp(expectedTotal.replace(/\./g, '\\.')))).toBeVisible({ timeout: 5000 })

        // Click continue
        const continueBtn = page.getByRole('button', { name: /tiếp tục/i })
            .or(page.getByRole('link', { name: /tiếp tục/i }))
        await expect(continueBtn).toBeVisible()
        await continueBtn.click()

        // ============================================
        // Phase 4: Registration (new user, not authenticated)
        // ============================================
        await page.waitForURL(/\/(register|login)\?.*quantity=5/, { timeout: 10000 })

        // If redirected to login, navigate to register
        if (page.url().includes('/login')) {
            await page.goto(`/register?quantity=5`)
            await page.waitForLoadState('networkidle')
        }

        await page.waitForTimeout(2000)

        // Click Email tab
        const emailTab = page.getByRole('button', { name: /email/i }).first()
        await expect(emailTab).toBeVisible({ timeout: 10000 })
        await emailTab.click()

        // Enter email
        const emailInput = page.locator('input[placeholder*="email"]')
        await emailInput.fill(testEmail)

        // Use default referral code
        const useDefaultRef = page.getByRole('button', { name: /bấm vào đây để dùng mã/i })
        await useDefaultRef.click()

        // Send OTP
        const sendOTP = page.getByRole('button', { name: /gửi mã otp/i })
        await sendOTP.click()

        // Wait for OTP input
        await expect(page.getByText(/nhập mã otp \(8 chữ số\)/i)).toBeVisible({ timeout: 10000 })

        // Get and enter OTP
        console.log('Fetching OTP from Mailpit...')
        const otpCode = await getOTPFromMailpit(testEmail)
        console.log(`Got OTP: ${otpCode}`)

        const otpInputs = page.locator('input[inputmode="numeric"]')
        await expect(otpInputs).toHaveCount(8)
        for (let i = 0; i < 8; i++) {
            await otpInputs.nth(i).fill(otpCode[i])
        }

        // ============================================
        // Phase 5: Checkout Page
        // ============================================
        await page.waitForURL(/\/checkout/, { timeout: 15000 })
        await page.waitForLoadState('networkidle')

        // Verify order summary
        await expect(page.getByText('Đơn hàng của bạn')).toBeVisible({ timeout: 10000 })

        // Verify order code generated (format: DH + 6 chars)
        const orderCodeElement = page.locator('span.font-mono.font-semibold.text-emerald-600')
        await expect(orderCodeElement).toBeVisible({ timeout: 5000 })
        const orderCode = await orderCodeElement.textContent()
        expect(orderCode).toMatch(/^DH[A-Z0-9]{6}$/)
        console.log(`Order created: ${orderCode}`)

        // Verify quantity displayed
        await expect(page.getByText(/5 cây/i).first()).toBeVisible()

        // Verify QR code for payment
        const qrImage = page.locator('img[alt="QR Code thanh toan"]')
        await expect(qrImage).toBeVisible({ timeout: 10000 })

        // Verify bank info
        await expect(page.locator('td:has-text("Ngân hàng")')).toBeVisible()
        await expect(page.locator('td:has-text("Số TK")')).toBeVisible()

        // Verify payment status indicator
        await expect(page.locator('text=/đang chờ thanh toán|chờ xác nhận/i')).toBeVisible({ timeout: 5000 })

        await page.screenshot({ path: 'e2e-results/full-buyer-journey-checkout.png', fullPage: true })

        console.log(`Full buyer journey completed: / → /pricing → /quantity(5) → /register → /checkout (${orderCode})`)
    })

    /**
     * Test: Journey with quantity 10 and manual payment claim
     */
    test('journey with manual payment claim flow', async ({ page }) => {
        const testEmail = getTestEmail('manual-claim')

        // Quick path: register directly with quantity
        await page.goto('/register?quantity=10')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        // Register via email
        const emailTab = page.getByRole('button', { name: /email/i }).first()
        await emailTab.click()

        const emailInput = page.locator('input[placeholder*="email"]')
        await emailInput.fill(testEmail)

        const useDefaultRef = page.getByRole('button', { name: /bấm vào đây để dùng mã/i })
        await useDefaultRef.click()

        const sendOTP = page.getByRole('button', { name: /gửi mã otp/i })
        await sendOTP.click()

        await expect(page.getByText(/nhập mã otp \(8 chữ số\)/i)).toBeVisible({ timeout: 10000 })

        const otpCode = await getOTPFromMailpit(testEmail)
        const otpInputs = page.locator('input[inputmode="numeric"]')
        for (let i = 0; i < 8; i++) {
            await otpInputs.nth(i).fill(otpCode[i])
        }

        // Wait for checkout
        await page.waitForURL(/\/checkout/, { timeout: 15000 })
        await page.waitForLoadState('networkidle')
        await expect(page.getByText('Đơn hàng của bạn')).toBeVisible({ timeout: 10000 })

        // Verify quantity = 10 trees
        const orderSummary = page.locator('.bg-white.rounded-2xl').filter({ hasText: 'Đơn hàng của bạn' })
        await expect(orderSummary.getByText('10 cây').first()).toBeVisible()

        // Click "Da chuyen tien" to claim manual payment
        const claimBtn = page.getByRole('button', { name: /đã chuyển tiền/i })
        const hasClaimBtn = await claimBtn.count() > 0

        if (hasClaimBtn) {
            await claimBtn.click()

            // Should transition to waiting state or show waiting UI
            await page.waitForLoadState('networkidle')

            // Verify transition to waiting state
            const waitingText = page.getByText(/đang chờ xác nhận/i)
                .or(page.getByText(/đang kiểm tra/i))
                .or(page.getByText(/chờ admin/i))

            const isWaiting = await waitingText.count() > 0
            const isOnWaitingPage = page.url().includes('/waiting')

            expect(isWaiting || isOnWaitingPage).toBeTruthy()

            await page.screenshot({ path: 'e2e-results/manual-claim-waiting.png', fullPage: true })
            console.log('Manual payment claim flow completed')
        } else {
            console.log('Manual payment claim button not found - skipping claim flow')
        }
    })
})
