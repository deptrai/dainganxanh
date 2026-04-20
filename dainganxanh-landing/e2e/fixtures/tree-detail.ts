/**
 * Tree Detail Navigation Fixtures
 *
 * Shared helpers for the tree-detail-extended spec family (split across
 * map-camera, gallery-timeline, reports).
 */

import { Page } from '@playwright/test'

/** Test order UUID used when Navigate-first fallback is taken. */
export const TEST_ORDER_ID = 'test-order-uuid-123'

/**
 * Navigate to a tree detail page: first try clicking the first order card in
 * My Garden; fall back to a direct URL with TEST_ORDER_ID if no cards render.
 */
export async function navigateToOrderDetail(page: Page): Promise<void> {
    await page.goto('/crm/my-garden')
    await page.waitForLoadState('networkidle')

    const firstOrderCard = page.locator('a[href*="/crm/my-garden/"]').first()
    const isVisible = await firstOrderCard.isVisible({ timeout: 5000 }).catch(() => false)

    if (isVisible) {
        await firstOrderCard.click()
        await page.waitForURL(/crm\/my-garden\/[a-f0-9-]+/, { timeout: 10000 })
    } else {
        await page.goto(`/crm/my-garden/${TEST_ORDER_ID}`)
        await page.waitForLoadState('networkidle')
    }
}
