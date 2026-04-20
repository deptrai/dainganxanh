import { test, expect } from '@playwright/test'
import { getOTPFromMailpit } from './fixtures/mailpit'
import { loginAtLoginPage } from './fixtures/auth'

/**
 * Referral System E2E Test Suite
 * Tests the referral code sharing and tracking system
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Test user: TEST_USER_EMAIL (env override) (with referral code setup)
 */

test.describe('[P1] Referral System Flow E2E', () => {

    test.afterAll(async ({ browser }) => {
        // Clean up: close all pages and reset browser state
        const contexts = browser.contexts()
        for (const ctx of contexts) {
            await ctx.clearCookies()
            await ctx.clearPermissions()
        }
    })
    const TEST_EMAIL = 'test@test.com'
    /**
     * Test: View referral page with code and stats
     */
    test('view referral page with code and stats', async ({ page }) => {
        // ============================================
        // Phase 1: Login
        // ============================================
        await loginAtLoginPage(page)

        // ============================================
        // Phase 2: Navigate to Referrals page
        // ============================================
        await page.goto('/crm/referrals')
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 3: Verify page header and description
        // ============================================
        await expect(page.getByText(/giới thiệu bạn bè/i)).toBeVisible({ timeout: 10000 })
        // Use first() to avoid strict mode violation since text appears multiple times
        await expect(page.getByText(/chia sẻ link giới thiệu/i).first()).toBeVisible()
        await expect(page.getByText(/hoa hồng 10%/i).first()).toBeVisible()

        // ============================================
        // Phase 4: Verify stats cards are displayed
        // ============================================
        // Stats should show total clicks, conversions, commission, conversion rate
        const statsSection = page.locator('div').filter({ hasText: /tổng.*|lượt.*|hoa hồng/i })
        await expect(statsSection.first()).toBeVisible({ timeout: 10000 })

        // ============================================
        // Phase 5: Verify referral code is displayed
        // ============================================
        await expect(page.locator('main').getByText(/mã giới thiệu/i).first()).toBeVisible()
        await expect(page.locator('main').getByText(/link giới thiệu của bạn/i).first()).toBeVisible()

        // Verify referral code format (should be visible in font-mono)
        const referralCode = page.locator('.font-mono').filter({ hasText: /[A-Z0-9]{6,}/ })
        await expect(referralCode.first()).toBeVisible()

        // ============================================
        // Phase 6: Take screenshot
        // ============================================
        await page.screenshot({
            path: 'e2e-results/referral-system-page.png',
            fullPage: true
        })

        console.log(`✅ Referral page loaded with code and stats`)
    })

    /**
     * Test: Copy referral link functionality
     */
    test('copy referral link to clipboard', async ({ page, context }) => {
        // Grant clipboard permissions
        await context.grantPermissions(['clipboard-read', 'clipboard-write'])

        // Login
        await loginAtLoginPage(page)

        // Navigate to referrals page
        await page.goto('/crm/referrals')
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 1: Find copy button
        // ============================================
        const copyButton = page.getByRole('button', { name: /sao chép|copy/i })
        await expect(copyButton).toBeVisible({ timeout: 10000 })

        // ============================================
        // Phase 2: Click copy button
        // ============================================
        await copyButton.click()

        // Wait a bit for clipboard operation
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 3: Verify success feedback
        // ============================================
        // Check for success icon or text change (either toast or button text change)
        try {
            const successIndicator = page.locator('text=/đã sao chép|copied/i')
            await expect(successIndicator).toBeVisible({ timeout: 5000 })
        } catch {
            // Fallback: Verify clipboard content directly
            const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
            expect(clipboardText).toMatch(/\?ref=/)
            console.log('✅ Verified via clipboard content (no UI feedback found)')
        }

        console.log(`✅ Referral link copied to clipboard`)
    })

    /**
     * Test: View referral QR code
     */
    test('view referral QR code', async ({ page }) => {
        // Login
        await loginAtLoginPage(page)

        // Navigate to referrals page
        await page.goto('/crm/referrals')
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 1: Verify QR code section exists
        // ============================================
        // QR code should be in a canvas or SVG element
        const qrCanvas = page.locator('canvas').or(page.locator('svg[viewBox]'))
        await expect(qrCanvas.first()).toBeVisible({ timeout: 10000 })

        // ============================================
        // Phase 2: Take screenshot with QR code
        // ============================================
        await page.screenshot({
            path: 'e2e-results/referral-qr-code.png',
            fullPage: true
        })

        console.log(`✅ Referral QR code displayed`)
    })

    /**
     * Test: View conversions list (or empty state)
     */
    test('view referral conversions list or empty state', async ({ page }) => {
        // Login
        await loginAtLoginPage(page)

        // Navigate to referrals page
        await page.goto('/crm/referrals')
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 1: Wait for page to fully load
        // ============================================
        await page.waitForLoadState('networkidle')
        // ============================================
        // Phase 2: Check for either conversions table or empty state
        // ============================================
        // Try to find either the table or empty state heading
        const hasTable = await page.locator('table').isVisible().catch(() => false)
        const hasEmptyState = await page.getByText(/chưa có chuyển đổi/i).isVisible().catch(() => false)

        if (hasTable) {
            // ============================================
            // Phase 3A: Verify conversions table structure
            // ============================================
            await expect(page.getByText(/lịch sử chuyển đổi/i)).toBeVisible()
            await expect(page.getByText(/mã đơn/i).first()).toBeVisible()
            await expect(page.getByText(/khách hàng/i).first()).toBeVisible()
            await expect(page.getByText(/giá trị đơn/i)).toBeVisible()
            await expect(page.getByText(/hoa hồng/i).first()).toBeVisible()

            console.log(`✅ Conversions table displayed`)
        } else if (hasEmptyState) {
            // ============================================
            // Phase 3B: Verify empty state
            // ============================================
            await expect(page.getByText(/chưa có chuyển đổi/i)).toBeVisible()

            console.log(`✅ Empty state displayed (no conversions yet)`)
        } else {
            throw new Error('Neither conversions table nor empty state found')
        }
    })

    /**
     * Test: No console errors on referrals page
     */
    test('no console errors on referrals page', async ({ page }) => {
        const consoleErrors: string[] = []

        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text())
            }
        })

        // Login
        await loginAtLoginPage(page)

        // Navigate to referrals page
        await page.goto('/crm/referrals')
        await page.waitForLoadState('networkidle')

        // Wait for page to fully render
        await expect(page.getByText(/giới thiệu bạn bè/i)).toBeVisible({ timeout: 10000 })
        await page.waitForLoadState('networkidle')

        // Verify no console errors
        if (consoleErrors.length > 0) {
            console.error('❌ Console errors detected:', consoleErrors)
            throw new Error(`Found ${consoleErrors.length} console errors`)
        }

        console.log(`✅ No console errors detected`)
    })
})
