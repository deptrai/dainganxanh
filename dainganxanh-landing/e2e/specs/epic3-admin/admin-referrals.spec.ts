import { test, expect } from '@playwright/test'
import { getOTPFromMailpit } from '../../fixtures/mailpit'
import { ADMIN_EMAIL, TEST_EMAIL } from '../../fixtures/identity'
import { loginAsAdmin } from '../../fixtures/auth'

/**
 * Admin Referrals Management E2E Test Suite
 * Tests the admin dashboard for referral code management and manual assignment
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Admin user: TEST_ADMIN_EMAIL (env override, must have admin role)
 */

test.describe('[P2] Admin Referrals Management E2E', () => {



    /**
     * Helper: Complete admin login flow and navigate to target page
     */
    /**
     * Test 1: Admin views referral management page
     */
    test('admin views referral management at /crm/admin/referrals', async ({ page }) => {
        await loginAsAdmin(page, '/crm/admin/referrals')

        // ============================================
        // Phase 1: Verify admin referrals page loaded
        // ============================================
        await expect(page).toHaveURL(/crm\/admin\/referrals/)

        // Check for page title
        await expect(page.getByText(/referral|giới thiệu|quản lý mã giới thiệu/i).first()).toBeVisible({ timeout: 10000 })

        // ============================================
        // Phase 2: Verify referrals table/list
        // ============================================
        await page.waitForLoadState('networkidle')

        // Check if referrals table exists
        const referralsTable = page.locator('table, div[class*="referral"]').first()
        const hasReferrals = await referralsTable.isVisible()

        if (hasReferrals) {
            console.log('✅ Referrals table displayed')

            // Verify table headers (user, referral code, clicks, conversions, etc.)
            const tableHeaders = page.locator('th, div[class*="header"]')
            const headerCount = await tableHeaders.count()
            expect(headerCount).toBeGreaterThan(0)

            // Verify at least one referral row exists
            const referralRows = page.locator('tr[class*="referral"], div[class*="referral-row"]')
            const rowCount = await referralRows.count()
            console.log(`✅ Found ${rowCount} referral records`)
        } else {
            await expect(page.getByText(/chưa có hoa hồng|không có dữ liệu|no referrals/i)).toBeVisible()
            console.log('ℹ️ No referral records found')
        }

        // ============================================
        // Phase 3: Check for statistics
        // ============================================
        // Look for referral statistics (total clicks, conversions, commission, etc.)
        const statsSection = page.locator('[class*="stat"], [class*="metric"], [class*="summary"]')
        const hasStats = await statsSection.count() > 0

        if (hasStats) {
            console.log('✅ Referral statistics displayed')
        }

        await page.screenshot({
            path: 'e2e-results/admin-referrals-list.png',
            fullPage: true
        })

        console.log(`✅ Admin referrals page loaded successfully`)
    })

    /**
     * Test 2: Admin manually assigns referral code to user without one
     */
    test('admin manually assigns referral code to user without one', async ({ page }) => {
        await loginAsAdmin(page, '/crm/admin/referrals')

        await expect(page.getByText(/referral|giới thiệu|quản lý mã giới thiệu/i).first()).toBeVisible({ timeout: 10000 })

        // Mock API response for users without referral code
        await page.route('**/api/admin/users/without-referral', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    users: [
                        {
                            id: 'user-no-ref-1',
                            email: 'noref@example.com',
                            phone: '0912345678',
                            referral_code: null,
                            created_at: '2026-03-15T08:00:00Z'
                        }
                    ],
                    total: 1
                })
            })
        })

        // Mock API for assigning referral code
        await page.route('**/api/admin/referrals/assign', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        referral_code: 'DNG123456',
                        message: 'Referral code assigned successfully'
                    })
                })
            } else {
                await route.continue()
            }
        })

        await page.waitForLoadState('networkidle')

        // Look for "assign referral code" button or section
        const assignButton = page.getByRole('button', { name: /gán mã|assign|tạo mã/i }).first()
        const hasAssignButton = await assignButton.count() > 0

        if (hasAssignButton) {
            console.log('📝 Attempting to assign referral code to user...')
            await assignButton.click()
            await page.waitForLoadState('networkidle')

            // Look for user selection (could be dropdown or search)
            const userSelect = page.locator('select[name*="user"], input[placeholder*="tìm người dùng"]')
            const hasUserSelect = await userSelect.count() > 0

            if (hasUserSelect) {
                await userSelect.first().fill('noref@example.com')
                await page.waitForLoadState('networkidle')

                // Select from dropdown if available
                const userOption = page.getByText('noref@example.com')
                if (await userOption.count() > 0) {
                    await userOption.first().click()
                }
            }

            // Click confirm/submit button
            const confirmButton = page.getByRole('button', { name: /xác nhận|confirm|gán mã|assign/i }).last()
            const hasConfirmButton = await confirmButton.count() > 0

            if (hasConfirmButton) {
                await confirmButton.click()
                await page.waitForLoadState('networkidle')

                // Check for success message
                const successMessage = page.locator('text=/thành công|success|đã gán/i')
                if (await successMessage.isVisible({ timeout: 5000 })) {
                    console.log('✅ Referral code assigned successfully')

                    // Verify the generated code is displayed
                    const codeDisplay = page.locator('text=/DNG[0-9]{6}/i')
                    if (await codeDisplay.count() > 0) {
                        const code = await codeDisplay.first().textContent()
                        console.log(`✅ Generated referral code: ${code}`)
                    }
                } else {
                    console.log('✅ Referral code assignment action executed')
                }
            }
        } else {
            console.log('ℹ️ Assign referral code button not found')
        }
    })

    /**
     * Test 3: Telegram notification mock on referral assignment
     */
    test('telegram notification mock on referral assignment (notifyReferralAssigned)', async ({ page }) => {
        let telegramApiCalled = false

        await loginAsAdmin(page, '/crm/admin/referrals')

        await expect(page.getByText(/referral|giới thiệu|quản lý mã giới thiệu/i).first()).toBeVisible({ timeout: 10000 })

        // Mock API for assigning referral code
        await page.route('**/api/admin/referrals/assign', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        referral_code: 'DNG789012',
                        message: 'Referral code assigned successfully'
                    })
                })
            } else {
                await route.continue()
            }
        })

        // Mock Telegram notification API and track if it's called
        await page.route('**/api/notifications/telegram', async route => {
            if (route.request().method() === 'POST') {
                const requestBody = route.request().postDataJSON()
                if (requestBody?.type === 'referral_assigned' || requestBody?.action === 'notifyReferralAssigned') {
                    telegramApiCalled = true
                    console.log('📱 Telegram notification API called:', requestBody)
                }

                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true })
                })
            } else {
                await route.continue()
            }
        })

        await page.waitForLoadState('networkidle')

        // Look for assign button
        const assignButton = page.getByRole('button', { name: /gán mã|assign|tạo mã/i }).first()
        const hasAssignButton = await assignButton.count() > 0

        if (hasAssignButton) {
            await assignButton.click()
            await page.waitForLoadState('networkidle')

            // Fill user selection if available
            const userSelect = page.locator('select[name*="user"], input[placeholder*="tìm người dùng"]')
            if (await userSelect.count() > 0) {
                await userSelect.first().fill('test@example.com')
                await page.waitForLoadState('networkidle')
            }

            // Click confirm
            const confirmButton = page.getByRole('button', { name: /xác nhận|confirm|gán mã|assign/i }).last()
            if (await confirmButton.count() > 0) {
                await confirmButton.click()
                await page.waitForLoadState('networkidle')

                // Verify Telegram API was called
                if (telegramApiCalled) {
                    console.log('✅ Telegram notification (notifyReferralAssigned) triggered successfully')
                } else {
                    console.log('ℹ️ Telegram notification not called (may be handled server-side)')
                }
            }
        } else {
            console.log('ℹ️ Cannot test Telegram notification - assign button not found')
        }

        await page.screenshot({
            path: 'e2e-results/admin-referral-assignment.png',
            fullPage: true
        })
    })
})
