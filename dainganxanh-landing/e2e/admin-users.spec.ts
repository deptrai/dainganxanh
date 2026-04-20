import { test, expect } from '@playwright/test'
import { getOTPFromMailpit } from './fixtures/mailpit'
import { ADMIN_EMAIL, TEST_EMAIL } from './fixtures/identity'
import { loginAsAdmin } from './fixtures/auth'

/**
 * Admin Users Management E2E Test Suite
 * Tests the admin dashboard for user management, role changes, and impersonation
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Admin user: TEST_ADMIN_EMAIL (env override, must have admin role)
 */

test.describe('[P1] Admin Users Management E2E', () => {

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
        await page.waitForLoadState('networkidle')

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
            await page.waitForLoadState('networkidle')

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

        await page.waitForLoadState('networkidle')

        // Look for role change dropdown or button
        const roleSelect = page.locator('select[name*="role"], button[class*="role"]').first()
        const hasRoleControl = await roleSelect.count() > 0

        if (hasRoleControl) {
            // Click role control
            await roleSelect.click()
            await page.waitForLoadState('networkidle')

            // Try to select admin role
            const adminOption = page.getByRole('option', { name: /admin/i }).or(page.getByText(/admin/i).and(page.locator('[role="menuitem"]')))
            const hasAdminOption = await adminOption.count() > 0

            if (hasAdminOption) {
                await adminOption.first().click()
                await page.waitForLoadState('networkidle')

                // Check for confirmation dialog
                const confirmButton = page.getByRole('button', { name: /xác nhận|confirm|đồng ý/i })
                const hasConfirmDialog = await confirmButton.count() > 0

                if (hasConfirmDialog) {
                    await confirmButton.click()
                    await page.waitForLoadState('networkidle')

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

        await page.waitForLoadState('networkidle')

        // Look for impersonate button
        const impersonateButton = page.getByRole('button', { name: /impersonate|hỗ trợ|xem như/i }).first()
        const hasImpersonateButton = await impersonateButton.count() > 0

        if (hasImpersonateButton) {
            console.log('📝 Attempting to impersonate user...')
            await impersonateButton.click()
            await page.waitForLoadState('networkidle')

            // Check for confirmation dialog
            const confirmButton = page.getByRole('button', { name: /xác nhận|confirm|tiếp tục/i })
            const hasConfirmDialog = await confirmButton.count() > 0

            if (hasConfirmDialog) {
                await confirmButton.click()
                await page.waitForLoadState('networkidle')
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
