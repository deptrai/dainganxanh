import { test, expect } from '@playwright/test'
import { loginAsUser } from './fixtures/auth'

/**
 * Harvest Decision Flow E2E Test Suite
 * Tests the tree harvest decision flow with 3 options: sell back, keep growing, receive product
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Test user: TEST_USER_EMAIL (env override) (with existing orders)
 */

test.describe('[P1] Harvest Decision Flow E2E', () => {

    /**
     * Test: View harvest options (3 choices)
     */
    test('view all three harvest options', async ({ page }) => {
        // Login
        await loginAsUser(page, '/my-garden')

        // Get first order
        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        const firstOrderCard = page.locator('a[href*="/crm/my-garden/"]').first()
        await expect(firstOrderCard).toBeVisible({ timeout: 10000 })

        const href = await firstOrderCard.getAttribute('href')
        const orderId = href?.split('/').pop()

        // Navigate to harvest page
        await page.goto(`/crm/my-garden/${orderId}/harvest`)
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 1: Verify Option 1 - Sell Back
        // ============================================
        await expect(page.getByRole('heading', { name: /bán lại cho đại ngàn xanh/i })).toBeVisible({ timeout: 10000 })
        await expect(page.getByText(/giá mua lại/i)).toBeVisible()

        // ============================================
        // Phase 2: Verify Option 2 - Keep Growing
        // ============================================
        await expect(page.getByRole('heading', { name: /tiếp tục nuôi cây/i })).toBeVisible()

        // ============================================
        // Phase 3: Verify Option 3 - Receive Product
        // ============================================
        await expect(page.getByRole('heading', { name: /nhận sản phẩm/i })).toBeVisible()

        console.log(`✅ All 3 harvest options visible`)
    })

    /**
     * Test: Navigate back from harvest page
     */
    test('navigate back to order detail from harvest page', async ({ page }) => {
        // Login
        await loginAsUser(page, '/my-garden')

        // Get first order
        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        const firstOrderCard = page.locator('a[href*="/crm/my-garden/"]').first()
        await expect(firstOrderCard).toBeVisible({ timeout: 10000 })

        const href = await firstOrderCard.getAttribute('href')
        const orderId = href?.split('/').pop()

        // Navigate to harvest page
        await page.goto(`/crm/my-garden/${orderId}/harvest`)
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 1: Click back button
        // ============================================
        const backButton = page.getByRole('link', { name: /quay lại/i })
        await expect(backButton).toBeVisible({ timeout: 10000 })
        await backButton.click()

        // ============================================
        // Phase 2: Verify redirected to order detail page
        // ============================================
        await page.waitForURL(/crm\/my-garden\/[a-f0-9-]+$/, { timeout: 10000 })

        // Verify we're on order detail page (not harvest page)
        await expect(page).not.toHaveURL(/\/harvest$/)

        console.log(`✅ Back navigation works`)
    })

    /**
     * Test: No console errors on harvest page
     */
    test('no console errors on harvest page', async ({ page }) => {
        const consoleErrors: string[] = []

        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text()
                if (text.includes('Failed to load resource') || text.includes('404') || text.includes('406')) return
                consoleErrors.push(text)
            }
        })

        // Login
        await loginAsUser(page, '/my-garden')

        // Get first order
        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        const firstOrderCard = page.locator('a[href*="/crm/my-garden/"]').first()
        await expect(firstOrderCard).toBeVisible({ timeout: 10000 })

        const href = await firstOrderCard.getAttribute('href')
        const orderId = href?.split('/').pop()

        // Navigate to harvest page
        await page.goto(`/crm/my-garden/${orderId}/harvest`)
        await page.waitForLoadState('networkidle')

        // Wait for page to fully render
        await expect(page.getByText(/cây sẵn sàng thu hoạch/i)).toBeVisible({ timeout: 10000 })
        await page.waitForLoadState('networkidle')

        // Verify no console errors
        if (consoleErrors.length > 0) {
            console.error('❌ Console errors detected:', consoleErrors)
            throw new Error(`Found ${consoleErrors.length} console errors`)
        }

        console.log(`✅ No console errors detected`)
    })
})
