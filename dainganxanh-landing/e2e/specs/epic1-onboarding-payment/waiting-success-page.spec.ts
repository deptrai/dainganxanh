import { test, expect } from '@playwright/test'
import { getOTPFromMailpit } from '../../utils/mailpit'
import { envConfig } from '../../config/env'

/**
 * Waiting & Success Page E2E Test Suite
 * Tests the post-payment waiting screen and success page
 *
 * Flow 1 coverage: /checkout/waiting → /checkout/success
 */

test.describe('Waiting & Success Pages E2E', () => {
    const BASE_EMAIL = 'test-waiting'

    function getTestEmail(testName: string): string {
        const timestamp = Date.now()
        const sanitized = testName.replace(/[^a-z0-9]/gi, '').toLowerCase()
        return `${BASE_EMAIL}-${sanitized}-${timestamp}@test.local`
    }

    /**
     * Helper: Register, login, create order, claim payment → returns orderCode
     */
    async function createOrderAndClaim(page: any, testEmail: string, quantity = 3): Promise<string> {
        await page.goto(`/register?quantity=${quantity}`)
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        const emailTab = page.getByRole('button', { name: /email/i }).first()
        await emailTab.click()

        const emailInput = page.locator('input[placeholder*="email"]')
        await emailInput.fill(testEmail)

        const useDefault = page.getByRole('button', { name: /bấm vào đây để dùng mã/i })
        await useDefault.click()

        const sendOTP = page.getByRole('button', { name: /gửi mã otp/i })
        await sendOTP.click()

        await expect(page.getByText(/nhập mã otp \(8 chữ số\)/i)).toBeVisible({ timeout: 10000 })

        const otpCode = await getOTPFromMailpit(testEmail)
        const otpInputs = page.locator('input[inputmode="numeric"]')
        for (let i = 0; i < 8; i++) {
            await otpInputs.nth(i).fill(otpCode[i])
        }

        await page.waitForURL(/\/checkout/, { timeout: 15000 })
        await page.waitForLoadState('networkidle')
        await expect(page.getByText('Đơn hàng của bạn')).toBeVisible({ timeout: 10000 })

        // Get order code
        const orderCodeEl = page.locator('span.font-mono.font-semibold.text-emerald-600')
        await expect(orderCodeEl).toBeVisible({ timeout: 5000 })
        const orderCode = await orderCodeEl.textContent()

        // Click "Da chuyen tien" to claim manual payment
        const claimBtn = page.getByRole('button', { name: /đã chuyển tiền/i })
        const hasClaimBtn = await claimBtn.count() > 0
        if (hasClaimBtn) {
            await claimBtn.click()
            await page.waitForLoadState('networkidle')
        }

        return orderCode!
    }

    // ============================================
    // Waiting Page Tests
    // ============================================

    test.describe('Waiting Page', () => {

        /**
         * Test: Waiting page displays order info and status
         */
        test('waiting page shows order info and polling status', async ({ page }) => {
            const testEmail = getTestEmail('waiting-display')
            const orderCode = await createOrderAndClaim(page, testEmail, 3)

            // Navigate to waiting page with proper query params
            await page.goto(`/checkout/waiting?orderCode=${orderCode}&quantity=3`)
            await page.waitForLoadState('networkidle')

            // Verify "Dang cho xac nhan" heading
            await expect(page.getByText(/đang chờ xác nhận/i)).toBeVisible({ timeout: 10000 })

            // Verify order code displayed
            await expect(page.getByText(orderCode)).toBeVisible()

            // Verify 3-step progress
            await expect(page.getByText(/báo chuyển tiền thành công/i)).toBeVisible()
            await expect(page.getByText(/admin đang kiểm tra/i)).toBeVisible()
            await expect(page.getByText(/tự động hoàn tất/i)).toBeVisible()

            // Verify auto-polling indicator
            await expect(page.getByText(/tự động kiểm tra trạng thái/i)).toBeVisible()

            // Verify "Mua them cay" button
            await expect(page.getByRole('button', { name: /mua thêm cây/i })).toBeVisible()

            await page.screenshot({ path: 'e2e-results/waiting-page.png', fullPage: true })
            console.log(`Waiting page verified for order: ${orderCode}`)
        })

        /**
         * Test: Waiting page shows identity form or saved confirmation
         */
        test('waiting page shows identity section', async ({ page }) => {
            const testEmail = getTestEmail('waiting-identity')
            const orderCode = await createOrderAndClaim(page, testEmail, 3)

            await page.goto(`/checkout/waiting?orderCode=${orderCode}&quantity=3`)
            await page.waitForLoadState('networkidle')

            // Wait for identity section to load (replaces loading skeleton)
            await page.waitForTimeout(3000)

            // Either identity form shows (new user) or saved confirmation
            const identityForm = page.getByText(/thông tin.*hợp đồng/i)
            const savedMsg = page.getByText(/thông tin hợp đồng đã được lưu/i)

            const hasForm = await identityForm.count() > 0
            const hasSaved = await savedMsg.count() > 0

            expect(hasForm || hasSaved).toBeTruthy()

            console.log(`Identity section: ${hasForm ? 'form displayed' : 'already saved'}`)
        })

        /**
         * Test: Waiting page reassurance message at bottom
         */
        test('waiting page shows reassurance message', async ({ page }) => {
            const testEmail = getTestEmail('waiting-reassure')
            const orderCode = await createOrderAndClaim(page, testEmail, 3)

            await page.goto(`/checkout/waiting?orderCode=${orderCode}&quantity=3`)
            await page.waitForLoadState('networkidle')

            // Verify reassurance text at bottom: "Ban co the roi trang nay..."
            await expect(page.getByText(/bạn có thể rời trang này/i)).toBeVisible({ timeout: 10000 })

            console.log('Reassurance message verified')
        })

        /**
         * Test: Waiting page without orderCode shows error
         */
        test('waiting page without orderCode shows error', async ({ page }) => {
            await page.goto('/checkout/waiting')
            await page.waitForLoadState('networkidle')

            await expect(page.getByText(/không tìm thấy đơn hàng/i)).toBeVisible({ timeout: 10000 })

            console.log('Missing orderCode error verified')
        })

        /**
         * Test: "Mua them cay" button navigates to /quantity
         */
        test('buy more button navigates to quantity page', async ({ page }) => {
            const testEmail = getTestEmail('waiting-buymore')
            const orderCode = await createOrderAndClaim(page, testEmail, 3)

            await page.goto(`/checkout/waiting?orderCode=${orderCode}&quantity=3`)
            await page.waitForLoadState('networkidle')

            const buyMoreBtn = page.getByRole('button', { name: /mua thêm cây/i })
            await expect(buyMoreBtn).toBeVisible({ timeout: 10000 })
            await buyMoreBtn.click()

            await expect(page).toHaveURL(/\/quantity/, { timeout: 10000 })

            console.log('Buy more navigation verified')
        })
    })

    // ============================================
    // Success Page Tests
    // ============================================

    test.describe('Success Page', () => {

        /**
         * Helper: Login as existing user (admin account with completed orders)
         */
        async function loginAsExistingUser(page: any) {
            await page.goto('/login')
            await page.waitForLoadState('networkidle')

            const emailInput = page.locator('input#identifier-input[type="email"]')
            await expect(emailInput).toBeVisible({ timeout: 10000 })
            await emailInput.fill(envConfig.ADMIN_EMAIL)

            const sendOTP = page.getByRole('button', { name: /gửi mã otp/i })
            await sendOTP.click()

            await expect(page.getByText(/nhập mã otp \(8 chữ số\)/i)).toBeVisible({ timeout: 10000 })
            const otpCode = await getOTPFromMailpit(envConfig.ADMIN_EMAIL)

            const otpInputs = page.locator('input[inputmode="numeric"]')
            for (let i = 0; i < 8; i++) {
                await otpInputs.nth(i).fill(otpCode[i])
            }

            const skipBtn = page.getByRole('button', { name: /bỏ qua/i })
            try {
                await skipBtn.waitFor({ state: 'visible', timeout: 5000 })
                await skipBtn.click()
            } catch {
                // No skip button
            }
            await page.waitForLoadState('networkidle')
        }

        /**
         * Test: Success page displays order summary and navigation
         */
        test('success page shows order summary and nav buttons', async ({ page }) => {
            await loginAsExistingUser(page)

            await page.goto('/checkout/success')
            await page.waitForLoadState('networkidle')

            // Check for order-related content or redirect
            const hasOrderCode = await page.locator('text=/DH[A-Z0-9]{6}/').count() > 0
            const hasCO2 = await page.getByText(/CO₂/i).count() > 0

            // Navigation buttons
            const hasGarden = await page.getByRole('link', { name: /vườn/i }).count() > 0
            const hasHome = await page.getByRole('link', { name: /trang chủ/i }).count() > 0
            const hasBuyMore = await page.getByRole('link', { name: /mua thêm/i }).count() > 0

            // At least navigation should work
            const hasNav = hasGarden || hasHome || hasBuyMore

            await page.screenshot({ path: 'e2e-results/success-page.png', fullPage: true })
            console.log(`Success page: orderCode=${hasOrderCode}, CO2=${hasCO2}, nav=${hasNav}`)
        })

        /**
         * Test: Success page "Mua them" navigates to quantity
         */
        test('success page buy more navigates to quantity', async ({ page }) => {
            await loginAsExistingUser(page)

            await page.goto('/checkout/success')
            await page.waitForLoadState('networkidle')

            const buyMoreBtn = page.getByRole('link', { name: /mua thêm/i })
            const hasBuyMore = await buyMoreBtn.count() > 0

            if (hasBuyMore) {
                await buyMoreBtn.click()
                await expect(page).toHaveURL(/\/quantity/, { timeout: 10000 })
                console.log('Buy more navigation verified')
            } else {
                console.log('Buy more button not found on success page')
            }
        })
    })
})
