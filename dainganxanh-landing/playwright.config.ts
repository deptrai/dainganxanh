import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.e2e cho E2E tests — dùng local Supabase, không dùng production
dotenv.config({ path: path.resolve(__dirname, '.env.e2e') })

export default defineConfig({
    testDir: './e2e',
    testMatch: /e2e\/specs\/.*\.spec\.ts/,   // Chỉ pick up E2E specs, bỏ qua jest/__tests__
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: process.env.CI ? 1 : 1,
    reporter: 'html',
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
        trace: 'on-first-retry',
    },

    projects: [
        {
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
            use: {
                ...devices['Desktop Chrome'],
                baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
            }
        },
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                headless: !!process.env.CI,
                storageState: 'e2e/storagestate/admin.json',
            },
            dependencies: ['setup'],
        },
    ],

    webServer: {
        // Chạy Next.js trỏ local Supabase — env vars đã load từ .env.e2e ở trên
        command: 'npx next dev -p 3001',
        url: 'http://localhost:3001',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        env: {
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
            NEXT_PUBLIC_BANK_NAME: process.env.NEXT_PUBLIC_BANK_NAME!,
            NEXT_PUBLIC_BANK_ACCOUNT: process.env.NEXT_PUBLIC_BANK_ACCOUNT!,
            NEXT_PUBLIC_BANK_HOLDER: process.env.NEXT_PUBLIC_BANK_HOLDER!,
            CASSO_SECURE_TOKEN: process.env.CASSO_SECURE_TOKEN!,
            INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET!,
            CONTRACT_API_SECRET: process.env.CONTRACT_API_SECRET!,
        },
    },
})
