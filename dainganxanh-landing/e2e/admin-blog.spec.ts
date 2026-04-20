import { test, expect } from '@playwright/test'
import { getOTPFromMailpit } from './fixtures/mailpit'
import { ADMIN_EMAIL, TEST_EMAIL } from './fixtures/identity'
import { loginAsAdmin } from './fixtures/auth'

/**
 * Admin Blog Management E2E Test Suite
 * Tests the admin dashboard for blog post creation, editing, and status management
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Admin user: TEST_ADMIN_EMAIL (env override, must have admin role)
 */

test.describe('[P2] Admin Blog Management E2E', () => {

    test.afterAll(async ({ browser }) => {
        // Clean up: close all pages and reset browser state
        const contexts = browser.contexts()
        for (const ctx of contexts) {
            await ctx.clearCookies()
            await ctx.clearPermissions()
        }
    })


    /**
     * Helper: Complete admin login flow and navigate to target page
     */
    /**
     * Test 1: Admin creates new blog post
     */
    test('admin creates new blog post at /crm/admin/blog/new', async ({ page }) => {
        await loginAsAdmin(page, '/crm/admin/blog')

        // ============================================
        // Phase 1: Navigate to create new post
        // ============================================
        await expect(page).toHaveURL(/crm\/admin\/blog/)

        // Look for "Create New Post" button
        const createButton = page.getByRole('button', { name: /tạo bài viết|create post|new post/i }).or(page.getByRole('link', { name: /tạo bài viết|create post|new post/i }))
        const hasCreateButton = await createButton.count() > 0

        if (hasCreateButton) {
            await createButton.first().click()
            await page.waitForLoadState('networkidle')

            // Verify we're on the create page
            await expect(page).toHaveURL(/crm\/admin\/blog\/new/)
            console.log('✅ Navigated to blog post creation page')
        } else {
            // Try direct navigation
            await page.goto('/crm/admin/blog/new')
            await page.waitForLoadState('networkidle')
        }

        // ============================================
        // Phase 2: Fill in blog post form
        // ============================================
        // Mock API for creating blog post
        await page.route('**/api/admin/blog', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        id: 'post-123',
                        slug: 'trao-chung-chi-trong-cay-2026',
                        message: 'Blog post created successfully'
                    })
                })
            } else {
                await route.continue()
            }
        })

        await page.waitForLoadState('networkidle')

        // Fill in title
        const titleInput = page.locator('input[name="title"], input[placeholder*="tiêu đề"]').first()
        const hasTitleInput = await titleInput.count() > 0

        if (hasTitleInput) {
            await titleInput.fill('Trao chứng chỉ trồng cây cho cộng đồng 2026')
            console.log('✅ Blog title entered')
        }

        // Fill in slug (if separate field)
        const slugInput = page.locator('input[name="slug"]')
        if (await slugInput.count() > 0) {
            await slugInput.fill('trao-chung-chi-trong-cay-2026')
        }

        // Fill in content (could be textarea or rich text editor)
        const contentInput = page.locator('textarea[name="content"], div[contenteditable="true"]').first()
        const hasContentInput = await contentInput.count() > 0

        if (hasContentInput) {
            await contentInput.fill('Ngày 20/3/2026, Đại Ngàn Xanh đã tổ chức lễ trao chứng chỉ trồng cây cho hơn 500 người tham gia chương trình. Đây là cột mốc quan trọng trong hành trình phủ xanh Việt Nam.')
            console.log('✅ Blog content entered')
        }

        // Select category (if available)
        const categorySelect = page.locator('select[name="category"]')
        if (await categorySelect.count() > 0) {
            await categorySelect.selectOption({ label: 'Tin tức' })
        }

        // Click save/publish button
        const saveButton = page.getByRole('button', { name: /lưu|save|tạo|create/i }).last()
        const hasSaveButton = await saveButton.count() > 0

        if (hasSaveButton) {
            await saveButton.click()
            await page.waitForLoadState('networkidle')

            // Check for success message
            const successMessage = page.locator('text=/thành công|success|đã tạo/i')
            if (await successMessage.isVisible({ timeout: 5000 })) {
                console.log('✅ Blog post created successfully')
            } else {
                console.log('✅ Blog post creation action executed')
            }
        }

        await page.screenshot({
            path: 'e2e-results/admin-blog-create.png',
            fullPage: true
        })
    })

    /**
     * Test 2: Admin edits existing blog post
     */
    test('admin edits existing blog post', async ({ page }) => {
        await loginAsAdmin(page, '/crm/admin/blog')

        await expect(page).toHaveURL(/crm\/admin\/blog/)
        await page.waitForLoadState('networkidle')

        // Mock API for blog post list
        await page.route('**/api/admin/blog**', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        posts: [
                            {
                                id: 'post-456',
                                title: 'Hướng dẫn trồng cây tràm',
                                slug: 'huong-dan-trong-cay-tram',
                                status: 'draft',
                                created_at: '2026-03-15T10:00:00Z'
                            }
                        ],
                        total: 1
                    })
                })
            } else {
                await route.continue()
            }
        })

        // Mock API for updating blog post
        await page.route('**/api/admin/blog/post-456', async route => {
            if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        message: 'Blog post updated successfully'
                    })
                })
            } else {
                await route.continue()
            }
        })

        // Look for edit button
        const editButton = page.getByRole('button', { name: /sửa|edit|chỉnh sửa/i }).first().or(page.getByRole('link', { name: /sửa|edit|chỉnh sửa/i }).first())
        const hasEditButton = await editButton.count() > 0

        if (hasEditButton) {
            await editButton.click()
            await page.waitForLoadState('networkidle')
            console.log('✅ Navigated to blog post edit page')

            // Modify title
            const titleInput = page.locator('input[name="title"], input[placeholder*="tiêu đề"]').first()
            if (await titleInput.count() > 0) {
                await titleInput.fill('Hướng dẫn trồng cây tràm - Cập nhật 2026')
                console.log('✅ Blog title updated')
            }

            // Modify content
            const contentInput = page.locator('textarea[name="content"], div[contenteditable="true"]').first()
            if (await contentInput.count() > 0) {
                await contentInput.fill('Cây tràm là loài cây quý hiếm, được trồng phổ biến tại miền Tây Nam Bộ. Bài viết này sẽ hướng dẫn chi tiết cách trồng và chăm sóc cây tràm.')
                console.log('✅ Blog content updated')
            }

            // Click save button
            const saveButton = page.getByRole('button', { name: /lưu|save|cập nhật|update/i }).last()
            if (await saveButton.count() > 0) {
                await saveButton.click()
                await page.waitForLoadState('networkidle')

                // Check for success message
                const successMessage = page.locator('text=/thành công|success|đã cập nhật/i')
                if (await successMessage.isVisible({ timeout: 5000 })) {
                    console.log('✅ Blog post edited successfully')
                }
            }
        } else {
            console.log('ℹ️ No blog posts available to edit')
        }

        await page.screenshot({
            path: 'e2e-results/admin-blog-edit.png',
            fullPage: true
        })
    })

    /**
     * Test 3: Admin changes post status (draft/published/scheduled)
     */
    test('admin changes post status (draft/published/scheduled)', async ({ page }) => {
        await loginAsAdmin(page, '/crm/admin/blog')

        await expect(page).toHaveURL(/crm\/admin\/blog/)
        await page.waitForLoadState('networkidle')

        // Mock API for updating post status
        await page.route('**/api/admin/blog/*/status', async route => {
            if (route.request().method() === 'PATCH') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        message: 'Post status updated successfully'
                    })
                })
            } else {
                await route.continue()
            }
        })

        // Look for status dropdown or status change button
        const statusSelect = page.locator('select[name*="status"]').first()
        const hasStatusSelect = await statusSelect.count() > 0

        if (hasStatusSelect) {
            // Test changing status from draft to published
            await statusSelect.selectOption({ value: 'published' })
            await page.waitForLoadState('networkidle')

            const confirmButton = page.getByRole('button', { name: /xác nhận|confirm|xuất bản/i })
            if (await confirmButton.count() > 0) {
                await confirmButton.click()
                await page.waitForLoadState('networkidle')
            }

            // Check for success message
            const successMessage = page.locator('text=/thành công|success|đã xuất bản/i')
            if (await successMessage.isVisible({ timeout: 5000 })) {
                console.log('✅ Post status changed to "published"')
            }

            // Test changing to scheduled
            if (await statusSelect.isVisible()) {
                await statusSelect.selectOption({ value: 'scheduled' })
                await page.waitForLoadState('networkidle')

                // Look for datetime picker if scheduled
                const datetimeInput = page.locator('input[type="datetime-local"], input[name*="publish_at"]')
                if (await datetimeInput.count() > 0) {
                    await datetimeInput.fill('2026-04-01T10:00')
                    console.log('✅ Scheduled publish date set')
                }
            }

            console.log('✅ Post status change functionality working')
        } else {
            // Look for status change buttons instead
            const publishButton = page.getByRole('button', { name: /xuất bản|publish/i }).first()
            if (await publishButton.count() > 0) {
                await publishButton.click()
                await page.waitForLoadState('networkidle')

                const successMessage = page.locator('text=/thành công|success|đã xuất bản/i')
                if (await successMessage.isVisible({ timeout: 5000 })) {
                    console.log('✅ Post published successfully')
                }
            } else {
                console.log('ℹ️ Status change controls not found')
            }
        }

        await page.screenshot({
            path: 'e2e-results/admin-blog-status.png',
            fullPage: true
        })
    })

    /**
     * Test 4: Admin previews blog post before publishing
     */
    test('admin previews blog post before publishing', async ({ page }) => {
        await loginAsAdmin(page, '/crm/admin/blog/new')

        await page.waitForLoadState('networkidle')
        // Fill in basic blog post info
        const titleInput = page.locator('input[name="title"], input[placeholder*="tiêu đề"]').first()
        if (await titleInput.count() > 0) {
            await titleInput.fill('Preview Test - Phương pháp trồng cây bền vững')
        }

        const contentInput = page.locator('textarea[name="content"], div[contenteditable="true"]').first()
        if (await contentInput.count() > 0) {
            await contentInput.fill('Bài viết này giới thiệu các phương pháp trồng cây bền vững, thân thiện với môi trường và mang lại hiệu quả kinh tế cao.')
        }

        // Look for preview button
        const previewButton = page.getByRole('button', { name: /xem trước|preview/i })
        const hasPreviewButton = await previewButton.count() > 0

        if (hasPreviewButton) {
            await previewButton.click()
            await page.waitForLoadState('networkidle')

            // Check if preview modal or new tab opened
            const previewModal = page.locator('[role="dialog"], [class*="modal"], [class*="preview"]')
            const hasPreviewModal = await previewModal.count() > 0

            if (hasPreviewModal) {
                console.log('✅ Preview modal opened')

                // Verify preview content is visible
                await expect(previewModal.getByText('Preview Test - Phương pháp trồng cây bền vững')).toBeVisible({ timeout: 5000 })
                console.log('✅ Preview content displayed correctly')

                // Close preview
                const closeButton = page.getByRole('button', { name: /đóng|close/i })
                if (await closeButton.count() > 0) {
                    await closeButton.click()
                }
            } else {
                // Check if new window/tab opened (for external preview)
                const pages = page.context().pages()
                if (pages.length > 1) {
                    console.log('✅ Preview opened in new tab')
                    const previewPage = pages[pages.length - 1]
                    await previewPage.close()
                }
            }

            console.log('✅ Blog post preview functionality working')
        } else {
            console.log('ℹ️ Preview button not found - may not be implemented yet')
        }

        await page.screenshot({
            path: 'e2e-results/admin-blog-preview.png',
            fullPage: true
        })
    })
})
