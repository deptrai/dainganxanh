import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { Client } from 'pg'

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })

async function applyMigration() {
    console.log('📦 Applying admin_preferences migration to remote Supabase...')

    const migrationPath = path.join(__dirname, '../../supabase/migrations/20260114_create_admin_preferences.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // Use Supabase connection pooler (Transaction mode)
    const connectionString = 'postgresql://postgres.gzuuyzikjvykjpeixzqk:Hoipt@2024@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'

    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    })

    try {
        console.log('🔌 Connecting to Supabase PostgreSQL (pooler)...')
        await client.connect()
        console.log('✅ Connected!')

        console.log('📝 Executing migration SQL...')
        await client.query(migrationSQL)

        console.log('✅ Migration applied successfully!')
        console.log('📊 Created admin_preferences table with RLS policies')

        // Verify table was created
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'admin_preferences'
        `)

        if (result.rows.length > 0) {
            console.log('✅ Table verification successful')
            console.log('📋 Table details:', result.rows[0])
        } else {
            console.warn('⚠️ Table not found after migration')
        }

        // Check RLS policies
        const policies = await client.query(`
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = 'admin_preferences'
        `)

        console.log(`✅ Found ${policies.rows.length} RLS policies:`)
        policies.rows.forEach((row: any) => {
            console.log(`   - ${row.policyname}`)
        })

    } catch (err: any) {
        console.error('❌ PostgreSQL error:', err.message)
        console.error('Full error:', err)
        process.exit(1)
    } finally {
        await client.end()
        console.log('🔌 Connection closed')
    }
}

applyMigration()
