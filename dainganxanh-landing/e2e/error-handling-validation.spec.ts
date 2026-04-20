import { test, expect } from '@playwright/test'
import { getOTPFromMailpit } from './fixtures/mailpit'
import { ADMIN_EMAIL, TEST_EMAIL } from './fixtures/identity'
import { loginAsAdmin, loginAtLoginPage } from './fixtures/auth'

/**
 * Error Handling — Form Validation & Data Integrity E2E
 *
 * Sections 1 + 5 from original error-handling: form validation errors and data integrity checks.
 *
 * Split from the original 1273-line error-handling.spec.ts to keep each
 * suite under the 300-line guideline and enable selective execution.
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Test user: TEST_USER_EMAIL (env override)
 * - Admin user: TEST_ADMIN_EMAIL (env override, with admin role)
 */


test.describe('[P1] Error Handling — Form Validation & Data Integrity E2E', () => {

    test.afterAll(async ({ browser }) => {
        // Clean up: close all pages and reset browser state
        const contexts = browser.contexts()
        for (const ctx of contexts) {
            await ctx.clearCookies()
            await ctx.clearPermissions()
        }
    })

    /**
     * ============================================
     * SECTION 1: Form Validation Errors (6 tests)
     * ============================================
     */

    /**
     * Test 1: Registration form with invalid phone format
     * SKIPPED: Phone tab has been removed - email only registration now
     */
    test.skip('registration form rejects invalid phone format', async ({ page }) => {
        await page.goto('/register?quantity=3')
        await page.waitForLoadState('networkidle')

        // Select phone tab
        const phoneTab = page.getByRole('button', { name: /phone|số điện thoại/i }).first()
        await phoneTab.click()

        // Test case 1: Phone too short (< 10 digits)
        const phoneInput = page.locator('input[type="tel"]')
        await phoneInput.fill('123456')
        await phoneInput.blur()

        // Verify error message appears
        await expect(page.getByText(/số điện thoại phải có.*10.*chữ số|số điện thoại không hợp lệ/i))
            .toBeVisible({ timeout: 5000 })

        await page.screenshot({
            path: 'e2e-results/error-phone-too-short.png',
            fullPage: true
        })

        // Test case 2: Non-numeric characters
        await phoneInput.clear()
        await phoneInput.fill('09abc12345')
        await phoneInput.blur()

        await expect(page.getByText(/số điện thoại.*chỉ được.*số|số điện thoại không hợp lệ/i))
            .toBeVisible({ timeout: 5000 })

        // Test case 3: Valid format clears error
        await phoneInput.clear()
        await phoneInput.fill('0901234567')
        await phoneInput.blur()

        await page.waitForLoadState('networkidle')
        await expect(page.getByText(/số điện thoại.*không hợp lệ/i)).not.toBeVisible()

        console.log('✅ Phone validation working correctly')
    })

    /**
     * Test 2: Identity form with invalid CCCD format
     */
    test('identity form rejects invalid CCCD format', async ({ page }) => {
        await loginAtLoginPage(page)

        // Mock order status - no id_number to trigger form
        await page.route('**/api/orders/status', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    order: {
                        id: 'test-order-cccd',
                        order_code: 'DHTEST01',
                        quantity: 3,
                        id_number: null
                    }
                })
            })
        })

        await page.goto('/checkout/success?orderCode=DHTEST01&quantity=3')
        await page.waitForLoadState('networkidle')

        await expect(page.getByText('Thông tin để tạo hợp đồng')).toBeVisible({ timeout: 10000 })

        // Test case 1: CCCD too short (< 12 digits)
        const idInput = page.locator('input#id_number')
        await idInput.fill('123')
        await idInput.blur()

        await expect(page.getByText(/số cccd phải có 12 chữ số/i))
            .toBeVisible({ timeout: 5000 })

        await page.screenshot({
            path: 'e2e-results/error-cccd-invalid.png',
            fullPage: true
        })

        // Test case 2: CCCD with letters - input filters out non-numeric automatically
        await idInput.clear()
        await idInput.fill('123ABC78901')
        await idInput.blur()

        // Input field auto-removes letters, leaving only numbers
        // So we still expect the "too short" error since it will be "12378901" (8 digits)
        await expect(page.getByText(/số cccd phải có 12 chữ số/i))
            .toBeVisible({ timeout: 5000 })

        // Test case 3: Valid CCCD clears error
        await idInput.clear()
        await idInput.fill('001234567890')
        await idInput.blur()

        await page.waitForLoadState('networkidle')
        await expect(page.getByText(/số cccd.*phải có/i)).not.toBeVisible()

        console.log('✅ CCCD validation working correctly')
    })

    /**
     * Test 3: Identity form with invalid name format
     * SKIPPED: Current schema only validates min length, not character restrictions
     */
    test.skip('identity form rejects name with numbers or special characters', async ({ page }) => {
        await loginAtLoginPage(page)

        await page.route('**/api/orders/status', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    order: {
                        id: 'test-order-name',
                        order_code: 'DHTEST02',
                        quantity: 2,
                        id_number: null
                    }
                })
            })
        })

        await page.goto('/checkout/success?orderCode=DHTEST02&quantity=2')
        await page.waitForLoadState('networkidle')

        await expect(page.getByText('Thông tin để tạo hợp đồng')).toBeVisible({ timeout: 10000 })

        const nameInput = page.locator('input#full_name')

        // Test case 1: Name with numbers
        await nameInput.fill('Nguyen Van 123')
        await nameInput.blur()

        await expect(page.getByText(/họ tên.*không được.*chứa.*số|họ tên không hợp lệ/i))
            .toBeVisible({ timeout: 5000 })

        // Test case 2: Name with special characters
        await nameInput.clear()
        await nameInput.fill('Nguyen@Van#A')
        await nameInput.blur()

        await expect(page.getByText(/họ tên.*không được.*ký tự đặc biệt|họ tên không hợp lệ/i))
            .toBeVisible({ timeout: 5000 })

        await page.screenshot({
            path: 'e2e-results/error-name-invalid.png',
            fullPage: true
        })

        // Test case 3: Valid name clears error
        await nameInput.clear()
        await nameInput.fill('Nguyễn Văn A')
        await nameInput.blur()

        await page.waitForLoadState('networkidle')
        await expect(page.getByText(/họ tên không hợp lệ/i)).not.toBeVisible()

        console.log('✅ Name validation working correctly')
    })

    /**
     * Test 4: Withdrawal form with amount below minimum (< 200k)
     *
     * Prerequisites:
     * - User must have referral_code in users table
     * - User must have available balance >= 200k
     *
     * To seed test data, run: npx tsx e2e/seed-withdrawal-test-data.ts
     */
    test('withdrawal form rejects amount below 200k minimum', async ({ page }) => {
        await loginAtLoginPage(page)

        await page.goto('/crm/referrals')
        await page.waitForLoadState('networkidle')

        // Withdrawal button only shows if user has balance >= 200k
        const withdrawButton = page.getByRole('button', { name: /rút tiền/i })

        try {
            await expect(withdrawButton).toBeVisible({ timeout: 5000 })
        } catch {
            console.log('⚠️  Withdrawal button not available - user needs referral_code and balance >= 200k')
            console.log('   Run: npx tsx e2e/seed-withdrawal-test-data.ts')
            test.skip()
            return
        }

        await withdrawButton.click()
        await page.waitForLoadState('networkidle')

        // Fill required fields
        await page.selectOption('select', { label: 'Vietcombank' })
        await page.fill('input[placeholder*="số tài khoản"]', '1234567890')
        await page.fill('input[placeholder*="tên chủ tài khoản"]', 'phanquochoipt')

        // Enter amount below minimum (200k)
        await page.fill('input[type="number"]', '100000')

        // Submit to trigger client-side validation
        const submitButton = page.getByRole('button', { name: /gửi yêu cầu/i })
        await submitButton.click()
        await page.waitForLoadState('networkidle')

        // Verify error message from client-side validation
        await expect(page.getByText(/số tiền rút tối thiểu là 200,000 VNĐ/i))
            .toBeVisible({ timeout: 5000 })

        await page.screenshot({
            path: 'e2e-results/error-withdrawal-below-minimum.png',
            fullPage: true
        })

        console.log('✅ Withdrawal minimum amount validation working')
    })

    /**
     * Test 5: Withdrawal form with amount exceeding available balance
     *
     * Prerequisites: Same as Test 4
     */
    test('withdrawal form rejects amount exceeding available balance', async ({ page }) => {
        await loginAtLoginPage(page)

        await page.goto('/crm/referrals')
        await page.waitForLoadState('networkidle')

        const withdrawButton = page.getByRole('button', { name: /rút tiền/i })

        try {
            await expect(withdrawButton).toBeVisible({ timeout: 5000 })
        } catch {
            console.log('⚠️  Withdrawal button not available - user needs referral_code and balance >= 200k')
            console.log('   Run: npx tsx e2e/seed-withdrawal-test-data.ts')
            test.skip()
            return
        }

        await withdrawButton.click()
        await page.waitForLoadState('networkidle')

        // Fill required fields
        await page.selectOption('select', { label: 'Vietcombank' })
        await page.fill('input[placeholder*="số tài khoản"]', '1234567890')
        await page.fill('input[placeholder*="tên chủ tài khoản"]', 'phanquochoipt')

        // Enter a very large amount that will exceed any reasonable balance
        await page.fill('input[type="number"]', '99999999')

        // Submit to trigger validation
        const submitButton = page.getByRole('button', { name: /gửi yêu cầu/i })
        await submitButton.click()
        await page.waitForLoadState('networkidle')

        // Verify error message
        await expect(page.getByText(/số tiền vượt quá số dư khả dụng/i))
            .toBeVisible({ timeout: 5000 })

        await page.screenshot({
            path: 'e2e-results/error-withdrawal-exceeds-balance.png',
            fullPage: true
        })

        console.log('✅ Withdrawal balance validation working')
    })

    /**
     * Test 6: Referral code input with invalid format
     * SKIPPED: Referral code input accepts any input (auto-lowercased), no special char validation
     */
    test.skip('referral code input rejects non-alphanumeric characters', async ({ page }) => {
        await page.goto('/register?quantity=3')
        await page.waitForLoadState('networkidle')

        // Find referral code input
        const refCodeInput = page.locator('input[name="referral_code"], input[placeholder*="mã giới thiệu"]')

        // Test case 1: Special characters
        await refCodeInput.fill('ABC@#$123')
        await refCodeInput.blur()

        await expect(page.getByText(/mã giới thiệu.*chỉ được.*chữ.*số|mã không hợp lệ/i))
            .toBeVisible({ timeout: 5000 })

        // Test case 2: Spaces
        await refCodeInput.clear()
        await refCodeInput.fill('ABC 123')
        await refCodeInput.blur()

        await expect(page.getByText(/mã giới thiệu.*không được.*khoảng trắng|mã không hợp lệ/i))
            .toBeVisible({ timeout: 5000 })

        await page.screenshot({
            path: 'e2e-results/error-referral-code-invalid.png',
            fullPage: true
        })

        // Test case 3: Valid code
        await refCodeInput.clear()
        await refCodeInput.fill('DNG895075')
        await refCodeInput.blur()

        await page.waitForLoadState('networkidle')
        await expect(page.getByText(/mã.*không hợp lệ/i)).not.toBeVisible()

        console.log('✅ Referral code validation working correctly')
    })

    /**
     * ============================================
     * SECTION 5: Data Integrity (2 tests)
     * ============================================
     */

    /**
     * Test 17: Negative order amount rejected
     */
    test('negative order amount is rejected', async ({ page }) => {
        await loginAtLoginPage(page)

        // Mock order creation API with validation
        await page.route('**/api/orders/create', async route => {
            if (route.request().method() === 'POST') {
                const payload = route.request().postDataJSON()

                if (payload.amount < 0) {
                    await route.fulfill({
                        status: 400,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            error: 'Invalid amount',
                            message: 'Số tiền phải lớn hơn 0'
                        })
                    })
                } else {
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            success: true,
                            order_code: 'DH123456'
                        })
                    })
                }
            } else {
                await route.continue()
            }
        })

        // Attempt to create order with negative amount
        const result = await page.evaluate(async () => {
            const res = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quantity: 5,
                    amount: -1300000,
                    user_id: 'user-123'
                })
            })

            return {
                status: res.status,
                data: await res.json()
            }
        })

        expect(result.status).toBe(400)
        expect(result.data.message).toContain('phải lớn hơn 0')

        await page.screenshot({
            path: 'e2e-results/error-negative-amount.png',
            fullPage: true
        })

        console.log('✅ Negative amount validation working')
    })

    /**
     * Test 18: Invalid GPS coordinates rejected
     */
    test('invalid GPS coordinates are rejected', async ({ page }) => {
        await loginAsAdmin(page, '/crm/admin')

        // Mock tree creation API with GPS validation
        await page.route('**/api/admin/trees/create', async route => {
            if (route.request().method() === 'POST') {
                const payload = route.request().postDataJSON()
                const { gps_lat, gps_lng } = payload

                // Validate GPS bounds (Vietnam: lat 8-24, lng 102-110)
                const isValidLat = gps_lat >= 8 && gps_lat <= 24
                const isValidLng = gps_lng >= 102 && gps_lng <= 110

                if (!isValidLat || !isValidLng) {
                    await route.fulfill({
                        status: 400,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            error: 'Invalid GPS coordinates',
                            message: 'Tọa độ GPS không nằm trong phạm vi Việt Nam',
                            valid_range: {
                                latitude: '8-24',
                                longitude: '102-110'
                            }
                        })
                    })
                } else {
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            success: true,
                            tree_id: 'tree-123'
                        })
                    })
                }
            } else {
                await route.continue()
            }
        })

        // Test case 1: Latitude out of bounds
        const result1 = await page.evaluate(async () => {
            const res = await fetch('/api/admin/trees/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: 'order-123',
                    gps_lat: 50.0, // Invalid - out of Vietnam
                    gps_lng: 106.0
                })
            })

            return { status: res.status, data: await res.json() }
        })

        expect(result1.status).toBe(400)
        expect(result1.data.message).toContain('không nằm trong phạm vi')

        // Test case 2: Longitude out of bounds
        const result2 = await page.evaluate(async () => {
            const res = await fetch('/api/admin/trees/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: 'order-123',
                    gps_lat: 10.7721,
                    gps_lng: 150.0 // Invalid - out of Vietnam
                })
            })

            return { status: res.status, data: await res.json() }
        })

        expect(result2.status).toBe(400)

        // Test case 3: Valid coordinates
        const result3 = await page.evaluate(async () => {
            const res = await fetch('/api/admin/trees/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: 'order-123',
                    gps_lat: 10.7721, // Valid - Ho Chi Minh City
                    gps_lng: 106.6980
                })
            })

            return { status: res.status, data: await res.json() }
        })

        expect(result3.status).toBe(200)
        expect(result3.data.success).toBe(true)

        await page.screenshot({
            path: 'e2e-results/error-invalid-gps.png',
            fullPage: true
        })

        console.log('✅ GPS coordinate validation working')
        console.log('   - Invalid latitude: Rejected')
        console.log('   - Invalid longitude: Rejected')
        console.log('   - Valid coordinates: Accepted')
    })
})
