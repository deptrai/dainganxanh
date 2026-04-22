import { defineConfig, devices } from '@playwright/test'
import { config } from 'dotenv'

// Load .env.test so TEST_ADMIN_EMAIL / TEST_USER_EMAIL / MAILPIT_URL are
// available to all spec files and fixtures at Playwright startup time.
config({ path: '.env.test', override: false })

const ADMIN_AUTH_FILE = '.auth/admin.json'
const USER_AUTH_FILE = '.auth/user.json'

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    // CI: 2 workers (cân bằng giữa speed và OTP rate-limit từ Supabase auth)
    // Local: 4 workers cho dev iteration nhanh hơn
    workers: process.env.CI ? 2 : 4,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3001',
        trace: 'on-first-retry',
    },

    projects: [
        // Setup project: runs ONCE before all tests, performs OTP login and
        // saves storage state. Subsequent projects load it via `use.storageState`,
        // so individual tests never repeat the OTP flow.
        {
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
        },
        // Admin-flow specs (admin-*, payment-webhook, notification-system,
        // performance-boundaries, error-handling-*, withdrawal-flow). Run
        // pre-authenticated as ADMIN_EMAIL.
        {
            name: 'chromium-admin',
            use: {
                ...devices['Desktop Chrome'],
                storageState: ADMIN_AUTH_FILE,
            },
            dependencies: ['setup'],
            testMatch: [
                /admin-.*\.spec\.ts/,
                /payment-webhook\.spec\.ts/,
                /notification-system\.spec\.ts/,
                /performance-boundaries\.spec\.ts/,
                /error-handling-.*\.spec\.ts/,
                /withdrawal-flow\.spec\.ts/,
            ],
        },
        // User-flow specs (checkout, my-garden, harvest, certificate, identity,
        // referral, tree-detail, accessibility, registration-auth). Run
        // pre-authenticated as TEST_EMAIL (falls back to admin if unset).
        {
            name: 'chromium-user',
            use: {
                ...devices['Desktop Chrome'],
                storageState: USER_AUTH_FILE,
            },
            dependencies: ['setup'],
            testMatch: [
                /checkout-payment-flow\.spec\.ts/,
                /my-garden-dashboard\.spec\.ts/,
                /harvest-decision\.spec\.ts/,
                /certificate-download\.spec\.ts/,
                /identity-form\.spec\.ts/,
                /referral-.*\.spec\.ts/,
                /tree-detail-.*\.spec\.ts/,
                /accessibility\.spec\.ts/,
                /notification-flow\.spec\.ts/,
            ],
        },
        // Unauthenticated specs (login/register flow itself, public pages). No storageState.
        {
            name: 'chromium-anon',
            use: { ...devices['Desktop Chrome'] },
            testMatch: [/registration-auth\.spec\.ts/, /public-blog\.spec\.ts/],
        },
    ],

    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3001',
        reuseExistingServer: !process.env.CI,
    },
})
