import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectSchema() {
    console.log('🔍 Inspecting users table schema...')

    // Attempt to fetch one user to see available columns
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1)

    if (error) {
        console.error('❌ Error fetching from users:', error)
        return
    }

    if (data && data.length > 0) {
        console.log('✅ Found columns in users table:', Object.keys(data[0]))
    } else {
        // If no data, checks information schema
        const { data: columns, error: schemaError } = await supabase.rpc('get_table_columns', { table_name: 'users' })
        // This RPC might not exist, so fallback to direct query if possible or just assuming connection works
        console.log('⚠️ No users found or unable to infer columns.')
    }
}

inspectSchema()
