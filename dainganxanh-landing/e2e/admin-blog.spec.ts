import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './fixtures/auth'
import { createClient } from '@supabase/supabase-js'

/**
 * Admin Blog Management E2E Test Suite
 *
 * Stack notes:
 * - Blog actions use Next.js Server Actions (no REST endpoints) → no route mocking needed
 * - Content editor is TipTap (div.ProseMirror contenteditable) → use .click() + .pressSequentially()
 * - Inputs are React controlled state (no `name` attr) → select by placeholder or role
 * - Delete uses window.confirm() → handle with page.on('dialog', ...)
 *
 * Prerequisites:
 * - Dev server at http://localhost:3001
 * - Supabase local + Mailpit at http://127.0.0.1:54334
 * - Admin user configured in TEST_ADMIN_EMAIL env
 */

test.describe('[P0] Admin Blog – List Page', () => {
  test('hiển thị trang danh sách blog', async ({ page }) => {
    await loginAsAdmin(page, '/crm/admin/blog')

    await expect(page).toHaveURL(/crm\/admin\/blog/)
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible()
    await expect(page.getByRole('link', { name: '+ Tạo bài mới' })).toBeVisible()
  })
})

test.describe('[P0] Admin Blog – Create', () => {
  test('tạo bài viết mới và publish', async ({ page }) => {
    await loginAsAdmin(page, '/crm/admin/blog/new')
    await page.waitForLoadState('networkidle')

    // Use timestamp suffix to avoid slug collision on retry
    const ts = require('crypto').randomBytes(4).toString('hex')
    const titleInput = page.getByPlaceholder('Nhập tiêu đề bài viết...')
    await titleInput.fill(`Bài kiểm tra E2E – Trồng cây ${ts}`)

    // Fill TipTap content
    const editor = page.locator('.ProseMirror')
    await editor.click()
    await editor.pressSequentially('Nội dung bài viết kiểm tra E2E cho dự án Đại Ngàn Xanh.')

    // Click Publish ngay
    await page.getByRole('button', { name: 'Publish ngay' }).click()

    // After create, Server Action → router.push(); assert redirect URL
    await expect(page).toHaveURL(/crm\/admin\/blog\/.+\/edit/, { timeout: 15000 })
  })

  test('lưu bài viết dưới dạng draft', async ({ page }) => {
    await loginAsAdmin(page, '/crm/admin/blog/new')
    await page.waitForLoadState('networkidle')

    const ts = require('crypto').randomBytes(4).toString('hex')
    const titleInput = page.getByPlaceholder('Nhập tiêu đề bài viết...')
    await titleInput.fill(`Draft Test – Bền vững ${ts}`)

    const editor = page.locator('.ProseMirror')
    await editor.click()
    await editor.pressSequentially('Nội dung draft bài viết thử nghiệm.')

    await page.getByRole('button', { name: 'Lưu Draft' }).click()

    // After create, Server Action → router.push(); assert redirect URL
    await expect(page).toHaveURL(/crm\/admin\/blog\/.+\/edit/, { timeout: 15000 })
  })
})

test.describe('[P1] Admin Blog – Validation', () => {
  test('báo lỗi khi tiêu đề trống', async ({ page }) => {
    await loginAsAdmin(page, '/crm/admin/blog/new')
    await page.waitForLoadState('networkidle')

    // Fill content but leave title empty
    const editor = page.locator('.ProseMirror')
    await editor.click()
    await editor.pressSequentially('Có nội dung nhưng không có tiêu đề.')

    await page.getByRole('button', { name: 'Lưu Draft' }).click()

    await expect(page.getByText('Tiêu đề không được để trống')).toBeVisible({ timeout: 5000 })
  })

  test('báo lỗi khi nội dung trống', async ({ page }) => {
    await loginAsAdmin(page, '/crm/admin/blog/new')
    await page.waitForLoadState('networkidle')

    // Fill title but leave TipTap empty
    const titleInput = page.getByPlaceholder('Nhập tiêu đề bài viết...')
    await titleInput.fill('Tiêu đề có, nội dung không')

    await page.getByRole('button', { name: 'Lưu Draft' }).click()

    await expect(page.getByText('Nội dung bài viết không được để trống')).toBeVisible({ timeout: 5000 })
  })

  test('báo lỗi khi slug không hợp lệ', async ({ page }) => {
    await loginAsAdmin(page, '/crm/admin/blog/new')
    await page.waitForLoadState('networkidle')

    const titleInput = page.getByPlaceholder('Nhập tiêu đề bài viết...')
    await titleInput.fill('Test')

    // Manually override slug to invalid value
    const slugInput = page.getByPlaceholder('url-slug-bai-viet')
    await slugInput.fill('Slug Không Hợp Lệ!')

    const editor = page.locator('.ProseMirror')
    await editor.click()
    await editor.pressSequentially('Nội dung hợp lệ.')

    await page.getByRole('button', { name: 'Lưu Draft' }).click()

    await expect(page.getByText('Slug chỉ được chứa chữ thường, số và dấu gạch ngang')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('[P1] Admin Blog – Slug Auto-gen', () => {
  test('slug tự động sinh từ tiêu đề', async ({ page }) => {
    await loginAsAdmin(page, '/crm/admin/blog/new')
    await page.waitForLoadState('networkidle')

    const titleInput = page.getByPlaceholder('Nhập tiêu đề bài viết...')
    await titleInput.fill('Trồng Cây Xanh 2026')

    // Wait for slug to auto-update via useEffect
    const slugInput = page.getByPlaceholder('url-slug-bai-viet')
    await expect(slugInput).not.toHaveValue('', { timeout: 3000 })

    const slugValue = await slugInput.inputValue()
    expect(slugValue).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    expect(slugValue).toContain('trong')
    expect(slugValue).toContain('cay')
    expect(slugValue).toContain('xanh')
  })

  test('nút Tự động reset slug về giá trị sinh từ tiêu đề', async ({ page }) => {
    await loginAsAdmin(page, '/crm/admin/blog/new')
    await page.waitForLoadState('networkidle')

    const titleInput = page.getByPlaceholder('Nhập tiêu đề bài viết...')
    await titleInput.fill('Hướng dẫn trồng cây tràm')

    // Manually override slug
    const slugInput = page.getByPlaceholder('url-slug-bai-viet')
    await slugInput.fill('slug-manual-override')

    // Click Tự động button to reset
    await page.getByRole('button', { name: 'Tự động' }).click()

    const slugValue = await slugInput.inputValue()
    expect(slugValue).not.toBe('slug-manual-override')
    expect(slugValue).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })
})

test.describe('[P1] Admin Blog – Delete', () => {
  // Note: these tests require at least one post to exist.
  // They will log a skip message if no posts are found rather than failing.

  test('xóa bài viết sau khi xác nhận', async ({ page }) => {
    await loginAsAdmin(page, '/crm/admin/blog')
    await page.waitForLoadState('networkidle')

    const deleteButton = page.getByRole('button', { name: 'Xóa' }).first()
    const hasPost = await deleteButton.count() > 0

    if (!hasPost) {
      console.log('ℹ️ Không có bài viết để xóa – bỏ qua test')
      return
    }

    // Get title of post to be deleted (for assertion)
    const firstRow = page.locator('tbody tr').first()
    const postTitle = await firstRow.locator('td').first().locator('.font-medium').textContent()

    // Accept the confirm dialog
    page.once('dialog', dialog => dialog.accept())
    await deleteButton.click()

    // Wait for table to re-render (router.refresh())
    await page.waitForLoadState('networkidle')

    // Post should be gone from the table
    if (postTitle) {
      await expect(page.getByText(postTitle, { exact: true })).not.toBeVisible({ timeout: 5000 })
    }
  })

  test('hủy xóa bài viết', async ({ page }) => {
    await loginAsAdmin(page, '/crm/admin/blog')
    await page.waitForLoadState('networkidle')

    const deleteButton = page.getByRole('button', { name: 'Xóa' }).first()
    const hasPost = await deleteButton.count() > 0

    if (!hasPost) {
      console.log('ℹ️ Không có bài viết để kiểm tra hủy xóa – bỏ qua test')
      return
    }

    // Get title before dismiss
    const firstRow = page.locator('tbody tr').first()
    const postTitle = await firstRow.locator('td').first().locator('.font-medium').textContent()

    // Dismiss the confirm dialog (cancel)
    page.once('dialog', dialog => dialog.dismiss())
    await deleteButton.click()

    // Post should still be in the table
    if (postTitle) {
      await expect(page.getByText(postTitle, { exact: true })).toBeVisible({ timeout: 3000 })
    }
  })
})

test.describe('[P2] Admin Blog – Tags', () => {
  test('thêm và xóa tag trong form tạo bài', async ({ page }) => {
    await loginAsAdmin(page, '/crm/admin/blog/new')
    await page.waitForLoadState('networkidle')

    const tagInput = page.getByPlaceholder('Nhập tag rồi nhấn Enter hoặc dấu phẩy...')

    // Add tag via Enter
    await tagInput.fill('trồng-cây')
    await tagInput.press('Enter')

    // Tag chip should appear
    await expect(page.getByText('trồng-cây')).toBeVisible({ timeout: 3000 })

    // Add second tag via comma
    await tagInput.fill('môi-trường,')
    await tagInput.press('Enter')
    await expect(page.getByText('môi-trường')).toBeVisible({ timeout: 3000 })

    // Remove first tag by clicking ×
    const firstTagSpan = page.locator('span').filter({ hasText: 'trồng-cây' })
    await firstTagSpan.getByRole('button').click()

    await expect(page.getByText('trồng-cây')).not.toBeVisible({ timeout: 3000 })
    // Second tag still present
    await expect(page.getByText('môi-trường')).toBeVisible()
  })
})

test.describe('[P2] Admin Blog – Edit', () => {
  test('chỉnh sửa bài viết hiện có', async ({ page }) => {
    // Create a post first to guarantee one exists for editing
    await loginAsAdmin(page, '/crm/admin/blog/new')
    await page.waitForLoadState('networkidle')

    const ts = require('crypto').randomBytes(4).toString('hex')
    await page.getByPlaceholder('Nhập tiêu đề bài viết...').fill(`Edit Target – ${ts}`)
    const editor = page.locator('.ProseMirror')
    await editor.click()
    await editor.pressSequentially('Nội dung bài viết dành cho test chỉnh sửa.')
    await page.getByRole('button', { name: 'Lưu Draft' }).click()
    await expect(page).toHaveURL(/crm\/admin\/blog\/.+\/edit/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')

    // Now we're already on the edit page — update the title
    const titleInput = page.getByPlaceholder('Nhập tiêu đề bài viết...')
    await expect(titleInput).toBeVisible({ timeout: 10000 })
    const currentTitle = await titleInput.inputValue()
    expect(currentTitle.length).toBeGreaterThan(0)

    await titleInput.fill(currentTitle + ' – Đã cập nhật')

    await page.getByRole('button', { name: 'Lưu Draft' }).click()

    // On edit (not create), Server Action returns without navigation → successMsg shows
    // Check success message first (appears while isPending is still true, then button re-enables)
    await expect(page.getByText(/Đã lưu draft/i)).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: 'Lưu Draft' })).toBeEnabled({ timeout: 15000 })
  })
})

// Cleanup: xóa tất cả blog posts được tạo trong test suite này
test.afterAll(async () => {
  const TEST_TITLE_PATTERNS = [
    'Bài kiểm tra E2E – Trồng cây',
    'Draft Test – Bền vững',
    'Edit Target –',
  ]

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54331',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  )

  for (const pattern of TEST_TITLE_PATTERNS) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .ilike('title', `${pattern}%`)
    if (error) console.warn(`⚠️ [afterAll] cleanup failed for "${pattern}":`, error.message)
    else console.log(`🧹 [afterAll] Deleted posts matching "${pattern}"`)
  }
})
