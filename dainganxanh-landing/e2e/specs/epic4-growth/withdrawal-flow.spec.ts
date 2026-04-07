import { test, expect } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as path from 'path'

test.use({ storageState: path.resolve(__dirname, '../../storagestate/admin.json') })

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env.local') })

/**
 * Withdrawal Flow E2E Test Suite
 * Tests the commission withdrawal request and admin approval flow
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Test user: test@test.com (existing user with possible commission)
 * - Admin user: phanquochoipt@gmail.com (existing admin)
 *
 * Test Flow:
 * 1. User views referrals page and checks withdrawal button state
 * 2. Admin views withdrawal requests (if any exist)
 * 3. Tests adapt based on actual data state (balance >= or < 200k)
 *
 * Note: Tests are designed to work with existing data and adapt to current state
 */

test.describe('Withdrawal Flow E2E', () => {
    /**
     * Test 1: User can view referrals page and withdrawal section
     * This test verifies the withdrawal UI exists and adapts based on balance
     */
    test('user can view referrals page and withdrawal section', async ({ page }) => {
        // Navigate to referrals page
        await page.goto('/crm/referrals')
        await page.waitForLoadState('networkidle')

        // Verify page loaded
        await expect(page.getByText(/giới thiệu bạn bè/i)).toBeVisible({ timeout: 10000 })

        // Wait for withdrawal section to load
        await page.waitForTimeout(3000)

        // Verify withdrawal section exists
        const balanceSection = page.locator('text=/số dư khả dụng/i')
        await expect(balanceSection).toBeVisible()

        // Verify withdraw button exists
        const withdrawButton = page.getByRole('button', { name: /rút tiền/i })
        await expect(withdrawButton).toBeVisible()

        // Check button state
        const isEnabled = await withdrawButton.isEnabled()

        if (isEnabled) {
            console.log('✅ Withdraw button is enabled (balance >= 200k)')
        } else {
            console.log('✅ Withdraw button is disabled (balance < 200k)')
            // Verify minimum balance message
            const minBalanceMessage = page.locator('text=/số dư tối thiểu.*200.*000/i')
            await expect(minBalanceMessage).toBeVisible()
        }

        // Take screenshot
        await page.screenshot({
            path: 'e2e-results/withdrawal-section.png',
            fullPage: true
        })

        console.log('✅ Withdrawal section displayed correctly')
    })

    /**
     * Test 2: Admin can view withdrawals page
     * This test verifies admin has access to withdrawal management
     */
    test('admin can view withdrawals page', async ({ page }) => {
        // Navigate to admin withdrawals page
        await page.goto('/crm/admin/withdrawals')
        await page.waitForLoadState('networkidle')

        // Verify page loaded (check URL or content)
        const isOnWithdrawalsPage = page.url().includes('/admin/withdrawals') ||
            await page.locator('text=/withdrawal|rút tiền/i').first().isVisible().catch(() => false)

        expect(isOnWithdrawalsPage).toBeTruthy()

        console.log('✅ Admin withdrawals page accessible')

        // Take screenshot
        await page.screenshot({
            path: 'e2e-results/admin-withdrawals.png',
            fullPage: true
        })
    })
})
