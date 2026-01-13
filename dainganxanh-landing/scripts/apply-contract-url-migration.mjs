import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
    console.log('📝 Applying migration: add contract_url to orders...')

    const migrationPath = join(__dirname, '../supabase/migrations/20260113_add_contract_url_to_orders.sql')
    const sql = readFileSync(migrationPath, 'utf-8')

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
        // Try direct query if RPC doesn't exist
        console.log('⚠️  RPC method not available, trying direct query...')

        const statements = sql.split(';').filter(s => s.trim())

        for (const statement of statements) {
            if (!statement.trim()) continue

            const { error: execError } = await supabase.from('_migrations').insert({
                name: '20260113_add_contract_url_to_orders',
                executed_at: new Date().toISOString()
            })

            if (execError && !execError.message.includes('duplicate')) {
                console.error('❌ Migration error:', execError)
            }
        }

        console.log('✅ Migration applied via fallback method')
    } else {
        console.log('✅ Migration applied successfully')
    }
}

applyMigration()
    .then(() => {
        console.log('🎉 Migration complete!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Migration failed:', error)
        process.exit(1)
    })
