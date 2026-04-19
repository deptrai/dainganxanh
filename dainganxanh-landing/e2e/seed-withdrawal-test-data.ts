/**
 * Seed script to create referral data for withdrawal E2E tests
 * Run before withdrawal tests: npx tsx e2e/seed-withdrawal-test-data.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54331'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const TEST_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'phanquochoipt@gmail.com'

async function seedWithdrawalTestData() {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    console.log('🌱 Seeding withdrawal test data...')

    // 1. Get test user from auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
        console.error('❌ Failed to list users:', authError)
        process.exit(1)
    }

    const testUser = users.find(u => u.email === TEST_EMAIL)
    if (!testUser) {
        console.error(`❌ Test user ${TEST_EMAIL} not found`)
        process.exit(1)
    }

    console.log(`✅ Found test user: ${testUser.id}`)

    // 2. Ensure user has referral_code
    const { error: updateError } = await supabase
        .from('users')
        .update({
            referral_code: 'TESTREF01',
            full_name: 'phanquochoipt'
        })
        .eq('id', testUser.id)

    if (updateError) {
        console.error('❌ Failed to update user:', updateError)
        process.exit(1)
    }

    console.log('✅ Updated user referral_code')

    // 3. Create seed order to generate balance (5% commission)
    const orderCode = `DHSEED${Date.now().toString(36).slice(-6).toUpperCase()}`

    const { error: orderError } = await supabase
        .from('orders')
        .insert({
            order_code: orderCode,
            user_id: testUser.id,
            quantity: 5,
            total_amount: 10000000, // 10M VNĐ -> 5% = 500k balance
            payment_method: 'banking',
            status: 'completed',
            referred_by: testUser.id // Self-referral to create balance
        })

    if (orderError) {
        console.error('❌ Failed to create seed order:', orderError)
        process.exit(1)
    }

    console.log(`✅ Created seed order: ${orderCode}`)
    console.log('✅ Withdrawal test data seeded successfully!')
    console.log('   - User has referral_code: TESTREF01')
    console.log('   - Balance created: 500,000 VNĐ (5% of 10M VNĐ)')
}

seedWithdrawalTestData().catch(console.error)
