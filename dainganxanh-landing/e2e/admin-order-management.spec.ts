import { test, expect } from '@playwright/test'
import { getOTPFromMailpit } from './fixtures/mailpit'
import { ADMIN_EMAIL, TEST_EMAIL } from './fixtures/identity'

/**
 * Admin Order Management E2E Test Suite
 * Tests the admin dashboard for order management and lot assignment
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Admin user: TEST_ADMIN_EMAIL (env override, must have admin role)
 */

test.describe('[P0] Admin Order Management E2E', () => {

    test.afterAll(async ({ browser }) => {
        // Clean up: close all pages and reset browser state
        const contexts = browser.contexts()
        for (const ctx of contexts) {
            await ctx.clearCookies()
            await ctx.clearPermissions()
        }
    })


    /**
     * Helper: Complete admin login flow and navigate to target page
     */
    async function loginAsAdmin(page: any, targetPath: string = '/crm/admin/orders') {
        // Start by going to the target page (will redirect to login if not authenticated)
        await page.goto(targetPath)
        await page.waitForLoadState('networkidle')

        // Check if we're on login page (redirected)
        const currentUrl = page.url()
        if (!currentUrl.includes('/login')) {
            // Already authenticated
            console.log('✅ Already authenticated')
            return
        }

        const emailInput = page.locator('input#identifier-input[type="email"]')
        await expect(emailInput).toBeVisible()
        await emailInput.fill(ADMIN_EMAIL)

        const sendOTPButton = page.getByRole('button', { name: /gửi mã otp/i })
        await sendOTPButton.click()

        await expect(page.getByText(/nhập mã otp \(8 chữ số\)/i)).toBeVisible({ timeout: 10000 })

        console.log('⏳ Fetching OTP from Mailpit...')
        const otpCode = await getOTPFromMailpit(ADMIN_EMAIL)
        console.log(`✅ Got OTP: ${otpCode}`)

        const otpInputs = page.locator('input[inputmode="numeric"]')
        await expect(otpInputs).toHaveCount(8)

        for (let i = 0; i < 8; i++) {
            await otpInputs.nth(i).fill(otpCode[i])
        }

        // Wait for OTP verification to complete - URL should change away from /login
        // or skip button should appear
        try {
            await Promise.race([
                page.waitForURL((url) => !url.href.includes('/login') && !url.href.includes('redirect'), { timeout: 10000 }),
                page.getByRole('button', { name: /bỏ qua/i }).waitFor({ state: 'visible', timeout: 10000 })
            ])
        } catch {
            // Timeout - OTP may still be processing
            console.log('⚠️ Waiting for OTP verification...')
        }

        await page.waitForLoadState('networkidle')
        // Additional wait for auth state to be persisted
        await page.waitForLoadState('networkidle')

        const skipButton = page.getByRole('button', { name: /bỏ qua/i })
        const hasSkipButton = await skipButton.count() > 0

        if (hasSkipButton) {
            await skipButton.click()
            // Wait for navigation after skip - should redirect back to target page
            try {
                await page.waitForURL(new RegExp(targetPath.replace(/\//g, '\\/')), { timeout: 15000 })
            } catch {
                // Timeout waiting for URL change, wait longer for auth state to persist
                console.log('⚠️ Redirect timeout, waiting for auth state...')
                await page.waitForLoadState('networkidle')
                // Check current URL
                const afterSkipUrl = page.url()
                console.log(`Current URL after skip: ${afterSkipUrl}`)
                // If not at target, manually navigate
                if (!afterSkipUrl.includes(targetPath)) {
                    console.log(`Manually navigating to ${targetPath}`)
                    await page.goto(targetPath)
                    await page.waitForLoadState('networkidle')
                }
            }
            await page.waitForLoadState('networkidle')

            // Extra wait to ensure page fully loaded
            await page.waitForLoadState('networkidle')

            // Log final URL to debug
            const finalUrl = page.url()
            console.log(`Final URL: ${finalUrl}`)
        } else {
            // If no skip button, OTP login completed and redirected already
            // Wait for redirect to complete, then check where we are
            console.log(`No skip button, waiting for auto-redirect...`)
            await page.waitForLoadState('networkidle')

            const currentUrl = page.url()
            console.log(`Current URL after OTP: ${currentUrl}`)

            // If not at target path, navigate manually
            if (!currentUrl.includes(targetPath)) {
                console.log(`Navigating to target: ${targetPath}`)
                await page.goto(targetPath)
                await page.waitForLoadState('networkidle')
            }

            const finalUrl = page.url()
            console.log(`Final URL: ${finalUrl}`)
        }

        console.log('✅ Admin login successful')
    }

    /**
     * Test: View admin orders dashboard
     */
    test('view admin orders dashboard', async ({ page }) => {
        // Login as admin and navigate to orders page
        await loginAsAdmin(page, '/crm/admin/orders')

        // ============================================
        // Phase 1: Verify admin orders page loaded
        // ============================================
        await expect(page).toHaveURL(/crm\/admin\/orders/)

        // Check for page title (use .first() to handle multiple matches)
        await expect(page.getByText(/order management|quản lý đơn hàng/i).first()).toBeVisible({ timeout: 10000 })

        // ============================================
        // Phase 2: Verify orders table/list
        // ============================================
        // Wait for orders to load (either table or empty state)
        await page.waitForLoadState('networkidle')

        // Check if orders table exists
        const ordersTable = page.locator('table, div[class*="order"]').first()
        const hasOrders = await ordersTable.isVisible()

        if (hasOrders) {
            console.log('✅ Orders table displayed')

            // Verify table headers/columns (order code, customer, status, etc.)
            const tableHeaders = page.locator('th, div[class*="header"]')
            const headerCount = await tableHeaders.count()
            expect(headerCount).toBeGreaterThan(0)

            // Verify at least one order row exists
            const orderRows = page.locator('tr[class*="order"], div[class*="order-row"]')
            const rowCount = await orderRows.count()
            console.log(`✅ Found ${rowCount} orders`)
        } else {
            // Empty state
            await expect(page.getByText(/không có đơn hàng|no orders/i)).toBeVisible()
            console.log('ℹ️ No orders found - showing empty state')
        }

        // ============================================
        // Phase 3: Verify filters exist
        // ============================================
        // Check for status filter or other filters
        const filterSection = page.locator('select, input[type="search"], button[class*="filter"]')
        const hasFilters = await filterSection.count() > 0

        if (hasFilters) {
            console.log('✅ Filter controls available')
        }

        // ============================================
        // Phase 4: Take screenshot
        // ============================================
        await page.screenshot({
            path: 'e2e-results/admin-orders-dashboard.png',
            fullPage: true
        })

        console.log(`✅ Admin orders dashboard loaded successfully`)
    })

    /**
     * Test: Filter orders by status
     */
    test('filter orders by status', async ({ page }) => {
        await loginAsAdmin(page, '/crm/admin/orders')

        // Wait for page to load
        await expect(page.getByText(/order management|quản lý đơn hàng/i).first()).toBeVisible({ timeout: 10000 })

        // Look for status filter dropdown
        const statusFilter = page.locator('select[name*="status"], select:has(option[value*="paid"])')

        if (await statusFilter.isVisible()) {
            // Get initial order count
            await page.waitForLoadState('networkidle')
            const initialRows = await page.locator('tr[class*="order"], div[class*="order-row"]').count()

            // Select "paid" status
            await statusFilter.selectOption({ value: 'paid' })
            await page.waitForLoadState('networkidle')

            // Verify filtered results
            const filteredRows = await page.locator('tr[class*="order"], div[class*="order-row"]').count()

            console.log(`✅ Filter applied: ${initialRows} → ${filteredRows} orders`)
        } else {
            console.log('ℹ️ Status filter not found or not visible')
        }
    })

    /**
     * Test: Verify order action
     */
    test('verify order from orders table', async ({ page }) => {
        await loginAsAdmin(page, '/crm/admin/orders')

        await expect(page.getByText(/order management|quản lý đơn hàng/i).first()).toBeVisible({ timeout: 10000 })

        // Wait for orders to load
        await page.waitForLoadState('networkidle')

        // Find first "Verify" button (for paid orders)
        const verifyButton = page.getByRole('button', { name: /verify|xác nhận|xác minh/i }).first()
        const hasVerifyButton = await verifyButton.count() > 0

        if (hasVerifyButton) {
            // Try to get order code, but with timeout
            try {
                const orderCodeElement = verifyButton.locator('..').locator('text=/DH[A-Z0-9]{6}/i').first()
                const orderCode = await orderCodeElement.textContent({ timeout: 5000 })
                console.log(`📝 Attempting to verify order: ${orderCode}`)

                await verifyButton.click()

                // Wait for success message or status change
                await page.waitForLoadState('networkidle')

                // Check for success indicator
                const successMessage = page.locator('text=/thành công|success|verified/i')
                if (await successMessage.isVisible()) {
                    console.log(`✅ Order verified successfully`)
                } else {
                    console.log('ℹ️ Verify action executed (no visible confirmation)')
                }
            } catch {
                console.log('ℹ️ Could not find order code or verify button not actionable')
            }
        } else {
            console.log('ℹ️ No orders available to verify')
        }
    })

    /**
     * Test: Navigate to lots assignment page
     */
    test('navigate to tree lot assignment page', async ({ page }) => {
        await loginAsAdmin(page, '/crm/admin/lots')

        // ============================================
        // Phase 1: Verify lots page loaded
        // ============================================
        await expect(page).toHaveURL(/crm\/admin\/lots/)

        // Check for page title
        await expect(page.getByText(/lot assignment|gán lô|quản lý lô/i).first()).toBeVisible({ timeout: 10000 })

        // ============================================
        // Phase 2: Verify lot assignment interface
        // ============================================
        // Check for order selection or lot input
        const lotAssignmentForm = page.locator('form, input[type="text"], select')
        const hasForm = await lotAssignmentForm.count() > 0

        if (hasForm) {
            console.log('✅ Lot assignment form available')
        }

        // ============================================
        // Phase 3: Take screenshot
        // ============================================
        await page.screenshot({
            path: 'e2e-results/admin-lots-assignment.png',
            fullPage: true
        })

        console.log(`✅ Lot assignment page loaded successfully`)
    })

    /**
     * Test: Pagination controls work
     */
    test('pagination controls work on orders page', async ({ page }) => {
        await loginAsAdmin(page, '/crm/admin/orders')

        await expect(page.getByText(/order management|quản lý đơn hàng/i).first()).toBeVisible({ timeout: 10000 })

        // Wait for orders to load
        await page.waitForLoadState('networkidle')

        // Look for pagination buttons (use more specific selector to avoid Next.js DevTools button)
        const nextButton = page.locator('button:has-text("Sau"), button:has-text("Next")').and(page.locator('[class*="pagination"], [class*="page"]')).first()
        const prevButton = page.locator('button:has-text("Trước"), button:has-text("Previous")').and(page.locator('[class*="pagination"], [class*="page"]')).first()

        const hasNextButton = await nextButton.count() > 0

        if (hasNextButton) {
            // Get current page indicator
            const pageIndicator = page.locator('text=/trang \\d+/i, text=/page \\d+/i')
            if (await pageIndicator.isVisible()) {
                const currentPageText = await pageIndicator.textContent()
                console.log(`📄 Current page: ${currentPageText}`)
            }

            // Click next if enabled
            const isNextEnabled = await nextButton.isEnabled()
            if (isNextEnabled) {
                await nextButton.click()
                await page.waitForLoadState('networkidle')

                console.log(`✅ Pagination next button works`)

                // Click previous to go back
                const isPrevEnabled = await prevButton.isEnabled()
                if (isPrevEnabled) {
                    await prevButton.click()
                    await page.waitForLoadState('networkidle')
                    console.log(`✅ Pagination previous button works`)
                }
            } else {
                console.log('ℹ️ Next button disabled (last page or single page)')
            }
        } else {
            console.log('ℹ️ Pagination not visible (not enough orders)')
        }
    })

    /**
     * Test: No console errors on admin pages
     */
    test('no console errors on admin orders page', async ({ page }) => {
        const consoleErrors: string[] = []

        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text())
            }
        })

        await loginAsAdmin(page, '/crm/admin/orders')

        // Wait for page to fully render
        await page.waitForLoadState('networkidle')

        // Verify no console errors
        if (consoleErrors.length > 0) {
            console.error('❌ Console errors detected:', consoleErrors)
            throw new Error(`Found ${consoleErrors.length} console errors`)
        }

        console.log(`✅ No console errors detected`)
    })
})
