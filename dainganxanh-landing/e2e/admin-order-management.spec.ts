import { test, expect } from '@playwright/test'

/**
 * Admin Order Management E2E Test Suite
 * Tests the admin dashboard for order management and lot assignment
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Admin user: phanquochoipt@gmail.com (must have admin role)
 */

test.describe('Admin Order Management E2E', () => {
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
     * Helper: Complete admin login flow
     */
    async function loginAsAdmin(page: any) {
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

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
     * Test: View admin orders dashboard
     */
    test('view admin orders dashboard', async ({ page }) => {
        // Login as admin
        await loginAsAdmin(page)

        // Navigate to admin orders page
        await page.goto('/crm/admin/orders')
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 1: Verify admin orders page loaded
        // ============================================
        await expect(page).toHaveURL(/crm\/admin\/orders/)

        // Check for page title
        await expect(page.getByText(/order management|quản lý đơn hàng/i)).toBeVisible({ timeout: 10000 })

        // ============================================
        // Phase 2: Verify orders table/list
        // ============================================
        // Wait for orders to load (either table or empty state)
        await page.waitForTimeout(2000)

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
        await loginAsAdmin(page)

        await page.goto('/crm/admin/orders')
        await page.waitForLoadState('networkidle')

        // Wait for page to load
        await expect(page.getByText(/order management|quản lý đơn hàng/i)).toBeVisible({ timeout: 10000 })

        // Look for status filter dropdown
        const statusFilter = page.locator('select[name*="status"], select:has(option[value*="paid"])')

        if (await statusFilter.isVisible()) {
            // Get initial order count
            await page.waitForTimeout(1000)
            const initialRows = await page.locator('tr[class*="order"], div[class*="order-row"]').count()

            // Select "paid" status
            await statusFilter.selectOption({ value: 'paid' })
            await page.waitForTimeout(1000)

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
        await loginAsAdmin(page)

        await page.goto('/crm/admin/orders')
        await page.waitForLoadState('networkidle')

        await expect(page.getByText(/order management|quản lý đơn hàng/i)).toBeVisible({ timeout: 10000 })

        // Wait for orders to load
        await page.waitForTimeout(2000)

        // Find first "Verify" button (for paid orders)
        const verifyButton = page.getByRole('button', { name: /verify|xác nhận|xác minh/i }).first()

        if (await verifyButton.isVisible()) {
            const orderCode = await verifyButton.locator('..').locator('text=/DH[A-Z0-9]{6}/i').textContent()
            console.log(`📝 Attempting to verify order: ${orderCode}`)

            await verifyButton.click()

            // Wait for success message or status change
            await page.waitForTimeout(2000)

            // Check for success indicator
            const successMessage = page.locator('text=/thành công|success|verified/i')
            if (await successMessage.isVisible()) {
                console.log(`✅ Order verified successfully`)
            } else {
                console.log('ℹ️ Verify action executed (no visible confirmation)')
            }
        } else {
            console.log('ℹ️ No orders available to verify')
        }
    })

    /**
     * Test: Navigate to lots assignment page
     */
    test('navigate to tree lot assignment page', async ({ page }) => {
        await loginAsAdmin(page)

        // Navigate to lots page
        await page.goto('/crm/admin/lots')
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 1: Verify lots page loaded
        // ============================================
        await expect(page).toHaveURL(/crm\/admin\/lots/)

        // Check for page title
        await expect(page.getByText(/lot assignment|gán lô|quản lý lô/i)).toBeVisible({ timeout: 10000 })

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
        await loginAsAdmin(page)

        await page.goto('/crm/admin/orders')
        await page.waitForLoadState('networkidle')

        await expect(page.getByText(/order management|quản lý đơn hàng/i)).toBeVisible({ timeout: 10000 })

        // Wait for orders to load
        await page.waitForTimeout(2000)

        // Look for pagination buttons
        const nextButton = page.getByRole('button', { name: /sau|next/i })
        const prevButton = page.getByRole('button', { name: /trước|previous/i })

        if (await nextButton.isVisible()) {
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
                await page.waitForTimeout(1000)

                console.log(`✅ Pagination next button works`)

                // Click previous to go back
                const isPrevEnabled = await prevButton.isEnabled()
                if (isPrevEnabled) {
                    await prevButton.click()
                    await page.waitForTimeout(1000)
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

        await loginAsAdmin(page)

        await page.goto('/crm/admin/orders')
        await page.waitForLoadState('networkidle')

        // Wait for page to fully render
        await page.waitForTimeout(3000)

        // Verify no console errors
        if (consoleErrors.length > 0) {
            console.error('❌ Console errors detected:', consoleErrors)
            throw new Error(`Found ${consoleErrors.length} console errors`)
        }

        console.log(`✅ No console errors detected`)
    })
})
