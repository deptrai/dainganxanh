import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../fixtures/auth'
import { supabase } from '../utils/supabase-admin'

// Day formatting helpers
function toISODate(d: Date) { return d.toISOString().split('T')[0] }
function addDays(d: Date, n: number) { return new Date(d.getTime() + n * 24 * 60 * 60 * 1000) }

test.describe.configure({ mode: 'serial' })

test.describe('[Story 11.8] Admin Room Calendar', () => {
    test.use({ storageState: '.auth/admin.json' })

    test('AC1: Calendar renders lots, rooms, bookings and month navigation', async ({ page }) => {
        await page.goto('/crm/admin/rooms')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        await expect(page.getByRole('heading', { name: /lịch phòng/i })).toBeVisible()

        // Month navigation
        await expect(page.getByRole('button', { name: /tháng trước/i })).toBeVisible()
        await expect(page.getByRole('button', { name: /tháng sau/i })).toBeVisible()

        // Lot section headers
        await expect(page.getByRole('heading', { name: /vườn trầm hương ba vì/i }).first()).toBeVisible()
        await expect(page.getByRole('heading', { name: /vườn dó đen tây nguyên/i }).first()).toBeVisible()
        await expect(page.getByRole('heading', { name: /vườn cây xanh đồng nai/i }).first()).toBeVisible()

        // Room names
        await expect(page.getByText(/phòng deluxe vườn trầm hương ba vì/i).first()).toBeVisible()
        await expect(page.getByText(/phòng vip vườn trầm hương ba vì/i).first()).toBeVisible()

        // Booking bar label: at least code or guest name visible somewhere
        await expect(page.getByText(/BKE2E/i).first()).toBeVisible({ timeout: 10000 })

        // Navigate next month then back
        const currentMonth = await page.locator('h1 + p').first().textContent() ?? ''
        await page.getByRole('button', { name: /tháng sau/i }).click()
        await page.waitForTimeout(1500)
        await page.screenshot({ path: '/tmp/e2e-story11-8/next-month.png', fullPage: true })

        await page.getByRole('button', { name: /tháng trước/i }).click()
        await page.waitForTimeout(1500)
        await expect(page.locator('h1 + p').first()).toContainText(currentMonth.trim() || /.*/)
        await page.screenshot({ path: '/tmp/e2e-story11-8/current-month.png', fullPage: true })
    })

    test('AC2: Block a room for maintenance via calendar', async ({ page }) => {
        await page.goto('/crm/admin/rooms')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        // Open block modal for first room
        const blockBtn = page.locator('button[aria-label*="Khóa phòng"]').first()
        await expect(blockBtn).toBeVisible({ timeout: 10000 })
        await blockBtn.click()

        const modal = page.locator('[role="dialog"]').first()
        await expect(modal).toBeVisible({ timeout: 10000 })

        // Fill inputs — pick dates >30d out to avoid collision with booking seed data
        const today = new Date()
        const start = addDays(today, 60)
        const end = addDays(today, 65)
        const startStr = toISODate(start)
        const endStr = toISODate(end)

        const reason = `E2E-Block-${Date.now()}`
        await modal.locator('#block-start').fill(startStr)
        await modal.locator('#block-end').fill(endStr)
        await modal.locator('#block-reason').fill(reason)

        const submit = modal.getByRole('button', { name: /^khóa phòng$/i }).first()
        await submit.click()

        // Wait for modal to close + calendar re-render
        await expect(modal).not.toBeVisible({ timeout: 15000 })

        // Wait for modal to close and calendar to refresh
        await page.waitForTimeout(2000)
        await page.screenshot({ path: '/tmp/e2e-story11-8/after-block.png', fullPage: true })

        const { data: blocks } = await supabase
            .from('room_blocks')
            .select('*')
            .eq('reason', reason)
            .order('created_at', { ascending: false })
            .limit(1)
        expect(blocks && blocks.length === 1).toBeTruthy()

        // Cleanup
        if (blocks && blocks.length === 1) {
            await supabase.from('room_blocks').delete().eq('id', blocks[0].id)
        }
    })

    test('AC3: Unblock a maintenance block', async ({ page }) => {
        // Pick a room and create a block through DB so we can remove it later
        const { data: room } = await supabase
            .from('rooms')
            .select('id, lot_id')
            .eq('name', 'Phòng Standard Vườn Cây Xanh Đồng Nai')
            .single()

        const today = new Date()
        const start = addDays(today, 70)
        const end = addDays(today, 75)

        const { data: inserted } = await supabase
            .from('room_blocks')
            .insert({
                room_id: room!.id,
                start_date: toISODate(start),
                end_date: toISODate(end),
                reason: 'E2E-Unblock-' + Date.now(),
                status: 'maintenance',
            })
            .select('id')
            .single()

        try {
            await page.goto('/crm/admin/rooms')
            await page.waitForLoadState('networkidle')
            await page.waitForTimeout(1500)

            // Navigate to month containing the block
            const startOfCurrent = new Date(today.getFullYear(), today.getMonth(), 1)
            const startOfBlock = new Date(start.getFullYear(), start.getMonth(), 1)
            const monthDiff = (startOfBlock.getFullYear() - startOfCurrent.getFullYear()) * 12 + (startOfBlock.getMonth() - startOfCurrent.getMonth())
            for (let i = 0; i < monthDiff; i++) {
                await page.getByRole('button', { name: /tháng sau/i }).click()
                await page.waitForTimeout(1500)
            }

            // Accept the confirm dialog automatically
            page.once('dialog', dialog => dialog.accept())

            const blockBar = page.locator(`button[aria-label*="Mở khóa block"]`).first()
            await expect(blockBar).toBeVisible({ timeout: 15000 })
            await blockBar.click()
            await page.waitForTimeout(2000)
            await page.screenshot({ path: '/tmp/e2e-story11-8/after-unblock.png', fullPage: true })

            // Verify removed
            const { data: remaining } = await supabase
                .from('room_blocks')
                .select('id')
                .eq('id', inserted!.id)
            expect(remaining).toHaveLength(0)
        } finally {
            await supabase.from('room_blocks').delete().eq('id', inserted!.id)
        }
    })

    test('AC4: Public garden and booking pages respect maintenance blocks', async ({ page }) => {
        test.setTimeout(120000)
        const { data: room } = await supabase
            .from('rooms')
            .select('id, lot_id')
            .eq('name', 'Phòng Standard Vườn Cây Xanh Đồng Nai')
            .single()

        const today = new Date()
        const checkIn = addDays(today, 50)
        const checkOut = addDays(today, 53)

        const { data: inserted } = await supabase
            .from('room_blocks')
            .insert({
                room_id: room!.id,
                start_date: toISODate(checkIn),
                end_date: toISODate(checkOut),
                reason: 'E2E-Public-' + Date.now(),
                status: 'maintenance',
            })
            .select('id')
            .single()

        try {
            // Garden detail page: fill dates via DateRangePicker inputs and verify blocked state
            await page.goto(`/eco-tourism/${room!.lot_id}`)
            await page.waitForLoadState('networkidle')
            await page.waitForTimeout(1500)

            const roomName = page.getByText(/phòng standard vườn cây xanh đồng nai/i).first()
            await expect(roomName).toBeVisible({ timeout: 10000 })

            // Fill dates via the DateRangePicker inputs
            const checkInInput = page.locator('#check-in')
            const checkOutInput = page.locator('#check-out')
            await expect(checkInInput).toBeVisible({ timeout: 10000 })
            await checkInInput.fill(toISODate(checkIn))
            await checkOutInput.fill(toISODate(checkOut))
            await page.waitForTimeout(1000)

            // Find the room card for Standard room and verify "Đã được đặt" badge appears
            const roomCard = roomName.locator('xpath=ancestor::*[contains(@class, "rounded-2xl")][1]')
            const badge = roomCard.locator('text=/đã được đặt/i').first()
            const badgeCount = await badge.count()
            expect(badgeCount > 0).toBeTruthy()
            await page.screenshot({ path: '/tmp/e2e-story11-8/public-garden-blocked.png', fullPage: true })

            // Booking page: direct URL should render maintenance message
            await page.goto(`/eco-tourism/${room!.lot_id}/book?room_id=${room!.id}&check_in=${toISODate(checkIn)}&check_out=${toISODate(checkOut)}`)
            await page.waitForLoadState('networkidle')
            await page.waitForTimeout(1500)

            await expect(page.getByRole('heading', { name: /phòng đang bảo trì/i })).toBeVisible({ timeout: 15000 })
            await page.screenshot({ path: '/tmp/e2e-story11-8/public-book-blocked.png', fullPage: true })
        } finally {
            await supabase.from('room_blocks').delete().eq('id', inserted!.id)
        }
    })
})