import { test, expect } from '@playwright/test'

/**
 * Public Blog E2E Test Suite
 *
 * Tests the public-facing blog pages:
 *   /blog           — post list with tag filter + pagination
 *   /blog/[slug]    — individual post detail
 *
 * No authentication required (public routes).
 * Tests are designed to be deterministic regardless of DB seed state:
 *   - Structural/heading assertions always hold
 *   - Content assertions use conditional checks (present OR empty-state)
 *   - 404 behavior tested with a guaranteed-invalid slug
 */

test.describe('[P2] Public Blog — List Page (/blog)', () => {
    test('renders page heading and metadata', async ({ page }) => {
        await page.goto('/blog')
        await page.waitForLoadState('networkidle')

        // H1 must always be present
        await expect(page.getByRole('heading', { level: 1, name: 'Blog Đại Ngàn Xanh' })).toBeVisible()

        // Page title
        await expect(page).toHaveTitle(/Blog/)
    })

    test('shows post cards or empty state (no crash)', async ({ page }) => {
        await page.goto('/blog')
        await page.waitForLoadState('networkidle')

        // Either a post grid or an empty-state message must be present — never a blank/error page
        const postCard = page.locator('a[href^="/blog/"]').first()
        const emptyState = page.getByText('Chưa có bài viết nào')

        const hasCards = await postCard.count() > 0
        const hasEmpty = await emptyState.isVisible()

        expect(hasCards || hasEmpty).toBe(true)
    })

    test('tag filter updates heading subtitle', async ({ page }) => {
        await page.goto('/blog?tag=carbon-credit')
        await page.waitForLoadState('networkidle')

        // H1 still present
        await expect(page.getByRole('heading', { level: 1, name: 'Blog Đại Ngàn Xanh' })).toBeVisible()

        // Subtitle mentions the filtered tag (use first() — metadata may duplicate the text)
        await expect(page.getByText('Bài viết về "carbon-credit"').first()).toBeVisible()
    })

    test('tag filter with unknown tag shows per-tag empty state', async ({ page }) => {
        await page.goto('/blog?tag=__nonexistent_tag_xyz__')
        await page.waitForLoadState('networkidle')

        // Specific per-tag empty message
        await expect(page.getByText('Chưa có bài viết về "__nonexistent_tag_xyz__"')).toBeVisible()
    })

    test('pagination param does not crash the page', async ({ page }) => {
        await page.goto('/blog?page=999')
        await page.waitForLoadState('networkidle')

        // Page must still render (empty or with posts — not a 500/crash)
        await expect(page.getByRole('heading', { level: 1, name: 'Blog Đại Ngàn Xanh' })).toBeVisible()
    })

    test('tag links on post cards navigate to filtered view', async ({ page }) => {
        await page.goto('/blog')
        await page.waitForLoadState('networkidle')

        // Only run the interaction if cards are present
        const tagLink = page.locator('a[href*="/blog?tag="], a[href*="blog/?tag="]').first()
        if (await tagLink.count() === 0) {
            test.skip()
            return
        }

        await tagLink.click()
        await page.waitForURL(/[?&]tag=/, { timeout: 10000 })

        // URL must contain tag param
        expect(page.url()).toContain('tag=')

        // H1 still visible
        await expect(page.getByRole('heading', { level: 1, name: 'Blog Đại Ngàn Xanh' })).toBeVisible()
    })
})

test.describe('[P2] Public Blog — Detail Page (/blog/[slug])', () => {
    test('invalid slug returns 404', async ({ page }) => {
        const response = await page.goto('/blog/__this-slug-will-never-exist-in-db__')
        // Next.js notFound() → 404 HTTP status
        expect(response?.status()).toBe(404)
    })

    test('valid slug renders article structure', async ({ page }) => {
        // First fetch a real published post slug via the list page
        await page.goto('/blog')
        await page.waitForLoadState('networkidle')

        const firstPostLink = page.locator('a[href^="/blog/"]').first()
        if (await firstPostLink.count() === 0) {
            // No posts in DB — skip detail tests
            test.skip()
            return
        }

        const href = await firstPostLink.getAttribute('href')
        await page.goto(href!)
        await page.waitForLoadState('networkidle')

        // Back link to /blog
        const backLink = page.getByRole('link', { name: 'Quay lại Blog' })
        await expect(backLink).toBeVisible()
        await expect(backLink).toHaveAttribute('href', '/blog')

        // Article h1 must be present
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

        // JSON-LD breadcrumb script tag must exist
        const allJsonLd = page.locator('script[type="application/ld+json"]')
        const count = await allJsonLd.count()
        expect(count).toBeGreaterThanOrEqual(1)
        // Find the one containing BreadcrumbList
        let foundBreadcrumb = false
        for (let i = 0; i < count; i++) {
            const text = await allJsonLd.nth(i).textContent()
            if (text?.includes('BreadcrumbList') && text?.includes('/blog')) {
                foundBreadcrumb = true
                break
            }
        }
        expect(foundBreadcrumb, 'Expected a JSON-LD BreadcrumbList script referencing /blog').toBe(true)
    })

    test('back link navigates to /blog', async ({ page }) => {
        await page.goto('/blog')
        await page.waitForLoadState('networkidle')

        const firstPostLink = page.locator('a[href^="/blog/"]').first()
        if (await firstPostLink.count() === 0) {
            test.skip()
            return
        }

        const href = await firstPostLink.getAttribute('href')
        await page.goto(href!)
        await page.waitForLoadState('networkidle')

        await page.getByRole('link', { name: 'Quay lại Blog' }).click()
        await page.waitForLoadState('networkidle')

        await expect(page).toHaveURL(/\/blog$|\/blog\/$|\/blog\?/)
        await expect(page.getByRole('heading', { level: 1, name: 'Blog Đại Ngàn Xanh' })).toBeVisible()
    })

    test('tag badges on post detail link to filtered blog list', async ({ page }) => {
        await page.goto('/blog')
        await page.waitForLoadState('networkidle')

        const firstPostLink = page.locator('a[href^="/blog/"]').first()
        if (await firstPostLink.count() === 0) {
            test.skip()
            return
        }

        const href = await firstPostLink.getAttribute('href')
        await page.goto(href!)
        await page.waitForLoadState('networkidle')

        // Tag badges rendered with asLink → anchor tags pointing to ?tag=xxx
        const tagBadge = page.locator('a[href*="tag="]').first()
        if (await tagBadge.count() === 0) {
            // Post has no tags — skip
            test.skip()
            return
        }

        await tagBadge.click()
        await page.waitForURL(/[?&]tag=/, { timeout: 10000 })

        expect(page.url()).toContain('/blog')
        expect(page.url()).toContain('tag=')
    })

    test('"Xem thêm bài viết" bottom link navigates to /blog', async ({ page }) => {
        await page.goto('/blog')
        await page.waitForLoadState('networkidle')

        const firstPostLink = page.locator('a[href^="/blog/"]').first()
        if (await firstPostLink.count() === 0) {
            test.skip()
            return
        }

        const href = await firstPostLink.getAttribute('href')
        await page.goto(href!)
        await page.waitForLoadState('networkidle')

        const moreLink = page.getByRole('link', { name: 'Xem thêm bài viết' })
        await expect(moreLink).toBeVisible()
        await expect(moreLink).toHaveAttribute('href', '/blog')
    })
})
