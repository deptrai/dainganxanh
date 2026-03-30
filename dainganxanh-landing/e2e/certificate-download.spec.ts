import { test, expect } from '@playwright/test'

/**
 * Certificate Download E2E Test Suite
 * Tests the complete flow from OTP login to certificate PDF download
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Test user: phanquochoipt@gmail.com
 */

test.describe('Certificate Download E2E', () => {
    const TEST_EMAIL = 'phanquochoipt@gmail.com'
    const MAILPIT_URL = 'http://127.0.0.1:54334'

    /**
     * Helper: Fetch OTP code from Mailpit
     */
    async function getOTPFromMailpit(email: string): Promise<string> {
        // Wait a bit for email to arrive
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Fetch messages from Mailpit API
        const response = await fetch(`${MAILPIT_URL}/api/v1/messages`)
        const data = await response.json()

        // Find latest message to our email
        const messages = data.messages || []
        const latestMessage = messages.find((msg: any) =>
            msg.To && msg.To.some((to: any) => to.Address === email)
        )

        if (!latestMessage) {
            throw new Error(`No email found for ${email} in Mailpit`)
        }

        // Fetch message body
        const msgResponse = await fetch(`${MAILPIT_URL}/api/v1/message/${latestMessage.ID}`)
        const msgData = await msgResponse.json()

        // Extract 8-digit OTP from email text
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
        // Navigate to login
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        // Step 1: Enter email
        const emailInput = page.locator('input#identifier-input[type="email"]')
        await expect(emailInput).toBeVisible()
        await emailInput.fill(TEST_EMAIL)

        // Click "Gửi mã OTP" button
        const sendOTPButton = page.getByRole('button', { name: /gửi mã otp/i })
        await sendOTPButton.click()

        // Wait for OTP input screen
        await expect(page.getByText(/nhập mã otp \(8 chữ số\)/i)).toBeVisible({ timeout: 10000 })

        // Step 2: Get real OTP from Mailpit
        console.log('⏳ Fetching OTP from Mailpit...')
        const otpCode = await getOTPFromMailpit(TEST_EMAIL)
        console.log(`✅ Got OTP: ${otpCode}`)

        // Step 3: Enter OTP (8 digits)
        const otpInputs = page.locator('input[inputmode="numeric"]')
        await expect(otpInputs).toHaveCount(8)

        for (let i = 0; i < 8; i++) {
            await otpInputs.nth(i).fill(otpCode[i])
        }

        // OTP auto-submits, wait for either checkout page or ref modal
        const skipButton = page.getByRole('button', { name: /bỏ qua/i })
        try {
            // Wait for ref modal to appear (happens after OTP verify)
            await skipButton.waitFor({ state: 'visible', timeout: 10000 })
            await skipButton.click()
            await page.waitForLoadState('networkidle')
        } catch {
            // No ref modal - already on checkout page
            await page.waitForLoadState('networkidle')
        }

        console.log('✅ Login successful')
    }

    /**
     * Main Test: Complete certificate download flow
     */
    test('complete flow: login → navigate to order → download certificate', async ({ page }) => {
        // Capture console logs for debugging
        const consoleMessages: string[] = []
        page.on('console', msg => {
            consoleMessages.push(`[${msg.type()}] ${msg.text()}`)
        })
        page.on('pageerror', err => {
            consoleMessages.push(`[PAGE ERROR] ${err.message}`)
        })
        // ============================================
        // Phase 1: Login
        // ============================================
        await loginWithOTP(page)
        await expect(page).toHaveURL(/checkout/, { timeout: 5000 })

        // ============================================
        // Phase 2: Navigate to My Garden
        // ============================================
        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        // Verify we're on My Garden page
        await expect(page).toHaveURL(/crm\/my-garden/)

        // ============================================
        // Phase 3: Navigate to completed order with lot
        // ============================================
        // IMPORTANT: Do not use .first() as orders are sorted DESC
        // We need the completed order (52273e22-c33a-40e2-98b6-9706e9333af1)
        await page.goto('/crm/my-garden/52273e22-c33a-40e2-98b6-9706e9333af1')
        await page.waitForLoadState('networkidle')

        // Verify we're on order detail page
        await page.waitForURL(/crm\/my-garden\/52273e22/, { timeout: 5000 })

        // ============================================
        // Phase 4: Verify certificate button
        // ============================================
        const downloadButton = page.getByRole('button', { name: /tải chứng chỉ/i })
        await expect(downloadButton).toBeVisible({ timeout: 5000 })
        await expect(downloadButton).toBeEnabled()

        // ============================================
        // Phase 5: Download certificate
        // ============================================
        await downloadButton.click()

        // Verify loading state appears
        const loadingText = page.getByText(/đang tạo chứng chỉ/i)
        await expect(loadingText).toBeVisible({ timeout: 5000 })

        // Wait for either success or error message
        const successMessage = page.getByText(/đã tải chứng chỉ thành công/i)
        const errorMessage = page.locator('div.bg-red-50, div[class*="text-red"]').filter({ hasText: /không|lỗi|thất bại/i })

        await Promise.race([
            successMessage.waitFor({ state: 'visible', timeout: 30000 }),
            errorMessage.waitFor({ state: 'visible', timeout: 30000 })
        ])

        // Check which message appeared
        const isSuccess = await successMessage.isVisible()
        const isError = await errorMessage.isVisible()

        if (isError) {
            const errorText = await errorMessage.textContent()
            console.error(`❌ Error message: ${errorText}`)
            throw new Error(`Certificate download failed: ${errorText}`)
        }

        // If success, verify download event
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 })
        const download = await downloadPromise
        const filename = download.suggestedFilename()

        // Verify PDF filename format
        expect(filename).toMatch(/certificate-.+\.pdf/)

        console.log(`✅ Certificate downloaded: ${filename}`)

        // ============================================
        // Phase 6: Verify success message
        // ============================================
        await expect(successMessage).toBeVisible({ timeout: 5000 })

        // Verify button is enabled again (not loading)
        await expect(downloadButton).toBeEnabled({ timeout: 5000 })

        // ============================================
        // Phase 7: Take screenshot
        // ============================================
        await page.screenshot({
            path: 'e2e-results/certificate-download-success.png',
            fullPage: true
        })

        // Log console messages for debugging
        console.log('\n=== Console Logs ===')
        consoleMessages.forEach(msg => console.log(msg))
    })

    /**
     * Test: Verify QR code verification URL
     */
    test('verify QR code redirects to verification page', async ({ page }) => {
        // Login
        await loginWithOTP(page)

        // Navigate to My Garden
        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        // Get first order ID
        const firstOrder = page.locator('a[href*="/crm/my-garden/"]').first()
        const orderHref = await firstOrder.getAttribute('href')
        const orderId = orderHref?.split('/').pop()

        if (!orderId) {
            throw new Error('Could not extract order ID')
        }

        // Navigate to verify URL (simulating QR code scan)
        const verifyUrl = `/crm/my-garden/${orderId}?verify=true`
        await page.goto(verifyUrl)
        await page.waitForLoadState('networkidle')

        // Verify banner is displayed
        await expect(page.getByText(/chứng chỉ đã được xác thực/i)).toBeVisible({ timeout: 5000 })

        // Verify green banner exists
        const banner = page.locator('.bg-green-600')
        await expect(banner).toBeVisible()

        console.log(`✅ QR verification works for order ${orderId}`)
    })

    /**
     * Test: Certificate button disabled during generation
     */
    test('certificate button disabled during generation', async ({ page }) => {
        // Login
        await loginWithOTP(page)

        // Navigate to order detail
        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        const firstOrder = page.locator('a[href*="/crm/my-garden/"]').first()
        await firstOrder.click()
        await page.waitForURL(/crm\/my-garden\/[a-f0-9-]+/)

        // Click download button
        const downloadButton = page.getByRole('button', { name: /tải chứng chỉ/i })
        await downloadButton.click()

        // Verify button is disabled during loading
        await expect(downloadButton).toBeDisabled({ timeout: 3000 })

        // Wait for completion (success or error)
        await page.waitForSelector('text=/đã tải chứng chỉ thành công|không thể tải chứng chỉ/i', { timeout: 30000 })

        // Verify button is enabled again
        await expect(downloadButton).toBeEnabled({ timeout: 5000 })

        console.log(`✅ Button state management works correctly`)
    })

    /**
     * Test: No console errors during flow
     */
    test('no console errors during certificate download', async ({ page }) => {
        const consoleErrors: string[] = []

        // Capture console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text())
            }
        })

        // Login
        await loginWithOTP(page)

        // Navigate to order detail
        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        const firstOrder = page.locator('a[href*="/crm/my-garden/"]').first()
        await firstOrder.click()
        await page.waitForURL(/crm\/my-garden\/[a-f0-9-]+/)

        // Download certificate
        const downloadButton = page.getByRole('button', { name: /tải chứng chỉ/i })
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 })
        await downloadButton.click()
        await downloadPromise

        // Wait for success message
        await expect(page.getByText(/đã tải chứng chỉ thành công/i)).toBeVisible({ timeout: 5000 })

        // Verify no console errors
        if (consoleErrors.length > 0) {
            console.error('❌ Console errors detected:', consoleErrors)
            throw new Error(`Found ${consoleErrors.length} console errors`)
        }

        console.log(`✅ No console errors detected`)
    })
})
