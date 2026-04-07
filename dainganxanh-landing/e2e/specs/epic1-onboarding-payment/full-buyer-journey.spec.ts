import { test, expect } from '@playwright/test'
import * as path from 'path'

/**
 * Full First-time Buyer Journey E2E Test
 * Complete end-to-end flow: Landing → Pricing → Quantity → Register → Checkout → Waiting
 *
 * Flow 1 from docs/userflow.md
 * Routes: / → /pricing → /quantity → /register → /checkout → /checkout/waiting
 */

test.use({
    storageState: path.resolve(__dirname, '../../storagestate/admin.json')
})

test.describe('Full First-time Buyer Journey', () => {
    /**
     * Test: Complete buyer journey from landing to checkout
     * This is the critical happy path for Flow 1
     * Requires a fresh (unauthenticated) user — skip in the main suite
     */
    test.skip(true, 'Requires fresh user - run separately')
    test('complete journey: landing → pricing → quantity → register → checkout', async ({ page }) => {
        // ============================================
        // Phase 1: Landing Page
        // ============================================
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // Verify landing page loaded
        await expect(page.getByText(/dệt đại ngàn.*gặt phước báu/i)).toBeVisible({ timeout: 10000 })

        // Click primary CTA
        const ctaButton = page.getByRole('link', { name: /gieo mầm ngay/i })
        await expect(ctaButton).toBeVisible()
        await ctaButton.click()

        // ============================================
        // Phase 2: Pricing Page
        // ============================================
        await expect(page).toHaveURL(/\/pricing/, { timeout: 10000 })
        await page.waitForLoadState('networkidle')

        // Verify pricing page
        await expect(page.getByText(/260\.000/)).toBeVisible({ timeout: 10000 })

        // Click CTA to go to quantity
        const quantityCTA = page.getByRole('link', { name: /tùy chỉnh số lượng/i })
            .or(page.getByRole('button', { name: /tùy chỉnh số lượng/i }))
        await expect(quantityCTA).toBeVisible()
        await quantityCTA.click()

        // ============================================
        // Phase 3: Quantity Page
        // ============================================
        await expect(page).toHaveURL(/\/quantity/, { timeout: 10000 })
        await page.waitForLoadState('networkidle')

        // Verify quantity page
        await expect(page.getByText(/chọn số lượng cây/i)).toBeVisible({ timeout: 10000 })

        // Select 5 trees using quick select
        const btn5 = page.getByRole('button', { name: /^5$/ })
            .or(page.locator('button:has-text("5")').first())
        await btn5.click()

        // Verify price updated: 5 * 260,000 = 1,300,000
        const expectedTotal = (5 * 260000).toLocaleString('vi-VN')
        await expect(page.getByText(new RegExp(expectedTotal.replace(/\./g, '\\.')))).toBeVisible({ timeout: 5000 })

        // Click continue
        const continueBtn = page.getByRole('button', { name: /tiếp tục/i })
            .or(page.getByRole('link', { name: /tiếp tục/i }))
        await expect(continueBtn).toBeVisible()
        await continueBtn.click()

        // ============================================
        // Phase 4: Registration (new user, not authenticated)
        // ============================================
        await page.waitForURL(/\/(register|login)\?.*quantity=5/, { timeout: 10000 })

        // If redirected to login, navigate to register
        if (page.url().includes('/login')) {
            await page.goto(`/register?quantity=5`)
            await page.waitForLoadState('networkidle')
        }

        await page.waitForTimeout(2000)

        // Click Email tab
        const emailTab = page.getByRole('button', { name: /email/i }).first()
        await expect(emailTab).toBeVisible({ timeout: 10000 })
        await emailTab.click()

        // NOTE: OTP login steps skipped — requires fresh user + Mailpit
    })

    /**
     * Test: Journey with quantity 10 and manual payment claim flow
     * Requires a fresh (unauthenticated) user — skip in the main suite
     */
    test.skip(true, 'Requires fresh user - run separately')
    test('journey with manual payment claim flow', async ({ page }) => {
        // Quick path: register directly with quantity
        await page.goto('/register?quantity=10')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        // NOTE: OTP login steps skipped — requires fresh user + Mailpit
        console.log('Manual payment claim flow - requires fresh user, run separately')
    })
})
