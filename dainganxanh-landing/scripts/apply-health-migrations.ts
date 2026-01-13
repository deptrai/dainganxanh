// Apply Story 3-6 health-related migrations
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
})

async function applyMigrations() {
    const migrations = [
        '../../supabase/migrations/20260113_add_tree_health_status.sql',
        '../../supabase/migrations/20260113_create_tree_health_logs.sql',
        '../../supabase/migrations/20260113_create_replacement_tasks.sql'
    ]

    for (const migrationPath of migrations) {
        console.log(`\n📝 Applying: ${migrationPath}`)
        const sql = readFileSync(resolve(__dirname, migrationPath), 'utf-8')

        const { error } = await supabase.rpc('execute_sql', { sql })

        if (error) {
            console.error(`❌ Failed: ${error.message}`)
            throw error
        }

        console.log('✅ Success')
    }

    console.log('\n✨ All migrations applied successfully!')
}

applyMigrations()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Fatal error:', err)
        process.exit(1)
    })
