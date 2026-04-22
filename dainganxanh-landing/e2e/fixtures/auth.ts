/**
 * Auth Fixture — `loginAsAdmin` and `loginAsUser`
 *
 * Replaces the duplicated `loginAsAdmin` / `loginWithOTP` helper that lived
 * inline in 11+ E2E spec files. Centralizing makes the OTP flow (Mailpit
 * polling, 8-digit input handling, post-OTP "skip identity" modal) a single
 * source of truth.
 *
 * Usage:
 *   await loginAsAdmin(page, '/crm/admin/orders')
 *   await loginAsUser(page, '/my-garden')
 */

import { Page, expect } from '@playwright/test'
import { getOTPFromMailpit } from './mailpit'
import { ADMIN_EMAIL, TEST_EMAIL } from './identity'

interface LoginOpts {
    /** Page selector or text shown after successful auth. Default: not on /login. */
    expectAfterLogin?: () => Promise<void>
    /** OTP digit count rendered by the form. Default: 8. */
    otpDigits?: 6 | 8
}

async function loginWithOTP(
    page: Page,
    email: string,
    targetPath: string,
    opts: LoginOpts = {}
): Promise<void> {
    const { otpDigits = 8 } = opts

    await page.goto(targetPath)
    await page.waitForLoadState('networkidle')

    const currentUrl = page.url()
    if (!currentUrl.includes('/login')) {
        // Already authenticated (session cookie still valid).
        return
    }

    const emailInput = page.locator('input#identifier-input[type="email"]')
    await expect(emailInput).toBeVisible()
    await emailInput.fill(email)

    const sendOTPButton = page.getByRole('button', { name: /gửi mã otp/i })
    await sendOTPButton.click()

    const otpPattern = otpDigits === 8 ? /nhập mã otp \(8 chữ số\)/i : /nhập mã otp/i
    await expect(page.getByText(otpPattern)).toBeVisible({ timeout: 10000 })

    const otpCode = await getOTPFromMailpit(email)

    const otpInputs = page.locator('input[inputmode="numeric"]')
    await expect(otpInputs).toHaveCount(otpDigits)

    for (let i = 0; i < otpDigits; i++) {
        await otpInputs.nth(i).fill(otpCode[i])
    }

    // Wait for either: redirect away from /login, OR the post-login "skip
    // identity verification" modal that appears for first-time users.
    try {
        await Promise.race([
            page.waitForURL(
                (url) => !url.href.includes('/login') && !url.href.includes('redirect'),
                { timeout: 10000 }
            ),
            page.getByRole('button', { name: /bỏ qua/i }).waitFor({ state: 'visible', timeout: 10000 }),
        ])
    } catch {
        // Fall through — the next assertion will catch a true failure.
    }

    await page.waitForLoadState('networkidle')

    // Dismiss "skip identity" modal if shown.
    const skipButton = page.getByRole('button', { name: /bỏ qua/i })
    if ((await skipButton.count()) > 0) {
        await skipButton.click()
        await page.waitForLoadState('networkidle')
    }

    // Ensure we landed at the target path. If a redirect bounced us, navigate
    // explicitly — but only after auth is confirmed.
    if (!page.url().includes(targetPath)) {
        await page.goto(targetPath)
        await page.waitForLoadState('networkidle')
    }

    if (opts.expectAfterLogin) {
        await opts.expectAfterLogin()
    }
}

/**
 * Log in as the admin account (TEST_ADMIN_EMAIL) and land on `targetPath`.
 * Defaults to `/crm/admin` when no target is given (most admin suites use it).
 */
export async function loginAsAdmin(
    page: Page,
    targetPath: string = '/crm/admin',
    opts?: LoginOpts
): Promise<void> {
    return loginWithOTP(page, ADMIN_EMAIL, targetPath, opts)
}

/**
 * Log in as the regular-user account (TEST_USER_EMAIL, falls back to admin)
 * and land on `targetPath`. Defaults to `/my-garden`.
 */
export async function loginAsUser(
    page: Page,
    targetPath: string = '/my-garden',
    opts?: LoginOpts
): Promise<void> {
    return loginWithOTP(page, TEST_EMAIL, targetPath, opts)
}

/**
 * Simpler login helper matching the historical `loginWithOTP(page)` signature
 * used by user-flow specs (checkout, my-garden, referral). Navigates to /login,
 * authenticates as TEST_EMAIL, dismisses the skip-identity modal, and returns.
 * The caller is expected to `await page.goto(...)` afterwards.
 */
export async function loginAtLoginPage(page: Page): Promise<void> {
    // Clear any existing auth state so we always land on the actual login form.
    // Tests that call this function explicitly want a fresh OTP login session.
    await page.context().clearCookies()
    // Clear localStorage before Supabase client initializes so storageState
    // from chromium-admin/chromium-user project doesn't bypass the login form.
    // Use sessionStorage as a one-shot flag: clears localStorage only on the FIRST
    // page load in this tab; subsequent navigations (after OTP login) keep the session.
    await page.addInitScript(() => {
        if (!sessionStorage.getItem('__auth_cleared')) {
            sessionStorage.setItem('__auth_cleared', '1')
            localStorage.clear()
        }
    })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const emailInput = page.locator('input#identifier-input[type="email"]')
    await expect(emailInput).toBeVisible()
    await emailInput.fill(TEST_EMAIL)

    const sendOTPButton = page.getByRole('button', { name: /gửi mã otp/i })
    await sendOTPButton.click()

    await expect(page.getByText(/nhập mã otp \(8 chữ số\)/i)).toBeVisible({ timeout: 20000 })

    const otpCode = await getOTPFromMailpit(TEST_EMAIL)

    const otpInputs = page.locator('input[inputmode="numeric"]')
    await expect(otpInputs).toHaveCount(8)

    for (let i = 0; i < 8; i++) {
        await otpInputs.nth(i).fill(otpCode[i])
    }

    const skipButton = page.getByRole('button', { name: /bỏ qua/i })
    try {
        await skipButton.waitFor({ state: 'visible', timeout: 10000 })
        await skipButton.click()
        await page.waitForLoadState('networkidle')
    } catch {
        await page.waitForLoadState('networkidle')
    }
}
