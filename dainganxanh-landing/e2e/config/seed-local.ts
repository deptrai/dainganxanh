/**
 * Seed script: tạo admin user trong local Supabase cho E2E tests
 * Run: npx tsx e2e/config/seed-local.ts
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://127.0.0.1:54331'
// CLI 2.x dùng sb_secret_* format — Kong tự convert sang JWT khi forward tới GoTrue
const SERVICE_ROLE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

const ADMIN_EMAIL = 'phanquochoipt@gmail.com'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
})

async function seedLocal() {
    console.log('🌱 Seeding local Supabase for E2E tests...\n')

    // 1. Tạo admin user
    console.log(`Creating admin user: ${ADMIN_EMAIL}`)
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        email_confirm: true,
        user_metadata: { full_name: 'Admin Test' },
    })

    if (userError && !userError.message.includes('already been registered')) {
        console.error('❌ Failed to create admin user:', userError.message)
        process.exit(1)
    }

    const userId = userData?.user?.id
    if (!userId) {
        // User đã tồn tại, lấy ID
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existing = users.find(u => u.email === ADMIN_EMAIL)
        if (!existing) { console.error('❌ Cannot find user'); process.exit(1) }
        console.log(`✅ Admin user already exists: ${existing.id}`)

        await ensureProfile(existing.id)
        return
    }

    console.log(`✅ Created admin user: ${userId}`)
    await ensureProfile(userId)
}

async function ensureProfile(userId: string) {
    // 2. Upsert vào bảng users với role admin
    const { error: profileError } = await supabase
        .from('users')
        .upsert({
            id: userId,
            email: ADMIN_EMAIL,
            full_name: 'Admin Test',
            role: 'admin',
            referral_code: 'dainganxanh',
        }, { onConflict: 'id' })

    if (profileError) {
        console.error('❌ Failed to upsert profile:', profileError.message)
        process.exit(1)
    }

    console.log('✅ Profile upserted (role: admin, referral_code: dainganxanh)')
    console.log('\n🎉 Local seed complete!')
    console.log('   Admin email:', ADMIN_EMAIL)
    console.log('   OTP bypass:  12345678 (dev mode)')
}

seedLocal().catch(console.error)
