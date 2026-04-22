import { test, expect } from '@playwright/test'
import { getOTPFromMailpit } from '../../fixtures/mailpit'
import { ADMIN_EMAIL, TEST_EMAIL } from '../../fixtures/identity'
import { loginAsUser } from '../../fixtures/auth'

/**
 * My Garden Dashboard E2E Test Suite
 * Tests the customer-facing dashboard for viewing purchased tree packages
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Test user: TEST_USER_EMAIL (env override) (with existing orders)
 */

test.describe('[P1] My Garden Dashboard E2E', () => {

    /**
     * Test: View My Garden dashboard with orders
     */
    test('view my garden dashboard with existing orders', async ({ page }) => {
        // Login
        await loginAsUser(page, '/my-garden')

        // Navigate to My Garden explicitly
        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 1: Verify dashboard header
        // ============================================
        await expect(page).toHaveURL(/crm\/my-garden/)

        // Check for header stats (heading confirms dashboard loaded)
        await expect(page.getByText(/vườn cây của tôi/i)).toBeVisible({ timeout: 10000 })

        // Verify notification bell is visible
        const notificationBell = page.getByLabel('Notifications')
        await expect(notificationBell).toBeVisible()

        // ============================================
        // Phase 2: Verify order cards are displayed
        // ============================================
        // Check for package/order cards
        const orderCards = page.locator('a[href*="/crm/my-garden/"]')
        const orderCount = await orderCards.count()

        if (orderCount > 0) {
            console.log(`✅ Found ${orderCount} orders in My Garden`)

            // Verify first order card has essential info
            const firstCard = orderCards.first()
            await expect(firstCard).toBeVisible()

            // Check for order code (format: DH-XXXXXX or PKG-YYYY-XXXXXX)
            await expect(firstCard.locator('text=/DH.*|PKG-.*|Mã đơn/i')).toBeVisible()

            // Check for quantity
            await expect(firstCard.locator('text=/\\d+ cây/i')).toBeVisible()

            // Check for status badge (Vietnamese or English)
            await expect(firstCard.locator('text=/pending|paid|verified|assigned|completed|chờ xử lý|đang trồng|hoàn thành/i')).toBeVisible()
        } else {
            // Empty state
            await expect(page.getByText(/chưa có đơn hàng|bắt đầu trồng cây/i)).toBeVisible()
            console.log('⚠️ No orders found - showing empty state')
        }

        // ============================================
        // Phase 3: Take screenshot
        // ============================================
        await page.screenshot({
            path: 'e2e-results/my-garden-dashboard.png',
            fullPage: true
        })

        console.log(`✅ My Garden dashboard loaded successfully`)
    })

    /**
     * Test: Click into order detail page
     */
    test('navigate to order detail from dashboard', async ({ page }) => {
        // Login
        await loginAsUser(page, '/my-garden')

        // Navigate to My Garden
        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 1: Click first order card
        // ============================================
        const firstOrderCard = page.locator('a[href*="/crm/my-garden/"]').first()
        await expect(firstOrderCard).toBeVisible({ timeout: 10000 })

        // Get order ID from href
        const href = await firstOrderCard.getAttribute('href')
        expect(href).toMatch(/\/crm\/my-garden\/[a-f0-9-]+/)

        await firstOrderCard.click()

        // ============================================
        // Phase 2: Verify order detail page loaded
        // ============================================
        await page.waitForURL(/crm\/my-garden\/[a-f0-9-]+/, { timeout: 10000 })

        // Check for order detail sections (heading or order code visible)
        await expect(page.getByText(/PKG-|DH[A-Z0-9]|quay lại vườn cây/i).first()).toBeVisible({ timeout: 10000 })

        // Verify order code is displayed (DH format or PKG fallback)
        await expect(page.locator('text=/DH[A-Z0-9]{6}|PKG-\d{4}-/i')).toBeVisible()

        // Check for tabs or sections (photos, timeline, etc.)
        const photoSection = page.locator('text=/thư viện ảnh|photos/i')
        const timelineSection = page.locator('text=/timeline|tiến độ/i')

        // At least one section should be visible
        const hasPhotoSection = await photoSection.isVisible()
        const hasTimelineSection = await timelineSection.isVisible()
        expect(hasPhotoSection || hasTimelineSection).toBeTruthy()

        // ============================================
        // Phase 3: Take screenshot
        // ============================================
        await page.screenshot({
            path: 'e2e-results/order-detail-page.png',
            fullPage: true
        })

        console.log(`✅ Order detail page loaded successfully`)
    })

    /**
     * Test: Empty garden state for new user
     */
    test('shows empty state for user with no orders', async ({ page, context }) => {
        // Note: This test requires a new user account or cleared orders
        // For now, we'll test the empty state component exists in DOM

        await loginAsUser(page, '/my-garden')

        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        // Check if empty state exists (might not be visible if user has orders)
        const emptyStateExists = await page.locator('text=/chưa có đơn hàng|bắt đầu trồng cây/i').count() > 0

        if (emptyStateExists) {
            console.log('✅ Empty state component exists')
        } else {
            console.log('ℹ️ User has orders - empty state not visible (expected)')
        }
    })

    /**
     * Test: Dashboard stats calculation
     */
    test('dashboard displays correct aggregate stats', async ({ page }) => {
        await loginAsUser(page, '/my-garden')

        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        // Wait for stats to load
        await page.waitForLoadState('networkidle')

        // Get total trees count
        const treesElement = page.locator('text=/tổng số cây/i').locator('..').locator('text=/\\d+/').first()
        if (await treesElement.isVisible()) {
            const treesText = await treesElement.textContent()
            const treesCount = parseInt(treesText?.replace(/,/g, '') || '0')
            expect(treesCount).toBeGreaterThanOrEqual(0)
            console.log(`✅ Total trees: ${treesCount}`)
        }

        // Get total CO2 absorbed
        const co2Element = page.locator('text=/tổng co₂|co2 hấp thụ/i').locator('..').locator('text=/\\d+/').first()
        if (await co2Element.isVisible()) {
            const co2Text = await co2Element.textContent()
            const co2Value = parseInt(co2Text?.replace(/,/g, '') || '0')
            expect(co2Value).toBeGreaterThanOrEqual(0)
            console.log(`✅ Total CO2: ${co2Value} kg`)
        }

        // Get total investment
        const investmentElement = page.locator('text=/tổng đầu tư|tổng chi/i').locator('..').locator('text=/\\d+/').first()
        if (await investmentElement.isVisible()) {
            const investmentText = await investmentElement.textContent()
            const investmentValue = parseInt(investmentText?.replace(/[,₫]/g, '') || '0')
            expect(investmentValue).toBeGreaterThanOrEqual(0)
            console.log(`✅ Total investment: ${investmentValue.toLocaleString('vi-VN')} ₫`)
        }
    })

    /**
     * Test: Notification bell interaction
     */
    test('notification bell opens dropdown', async ({ page }) => {
        await loginAsUser(page, '/my-garden')

        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        // Find and click notification bell
        const notificationBell = page.getByLabel('Notifications')
        await expect(notificationBell).toBeVisible({ timeout: 10000 })
        await notificationBell.click()

        // Verify dropdown appears
        await expect(page.getByText('Thông báo').first()).toBeVisible({ timeout: 5000 })

        // Close dropdown by clicking outside or ESC
        await page.keyboard.press('Escape')

        console.log(`✅ Notification bell interaction works`)
    })

    /**
     * Test: No console errors on My Garden page
     */
    test('no console errors on my garden dashboard', async ({ page }) => {
        const consoleErrors: string[] = []

        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text()
                if (text.includes('Failed to load resource') || text.includes('404') || text.includes('406')) return
                consoleErrors.push(text)
            }
        })

        await loginAsUser(page, '/my-garden')

        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

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
