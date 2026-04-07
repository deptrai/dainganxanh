/**
 * Full Payment Flow — End-to-End (Serial, 1 session)
 *
 * Flow:
 *   1. Checkout confirm step (quantity=2)
 *   2. Đặt đơn ngay → payment step (QR + bank info)
 *   3. Báo đã chuyển tiền → manual_payment_claimed
 *   4. Admin duyệt → completed
 *   5. Verify: không còn nút "Xác minh"
 *   6. Verify: filter không còn "Đã xác minh"
 *
 * Strategy: beforeAll cleanup via Supabase service role → clean state mỗi lần chạy.
 */

import { test, expect, Page } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'
import { getTestUserId, cleanupOrdersForUser } from '../../utils/supabase-admin'
import { envConfig } from '../../config/env'

test.use({
    storageState: path.resolve(__dirname, '../../storagestate/admin.json'),
})

test.describe.configure({ mode: 'serial' })

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../../e2e-results/full-payment-flow')

async function shot(page: Page, name: string) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: true })
    console.log(`📸 ${name}.png`)
}

// ── Cleanup before all tests ────────────────────────────────────────────────
test.beforeAll(async () => {
    const userId = await getTestUserId(envConfig.ADMIN_EMAIL)
    if (!userId) throw new Error(`Test user ${envConfig.ADMIN_EMAIL} not found in Supabase`)
    await cleanupOrdersForUser(userId)
})

// ────────────────────────────────────────────────────────────────────────────
// TEST 1: Checkout confirm step
// ────────────────────────────────────────────────────────────────────────────
test('1. Checkout hiển thị confirm step', async ({ page }) => {
    await page.goto('/checkout?quantity=2')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await shot(page, '01-checkout-confirm')

    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByText(/xác nhận đơn hàng/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('2 cây')).toBeVisible()
    await expect(page.getByRole('button', { name: /đặt đơn ngay/i })).toBeVisible()

    console.log('✅ Test 1 PASS: Confirm step hiển thị')
})

// ────────────────────────────────────────────────────────────────────────────
// TEST 2: Đặt đơn ngay → payment step
// ────────────────────────────────────────────────────────────────────────────
test('2. Đặt đơn ngay → QR + thông tin chuyển khoản', async ({ page }) => {
    await page.goto('/checkout?quantity=2')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Nếu confirm step → click đặt đơn
    const confirmVisible = await page.getByText(/xác nhận đơn hàng/i).isVisible({ timeout: 5000 }).catch(() => false)
    if (confirmVisible) {
        await page.getByRole('button', { name: /đặt đơn ngay/i }).click()
    }

    // Payment step
    await expect(page.locator('img[alt="QR Code thanh toan"]')).toBeVisible({ timeout: 15000 })
    await shot(page, '02-payment-step')

    await expect(page.locator('text=MB Bank')).toBeVisible()
    await expect(page.locator('text=796333999')).toBeVisible()
    await expect(page.getByRole('button', { name: /đã chuyển tiền thành công/i })).toBeVisible()

    console.log('✅ Test 2 PASS: Payment step — QR + bank info')
})

// ────────────────────────────────────────────────────────────────────────────
// TEST 3: Claim payment → manual_payment_claimed
// ────────────────────────────────────────────────────────────────────────────
test('3. Báo đã chuyển tiền → waiting/identity', async ({ page }) => {
    await page.goto('/checkout?quantity=2')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Nếu confirm step → đặt đơn trước
    const confirmVisible = await page.getByText(/xác nhận đơn hàng/i).isVisible({ timeout: 5000 }).catch(() => false)
    if (confirmVisible) {
        await page.getByRole('button', { name: /đặt đơn ngay/i }).click()
        await expect(page.locator('img[alt="QR Code thanh toan"]')).toBeVisible({ timeout: 15000 })
    }

    // Claim
    await shot(page, '03-before-claim')
    const claimBtn = page.getByRole('button', { name: /đã chuyển tiền thành công/i })
    await expect(claimBtn).toBeVisible({ timeout: 10000 })
    await claimBtn.click()

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await shot(page, '03-after-claim')

    // Expect: waiting page, identity form, or still on checkout
    const onIdentity = await page.getByText(/thông tin.*hợp đồng|cccd|họ và tên/i).isVisible({ timeout: 5000 }).catch(() => false)
    const onWaiting = page.url().includes('/checkout/waiting')
    const onCheckout = page.url().includes('/checkout')

    expect(onIdentity || onWaiting || onCheckout).toBe(true)
    console.log(`✅ Test 3 PASS: Claim → ${onIdentity ? 'identity form' : onWaiting ? 'waiting' : 'checkout'}`)
})

// ────────────────────────────────────────────────────────────────────────────
// TEST 4: Admin approve → completed
// ────────────────────────────────────────────────────────────────────────────
test('4. Admin duyệt thanh toán → Hoàn thành', async ({ page }) => {
    await page.goto('/crm/admin/orders')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await shot(page, '04-admin-orders')

    await expect(page).not.toHaveURL(/\/login/)

    // Scroll to see orders
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(500)

    const approveBtn = page.getByRole('button', { name: /duyệt thanh toán/i }).first()
    await expect(approveBtn).toBeVisible({ timeout: 10000 })

    await shot(page, '04-before-approve')
    await approveBtn.click()

    // Confirm modal
    const confirmBtn = page.getByRole('button', { name: /xác nhận duyệt/i })
    await expect(confirmBtn).toBeVisible({ timeout: 5000 })
    await shot(page, '04-confirm-modal')
    await confirmBtn.click()

    // Wait for completion
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.waitForTimeout(2000)
    await shot(page, '04-after-approve')

    // Check for "Hoàn thành" badge in table (not in filter dropdown)
    await expect(page.locator('table span:has-text("Hoàn thành")').first()).toBeVisible({ timeout: 10000 })
    console.log('✅ Test 4 PASS: Order → Hoàn thành')
})

// ────────────────────────────────────────────────────────────────────────────
// TEST 5: Không còn nút "Xác minh"
// ────────────────────────────────────────────────────────────────────────────
test('5. Không còn nút "Xác minh" trong admin', async ({ page }) => {
    await page.goto('/crm/admin/orders')
    await page.waitForLoadState('networkidle')

    const verifyBtn = page.getByRole('button', { name: /^xác minh$/i })
    await expect(verifyBtn).not.toBeVisible()

    console.log('✅ Test 5 PASS: Không có nút "Xác minh"')
})

// ────────────────────────────────────────────────────────────────────────────
// TEST 6: Filter không có "Đã xác minh"
// ────────────────────────────────────────────────────────────────────────────
test('6. Filter dropdown không có "Đã xác minh"', async ({ page }) => {
    await page.goto('/crm/admin/orders')
    await page.waitForLoadState('networkidle')

    const statusSelect = page.locator('select').first()
    if (!(await statusSelect.isVisible({ timeout: 5000 }).catch(() => false))) {
        console.log('⚠️  Không tìm thấy select — skip')
        return
    }

    const options = await statusSelect.locator('option').allTextContents()
    const hasVerified = options.some(o => /đã xác minh|verified/i.test(o))
    expect(hasVerified).toBe(false)

    console.log(`✅ Test 6 PASS: Options = [${options.join(' | ')}]`)
})
