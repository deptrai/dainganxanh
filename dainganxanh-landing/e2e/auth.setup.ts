/**
 * Auth Setup Project — runs ONCE before all chromium tests, performs OTP login
 * for the admin and user accounts, and saves the resulting browser storage
 * state to `.auth/admin.json` and `.auth/user.json`.
 *
 * Subsequent test projects load these via `use.storageState`, so individual
 * tests skip the entire OTP flow. This eliminates:
 *
 * - Per-test Mailpit polling (was 15-20s × 100+ tests)
 * - Skip-identity-modal handling (was the source of `if/try` branching across
 *   every admin spec — flagged as the top determinism violation)
 * - OTP rate-limit collisions between parallel workers
 *
 * Tests can still call `loginAsAdmin(page, '/path')` if they need a clean
 * state — the fixture is unchanged and remains the supported entry point.
 */

import { test as setup, expect } from '@playwright/test'
import { getOTPFromMailpit } from './fixtures/mailpit'
import { ADMIN_EMAIL, TEST_EMAIL } from './fixtures/identity'

const ADMIN_AUTH_FILE = '.auth/admin.json'
const USER_AUTH_FILE = '.auth/user.json'

async function performOTPLogin(page: import('@playwright/test').Page, email: string) {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const emailInput = page.locator('input#identifier-input[type="email"]')
    await expect(emailInput).toBeVisible()
    await emailInput.fill(email)

    const sendOTPButton = page.getByRole('button', { name: /gửi mã otp/i })
    await sendOTPButton.click({ force: true })

    await expect(page.getByText(/nhập mã otp \(6 chữ số\)/i)).toBeVisible({ timeout: 10000 })

    const otpCode = await getOTPFromMailpit(email)

    const otpInputs = page.locator('input[inputmode="numeric"]')
    await expect(otpInputs).toHaveCount(6)

    for (let i = 0; i < 6; i++) {
        await otpInputs.nth(i).fill(otpCode[i])
    }

    // Wait for redirect off /login OR any post-login modal.
    await Promise.race([
        page.waitForURL((url) => !url.href.includes('/login'), { timeout: 15000 }),
        page.getByRole('button', { name: /bỏ qua/i }).waitFor({ state: 'visible', timeout: 15000 }),
        page.getByRole('button', { name: /xác nhận/i }).waitFor({ state: 'visible', timeout: 15000 }),
    ])

    // Dismiss referral-code modal if present (new accounts without referral).
    const referralInput = page.getByPlaceholder(/VD: dainganxanh/i)
    if (await referralInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        const skipReferral = page.getByRole('button', { name: /bấm vào đây để dùng mã/i })
        if (await skipReferral.isVisible({ timeout: 1000 }).catch(() => false)) {
            await skipReferral.click()
        }
        await page.getByRole('button', { name: /xác nhận/i }).click()
        await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 15000 })
    }

    // Dismiss skip-identity modal if present — one-time CCCD prompt.
    const skipButton = page.getByRole('button', { name: /bỏ qua/i })
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipButton.click()
        await page.waitForLoadState('networkidle')
    }
}

setup('authenticate admin', async ({ page }) => {
    await performOTPLogin(page, ADMIN_EMAIL)
    await page.context().storageState({ path: ADMIN_AUTH_FILE })
})

setup('authenticate user', async ({ page }) => {
    if (TEST_EMAIL === ADMIN_EMAIL) {
        // No separate user account configured; reuse admin state.
        return
    }
    await performOTPLogin(page, TEST_EMAIL)
    await page.context().storageState({ path: USER_AUTH_FILE })
})
