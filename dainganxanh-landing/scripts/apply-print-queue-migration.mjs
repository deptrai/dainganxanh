import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: resolve(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

console.log('📝 Reading migration file...')
const sql = readFileSync(resolve(__dirname, '../../supabase/migrations/20260113_create_print_queue.sql'), 'utf-8')

console.log('🔧 Applying entire migration as single transaction...')

const { error } = await supabase.rpc('execute_sql', { sql })

if (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
}

console.log('✅ Migration completed successfully!')
console.log('📊 print_queue table created with:')
console.log('  - Table structure')
console.log('  - Indexes (order_id, status, created_at)')
console.log('  - Triggers (updated_at auto-update)')
console.log('  - Comments (documentation)')
