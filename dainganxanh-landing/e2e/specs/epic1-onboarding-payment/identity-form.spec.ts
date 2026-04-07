import { test, expect } from '@playwright/test'
import * as path from 'path'
import { envConfig } from '../../config/env'

test.use({ storageState: path.resolve(__dirname, '../../storagestate/admin.json') })

/**
 * Identity Form E2E Test Suite
 * Tests the customer identity form displayed after successful purchase
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Test user: phanquochoipt@gmail.com
 */

test.describe('Identity Form E2E', () => {
    /**
     * Test Data: Valid identity data
     */
    const VALID_IDENTITY = {
        full_name: 'Nguyễn Văn Test',
        dob: '1990-01-15',
        nationality: 'Việt Nam',
        id_number: '001234567890',
        id_issue_date: '2020-05-20',
        id_issue_place: 'Cục Cảnh sát QLHC về TTXH',
        address: '123 Đường Test, Phường Test, Quận Test, TP.HCM',
        phone: '0901234567'
    }

    /**
     * Helper: Setup success page with identity form visible
     * Mocks the auto-fill-identity API to return hasIdentity: false
     */
    async function setupSuccessPageWithIdentityForm(page: any, orderCode: string, quantity: number) {
        // Mock auto-fill-identity API — user has no identity data yet
        await page.route('**/api/orders/auto-fill-identity*', async (route: any) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ hasIdentity: false })
            })
        })

        await page.goto(`/checkout/success?orderCode=${orderCode}&quantity=${quantity}`)
        await page.waitForLoadState('networkidle')

        // Wait for motion animation delay (identity form has delay: 2.3s)
        await page.waitForTimeout(3000)
    }

    /**
     * Test 1: User without id_number sees identity form after purchase
     */
    test('user without id_number sees identity form after purchase', async ({ page }) => {
        await setupSuccessPageWithIdentityForm(page, 'DHTEST01', 3)

        // Verify identity form is visible
        await expect(page.getByText('Thông tin để tạo hợp đồng')).toBeVisible({ timeout: 10000 })
        await expect(page.getByText(/điền thông tin cccd/i)).toBeVisible()

        // Verify all form fields are present
        await expect(page.locator('input#full_name')).toBeVisible()
        await expect(page.locator('input#dob')).toBeVisible()
        await expect(page.locator('input#nationality')).toBeVisible()
        await expect(page.locator('input#id_number')).toBeVisible()
        await expect(page.locator('input#id_issue_date')).toBeVisible()
        await expect(page.locator('input#id_issue_place')).toBeVisible()
        await expect(page.locator('textarea#address')).toBeVisible()
        await expect(page.locator('input#phone')).toBeVisible()

        // Verify submit button
        await expect(page.getByRole('button', { name: /tiếp tục/i })).toBeVisible()

        // Verify skip button
        await expect(page.getByText(/bỏ qua, điền sau/i)).toBeVisible()

        console.log('✅ Identity form displayed with all required fields')
    })

    /**
     * Test 2: User fills and submits identity form successfully
     */
    test('user fills and submits identity form successfully', async ({ page }) => {
        // Mock auto-fill-identity — no identity yet
        await page.route('**/api/orders/auto-fill-identity*', async (route: any) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ hasIdentity: false })
            })
        })

        // Mock identity submission API - success response
        await page.route('**/api/orders/identity', async (route: any) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true })
                })
            } else {
                await route.continue()
            }
        })

        // Navigate to success page
        await page.goto('/checkout/success?orderCode=DHTEST02&quantity=5')
        await page.waitForLoadState('networkidle')

        // Wait for animation delays
        await page.waitForTimeout(3000)

        // Wait for form to appear
        await expect(page.getByText('Thông tin để tạo hợp đồng')).toBeVisible({ timeout: 10000 })

        // Fill all fields
        await page.locator('input#full_name').fill(VALID_IDENTITY.full_name)
        await page.locator('input#dob').fill(VALID_IDENTITY.dob)
        await page.locator('input#nationality').fill(VALID_IDENTITY.nationality)
        await page.locator('input#id_number').fill(VALID_IDENTITY.id_number)
        await page.locator('input#id_issue_date').fill(VALID_IDENTITY.id_issue_date)
        await page.locator('input#id_issue_place').fill(VALID_IDENTITY.id_issue_place)
        await page.locator('textarea#address').fill(VALID_IDENTITY.address)
        await page.locator('input#phone').fill(VALID_IDENTITY.phone)

        // Submit form
        await page.getByRole('button', { name: /tiếp tục/i }).click()

        // Verify success message
        await expect(page.getByText('Đã lưu thông tin hợp đồng!')).toBeVisible({ timeout: 10000 })
        await expect(page.getByText(/hợp đồng sẽ được gửi qua email/i)).toBeVisible()

        // Verify form is hidden
        await expect(page.getByText('Thông tin để tạo hợp đồng')).not.toBeVisible()

        console.log('✅ Identity form submitted successfully')
    })

    /**
     * Test 3: Form validation works for required fields
     */
    test('form validation works for required fields', async ({ page }) => {
        await setupSuccessPageWithIdentityForm(page, 'DHTEST03', 2)

        // Wait for form
        await expect(page.getByText('Thông tin để tạo hợp đồng')).toBeVisible({ timeout: 10000 })

        // Test CCCD validation - invalid length
        const idNumberInput = page.locator('input#id_number')
        await idNumberInput.fill('123')
        await idNumberInput.blur()
        await expect(page.getByText(/số cccd phải có 12 chữ số/i)).toBeVisible({ timeout: 5000 })

        // Fix CCCD
        await idNumberInput.fill('001234567890')
        await idNumberInput.blur()
        await expect(page.getByText(/số cccd phải có 12 chữ số/i)).not.toBeVisible()

        // Test phone validation - invalid format
        const phoneInput = page.locator('input#phone')
        await phoneInput.fill('123456')
        await phoneInput.blur()
        await expect(page.getByText(/số điện thoại không hợp lệ/i)).toBeVisible({ timeout: 5000 })

        // Fix phone
        await phoneInput.fill('0901234567')
        await phoneInput.blur()
        await expect(page.getByText(/số điện thoại không hợp lệ/i)).not.toBeVisible()

        // Test required field - try to submit with missing full_name
        await page.locator('input#dob').fill(VALID_IDENTITY.dob)
        await page.locator('input#id_issue_date').fill(VALID_IDENTITY.id_issue_date)
        await page.locator('input#id_issue_place').fill(VALID_IDENTITY.id_issue_place)
        await page.locator('textarea#address').fill(VALID_IDENTITY.address)

        // Submit without full_name
        await page.getByRole('button', { name: /tiếp tục/i }).click()

        // Verify error message
        await expect(page.getByText(/vui lòng nhập họ tên/i)).toBeVisible({ timeout: 5000 })

        console.log('✅ Form validation working correctly')
    })

    /**
     * Test 4: User can skip identity form
     */
    test('user can skip identity form', async ({ page }) => {
        await setupSuccessPageWithIdentityForm(page, 'DHTEST04', 1)

        // Wait for form
        await expect(page.getByText('Thông tin để tạo hợp đồng')).toBeVisible({ timeout: 10000 })

        // Click skip button
        const skipButton = page.getByText(/bỏ qua, điền sau/i)
        await expect(skipButton).toBeVisible()
        await skipButton.click()

        // Verify form is hidden
        await expect(page.getByText('Thông tin để tạo hợp đồng')).not.toBeVisible()

        // Wait for nav buttons animation (delay: 3s)
        await page.waitForTimeout(1500)

        // Verify navigation options are visible
        await expect(page.getByRole('link', { name: /xem vườn cây của tôi/i })).toBeVisible({ timeout: 5000 })
        await expect(page.getByRole('link', { name: /về trang chủ/i })).toBeVisible()

        console.log('✅ Skip identity form works correctly')
    })

    /**
     * Test 5: User with existing id_number skips form
     */
    test('user with existing id_number skips form', async ({ page }) => {
        // Mock auto-fill-identity — user HAS identity data
        await page.route('**/api/orders/auto-fill-identity*', async (route: any) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ hasIdentity: true, autoFilled: true })
            })
        })

        // Navigate to success page
        await page.goto('/checkout/success?orderCode=DHTEST05&quantity=3')
        await page.waitForLoadState('networkidle')

        // Wait for animation delays
        await page.waitForTimeout(3000)

        // Verify identity form is NOT visible
        await expect(page.getByText('Thông tin để tạo hợp đồng')).not.toBeVisible()

        // Verify identity saved confirmation IS visible (autoFilled: true triggers success)
        await expect(page.getByText('Đã lưu thông tin hợp đồng!')).toBeVisible({ timeout: 5000 })

        // Verify order summary is visible
        await expect(page.getByText('Chi tiết đơn hàng')).toBeVisible({ timeout: 10000 })
        await expect(page.getByText('DHTEST05', { exact: true })).toBeVisible()

        // Wait for nav animation (delay: 3s)
        await page.waitForTimeout(1000)

        // Verify navigation options are visible
        await expect(page.getByRole('link', { name: /xem vườn cây của tôi/i })).toBeVisible({ timeout: 5000 })

        console.log('✅ User with existing id_number skips form correctly')
    })

    /**
     * Test 6: No console errors during identity form interaction
     */
    test('no console errors during identity form interaction', async ({ page }) => {
        const consoleErrors: string[] = []

        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text()
                // Filter out expected errors
                if (!text.includes('Failed to load resource') &&
                    !text.includes('404') &&
                    !text.includes('406')) {
                    consoleErrors.push(text)
                }
            }
        })

        await setupSuccessPageWithIdentityForm(page, 'DHTEST06', 2)

        // Wait for form
        await expect(page.getByText('Thông tin để tạo hợp đồng')).toBeVisible({ timeout: 10000 })

        // Interact with form
        await page.locator('input#full_name').fill(VALID_IDENTITY.full_name)
        await page.locator('input#id_number').fill(VALID_IDENTITY.id_number)

        // Wait for any async errors
        await page.waitForTimeout(3000)

        // Filter critical errors
        const criticalErrors = consoleErrors.filter(err =>
            !err.includes('406') && !err.includes('Not Acceptable')
        )

        // Verify no console errors
        if (criticalErrors.length > 0) {
            console.error('❌ Console errors detected:', criticalErrors)
            throw new Error(`Found ${criticalErrors.length} console errors`)
        }

        console.log('✅ No console errors detected')
    })
})
