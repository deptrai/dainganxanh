import fetch from 'node-fetch'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'

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

// Extract project ref from URL (e.g., https://gzuuyzikjvykjpeixzqk.supabase.co -> gzuuyzikjvykjpeixzqk)
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!projectRef) {
    console.error('❌ Could not extract project ref from Supabase URL')
    process.exit(1)
}

async function applyMigrationViaAPI() {
    console.log('📝 Applying migration via Supabase Management API...')
    console.log(`   Project Ref: ${projectRef}`)

    const sql = `
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS contract_url TEXT;
        CREATE INDEX IF NOT EXISTS idx_orders_contract_url ON orders(contract_url) WHERE contract_url IS NOT NULL;
    `

    try {
        // Try using service role key as authorization
        const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ query: sql })
        })

        const result = await response.json()

        if (!response.ok) {
            console.log('⚠️  Management API failed:', result)
            console.log('   Trying alternative approach with direct Supabase client...')
            return false
        }

        console.log('✅ Migration applied successfully via Management API')
        return true
    } catch (error) {
        console.log('⚠️  API request failed:', error.message)
        return false
    }
}

async function addTestData() {
    console.log('🔍 Adding test contract URLs to orders...')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get orders without contract_url
    const { data: orders, error: fetchError } = await supabase
        .from('orders')
        .select('id, order_code, status')
        .is('contract_url', null)
        .in('status', ['verified', 'assigned', 'completed'])
        .limit(10)

    if (fetchError) {
        console.error('❌ Error fetching orders:', fetchError)
        return
    }

    if (!orders || orders.length === 0) {
        console.log('✅ All eligible orders already have contract_url')
        return
    }

    console.log(`📝 Found ${orders.length} orders without contract_url`)

    // Update each order
    for (const order of orders) {
        const contractUrl = `https://storage.supabase.co/contracts/test-${order.id}.pdf`
        const orderCode = order.order_code || `ORD-${order.id.substring(0, 8)}`

        const { error: updateError } = await supabase
            .from('orders')
            .update({
                contract_url: contractUrl,
                order_code: orderCode
            })
            .eq('id', order.id)

        if (updateError) {
            console.error(`❌ Error updating order ${order.id}:`, updateError)
        } else {
            console.log(`✅ Updated order ${orderCode} with contract URL`)
        }
    }

    console.log('🎉 Done! Contract URLs added to test orders')
}

async function main() {
    const success = await applyMigrationViaAPI()

    if (!success) {
        console.log('')
        console.log('❌ Could not apply migration via API')
        console.log('📝 Please run this SQL manually in Supabase Dashboard:')
        console.log('   https://supabase.com/dashboard/project/' + projectRef + '/sql')
        console.log('')
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS contract_url TEXT;')
        console.log('CREATE INDEX IF NOT EXISTS idx_orders_contract_url ON orders(contract_url) WHERE contract_url IS NOT NULL;')
        console.log('')
        return
    }

    await addTestData()
}

main()
    .then(() => {
        console.log('✅ All done!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Script failed:', error)
        process.exit(1)
    })
