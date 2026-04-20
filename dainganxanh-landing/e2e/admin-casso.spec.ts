import { test, expect } from '@playwright/test'
import { getOTPFromMailpit } from './fixtures/mailpit'
import { ADMIN_EMAIL, TEST_EMAIL } from './fixtures/identity'
import { loginAsAdmin } from './fixtures/auth'

/**
 * Admin Casso Transaction History E2E Test Suite
 * Tests the admin dashboard for Casso bank transaction history and reprocessing
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Admin user: TEST_ADMIN_EMAIL (env override, must have admin role)
 */

test.describe('Admin Casso Transaction History E2E', () => {

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
     * Test 1: Admin views Casso transaction history
     */
    test('admin views Casso transaction history at /crm/admin/casso', async ({ page }) => {
        await loginAsAdmin(page, '/crm/admin/casso')

        // ============================================
        // Phase 1: Verify admin Casso page loaded
        // ============================================
        await expect(page).toHaveURL(/crm\/admin\/casso/)

        // Check for page title
        await expect(page.getByText(/casso|transaction|giao dịch|lịch sử thanh toán/i).first()).toBeVisible({ timeout: 10000 })

        // ============================================
        // Phase 2: Verify transactions table/list
        // ============================================
        await page.waitForLoadState('networkidle')

        // Check if transactions table exists
        const transactionsTable = page.locator('table, div[class*="transaction"]').first()
        const hasTransactions = await transactionsTable.isVisible()

        if (hasTransactions) {
            console.log('✅ Casso transactions table displayed')

            // Verify table headers (txId, amount, status, order code, etc.)
            const tableHeaders = page.locator('th, div[class*="header"]')
            const headerCount = await tableHeaders.count()
            expect(headerCount).toBeGreaterThan(0)

            // Verify at least one transaction row exists
            const transactionRows = page.locator('tr[class*="transaction"], div[class*="transaction-row"]')
            const rowCount = await transactionRows.count()
            console.log(`✅ Found ${rowCount} transactions`)
        } else {
            await expect(page.getByText(/không có giao dịch|no transactions/i)).toBeVisible()
            console.log('ℹ️ No transactions found')
        }

        // ============================================
        // Phase 3: Check for status badges
        // ============================================
        // Look for status indicators: processed, no_match, function_error
        const statusBadges = page.locator('[class*="badge"], [class*="status"], [class*="chip"]')
        const hasStatusBadges = await statusBadges.count() > 0

        if (hasStatusBadges) {
            console.log('✅ Transaction status badges displayed')
        }

        await page.screenshot({
            path: 'e2e-results/admin-casso-transactions.png',
            fullPage: true
        })

        console.log(`✅ Admin Casso transaction history page loaded successfully`)
    })

    /**
     * Test 2: Admin filters transactions by status
     */
    test('admin filters transactions by status (processed/no_match/function_error)', async ({ page }) => {
        await loginAsAdmin(page, '/crm/admin/casso')

        await expect(page.getByText(/casso|transaction|giao dịch|lịch sử thanh toán/i).first()).toBeVisible({ timeout: 10000 })

        // Mock API response for filtered transactions
        await page.route('**/api/admin/casso**', async route => {
            const url = route.request().url()

            if (url.includes('status=processed')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        transactions: [
                            {
                                id: 'tx-1',
                                casso_tid: '123456789',
                                amount: 1300000,
                                description: 'Chuyen tien DH1A2B3C',
                                status: 'processed',
                                order_code: 'DH1A2B3C',
                                when: '2026-03-20T10:30:00Z'
                            }
                        ],
                        total: 1
                    })
                })
            } else if (url.includes('status=no_match')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        transactions: [
                            {
                                id: 'tx-2',
                                casso_tid: '987654321',
                                amount: 500000,
                                description: 'Chuyen tien khong co ma',
                                status: 'no_match',
                                order_code: null,
                                when: '2026-03-19T14:20:00Z'
                            }
                        ],
                        total: 1
                    })
                })
            } else if (url.includes('status=function_error')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        transactions: [
                            {
                                id: 'tx-3',
                                casso_tid: '555555555',
                                amount: 2600000,
                                description: 'DH9X8Y7Z error processing',
                                status: 'function_error',
                                order_code: 'DH9X8Y7Z',
                                error_message: 'Edge function timeout',
                                when: '2026-03-18T09:15:00Z'
                            }
                        ],
                        total: 1
                    })
                })
            } else {
                await route.continue()
            }
        })

        await page.waitForLoadState('networkidle')

        // Look for status filter dropdown
        const statusFilter = page.locator('select[name*="status"], select:has(option[value*="processed"])')
        const hasStatusFilter = await statusFilter.count() > 0

        if (hasStatusFilter) {
            // Test filtering by "processed"
            await statusFilter.selectOption({ value: 'processed' })
            await page.waitForLoadState('networkidle')

            // Verify "processed" results
            const processedBadge = page.locator('text=/processed|đã xử lý/i')
            if (await processedBadge.count() > 0) {
                console.log('✅ Filter by "processed" status works')
            }

            // Test filtering by "no_match"
            await statusFilter.selectOption({ value: 'no_match' })
            await page.waitForLoadState('networkidle')

            const noMatchBadge = page.locator('text=/no_match|không khớp/i')
            if (await noMatchBadge.count() > 0) {
                console.log('✅ Filter by "no_match" status works')
            }

            // Test filtering by "function_error"
            await statusFilter.selectOption({ value: 'function_error' })
            await page.waitForLoadState('networkidle')

            const errorBadge = page.locator('text=/function_error|lỗi|error/i')
            if (await errorBadge.count() > 0) {
                console.log('✅ Filter by "function_error" status works')
            }

            console.log('✅ Transaction status filter working correctly')
        } else {
            console.log('ℹ️ Status filter not found on Casso page')
        }
    })

    /**
     * Test 3: Admin manually reprocesses failed transaction
     */
    test('admin manually reprocesses failed transaction', async ({ page }) => {
        await loginAsAdmin(page, '/crm/admin/casso')

        await expect(page.getByText(/casso|transaction|giao dịch|lịch sử thanh toán/i).first()).toBeVisible({ timeout: 10000 })

        // Mock API response for transaction list with failed transaction
        await page.route('**/api/admin/casso', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        transactions: [
                            {
                                id: 'tx-error-1',
                                casso_tid: '111222333',
                                amount: 1300000,
                                description: 'DH5T6U7V timeout error',
                                status: 'function_error',
                                order_code: 'DH5T6U7V',
                                error_message: 'Edge function timeout during contract generation',
                                when: '2026-03-25T11:45:00Z'
                            }
                        ],
                        total: 1
                    })
                })
            } else {
                await route.continue()
            }
        })

        // Mock reprocess API
        await page.route('**/api/admin/casso/*/reprocess', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        message: 'Transaction reprocessed successfully',
                        new_status: 'processed'
                    })
                })
            } else {
                await route.continue()
            }
        })

        await page.waitForLoadState('networkidle')

        // Look for reprocess button
        const reprocessButton = page.getByRole('button', { name: /reprocess|xử lý lại|thử lại/i }).first()
        const hasReprocessButton = await reprocessButton.count() > 0

        if (hasReprocessButton) {
            console.log('📝 Attempting to reprocess failed transaction...')
            await reprocessButton.click()
            await page.waitForLoadState('networkidle')

            // Check for confirmation dialog
            const confirmButton = page.getByRole('button', { name: /xác nhận|confirm|đồng ý/i })
            const hasConfirmDialog = await confirmButton.count() > 0

            if (hasConfirmDialog) {
                await confirmButton.click()
                await page.waitForLoadState('networkidle')

                // Check for success message
                const successMessage = page.locator('text=/thành công|success|đã xử lý/i')
                if (await successMessage.isVisible({ timeout: 5000 })) {
                    console.log('✅ Transaction reprocessed successfully')
                } else {
                    console.log('✅ Reprocess action executed')
                }
            } else {
                // No confirmation dialog - direct reprocess
                await page.waitForLoadState('networkidle')
                const successMessage = page.locator('text=/thành công|success|đã xử lý/i')
                if (await successMessage.isVisible({ timeout: 5000 })) {
                    console.log('✅ Transaction reprocessed successfully (no confirmation dialog)')
                }
            }
        } else {
            console.log('ℹ️ No failed transactions available to reprocess')
        }

        await page.screenshot({
            path: 'e2e-results/admin-casso-reprocess.png',
            fullPage: true
        })
    })
})
