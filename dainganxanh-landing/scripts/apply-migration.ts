// Apply migrations programmatically using Supabase execute_sql function
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('🔑 Loaded credentials:')
console.log('  URL:', supabaseUrl ? '✅' : '❌ MISSING')
console.log('  Service Key:', supabaseServiceKey ? '✅' : '❌ MISSING')

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
})

async function applyMigration(sqlFilePath: string) {
    console.log(`📝 Reading migration: ${sqlFilePath}`)
    const sql = readFileSync(sqlFilePath, 'utf-8')

    // Smart SQL splitting that handles DO $$ blocks
    const statements: string[] = []
    let current = ''
    let inDoBlock = false
    let blockDepth = 0

    const lines = sql.split('\n')
    for (const line of lines) {
        const trimmed = line.trim()

        // Skip comments
        if (trimmed.startsWith('--') || trimmed.length === 0) {
            continue
        }

        // Track DO $$ blocks
        if (trimmed.startsWith('DO $$')) {
            inDoBlock = true
            blockDepth = 0
            current = line + '\n'
            continue
        }

        if (inDoBlock) {
            current += line + '\n'

            // Count BEGIN/END depth
            if (trimmed.startsWith('BEGIN')) blockDepth++
            if (trimmed.startsWith('END')) blockDepth--

            // End of DO block
            if (trimmed === 'END $$;' || (trimmed.startsWith('END $$') && blockDepth <= 0)) {
                statements.push(current.trim())
                current = ''
                inDoBlock = false
            }
            continue
        }

        current += line + '\n'

        // Statement ends with semicolon
        if (trimmed.endsWith(';')) {
            const stmt = current.trim()
            if (stmt.length > 0) {
                statements.push(stmt)
            }
            current = ''
        }
    }

    console.log(`🔧 Applying ${statements.length} statements...`)

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i]
        console.log(`\n[${i + 1}/${statements.length}] Executing:`)
        console.log(stmt.substring(0, 80) + '...')

        try {
            const { data, error } = await supabase.rpc('execute_sql', { sql: stmt })

            if (error) {
                console.error(`❌ Failed:`, error.message)
                throw error
            }

            console.log('✅ Success')
        } catch (err: any) {
            console.error('💥 Migration failed:', err)
            process.exit(1)
        }
    }

    console.log('\n✨ Migration completed successfully!')
}

// Apply the trees table migration
applyMigration('../supabase/migrations/20260112_fix_trees_table_schema.sql')
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Fatal error:', err)
        process.exit(1)
    })
