/**
 * Test Identity Fixture
 *
 * Centralizes test user/admin email reads so we never hardcode real emails
 * in spec files. Override via .env.test (gitignored) for CI / local runs.
 *
 * Replaces 20+ inline `process.env.TEST_ADMIN_EMAIL ?? 'phanquochoipt@gmail.com'`
 * fallbacks across the suite — the fallback below is a non-deliverable
 * placeholder so a missing env var fails loudly instead of leaking into
 * a real inbox.
 */

const PLACEHOLDER_ADMIN = 'admin-fixture-not-configured@test.local'
const PLACEHOLDER_USER = 'user-fixture-not-configured@test.local'

/**
 * Email used for admin-flow E2E tests. Must be an account with `admin` or
 * `super_admin` role in the test DB and a Mailpit-routable inbox.
 *
 * Override in .env.test:
 *   TEST_ADMIN_EMAIL=admin@test.local
 */
export const ADMIN_EMAIL: string = process.env.TEST_ADMIN_EMAIL ?? PLACEHOLDER_ADMIN

/**
 * Email used for regular-user E2E tests. Override in .env.test:
 *   TEST_USER_EMAIL=user@test.local
 *
 * Falls back to ADMIN_EMAIL only if neither var is set (preserves the
 * historical behavior where many specs reused the admin account).
 */
export const TEST_EMAIL: string = process.env.TEST_USER_EMAIL ?? ADMIN_EMAIL

/**
 * Build a per-worker unique email for parallel tests that need isolation.
 * Use this in place of ADMIN_EMAIL when the test creates new accounts so
 * workers don't collide on OTP retrieval.
 *
 * Example:
 *   const email = userEmailForWorker(testInfo.workerIndex)
 */
export function userEmailForWorker(workerIndex: number): string {
    const stamp = Date.now()
    return `test-w${workerIndex}-${stamp}@test.local`
}
