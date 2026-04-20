import { test, expect } from '@playwright/test'
import { getOTPFromMailpit } from './fixtures/mailpit'
import { createClient } from '@supabase/supabase-js'
import { loginAtLoginPage } from './fixtures/auth'

/**
 * Harvest Decision Flow E2E Test Suite
 * Tests the tree harvest decision flow with 3 options: sell back, keep growing, receive product
 *
 * Prerequisites:
 * - Dev server running at http://localhost:3001
 * - Supabase local running with Mailpit at http://127.0.0.1:54334
 * - Test user: TEST_USER_EMAIL (env override) (with existing orders)
 */

test.describe('[P1] Harvest Decision Flow E2E', () => {

    const TEST_EMAIL = 'test@test.com'
    const SUPABASE_URL = 'http://127.0.0.1:54331'
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

    let testOrderId: string | null = null
    let testTreeId: string | null = null
    /** Whether the order was created by this run (vs reused). Only created rows are deleted in afterAll. */
    let createdOrderInThisRun = false

    test.afterAll(async ({ browser }) => {
        // 1. Database cleanup — only delete rows we created in this run.
        //    Reused/pre-existing orders are left untouched to keep dev DB stable.
        if (createdOrderInThisRun && (testOrderId || testTreeId)) {
            const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
            try {
                if (testTreeId) {
                    await supabase.from('trees').delete().eq('id', testTreeId)
                    console.log(`🧹 [afterAll] Deleted test tree ${testTreeId}`)
                }
                if (testOrderId) {
                    await supabase.from('orders').delete().eq('id', testOrderId)
                    console.log(`🧹 [afterAll] Deleted test order ${testOrderId}`)
                }
            } catch (cleanupErr) {
                console.warn('⚠️ [afterAll] DB cleanup failed (non-blocking):', cleanupErr)
            }
        }

        // 2. Browser cleanup
        const contexts = browser.contexts()
        for (const ctx of contexts) {
            await ctx.clearCookies()
            await ctx.clearPermissions()
        }
    })

    // Setup test data before all tests
    test.beforeAll(async () => {
        console.log('🔧 [beforeAll] Starting test data setup...')
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

        // Get test user ID from users table (not auth.users)
        console.log(`🔍 [beforeAll] Looking for user: ${TEST_EMAIL}`)
        const { data: testUsers, error: userError } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', TEST_EMAIL)
            .limit(1)

        if (userError) {
            console.error(`❌ [beforeAll] User query error:`, userError)
            return
        }

        if (!testUsers || testUsers.length === 0) {
            console.warn(`⚠️ [beforeAll] Test user ${TEST_EMAIL} not found - tests will fail`)
            return
        }

        const testUser = testUsers[0]
        console.log(`✅ [beforeAll] Found user ID: ${testUser.id}`)

        // Check if user already has orders
        console.log(`🔍 [beforeAll] Checking for existing orders...`)
        const { data: existingOrders, error: orderCheckError } = await supabase
            .from('orders')
            .select('id, code')
            .eq('user_id', testUser.id)
            .limit(1)

        if (orderCheckError) {
            console.error(`❌ [beforeAll] Order check error:`, orderCheckError)
        }

        if (existingOrders && existingOrders.length > 0) {
            testOrderId = existingOrders[0].id
            console.log(`✅ [beforeAll] Using existing order: ${existingOrders[0].code} (${testOrderId})`)
            return
        }

        // Create test order with tree
        console.log(`🌱 [beforeAll] Creating new test order...`)
        const orderCode = `DH-TEST-${Date.now()}`
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                code: orderCode,
                user_id: testUser.id,
                quantity: 10,
                total_amount: 1000000,
                payment_method: 'banking',
                status: 'completed',
                tree_status: 'growing',
                planted_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
                co2_absorbed: 10
            })
            .select()
            .single()

        if (orderError) {
            console.error('❌ [beforeAll] Failed to create test order:', orderError.message)
            console.error('❌ [beforeAll] Error details:', JSON.stringify(orderError, null, 2))
            return
        }

        if (!order) {
            console.error('❌ [beforeAll] Order created but no data returned')
            return
        }

        testOrderId = order.id
        createdOrderInThisRun = true
        console.log(`✅ [beforeAll] Created test order: ${orderCode} (${testOrderId})`)

        // Create at least one tree for this order
        console.log(`🌳 [beforeAll] Creating test tree...`)
        const treeCode = `TREE-TEST-${Date.now()}`
        const { data: tree, error: treeError } = await supabase
            .from('trees')
            .insert({
                code: treeCode,
                order_id: order.id,
                user_id: testUser.id,
                status: 'active',
                planted_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) // 6 months ago
            })
            .select()
            .single()

        if (treeError) {
            console.error('❌ [beforeAll] Failed to create test tree:', treeError.message)
            console.error('❌ [beforeAll] Error details:', JSON.stringify(treeError, null, 2))
        } else {
            testTreeId = tree?.id ?? null
            console.log(`✅ [beforeAll] Created test tree: ${treeCode} (${testTreeId})`)
        }

        console.log('✅ [beforeAll] Test data setup complete!')
    })
    /**
     * Test: View harvest page with tree info
     */
    test('view harvest page with tree maturity info', async ({ page }) => {
        // ============================================
        // Phase 1: Login
        // ============================================
        await loginAtLoginPage(page)

        // Navigate to My Garden
        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 2: Get first order and navigate to harvest page
        // ============================================
        const firstOrderCard = page.locator('a[href*="/crm/my-garden/"]').first()
        await expect(firstOrderCard).toBeVisible({ timeout: 10000 })

        const href = await firstOrderCard.getAttribute('href')
        const orderId = href?.split('/').pop()

        // Navigate to harvest page
        await page.goto(`/crm/my-garden/${orderId}/harvest`)
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 3: Verify harvest page loaded with tree info
        // ============================================
        await expect(page.getByText(/cây sẵn sàng thu hoạch/i)).toBeVisible({ timeout: 10000 })

        // Verify tree info section
        await expect(page.getByText(/thông tin cây/i)).toBeVisible()
        await expect(page.getByText(/mã cây/i)).toBeVisible()
        await expect(page.getByText(/tuổi cây/i)).toBeVisible()
        await expect(page.getByText(/ngày trồng/i)).toBeVisible()
        await expect(page.getByText(/co₂ đã hấp thụ/i)).toBeVisible()

        // Verify harvest options section
        await expect(page.getByText(/lựa chọn thu hoạch/i)).toBeVisible()

        // ============================================
        // Phase 4: Take screenshot
        // ============================================
        await page.screenshot({
            path: 'e2e-results/harvest-decision-page.png',
            fullPage: true
        })

        console.log(`✅ Harvest page loaded with tree info`)
    })

    /**
     * Test: View harvest options (3 choices)
     */
    test('view all three harvest options', async ({ page }) => {
        // Login
        await loginAtLoginPage(page)

        // Get first order
        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        const firstOrderCard = page.locator('a[href*="/crm/my-garden/"]').first()
        await expect(firstOrderCard).toBeVisible({ timeout: 10000 })

        const href = await firstOrderCard.getAttribute('href')
        const orderId = href?.split('/').pop()

        // Navigate to harvest page
        await page.goto(`/crm/my-garden/${orderId}/harvest`)
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 1: Verify Option 1 - Sell Back
        // ============================================
        await expect(page.getByRole('heading', { name: /bán lại cho đại ngàn xanh/i })).toBeVisible({ timeout: 10000 })
        await expect(page.getByText(/giá mua lại/i)).toBeVisible()

        // ============================================
        // Phase 2: Verify Option 2 - Keep Growing
        // ============================================
        await expect(page.getByRole('heading', { name: /tiếp tục nuôi cây/i })).toBeVisible()

        // ============================================
        // Phase 3: Verify Option 3 - Receive Product
        // ============================================
        await expect(page.getByRole('heading', { name: /nhận sản phẩm/i })).toBeVisible()

        console.log(`✅ All 3 harvest options visible`)
    })

    /**
     * Test: Navigate back from harvest page
     */
    test('navigate back to order detail from harvest page', async ({ page }) => {
        // Login
        await loginAtLoginPage(page)

        // Get first order
        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        const firstOrderCard = page.locator('a[href*="/crm/my-garden/"]').first()
        await expect(firstOrderCard).toBeVisible({ timeout: 10000 })

        const href = await firstOrderCard.getAttribute('href')
        const orderId = href?.split('/').pop()

        // Navigate to harvest page
        await page.goto(`/crm/my-garden/${orderId}/harvest`)
        await page.waitForLoadState('networkidle')

        // ============================================
        // Phase 1: Click back button
        // ============================================
        const backButton = page.getByRole('link', { name: /quay lại/i })
        await expect(backButton).toBeVisible({ timeout: 10000 })
        await backButton.click()

        // ============================================
        // Phase 2: Verify redirected to order detail page
        // ============================================
        await page.waitForURL(/crm\/my-garden\/[a-f0-9-]+$/, { timeout: 10000 })

        // Verify we're on order detail page (not harvest page)
        await expect(page).not.toHaveURL(/\/harvest$/)

        console.log(`✅ Back navigation works`)
    })

    /**
     * Test: No console errors on harvest page
     */
    test('no console errors on harvest page', async ({ page }) => {
        const consoleErrors: string[] = []

        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text())
            }
        })

        // Login
        await loginAtLoginPage(page)

        // Get first order
        await page.goto('/crm/my-garden')
        await page.waitForLoadState('networkidle')

        const firstOrderCard = page.locator('a[href*="/crm/my-garden/"]').first()
        await expect(firstOrderCard).toBeVisible({ timeout: 10000 })

        const href = await firstOrderCard.getAttribute('href')
        const orderId = href?.split('/').pop()

        // Navigate to harvest page
        await page.goto(`/crm/my-garden/${orderId}/harvest`)
        await page.waitForLoadState('networkidle')

        // Wait for page to fully render
        await expect(page.getByText(/cây sẵn sàng thu hoạch/i)).toBeVisible({ timeout: 10000 })
        await page.waitForLoadState('networkidle')

        // Verify no console errors
        if (consoleErrors.length > 0) {
            console.error('❌ Console errors detected:', consoleErrors)
            throw new Error(`Found ${consoleErrors.length} console errors`)
        }

        console.log(`✅ No console errors detected`)
    })
})
