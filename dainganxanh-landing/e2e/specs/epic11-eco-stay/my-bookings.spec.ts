import { test, expect } from '@playwright/test'
import { loginAsUser } from '../../fixtures/auth'

test.describe('[Story 11.6] View My Bookings CRM', () => {
    test.use({ storageState: '.auth/user.json' })

    test('displays booking list and navigates to detail', async ({ page }) => {
        await page.goto('/crm/my-bookings')
        await page.waitForLoadState('networkidle')

        await expect(page).toHaveURL(/crm\/my-bookings/)
        await expect(page.getByRole('heading', { name: /lịch sử đặt phòng/i })).toBeVisible()

        const table = page.locator('table')
        await expect(table).toBeVisible()

        for (const header of ['Mã đặt phòng', 'Phòng', 'Khu vườn', 'Nhận phòng', 'Trả phòng', 'Trạng thái', 'Tổng tiền']) {
            await expect(table.getByRole('columnheader', { name: header, exact: true })).toBeVisible()
        }

        const firstBookingLink = table.locator('tbody tr:first-child a').first()
        await expect(firstBookingLink).toBeVisible()
        const code = (await firstBookingLink.textContent() || '').trim()
        await firstBookingLink.click()

        await page.waitForURL(/crm\/my-bookings\/.+/)
        await expect(page.getByText(code)).toBeVisible()
        await expect(page.getByRole('link', { name: /quay lại danh sách/i })).toBeVisible()
        await expect(page.locator('text=/Thông tin phòng & nghỉ dưỡng|Thông tin khách & thanh toán/i').first()).toBeVisible()
    })

    test('empty state links back to eco-tourism', async ({ page, context }) => {
        const noBookingContext = await context.browser()?.newContext({ storageState: undefined })
        if (!noBookingContext) throw new Error('Could not create isolated context')
        const noBookingPage = await noBookingContext.newPage()

        await loginAsUser(noBookingPage, '/crm/my-bookings', { otpDigits: 6 })

        const emptyStateText = noBookingPage.getByText(/bạn chưa có đặt phòng nào/i)
        if (await emptyStateText.isVisible()) {
            const exploreLink = noBookingPage.getByRole('link', { name: /khám phá vườn nghỉ dưỡng/i })
            await expect(exploreLink).toBeVisible()
            await expect(exploreLink).toHaveAttribute('href', '/eco-tourism')
            await exploreLink.click()
            await expect(noBookingPage).toHaveURL(/\/eco-tourism/)
        }
        await noBookingContext.close()
    })

    test('pagination drops cancelled param on page change', async ({ page }) => {
        await page.goto('/crm/my-bookings?cancelled=1&page=1')
        await page.waitForLoadState('networkidle')

        await expect(page.getByText(/đã hủy đặt phòng thành công/i)).toBeVisible()

        const nextBtn = page.getByRole('button', { name: /trang sau|sau/i })
        if (await nextBtn.isEnabled()) {
            await nextBtn.click()
            await page.waitForLoadState('networkidle')
            await expect(page).toHaveURL(/page=2/)
            await expect(page).not.toHaveURL(/cancelled=1/)
        }
    })

    test('confirmed booking detail shows check-in instructions', async ({ page }) => {
        await page.goto('/crm/my-bookings')
        await page.waitForLoadState('networkidle')

        const confirmedRow = page.locator('tbody tr:has-text("Đã xác nhận")').first()
        if (await confirmedRow.isVisible()) {
            await confirmedRow.click()
            await page.waitForURL(/crm\/my-bookings\/.+/)
            await expect(page.getByText(/hướng dẫn nhận phòng/i)).toBeVisible({ timeout: 10000 })
        }
    })

    test('no console errors on my bookings pages', async ({ page }) => {
        const consoleErrors: string[] = []
        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text()
                if (text.includes('Failed to load resource') || text.includes('404') || text.includes('406')) return
                consoleErrors.push(text)
            }
        })

        await page.goto('/crm/my-bookings')
        await page.waitForLoadState('networkidle')

        const firstLink = page.locator('table tbody tr:first-child a').first()
        if (await firstLink.isVisible()) {
            await firstLink.click()
            await page.waitForURL(/crm\/my-bookings\/.+/)
            await page.waitForLoadState('networkidle')
        }

        expect(consoleErrors).toHaveLength(0)
    })
})
