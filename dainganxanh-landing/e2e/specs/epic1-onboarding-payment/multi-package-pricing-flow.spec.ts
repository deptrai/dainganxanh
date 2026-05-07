import { test, expect } from '@playwright/test'
import { loginAsUser } from '../../fixtures/auth'

/**
 * Multi-Package Pricing & Purchase Flow E2E Test Suite
 *
 * Covers:
 *   1. Pricing page — 2 cards (260k standard + 410k insurance) layout & content
 *   2. Standard package full flow: pricing → quantity → checkout → order created
 *   3. Insurance package full flow: pricing → quantity → checkout → order created
 *   4. URL parameter threading (&package=) through the entire funnel
 *   5. Cancel flow preserves package context
 *
 * Prerequisites:
 * - Dev server at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - storagestate/user.json populated (run auth.setup.ts first)
 */

test.describe('[P0] Multi-Package Pricing & Purchase Flow', () => {

    // ============================================
    // Pricing Page — 2 Cards
    // ============================================

    test.describe('Pricing Page — 2 gói side-by-side', () => {

        test.beforeEach(async ({ page }) => {
            await page.goto('/pricing')
            await page.waitForLoadState('networkidle')
        })

        test('[P0] hiển thị đủ 2 gói: standard 260k và insurance 410k', async ({ page }) => {
            // Standard card
            await expect(page.getByText(/gói cá nhân/i)).toBeVisible({ timeout: 10000 })
            await expect(page.getByText(/260\.000/)).toBeVisible()

            // Insurance card
            await expect(page.getByText(/gói có bảo hiểm/i)).toBeVisible()
            await expect(page.getByText(/410\.000/)).toBeVisible()

            console.log('[P0] Both pricing cards visible')
        })

        test('[P0] insurance card có badge "Kèm Bảo Hiểm"', async ({ page }) => {
            await expect(page.getByText(/kèm bảo hiểm/i)).toBeVisible({ timeout: 10000 })
        })

        test('[P0] insurance card hiển thị breakdown bảo hiểm 150k', async ({ page }) => {
            await expect(page.getByText(/bảo hiểm cam kết bao tiêu/i).first()).toBeVisible({ timeout: 10000 })
            await expect(page.getByText(/150\.000/)).toBeVisible()
            await expect(page.getByText(/2\.500.*tháng/i)).toBeVisible()
            await expect(page.getByText(/325\.000/)).toBeVisible()
        })

        test('[P1] insurance card hiển thị 6 features (thêm 2 so với standard)', async ({ page }) => {
            await expect(page.getByText(/bảo hiểm cam kết bao tiêu 60 tháng/i)).toBeVisible({ timeout: 10000 })
            await expect(page.getByText(/hoàn 325\.000/i)).toBeVisible()
        })

        test('[P1] standard card breakdown: 40k + 194k + 26k = 260k', async ({ page }) => {
            await expect(page.getByText(/40\.000/)).toBeVisible({ timeout: 10000 })
            await expect(page.getByText(/194\.000/)).toBeVisible()
            await expect(page.getByText(/26\.000/)).toBeVisible()
        })

        test('[P0] standard CTA → /quantity?package=standard', async ({ page }) => {
            // Standard card button (emerald) — first button
            const standardBtn = page.getByRole('button', { name: /tùy chỉnh số lượng/i }).first()
            await expect(standardBtn).toBeVisible({ timeout: 10000 })
            await standardBtn.click()

            await expect(page).toHaveURL(/\/quantity.*package=standard/, { timeout: 10000 })
        })

        test('[P0] insurance CTA → /quantity?package=insurance', async ({ page }) => {
            // Insurance card button (amber) — second button
            const insuranceBtn = page.getByRole('button', { name: /tùy chỉnh số lượng/i }).last()
            await expect(insuranceBtn).toBeVisible({ timeout: 10000 })
            await insuranceBtn.click()

            await expect(page).toHaveURL(/\/quantity.*package=insurance/, { timeout: 10000 })
        })
    })

    // ============================================
    // Quantity Page — package param awareness
    // ============================================

    test.describe('Quantity Page — Package Awareness', () => {

        test('[P0] ?package=standard hiển thị tên gói và 260k/cây', async ({ page }) => {
            await page.goto('/quantity?initial=10&package=standard')
            await page.waitForLoadState('networkidle')

            await expect(page.getByText(/gói cá nhân/i)).toBeVisible({ timeout: 10000 })
            // 10 × 260k = 2,600,000
            await expect(page.getByText(/2\.600\.000/)).toBeVisible()
            await expect(page.getByText(/260\.000/)).toBeVisible()
        })

        test('[P0] ?package=insurance hiển thị tên gói và 410k/cây', async ({ page }) => {
            await page.goto('/quantity?initial=10&package=insurance')
            await page.waitForLoadState('networkidle')

            await expect(page.getByText(/gói có bảo hiểm/i)).toBeVisible({ timeout: 10000 })
            // 10 × 410k = 4,100,000
            await expect(page.getByText(/4\.100\.000/)).toBeVisible()
            await expect(page.getByText(/410\.000/)).toBeVisible()
        })

        test('[P1] price updates correctly for insurance when quantity changes', async ({ page }) => {
            await page.goto('/quantity?initial=5&package=insurance')
            await page.waitForLoadState('networkidle')

            // 5 × 410k = 2,050,000
            await expect(page.getByText(/2\.050\.000/)).toBeVisible({ timeout: 10000 })

            // Change to 10
            const btn10 = page.getByRole('button', { name: /^10$/ })
            await btn10.click()

            // 10 × 410k = 4,100,000
            await expect(page.getByText(/4\.100\.000/)).toBeVisible({ timeout: 5000 })
        })

        test('[P0] "Tiếp tục" từ insurance → URL có &package=insurance', async ({ page }) => {
            await page.goto('/quantity?initial=5&package=insurance')
            await page.waitForLoadState('networkidle')

            const continueBtn = page.getByRole('button', { name: /tiếp tục/i })
            await continueBtn.click()

            await page.waitForURL(/\/(register|checkout|login).*package=insurance/, { timeout: 10000 })
            expect(page.url()).toMatch(/package=insurance/)
        })

        test('[P1] back link từ quantity → /pricing', async ({ page }) => {
            await page.goto('/quantity?initial=5&package=insurance')
            await page.waitForLoadState('networkidle')

            const backLink = page.getByRole('link', { name: /quay lại/i })
            await backLink.click()

            await expect(page).toHaveURL(/\/pricing/, { timeout: 10000 })
        })
    })

    // ============================================
    // Register Page — package threading
    // ============================================

    test.describe('Register Page — Package Threading', () => {

        test('[P0] ?package=insurance hiển thị tổng tiền 410k × quantity', async ({ page }) => {
            await page.goto('/register?quantity=5&package=insurance')
            await page.waitForLoadState('networkidle')

            // 5 × 410k = 2,050,000
            await expect(page.getByText(/2\.050\.000/)).toBeVisible({ timeout: 10000 })
        })

        test('[P1] link "Đăng nhập ngay" thread &package=insurance', async ({ page }) => {
            await page.goto('/register?quantity=5&package=insurance')
            await page.waitForLoadState('networkidle')

            const loginLink = page.getByRole('link', { name: /đăng nhập ngay/i })
            const href = await loginLink.getAttribute('href')
            expect(href).toMatch(/package=insurance/)
        })
    })

    // ============================================
    // Checkout — Standard Full Flow (authenticated)
    // ============================================

    test.describe('[P0] Standard Package Checkout Flow (authenticated)', () => {

        test('pricing → quantity → checkout: 5 cây × 260k = 1.300.000đ', async ({ page }) => {
            await loginAsUser(page, '/crm/my-garden')

            // Go to checkout directly with standard package
            await page.goto('/checkout?quantity=5&package=standard')
            await page.waitForLoadState('networkidle')

            // Wait for confirmation step to load
            await expect(page.getByText(/xác nhận đơn hàng/i)).toBeVisible({ timeout: 15000 })

            // Verify pricing
            await expect(page.getByText(/5 cây/i)).toBeVisible()
            await expect(page.getByText(/260\.000/)).toBeVisible()
            await expect(page.getByText(/1\.300\.000/)).toBeVisible()
        })

        test('[P0] "Đặt đơn ngay" tạo pending order với unit_price=260000', async ({ page }) => {
            await loginAsUser(page, '/crm/my-garden')

            await page.goto('/checkout?quantity=3&package=standard')
            await page.waitForLoadState('networkidle')

            await expect(page.getByText(/xác nhận đơn hàng/i)).toBeVisible({ timeout: 15000 })

            // Click confirm
            await page.getByRole('button', { name: /đặt đơn ngay/i }).click()

            // Should show banking info after order created
            await expect(page.getByText(/MB Bank/i).or(page.getByText(/ngân hàng/i))).toBeVisible({ timeout: 15000 })

            // Verify order code generated
            const orderCodeEl = page.locator('span.font-mono').first()
            const orderCode = await orderCodeEl.textContent()
            expect(orderCode).toMatch(/^DH[A-Z0-9]{6}$/i)

            // Verify amount: 3 × 260k = 780,000
            await expect(page.getByText(/780\.000/)).toBeVisible()

            console.log(`[Standard] Order created: ${orderCode}`)
        })
    })

    // ============================================
    // Checkout — Insurance Full Flow (authenticated)
    // ============================================

    test.describe('[P0] Insurance Package Checkout Flow (authenticated)', () => {

        test('pricing → quantity → checkout: 5 cây × 410k = 2.050.000đ', async ({ page }) => {
            await loginAsUser(page, '/crm/my-garden')

            await page.goto('/checkout?quantity=5&package=insurance')
            await page.waitForLoadState('networkidle')

            await expect(page.getByText(/xác nhận đơn hàng/i)).toBeVisible({ timeout: 15000 })

            // Verify insurance pricing
            await expect(page.getByText(/5 cây/i)).toBeVisible()
            await expect(page.getByText(/410\.000/)).toBeVisible()
            await expect(page.getByText(/2\.050\.000/)).toBeVisible()
        })

        test('[P0] "Đặt đơn ngay" tạo pending order với unit_price=410000', async ({ page }) => {
            await loginAsUser(page, '/crm/my-garden')

            await page.goto('/checkout?quantity=2&package=insurance')
            await page.waitForLoadState('networkidle')

            await expect(page.getByText(/xác nhận đơn hàng/i)).toBeVisible({ timeout: 15000 })

            await page.getByRole('button', { name: /đặt đơn ngay/i }).click()

            await expect(page.getByText(/MB Bank/i).or(page.getByText(/ngân hàng/i))).toBeVisible({ timeout: 15000 })

            const orderCodeEl = page.locator('span.font-mono').first()
            const orderCode = await orderCodeEl.textContent()
            expect(orderCode).toMatch(/^DH[A-Z0-9]{6}$/i)

            // Verify amount: 2 × 410k = 820,000
            await expect(page.getByText(/820\.000/)).toBeVisible()

            console.log(`[Insurance] Order created: ${orderCode}`)
        })

        test('[P1] cancel insurance order → redirect về quantity?package=insurance', async ({ page }) => {
            await loginAsUser(page, '/crm/my-garden')

            await page.goto('/checkout?quantity=3&package=insurance')
            await page.waitForLoadState('networkidle')

            await expect(page.getByText(/xác nhận đơn hàng/i)).toBeVisible({ timeout: 15000 })

            // Create order first
            await page.getByRole('button', { name: /đặt đơn ngay/i }).click()
            await expect(page.getByText(/MB Bank/i)).toBeVisible({ timeout: 15000 })

            // Now cancel
            await page.getByRole('button', { name: /hủy đơn hàng/i }).click()
            await page.waitForLoadState('networkidle')

            // Should redirect back to quantity with insurance package
            await expect(page).toHaveURL(/\/(quantity|pricing).*package=insurance/, { timeout: 10000 })
        })
    })

    // ============================================
    // No console errors (regression check)
    // ============================================

    test('[P2] no console errors on insurance pricing flow', async ({ page }) => {
        const consoleErrors: string[] = []

        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text()
                if (!text.includes('Failed to load resource') &&
                    !text.includes('404') && !text.includes('406')) {
                    consoleErrors.push(text)
                }
            }
        })

        await page.goto('/pricing')
        await page.waitForLoadState('networkidle')
        await page.goto('/quantity?initial=5&package=insurance')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1500)

        const critical = consoleErrors.filter(e =>
            !e.includes('406') && !e.includes('Not Acceptable')
        )
        if (critical.length > 0) {
            throw new Error(`Console errors on insurance flow: ${critical.join(', ')}`)
        }
    })
})
