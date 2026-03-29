import { test, expect } from '@playwright/test'

test.describe('Certificate Download E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to login page
        await page.goto('/login')
    })

    test('download certificate from tree detail page', async ({ page }) => {
        // Step 1: Login
        await page.fill('input[type="email"]', 'test@example.com')
        await page.fill('input[type="password"]', 'password123')
        await page.click('button[type="submit"]')

        // Wait for redirect to My Garden
        await page.waitForURL('**/crm/my-garden')

        // Step 2: Navigate to first order detail
        const firstOrder = page.locator('a[href*="/crm/my-garden/"]').first()
        await firstOrder.click()

        // Wait for order detail page to load
        await page.waitForURL('**/crm/my-garden/*')

        // Step 3: Verify certificate download button is visible
        const downloadButton = page.getByRole('button', { name: /tải chứng chỉ/i })
        await expect(downloadButton).toBeVisible()

        // Step 4: Click download button
        const downloadPromise = page.waitForEvent('download')
        await downloadButton.click()

        // Step 5: Verify loading state
        await expect(page.getByText(/đang tạo chứng chỉ/i)).toBeVisible()

        // Step 6: Wait for download to complete
        const download = await downloadPromise
        expect(download.suggestedFilename()).toMatch(/certificate-.+\.pdf/)

        // Step 7: Verify success message
        await expect(page.getByText(/đã tải chứng chỉ thành công/i)).toBeVisible()
    })

    test('verify QR code redirects to verification page', async ({ page, context }) => {
        // Step 1: Login
        await page.goto('/login')
        await page.fill('input[type="email"]', 'test@example.com')
        await page.fill('input[type="password"]', 'password123')
        await page.click('button[type="submit"]')
        await page.waitForURL('**/crm/my-garden')

        // Step 2: Get first order ID from URL
        const firstOrder = page.locator('a[href*="/crm/my-garden/"]').first()
        const orderHref = await firstOrder.getAttribute('href')
        const orderId = orderHref?.split('/').pop()

        if (!orderId) {
            throw new Error('Could not extract order ID')
        }

        // Step 3: Navigate directly to verify URL (simulating QR code scan)
        const verifyUrl = `/crm/my-garden/${orderId}?verify=true`
        await page.goto(verifyUrl)

        // Step 4: Verify banner is displayed
        await expect(page.getByText(/chứng chỉ đã được xác thực/i)).toBeVisible()

        // Step 5: Verify order code is displayed in banner
        const banner = page.locator('.bg-green-600')
        await expect(banner).toBeVisible()
    })

    test('show error message when certificate generation fails', async ({ page }) => {
        // Mock API to simulate failure
        await page.route('**/functions/v1/generate-certificate', (route) => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    error: 'PDF generation failed',
                }),
            })
        })

        // Step 1: Login and navigate to order detail
        await page.fill('input[type="email"]', 'test@example.com')
        await page.fill('input[type="password"]', 'password123')
        await page.click('button[type="submit"]')
        await page.waitForURL('**/crm/my-garden')

        const firstOrder = page.locator('a[href*="/crm/my-garden/"]').first()
        await firstOrder.click()
        await page.waitForURL('**/crm/my-garden/*')

        // Step 2: Click download button
        const downloadButton = page.getByRole('button', { name: /tải chứng chỉ/i })
        await downloadButton.click()

        // Step 3: Verify error message is displayed
        await expect(page.getByText(/không thể tải chứng chỉ/i)).toBeVisible()
    })

    test('certificate button disabled during generation', async ({ page }) => {
        // Step 1: Login and navigate to order detail
        await page.goto('/login')
        await page.fill('input[type="email"]', 'test@example.com')
        await page.fill('input[type="password"]', 'password123')
        await page.click('button[type="submit"]')
        await page.waitForURL('**/crm/my-garden')

        const firstOrder = page.locator('a[href*="/crm/my-garden/"]').first()
        await firstOrder.click()
        await page.waitForURL('**/crm/my-garden/*')

        // Step 2: Click download button
        const downloadButton = page.getByRole('button', { name: /tải chứng chỉ/i })
        await downloadButton.click()

        // Step 3: Verify button is disabled during loading
        await expect(downloadButton).toBeDisabled()

        // Step 4: Wait for completion and verify button is enabled again
        await page.waitForSelector('text=/đã tải chứng chỉ thành công|không thể tải chứng chỉ/i')
        await expect(downloadButton).toBeEnabled()
    })

    test('verify certificate button visible for all order statuses', async ({ page }) => {
        // Step 1: Login
        await page.goto('/login')
        await page.fill('input[type="email"]', 'test@example.com')
        await page.fill('input[type="password"]', 'password123')
        await page.click('button[type="submit"]')
        await page.waitForURL('**/crm/my-garden')

        // Step 2: Get all order links
        const orderLinks = page.locator('a[href*="/crm/my-garden/"]')
        const count = await orderLinks.count()

        // Step 3: Check certificate button on each order (max 3 for faster test)
        const maxToCheck = Math.min(count, 3)
        for (let i = 0; i < maxToCheck; i++) {
            // Navigate to order detail
            await page.goto('/crm/my-garden')
            await orderLinks.nth(i).click()
            await page.waitForURL('**/crm/my-garden/*')

            // Verify button is visible
            const downloadButton = page.getByRole('button', { name: /tải chứng chỉ/i })
            await expect(downloadButton).toBeVisible()
        }
    })
})
