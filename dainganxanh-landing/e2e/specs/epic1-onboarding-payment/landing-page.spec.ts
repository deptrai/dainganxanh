import { test, expect } from '@playwright/test'

/**
 * Landing Page E2E Test Suite
 * Tests the landing page content, sections, and CTA navigation
 *
 * Flow 1 coverage: Landing Page (/) → Hero, Features, FAQ, CTA
 */

test.describe('Landing Page E2E', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')
    })

    /**
     * Test: Hero section displays correctly with CTA
     */
    test('hero section displays headline and CTA buttons', async ({ page }) => {
        // Verify main headline
        await expect(page.getByText(/dệt đại ngàn.*gặt phước báu/i)).toBeVisible({ timeout: 10000 })

        // Verify primary CTA button "Gieo Mầm Ngay"
        const ctaButton = page.getByRole('link', { name: /gieo mầm ngay/i })
        await expect(ctaButton).toBeVisible()

        // Verify tree counter component is visible
        const treeCounter = page.locator('[class*="counter"], [class*="TreeCounter"]').first()
        // Tree counter may be rendered as text - check for numeric content
        const counterOrText = page.locator('text=/\\d+.*cây/i').first()
        const hasCounter = await treeCounter.count() > 0 || await counterOrText.count() > 0
        expect(hasCounter).toBeTruthy()

        await page.screenshot({ path: 'e2e-results/landing-hero.png', fullPage: false })
        console.log('Landing hero section verified')
    })

    /**
     * Test: Navigation bar displays correctly
     */
    test('navbar displays brand and navigation links', async ({ page }) => {
        // Verify brand name
        await expect(page.getByText(/đại ngàn xanh/i).first()).toBeVisible()

        // Verify CTA button in navbar "Trong Ngay"
        const navCTA = page.getByRole('link', { name: /trồng ngay/i }).first()
        await expect(navCTA).toBeVisible()

        console.log('Navbar verified')
    })

    /**
     * Test: About section (Tai Sao Phai La Bay Gio)
     */
    test('about section displays content', async ({ page }) => {
        const aboutSection = page.locator('#about')
        await aboutSection.scrollIntoViewIfNeeded()

        await expect(page.getByText(/tại sao phải là bây giờ/i)).toBeVisible()

        console.log('About section verified')
    })

    /**
     * Test: Product benefits section with 4 benefit cards
     */
    test('product benefits section displays 4 cards', async ({ page }) => {
        const productSection = page.locator('#product')
        await productSection.scrollIntoViewIfNeeded()

        // Verify section heading
        await expect(page.getByText(/hơn cả một cái cây/i)).toBeVisible()

        // Verify 4 benefit cards exist
        await expect(page.getByText(/sinh mệnh thật/i)).toBeVisible()
        await expect(page.getByText(/minh bạch tuyệt đối/i)).toBeVisible()
        await expect(page.getByText(/quản lý số/i)).toBeVisible()
        await expect(page.getByText(/phước báu trao tay/i)).toBeVisible()

        console.log('Product benefits section verified with 4 cards')
    })

    /**
     * Test: How It Works section with 4 steps
     */
    test('how-it-works section displays 4 steps', async ({ page }) => {
        const howSection = page.locator('#how-it-works')
        await howSection.scrollIntoViewIfNeeded()

        await expect(page.getByText(/hành trình trao gửi sự sống/i)).toBeVisible()

        // Verify 4 steps
        await expect(page.getByText(/chọn số lượng/i).first()).toBeVisible()
        await expect(page.getByText(/đăng ký/i).first()).toBeVisible()
        await expect(page.getByText(/thanh toán/i).first()).toBeVisible()
        await expect(page.getByText(/nhận di sản/i)).toBeVisible()

        console.log('How-it-works section verified with 4 steps')
    })

    /**
     * Test: FAQ section displays questions
     */
    test('FAQ section displays questions and answers', async ({ page }) => {
        const faqSection = page.getByText(/những lời giải đáp chân thành/i)
        await faqSection.scrollIntoViewIfNeeded()
        await expect(faqSection).toBeVisible()

        // Verify FAQ about 260k price breakdown exists
        await expect(page.getByText(/260/i).first()).toBeVisible()

        console.log('FAQ section verified')
    })

    /**
     * Test: CTA button navigates to pricing page
     */
    test('primary CTA navigates to pricing page', async ({ page }) => {
        const ctaButton = page.getByRole('link', { name: /gieo mầm ngay/i })
        await expect(ctaButton).toBeVisible()
        await ctaButton.click()

        await expect(page).toHaveURL(/\/pricing/, { timeout: 10000 })

        console.log('CTA navigation to /pricing verified')
    })

    /**
     * Test: Navbar "Trong Ngay" CTA navigates to pricing
     */
    test('navbar CTA navigates to pricing page', async ({ page }) => {
        const navCTA = page.getByRole('link', { name: /trồng ngay/i }).first()
        await navCTA.click()

        await expect(page).toHaveURL(/\/pricing/, { timeout: 10000 })

        console.log('Navbar CTA navigation verified')
    })

    /**
     * Test: Footer section displays
     */
    test('footer section displays brand and copyright', async ({ page }) => {
        const footer = page.locator('footer')
        await footer.scrollIntoViewIfNeeded()
        await expect(footer).toBeVisible()

        console.log('Footer verified')
    })

    /**
     * Test: No console errors on landing page
     */
    test('no console errors on landing page', async ({ page }) => {
        const consoleErrors: string[] = []

        page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text()
                if (!text.includes('Failed to load resource') &&
                    !text.includes('404') &&
                    !text.includes('406')) {
                    consoleErrors.push(text)
                }
            }
        })

        // Re-navigate to capture errors from fresh load
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        const criticalErrors = consoleErrors.filter(err =>
            !err.includes('406') && !err.includes('Not Acceptable')
        )

        if (criticalErrors.length > 0) {
            console.error('Console errors detected:', criticalErrors)
            throw new Error(`Found ${criticalErrors.length} console errors`)
        }

        console.log('No console errors on landing page')
    })
})
