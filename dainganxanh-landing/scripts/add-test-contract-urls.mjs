import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

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

async function addContractUrlColumn() {
    console.log('📝 Adding contract_url column to orders table...')

    try {
        // First, check if column exists by trying to select it
        const { error: checkError } = await supabase
            .from('orders')
            .select('contract_url')
            .limit(1)

        if (!checkError) {
            console.log('✅ Column contract_url already exists')
            return true
        }

        if (checkError.code !== '42703') {
            // Error is not "column does not exist"
            console.error('❌ Unexpected error:', checkError)
            return false
        }

        console.log('⚠️  Column does not exist, please add it manually via Supabase Dashboard:')
        console.log('')
        console.log('SQL to run in Supabase SQL Editor:')
        console.log('-----------------------------------')
        console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS contract_url TEXT;')
        console.log('CREATE INDEX IF NOT EXISTS idx_orders_contract_url ON orders(contract_url) WHERE contract_url IS NOT NULL;')
        console.log('-----------------------------------')
        console.log('')
        console.log('After running the SQL, run this script again to add test data.')

        return false
    } catch (error) {
        console.error('❌ Error:', error)
        return false
    }
}

async function addTestContractUrls() {
    console.log('🔍 Fetching orders without contract_url...')

    // Get orders that don't have contract_url yet AND have a valid user_id
    // (so they appear in admin UI which requires user association)
    const { data: orders, error: fetchError } = await supabase
        .from('orders')
        .select('id, user_id')
        .is('contract_url', null)
        .not('user_id', 'is', null)
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

    // Update each order with a test contract URL
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
    const columnExists = await addContractUrlColumn()

    if (columnExists) {
        await addTestContractUrls()
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Script failed:', error)
        process.exit(1)
    })
