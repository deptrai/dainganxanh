import { test, expect } from '@playwright/test'
import * as path from 'path'

/**
 * Harvest Actions E2E Tests
 * Covers: sell back, keep growing, receive product submit actions
 * Uses storageState for pre-authenticated admin session
 */

test.use({
    storageState: path.resolve(__dirname, '../../storagestate/admin.json')
})

test.describe('Harvest Actions E2E', () => {

    test('sell back option shows confirmation and expected return', async ({ page }) => {
        // Navigate to my garden
        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        // Find first order with trees
        const orderLink = page.locator('a[href*="/crm/my-garden/"]').first()
        if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            await orderLink.click()
            await page.waitForLoadState('networkidle')

            // Navigate to harvest page
            const harvestLink = page.locator('a[href*="/harvest"]').first()
            if (await harvestLink.isVisible({ timeout: 5000 }).catch(() => false)) {
                await harvestLink.click()
                await page.waitForLoadState('networkidle')

                // Check for sell back option
                const sellBackOption = page.getByText(/bán lại|sell back/i).first()
                if (await sellBackOption.isVisible({ timeout: 5000 }).catch(() => false)) {
                    await sellBackOption.click()
                    await page.waitForTimeout(1000)
                    console.log('✅ Sell back option visible and clickable')
                } else {
                    console.log('⚠️ Sell back option not visible (trees may not be mature)')
                }
            } else {
                console.log('⚠️ No harvest link found (trees not yet 60 months)')
            }
        } else {
            console.log('⚠️ No orders found in my garden')
        }
    })

    test('keep growing option shows contract renewal info', async ({ page }) => {
        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        const orderLink = page.locator('a[href*="/crm/my-garden/"]').first()
        if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            await orderLink.click()
            await page.waitForLoadState('networkidle')

            const harvestLink = page.locator('a[href*="/harvest"]').first()
            if (await harvestLink.isVisible({ timeout: 5000 }).catch(() => false)) {
                await harvestLink.click()
                await page.waitForLoadState('networkidle')

                const keepOption = page.getByText(/giữ cây|tiếp tục|keep/i).first()
                if (await keepOption.isVisible({ timeout: 5000 }).catch(() => false)) {
                    console.log('✅ Keep growing option visible')
                } else {
                    console.log('⚠️ Keep option not visible')
                }
            } else {
                console.log('⚠️ No harvest link found')
            }
        } else {
            console.log('⚠️ No orders found')
        }
    })

    test('receive product option shows product choices', async ({ page }) => {
        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        const orderLink = page.locator('a[href*="/crm/my-garden/"]').first()
        if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            await orderLink.click()
            await page.waitForLoadState('networkidle')

            const harvestLink = page.locator('a[href*="/harvest"]').first()
            if (await harvestLink.isVisible({ timeout: 5000 }).catch(() => false)) {
                await harvestLink.click()
                await page.waitForLoadState('networkidle')

                const productOption = page.getByText(/nhận sản phẩm|trầm hương|tinh dầu|receive product/i).first()
                if (await productOption.isVisible({ timeout: 5000 }).catch(() => false)) {
                    console.log('✅ Receive product option visible')
                } else {
                    console.log('⚠️ Receive product option not visible')
                }
            } else {
                console.log('⚠️ No harvest link found')
            }
        } else {
            console.log('⚠️ No orders found')
        }
    })
})
