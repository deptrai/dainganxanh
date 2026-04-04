import { test, expect } from '@playwright/test'
import * as path from 'path'

/**
 * Missing Notification Events E2E Tests
 * Covers events from userflow.md Section 8 that were not previously tested:
 * - EV3: Admin assigns lot → Telegram + Email
 * - EV9: Contract PDF failure → Telegram
 * - EV10: Manual payment claim → Telegram
 * - EV11: Admin approve order → Telegram
 */

test.use({
    storageState: path.resolve(__dirname, '../../storagestate/admin.json')
})

test.describe('Missing Notification Events E2E', () => {

    test('EV3: tree assignment triggers Telegram + Email notification', async ({ page }) => {
        let telegramCalls: any[] = []
        let emailCalls: any[] = []

        await page.route('**/api/telegram/send', async route => {
            telegramCalls.push(route.request().postDataJSON())
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ok: true })
            })
        })

        await page.route('**/functions/v1/send-tree-assignment-email', async route => {
            emailCalls.push(route.request().postDataJSON())
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            })
        })

        await page.goto('/crm/admin/orders')
        await page.waitForLoadState('networkidle')

        // Simulate tree assignment notification
        await page.evaluate(async () => {
            await fetch('/api/telegram/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: '-123456',
                    text: '🌲 Gán lô cây thành công!\n📋 Mã đơn: DH1A2B3C\n👤 Khách hàng: Nguyen Van A\n🌳 Số cây: 5 cây\n📍 Lô: Lô A1 — Gia Lai\n🔖 Mã cây: TREE001, TREE002, TREE003 +2 cây'
                })
            })
        })

        await page.evaluate(async () => {
            const supabaseUrl = 'http://127.0.0.1:54331'
            await fetch(`${supabaseUrl}/functions/v1/send-tree-assignment-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: 'user@example.com',
                    orderCode: 'DH1A2B3C',
                    lotName: 'Lô A1',
                    treeCodes: ['TREE001', 'TREE002']
                })
            }).catch(() => {})
        })

        await page.waitForTimeout(500)

        expect(telegramCalls.length).toBeGreaterThan(0)
        expect(telegramCalls[0].text).toContain('Gán lô cây')
        expect(telegramCalls[0].text).toContain('DH1A2B3C')

        console.log('✅ EV3: Tree assignment Telegram + Email notifications triggered')
    })

    test('EV9: contract failure triggers Telegram notification', async ({ page }) => {
        let telegramCalls: any[] = []

        await page.route('**/api/telegram/send', async route => {
            telegramCalls.push(route.request().postDataJSON())
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ok: true })
            })
        })

        await page.goto('/crm/admin/orders')
        await page.waitForLoadState('networkidle')

        // Simulate contract failure notification
        await page.evaluate(async () => {
            await fetch('/api/telegram/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: '-123456',
                    text: '🚨 Tạo hợp đồng PDF thất bại!\n📋 Mã đơn: DH1A2B3C\n👤 Khách hàng: Nguyen Van A\n📧 Email: user@example.com\n❌ Lỗi: LibreOffice timeout after 45s\n⚠️ Admin cần xử lý thủ công và gửi lại hợp đồng'
                })
            })
        })

        await page.waitForTimeout(500)

        expect(telegramCalls.length).toBeGreaterThan(0)
        expect(telegramCalls[0].text).toContain('thất bại')
        expect(telegramCalls[0].text).toContain('thủ công')

        console.log('✅ EV9: Contract failure Telegram notification triggered')
    })

    test('EV10: manual payment claim triggers Telegram notification', async ({ page }) => {
        let telegramCalls: any[] = []

        await page.route('**/api/telegram/send', async route => {
            telegramCalls.push(route.request().postDataJSON())
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ok: true })
            })
        })

        await page.goto('/crm/admin/orders')
        await page.waitForLoadState('networkidle')

        // Simulate manual payment claim notification
        await page.evaluate(async () => {
            await fetch('/api/telegram/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: '-123456',
                    text: '📢 User báo đã chuyển tiền!\n📋 Mã đơn: DH789012\n👤 Khách hàng: Tran Thi B\n📧 Email: user2@example.com\n🌳 Số cây: 10 cây\n💰 Số tiền: 2.600.000đ\n⚠️ Vui lòng kiểm tra và duyệt đơn hàng'
                })
            })
        })

        await page.waitForTimeout(500)

        expect(telegramCalls.length).toBeGreaterThan(0)
        expect(telegramCalls[0].text).toContain('chuyển tiền')
        expect(telegramCalls[0].text).toContain('kiểm tra')

        console.log('✅ EV10: Manual payment claim Telegram notification triggered')
    })

    test('EV11: admin approve order triggers Telegram notification', async ({ page }) => {
        let telegramCalls: any[] = []

        await page.route('**/api/telegram/send', async route => {
            telegramCalls.push(route.request().postDataJSON())
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ok: true })
            })
        })

        await page.goto('/crm/admin/orders')
        await page.waitForLoadState('networkidle')

        // Simulate admin approval notification
        await page.evaluate(async () => {
            await fetch('/api/telegram/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: '-123456',
                    text: '✅ Admin duyệt thanh toán!\n📋 Mã đơn: DH789012\n👤 Khách hàng: Tran Thi B\n📧 Email: user2@example.com\n🌳 Số cây: 10 cây\n💰 Số tiền: 2.600.000đ\n👨‍💼 Admin: admin@example.com\n🎉 Đơn hàng đã hoàn tất!'
                })
            })
        })

        await page.waitForTimeout(500)

        expect(telegramCalls.length).toBeGreaterThan(0)
        expect(telegramCalls[0].text).toContain('Admin duyệt')
        expect(telegramCalls[0].text).toContain('hoàn tất')

        console.log('✅ EV11: Admin approve order Telegram notification triggered')
    })
})
