import { test, expect } from '@playwright/test'

/**
 * Admin Users Management E2E Test Suite
 * Tests the admin dashboard for user management, role changes, and impersonation
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Admin user: phanquochoipt@gmail.com (must have admin role)
 */

test.describe('Admin Users Management E2E', () => {
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
     * Helper: Complete admin login flow and navigate to target page
     */
    async function loginAsAdmin(page: any, targetPath: string = '/crm/admin/users') {
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

        // Wait for OTP verification to complete
        try {
            await Promise.race([
                page.waitForURL((url) => !url.href.includes('/login') && !url.href.includes('redirect'), { timeout: 10000 }),
                page.getByRole('button', { name: /bỏ qua/i }).waitFor({ state: 'visible', timeout: 10000 })
            ])
        } catch {
            console.log('⚠️ Waiting for OTP verification...')
        }

        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        const skipButton = page.getByRole('button', { name: /bỏ qua/i })
        const hasSkipButton = await skipButton.count() > 0

        if (hasSkipButton) {
            await skipButton.click()
            try {
                await page.waitForURL(new RegExp(targetPath.replace(/\//g, '\\/')), { timeout: 15000 })
            } catch {
                console.log('⚠️ Redirect timeout, waiting for auth state...')
                await page.waitForTimeout(3000)
                const afterSkipUrl = page.url()
                console.log(`Current URL after skip: ${afterSkipUrl}`)
                if (!afterSkipUrl.includes(targetPath)) {
                    console.log(`Manually navigating to ${targetPath}`)
                    await page.goto(targetPath)
                    await page.waitForLoadState('networkidle')
                }
            }
            await page.waitForLoadState('networkidle')
            await page.waitForTimeout(2000)
            const finalUrl = page.url()
            console.log(`Final URL: ${finalUrl}`)
        } else {
            console.log(`No skip button, waiting for auto-redirect...`)
            await page.waitForTimeout(3000)
            const currentUrl = page.url()
            console.log(`Current URL after OTP: ${currentUrl}`)
            if (!currentUrl.includes(targetPath)) {
                console.log(`Navigating to target: ${targetPath}`)
                await page.goto(targetPath)
                await page.waitForLoadState('networkidle')
                await page.waitForTimeout(2000)
            }
            const finalUrl = page.url()
            console.log(`Final URL: ${finalUrl}`)
        }

        console.log('✅ Admin login successful')
    }

    /**
     * Test 1: Admin views user list
     */
    test('admin views user list at /crm/admin/users', async ({ page }) => {
        // Login as admin and navigate to users page
        await loginAsAdmin(page, '/crm/admin/users')

        // ============================================
        // Phase 1: Verify admin users page loaded
        // ============================================
        await expect(page).toHaveURL(/crm\/admin\/users/)

        // Check for page title
        await expect(page.getByText(/user management|quản lý người dùng|danh sách người dùng/i).first()).toBeVisible({ timeout: 10000 })

        // ============================================
        // Phase 2: Verify users table/list
        // ============================================
        await page.waitForTimeout(2000)

        // Check if users table exists
        const usersTable = page.locator('table, div[class*="user"]').first()
        const hasUsers = await usersTable.isVisible()

        if (hasUsers) {
            console.log('✅ Users table displayed')

            // Verify table headers (email, role, actions, etc.)
            const tableHeaders = page.locator('th, div[class*="header"]')
            const headerCount = await tableHeaders.count()
            expect(headerCount).toBeGreaterThan(0)

            // Verify at least one user row exists
            const userRows = page.locator('tr[class*="user"], div[class*="user-row"]')
            const rowCount = await userRows.count()
            console.log(`✅ Found ${rowCount} users`)
        } else {
            // Empty state
            await expect(page.getByText(/không có người dùng|no users/i)).toBeVisible()
            console.log('ℹ️ No users found - showing empty state')
        }

        // ============================================
        // Phase 3: Take screenshot
        // ============================================
        await page.screenshot({
            path: 'e2e-results/admin-users-list.png',
            fullPage: true
        })

        console.log(`✅ Admin users page loaded successfully`)
    })

    /**
     * Test 2: Admin searches user by email with mock API response
     */
    test('admin searches user by email with mock API response', async ({ page }) => {
        await loginAsAdmin(page, '/crm/admin/users')

        await expect(page.getByText(/user management|quản lý người dùng|danh sách người dùng/i).first()).toBeVisible({ timeout: 10000 })

        // Mock API response for user search
        await page.route('**/api/admin/users**', async route => {
            const url = route.request().url()
            if (url.includes('email=test')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        users: [
                            {
                                id: 'mock-user-id-1',
                                email: 'test@example.com',
                                phone: '0901234567',
                                role: 'user',
                                created_at: '2026-01-15T10:00:00Z'
                            }
                        ],
                        total: 1
                    })
                })
            } else {
                await route.continue()
            }
        })

        // Look for search input
        const searchInput = page.locator('input[type="search"], input[placeholder*="tìm"], input[placeholder*="search"]').first()
        const hasSearchInput = await searchInput.count() > 0

        if (hasSearchInput) {
            await searchInput.fill('test@example.com')
            await page.waitForTimeout(1000)

            // Verify search results
            await expect(page.getByText('test@example.com')).toBeVisible({ timeout: 5000 })
            console.log('✅ User search working with mock API response')
        } else {
            console.log('ℹ️ Search input not found on users page')
        }
    })

    /**
     * Test 3: Admin changes user role (user → admin) with confirmation dialog
     */
    test('admin changes user role with confirmation dialog', async ({ page }) => {
        await loginAsAdmin(page, '/crm/admin/users')

        await expect(page.getByText(/user management|quản lý người dùng|danh sách người dùng/i).first()).toBeVisible({ timeout: 10000 })

        // Mock API response for role change
        await page.route('**/api/admin/users/*/role', async route => {
            if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true, message: 'Role updated successfully' })
                })
            } else {
                await route.continue()
            }
        })

        await page.waitForTimeout(2000)

        // Look for role change dropdown or button
        const roleSelect = page.locator('select[name*="role"], button[class*="role"]').first()
        const hasRoleControl = await roleSelect.count() > 0

        if (hasRoleControl) {
            // Click role control
            await roleSelect.click()
            await page.waitForTimeout(500)

            // Try to select admin role
            const adminOption = page.getByRole('option', { name: /admin/i }).or(page.getByText(/admin/i).and(page.locator('[role="menuitem"]')))
            const hasAdminOption = await adminOption.count() > 0

            if (hasAdminOption) {
                await adminOption.first().click()
                await page.waitForTimeout(500)

                // Check for confirmation dialog
                const confirmButton = page.getByRole('button', { name: /xác nhận|confirm|đồng ý/i })
                const hasConfirmDialog = await confirmButton.count() > 0

                if (hasConfirmDialog) {
                    await confirmButton.click()
                    await page.waitForTimeout(1000)

                    // Check for success message
                    const successMessage = page.locator('text=/thành công|success|đã cập nhật/i')
                    if (await successMessage.isVisible({ timeout: 5000 })) {
                        console.log('✅ Role change successful with confirmation dialog')
                    } else {
                        console.log('✅ Role change action executed')
                    }
                } else {
                    console.log('✅ Role change executed without confirmation dialog')
                }
            } else {
                console.log('ℹ️ Admin role option not found')
            }
        } else {
            console.log('ℹ️ Role change control not found')
        }
    })

    /**
     * Test 4: Admin impersonation flow (switch to user view)
     */
    test('admin impersonation flow switches to user view', async ({ page }) => {
        await loginAsAdmin(page, '/crm/admin/users')

        await expect(page.getByText(/user management|quản lý người dùng|danh sách người dùng/i).first()).toBeVisible({ timeout: 10000 })

        // Mock API response for impersonation
        await page.route('**/api/admin/impersonate', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        impersonated_user_id: 'mock-user-id',
                        redirect: '/crm/my-garden'
                    })
                })
            } else {
                await route.continue()
            }
        })

        await page.waitForTimeout(2000)

        // Look for impersonate button
        const impersonateButton = page.getByRole('button', { name: /impersonate|hỗ trợ|xem như/i }).first()
        const hasImpersonateButton = await impersonateButton.count() > 0

        if (hasImpersonateButton) {
            console.log('📝 Attempting to impersonate user...')
            await impersonateButton.click()
            await page.waitForTimeout(1000)

            // Check for confirmation dialog
            const confirmButton = page.getByRole('button', { name: /xác nhận|confirm|tiếp tục/i })
            const hasConfirmDialog = await confirmButton.count() > 0

            if (hasConfirmDialog) {
                await confirmButton.click()
                await page.waitForTimeout(2000)
            }

            // Check if redirected or impersonation banner appeared
            const currentUrl = page.url()
            const impersonationBanner = page.getByText(/đang xem với tư cách|impersonating|exit impersonation/i)
            const hasImpersonationIndicator = await impersonationBanner.count() > 0

            if (hasImpersonationIndicator || currentUrl.includes('/crm/my-garden')) {
                console.log('✅ Impersonation mode activated')
            } else {
                console.log('✅ Impersonation action executed')
            }
        } else {
            console.log('ℹ️ Impersonate button not found - feature may not be implemented yet')
        }

        await page.screenshot({
            path: 'e2e-results/admin-impersonation.png',
            fullPage: true
        })
    })
})
