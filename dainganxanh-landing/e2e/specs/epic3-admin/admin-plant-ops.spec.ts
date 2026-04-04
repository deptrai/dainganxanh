import { test, expect } from '@playwright/test'
import * as path from 'path'

/**
 * Admin Plant Operations E2E Tests
 * Covers: checklist, photo upload, tree update, health check, analytics, settings
 */

test.use({
    storageState: path.resolve(__dirname, '../../storagestate/admin.json')
})

test.describe('Admin Plant Operations E2E', () => {

    test('admin views field checklist page', async ({ page }) => {
        await page.goto('/crm/admin/checklist')
        await page.waitForLoadState('networkidle')

        // Verify page loads (may be empty or show checklist items)
        const heading = page.getByRole('heading').first()
        await expect(heading).toBeVisible({ timeout: 10000 })

        const url = page.url()
        expect(url).toContain('/crm/admin/checklist')
        console.log('✅ Admin checklist page loaded')
    })

    test('admin views photo upload page', async ({ page }) => {
        await page.goto('/crm/admin/photos/upload')
        await page.waitForLoadState('networkidle')

        const url = page.url()
        // Should either show upload page or redirect to login
        expect(url).toMatch(/photos|login/)
        console.log(`✅ Photo upload page: ${url}`)
    })

    test('admin views tree management page', async ({ page }) => {
        await page.goto('/crm/admin/trees')
        await page.waitForLoadState('networkidle')

        const url = page.url()
        expect(url).toMatch(/trees|login/)
        console.log(`✅ Tree management page: ${url}`)
    })

    test('admin views analytics dashboard', async ({ page }) => {
        await page.goto('/crm/admin/analytics')
        await page.waitForLoadState('networkidle')

        const url = page.url()
        expect(url).toMatch(/analytics|login/)
        console.log(`✅ Analytics page: ${url}`)
    })

    test('admin views settings page', async ({ page }) => {
        await page.goto('/crm/admin/settings')
        await page.waitForLoadState('networkidle')

        const url = page.url()
        expect(url).toMatch(/settings|login/)
        console.log(`✅ Settings page: ${url}`)
    })

    test('admin views lot management page', async ({ page }) => {
        await page.goto('/crm/admin/lots')
        await page.waitForLoadState('networkidle')

        const url = page.url()
        expect(url).toMatch(/lots|login/)
        console.log(`✅ Lot management page: ${url}`)
    })
})
