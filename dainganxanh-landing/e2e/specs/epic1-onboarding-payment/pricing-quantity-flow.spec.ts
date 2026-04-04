import { test, expect } from '@playwright/test'

/**
 * Pricing & Quantity Page E2E Test Suite
 * Tests pricing page content, quantity selection, and price calculation
 *
 * Flow 1 coverage: /pricing → /quantity → price summary → continue
 */

test.describe('Pricing & Quantity Flow E2E', () => {

    // ============================================
    // Pricing Page Tests
    // ============================================

    test.describe('Pricing Page', () => {

        test.beforeEach(async ({ page }) => {
            await page.goto('/pricing')
            await page.waitForLoadState('networkidle')
        })

        /**
         * Test: Pricing page displays package with 260k/tree
         */
        test('displays individual package at 260.000 VND per tree', async ({ page }) => {
            // Verify page heading
            await expect(page.getByText(/chọn gói trồng cây/i)).toBeVisible({ timeout: 10000 })

            // Verify package name
            await expect(page.getByText(/gói cá nhân/i)).toBeVisible()

            // Verify price 260.000
            await expect(page.getByText(/260\.000/)).toBeVisible()

            console.log('Pricing page displays 260k/tree package')
        })

        /**
         * Test: Pricing page shows cost breakdown
         */
        test('shows cost breakdown with 3 items', async ({ page }) => {
            // Seedling cost
            await expect(page.getByText(/cây giống/i)).toBeVisible({ timeout: 10000 })
            await expect(page.getByText(/40\.000/)).toBeVisible()

            // 5-year care fee
            await expect(page.getByText(/chăm sóc/i).first()).toBeVisible()
            await expect(page.getByText(/194\.000/)).toBeVisible()

            // Green ambassador fund
            await expect(page.getByText(/đại sứ xanh/i)).toBeVisible()
            await expect(page.getByText(/26\.000/)).toBeVisible()

            console.log('Cost breakdown verified: 40k + 194k + 26k = 260k')
        })

        /**
         * Test: Pricing page shows features list
         */
        test('shows 4 features', async ({ page }) => {
            await expect(page.getByText(/chứng nhận sở hữu/i)).toBeVisible({ timeout: 10000 })
            await expect(page.getByText(/báo cáo hàng quý/i).first()).toBeVisible()
            await expect(page.getByText(/GPS/i).first()).toBeVisible()
            await expect(page.getByText(/thu hoạch/i).first()).toBeVisible()

            console.log('4 features verified')
        })

        /**
         * Test: Pricing page shows trust indicators
         */
        test('shows trust indicators', async ({ page }) => {
            await expect(page.getByText(/5 năm/i).first()).toBeVisible({ timeout: 10000 })
            await expect(page.getByText(/100%/i).first()).toBeVisible()
            await expect(page.getByText(/20kg/i).or(page.getByText(/20 ?kg/i)).first()).toBeVisible()

            console.log('Trust indicators verified')
        })

        /**
         * Test: CTA button navigates to quantity page
         */
        test('CTA navigates to quantity page', async ({ page }) => {
            const ctaButton = page.getByRole('link', { name: /tùy chỉnh số lượng/i })
                .or(page.getByRole('button', { name: /tùy chỉnh số lượng/i }))
            await expect(ctaButton).toBeVisible({ timeout: 10000 })
            await ctaButton.click()

            await expect(page).toHaveURL(/\/quantity/, { timeout: 10000 })

            console.log('Pricing CTA navigates to /quantity')
        })

        /**
         * Test: No console errors on pricing page
         */
        test('no console errors on pricing page', async ({ page }) => {
            const consoleErrors: string[] = []

            page.on('console', msg => {
                if (msg.type() === 'error') {
                    const text = msg.text()
                    if (!text.includes('Failed to load resource') &&
                        !text.includes('404') && !text.includes('406')) {
                        consoleErrors.push(text)
                    }
                }
            })

            await page.goto('/pricing')
            await page.waitForLoadState('networkidle')
            await page.waitForTimeout(2000)

            const critical = consoleErrors.filter(e =>
                !e.includes('406') && !e.includes('Not Acceptable')
            )

            if (critical.length > 0) {
                throw new Error(`Found ${critical.length} console errors: ${critical.join(', ')}`)
            }

            console.log('No console errors on pricing page')
        })
    })

    // ============================================
    // Quantity Page Tests
    // ============================================

    test.describe('Quantity Page', () => {

        test.beforeEach(async ({ page }) => {
            await page.goto('/quantity')
            await page.waitForLoadState('networkidle')
        })

        /**
         * Test: Quantity page displays heading and selector
         */
        test('displays heading and quantity selector', async ({ page }) => {
            await expect(page.getByText(/chọn số lượng cây/i)).toBeVisible({ timeout: 10000 })

            // Verify quantity input exists
            const quantityInput = page.locator('input[type="number"]')
            await expect(quantityInput).toBeVisible()

            console.log('Quantity page heading and input verified')
        })

        /**
         * Test: Quick select buttons (5, 10, 50, 100)
         */
        test('quick select buttons set correct quantities', async ({ page }) => {
            // Wait for page to load
            await expect(page.getByText(/chọn số lượng cây/i)).toBeVisible({ timeout: 10000 })

            // Test quick select button: 5
            const btn5 = page.getByRole('button', { name: /^5$/ })
                .or(page.locator('button:has-text("5")').first())
            await btn5.click()

            const quantityInput = page.locator('input[type="number"]')
            await expect(quantityInput).toHaveValue('5')

            // Test quick select button: 10
            const btn10 = page.getByRole('button', { name: /^10$/ })
                .or(page.locator('button:has-text("10")').first())
            await btn10.click()
            await expect(quantityInput).toHaveValue('10')

            // Test quick select button: 50
            const btn50 = page.getByRole('button', { name: /^50$/ })
                .or(page.locator('button:has-text("50")').first())
            await btn50.click()
            await expect(quantityInput).toHaveValue('50')

            // Test quick select button: 100
            const btn100 = page.getByRole('button', { name: /^100$/ })
                .or(page.locator('button:has-text("100")').first())
            await btn100.click()
            await expect(quantityInput).toHaveValue('100')

            console.log('Quick select buttons 5/10/50/100 verified')
        })

        /**
         * Test: Price summary updates dynamically
         */
        test('price summary updates when quantity changes', async ({ page }) => {
            await expect(page.getByText(/chọn số lượng cây/i)).toBeVisible({ timeout: 10000 })

            // Select 10 trees
            const btn10 = page.getByRole('button', { name: /^10$/ })
                .or(page.locator('button:has-text("10")').first())
            await btn10.click()

            // Verify total: 10 * 260,000 = 2,600,000
            const expectedTotal = (10 * 260000).toLocaleString('vi-VN')
            await expect(page.getByText(new RegExp(expectedTotal.replace(/\./g, '\\.')))).toBeVisible({ timeout: 5000 })

            // Select 50 trees
            const btn50 = page.getByRole('button', { name: /^50$/ })
                .or(page.locator('button:has-text("50")').first())
            await btn50.click()

            // Verify total: 50 * 260,000 = 13,000,000
            const expectedTotal50 = (50 * 260000).toLocaleString('vi-VN')
            await expect(page.getByText(new RegExp(expectedTotal50.replace(/\./g, '\\.')))).toBeVisible({ timeout: 5000 })

            console.log('Price summary updates dynamically verified')
        })

        /**
         * Test: Custom quantity input works
         */
        test('custom quantity input accepts valid numbers', async ({ page }) => {
            await expect(page.getByText(/chọn số lượng cây/i)).toBeVisible({ timeout: 10000 })

            const quantityInput = page.locator('input[type="number"]')
            await quantityInput.fill('25')

            // Verify total: 25 * 260,000 = 6,500,000
            const expectedTotal = (25 * 260000).toLocaleString('vi-VN')
            await expect(page.getByText(new RegExp(expectedTotal.replace(/\./g, '\\.')))).toBeVisible({ timeout: 5000 })

            console.log('Custom quantity input verified')
        })

        /**
         * Test: Back link navigates to pricing
         */
        test('back link navigates to pricing page', async ({ page }) => {
            const backLink = page.getByRole('link', { name: /quay lại/i })
            await expect(backLink).toBeVisible({ timeout: 10000 })
            await backLink.click()

            await expect(page).toHaveURL(/\/pricing/, { timeout: 10000 })

            console.log('Back link navigation verified')
        })

        /**
         * Test: Continue button exists and requires auth
         */
        test('continue button navigates to register or checkout', async ({ page }) => {
            await expect(page.getByText(/chọn số lượng cây/i)).toBeVisible({ timeout: 10000 })

            // Select quantity
            const btn5 = page.getByRole('button', { name: /^5$/ })
                .or(page.locator('button:has-text("5")').first())
            await btn5.click()

            // Click continue button
            const continueBtn = page.getByRole('button', { name: /tiếp tục/i })
                .or(page.getByRole('link', { name: /tiếp tục/i }))
            await expect(continueBtn).toBeVisible()
            await continueBtn.click()

            // Should navigate to register or checkout (depends on auth state)
            await page.waitForURL(/\/(register|checkout|login)\?.*quantity=5/, { timeout: 10000 })

            const url = page.url()
            expect(url).toMatch(/quantity=5/)

            console.log(`Continue button navigated to: ${url}`)
        })

        /**
         * Test: Benefits section displays 3 cards
         */
        test('benefits section displays 3 trust cards', async ({ page }) => {
            // Verify benefit cards
            await expect(page.getByText(/giống chất lượng/i).or(page.getByText(/dó đen/i)).first()).toBeVisible({ timeout: 10000 })
            await expect(page.getByText(/GPS/i).first()).toBeVisible()
            await expect(page.getByText(/báo cáo/i).first()).toBeVisible()

            console.log('3 benefit cards verified')
        })

        /**
         * Test: Security badge displays
         */
        test('security badge displays on quantity page', async ({ page }) => {
            await expect(page.getByText(/thanh toán an toàn/i).or(page.getByText(/bảo mật/i)).first()).toBeVisible({ timeout: 10000 })

            console.log('Security badge verified')
        })
    })
})
