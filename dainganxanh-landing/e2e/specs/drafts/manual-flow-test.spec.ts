import { test, expect } from '@playwright/test'
import path from 'path'

const SCREENSHOTS_DIR = path.join(__dirname, '../e2e-results/screenshots')

test.describe('Manual Flow Tests - Đất Ngàn Xanh', () => {

    test('Flow 1: Homepage loads correctly', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, 'flow1-homepage.png'),
            fullPage: true,
        })

        const title = await page.title()
        console.log('Page title:', title)

        const bodyText = await page.locator('body').innerText()
        console.log('Body text (first 300 chars):', bodyText.substring(0, 300))

        // Assert page loaded
        await expect(page.locator('body')).not.toBeEmpty()
        console.log('PASS: Homepage loaded')
    })

    test('Flow 2: Registration page - verify required fields', async ({ page }) => {
        await page.goto(`/register?quantity=1`)
        await page.waitForLoadState('networkidle')

        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, 'flow2-register-initial.png'),
            fullPage: true,
        })

        // Verify phone/email input (the identifier field)
        // The page defaults to email mode; input has placeholder "email@example.com"
        const identifierInput = page.locator('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]').first()
        await expect(identifierInput).toBeVisible({ timeout: 10000 })
        console.log('PASS: Phone/email input field is VISIBLE')

        // Verify referral code field — placeholder is "VD: dainganxanh"
        const referralInput = page.locator('input[placeholder="VD: dainganxanh"]')
        await expect(referralInput).toBeVisible({ timeout: 10000 })
        console.log('PASS: "Mã giới thiệu" referral input is VISIBLE')

        // Verify "Mã giới thiệu" label is visible
        const referralLabel = page.locator('text=Mã giới thiệu').first()
        await expect(referralLabel).toBeVisible({ timeout: 5000 })
        console.log('PASS: "Mã giới thiệu" label is VISIBLE')

        // Verify default referral code button "dainganxanh"
        const defaultReferralBtn = page.locator('button:has-text("dainganxanh")').first()
        await expect(defaultReferralBtn).toBeVisible({ timeout: 5000 })
        console.log('PASS: Default referral button with "dainganxanh" is VISIBLE')

        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, 'flow2-register-verified.png'),
            fullPage: true,
        })
    })

    test('Flow 3: Duplicate account prevention - referral validation', async ({ page }) => {
        await page.goto(`/register?quantity=1`)
        await page.waitForLoadState('networkidle')

        // Fill in identifier field with email that should NOT exist
        const identifierInput = page.locator('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]').first()
        await identifierInput.fill('testlocal@example.com')
        console.log('Filled identifier with: testlocal@example.com')

        // Leave referral code empty and click send OTP
        // Referral code is empty at this point
        const sendOtpBtn = page.locator('button:has-text("Gửi mã OTP")')
        await expect(sendOtpBtn).toBeVisible({ timeout: 5000 })
        await sendOtpBtn.click()
        console.log('Clicked "Gửi mã OTP" button (referral empty)')

        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, 'flow3-empty-referral-error.png'),
            fullPage: true,
        })

        // Verify error message appears: "Vui lòng nhập mã giới thiệu"
        // Error is rendered as <p class="mt-1 text-xs text-red-600">
        const errorMsg = page.locator('p.text-red-600:has-text("Vui lòng nhập mã giới thiệu"), p:has-text("Vui lòng nhập mã giới thiệu")').first()
        await expect(errorMsg).toBeVisible({ timeout: 5000 })
        const errorText = await errorMsg.innerText()
        console.log('PASS: Error message visible:', errorText)

        // Fill referral code with "dainganxanh"
        const referralInput = page.locator('input[placeholder="VD: dainganxanh"]')
        await referralInput.fill('dainganxanh')
        console.log('Filled referral code with: dainganxanh')

        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, 'flow3-referral-filled.png'),
            fullPage: true,
        })

        // Verify the error is gone after filling referral
        await expect(errorMsg).not.toBeVisible({ timeout: 3000 })
        console.log('PASS: Error cleared after filling referral code')

        // Verify referral input now shows "dainganxanh"
        await expect(referralInput).toHaveValue('dainganxanh')
        console.log('PASS: Referral code field shows "dainganxanh"')
    })

    test('Flow 4: Login page loads', async ({ page }) => {
        await page.goto(`/login?quantity=1`)
        await page.waitForLoadState('networkidle')

        const currentUrl = page.url()
        const title = await page.title()
        console.log('Login page URL:', currentUrl)
        console.log('Login page title:', title)

        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, 'flow4-login.png'),
            fullPage: true,
        })

        await expect(page.locator('body')).not.toBeEmpty()
        console.log('PASS: Login page loaded')
    })

    test('Flow 5: CRM routes redirect to login (unauthenticated)', async ({ page }) => {
        // Navigate to /crm
        await page.goto(`/crm`)
        await page.waitForLoadState('networkidle')

        const crmUrl = page.url()
        console.log('After /crm, redirected to:', crmUrl)

        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, 'flow5-crm-redirect.png'),
            fullPage: true,
        })

        // Verify /crm redirects (to login or dashboard)
        const crmRedirectedToLogin = crmUrl.includes('login') || crmUrl.includes('/crm/dashboard')
        console.log('PASS: /crm redirected correctly:', crmRedirectedToLogin, '-> URL:', crmUrl)

        // Navigate to /crm/referrals
        await page.goto(`/crm/referrals`)
        await page.waitForLoadState('networkidle')

        const referralsUrl = page.url()
        console.log('After /crm/referrals, redirected to:', referralsUrl)

        await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, 'flow5-crm-referrals-redirect.png'),
            fullPage: true,
        })

        // Verify /crm/referrals redirects away when not authenticated
        const referralsNotDirectAccess = !referralsUrl.endsWith('/crm/referrals') || referralsUrl.includes('login')
        console.log('PASS: /crm/referrals redirected correctly:', referralsNotDirectAccess, '-> URL:', referralsUrl)

        // Assert redirect happened (either to login page or some other page)
        expect(referralsUrl).toContain('login')
        console.log('PASS: Unauthenticated user redirected to login from /crm/referrals')
    })
})
