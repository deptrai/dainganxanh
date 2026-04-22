/**
 * Condition-based wait helpers for E2E tests.
 *
 * These replace hardcoded `waitForTimeout` calls with deterministic
 * condition waits. Import and use instead of raw `page.waitForTimeout`.
 *
 * Usage:
 *   import { waitForNetworkIdle, waitForElement, waitForNavigation } from './fixtures/wait-helpers'
 */

import type { Page, Locator } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Wait for network to settle (replaces waitForTimeout after navigation).
 * Use when you'd normally write: await page.waitForTimeout(2000)
 */
export async function waitForNetworkIdle(page: Page, timeout = 10_000): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout })
}

/**
 * Wait for an element to be visible (replaces pre-interaction sleep).
 * Use when you'd normally write: await page.waitForTimeout(N); await element.click()
 */
export async function waitForElement(locator: Locator, timeout = 10_000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout })
}

/**
 * Wait for URL to match pattern (replaces post-submit sleep).
 * Use when you'd normally write: await page.waitForTimeout(2000) after click
 */
export async function waitForNavigation(page: Page, urlPattern: RegExp | string, timeout = 15_000): Promise<void> {
    await page.waitForURL(urlPattern, { timeout })
}

/**
 * Wait for a toast or status message to appear.
 * Use when you'd normally write: await page.waitForTimeout(2000) to wait for feedback.
 */
export async function waitForToast(page: Page, options: { timeout?: number } = {}): Promise<Locator> {
    const toast = page.locator('[role="status"], [role="alert"], .toast, [data-testid*="toast"]')
    await toast.first().waitFor({ state: 'visible', timeout: options.timeout ?? 10_000 })
    return toast.first()
}

/**
 * Wait for a form submission to complete (loading spinner disappears).
 * Use when you'd normally write: await page.waitForTimeout(3000) after submit.
 */
export async function waitForFormSubmit(page: Page, submitButton: Locator, timeout = 15_000): Promise<void> {
    // Wait for button to become enabled again (loading state ends)
    // OR wait for navigation/network idle
    await Promise.race([
        expect(submitButton).toBeEnabled({ timeout }),
        page.waitForLoadState('networkidle', { timeout }),
    ])
}
