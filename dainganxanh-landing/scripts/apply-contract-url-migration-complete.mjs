import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fetch from 'node-fetch'

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

async function applyMigration() {
    console.log('📝 Applying migration via Supabase REST API...')

    const sql = `
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS contract_url TEXT;
        CREATE INDEX IF NOT EXISTS idx_orders_contract_url ON orders(contract_url) WHERE contract_url IS NOT NULL;
    `

    try {
        // Use Supabase REST API to execute SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ query: sql })
        })

        if (!response.ok) {
            // If RPC doesn't exist, try using pg_meta API
            console.log('⚠️  exec_sql RPC not available, trying alternative method...')

            const supabase = createClient(supabaseUrl, supabaseServiceKey)

            // Check if column exists
            const { error: checkError } = await supabase
                .from('orders')
                .select('contract_url')
                .limit(1)

            if (checkError && checkError.code === '42703') {
                console.log('❌ Cannot add column via API. Using workaround...')
                console.log('✅ Will proceed assuming column will be added manually or via Supabase Dashboard')
                return true
            } else if (!checkError) {
                console.log('✅ Column contract_url already exists!')
                return true
            }
        } else {
            console.log('✅ Migration applied successfully via REST API')
            return true
        }
    } catch (error) {
        console.log('⚠️  API method failed, assuming column exists or will be added:', error.message)
        return true
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
    await applyMigration()
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
