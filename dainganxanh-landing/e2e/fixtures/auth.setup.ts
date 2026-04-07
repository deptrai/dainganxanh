import { test as setup, expect, chromium } from '@playwright/test'
import { envConfig } from '../config/env'
import { getOTPFromMailpit } from '../utils/mailpit'
import * as path from 'path'
import * as fs from 'fs'

const adminFile = path.resolve(__dirname, '../storagestate/admin.json')

/**
 * Global Auth Setup — chạy 1 lần duy nhất trước tất cả tests.
 * Lưu session vào admin.json để mọi test dùng lại — không OTP lại.
 *
 * Logic:
 *   1. Nếu admin.json tồn tại và session còn valid → giữ nguyên, return sớm
 *   2. Nếu không → login bằng dev OTP bypass (12345678)
 */
setup('Xác thực đăng nhập toàn cục (Global Auth)', async ({ page }) => {
    console.log('🔄 Global Auth Setup...')

    // ── Bước 1: Kiểm tra session cũ còn valid không ─────────────────────
    if (fs.existsSync(adminFile)) {
        try {
            const stored = JSON.parse(fs.readFileSync(adminFile, 'utf8'))
            const cookies = stored.cookies || []
            // Tìm auth token cookie của Supabase
            const authCookie = cookies.find((c: any) =>
                c.name.includes('auth-token') && !c.name.includes('code-verifier')
            )
            if (authCookie) {
                // Thử navigate đến trang protected với session cũ
                await page.context().addCookies(cookies)
                await page.goto('/crm/my-garden')
                await page.waitForLoadState('networkidle')
                if (!page.url().includes('/login')) {
                    console.log('✅ Session cũ còn valid, giữ nguyên admin.json')
                    return
                }
                console.log('⚠️  Session cũ hết hạn, login lại...')
            }
        } catch {
            console.log('⚠️  Không đọc được admin.json, login lại...')
        }
    }

    // ── Bước 2: Login bằng dev OTP bypass ───────────────────────────────
    await page.context().clearCookies()

    // Pre-set ref cookie để skip referral modal
    await page.context().addCookies([{
        name: 'ref',
        value: 'dainganxanh',
        domain: 'localhost',
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 90 * 24 * 3600,
    }])

    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Click tab Email nếu cần
    const emailTab = page.getByRole('button', { name: /^email$/i }).first()
    if (await emailTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await emailTab.click()
    }

    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first()
    await expect(emailInput).toBeVisible({ timeout: 10000 })
    await emailInput.fill(envConfig.ADMIN_EMAIL)

    await page.getByRole('button', { name: /gửi mã otp/i }).click()

    // Đợi OTP form hoặc redirect thẳng (nếu có session)
    const otpVisible = await page.getByText(/nhập mã otp/i)
        .waitFor({ state: 'visible', timeout: 10000 })
        .then(() => true)
        .catch(() => false)

    if (!otpVisible) {
        // Đã redirect (session auto-restored) — kiểm tra có ra khỏi /login không
        await page.waitForTimeout(2000)
        if (!page.url().includes('/login')) {
            console.log('✅ Auto-login thành công (session restored)')
            await page.context().storageState({ path: adminFile })
            return
        }
        throw new Error('OTP form không hiện sau khi gửi OTP')
    }

    // Lấy OTP từ Mailpit (inbucket local) hoặc dev bypass
    const otp = await getOTPFromMailpit(envConfig.ADMIN_EMAIL)
    console.log(`📲 Nhập OTP: ${otp}`)

    const otpInputs = page.locator('input[inputmode="numeric"]')
    await expect(otpInputs).toHaveCount(8, { timeout: 5000 })
    for (let i = 0; i < 8; i++) {
        await otpInputs.nth(i).fill(otp[i])
    }

    // Đợi redirect ra khỏi /login
    await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 20000 })

    // Skip referral modal nếu có
    const skipBtn = page.getByRole('button', { name: /bỏ qua/i })
    if (await skipBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await skipBtn.click()
        await page.waitForLoadState('networkidle')
    }

    await page.waitForTimeout(1000)
    await page.context().storageState({ path: adminFile })
    console.log(`✅ Session lưu tại: ${adminFile}`)
})
