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

async function createMigrationFunction() {
    console.log('📝 Creating PostgreSQL function to apply migration...')

    // First, create a function that can execute DDL
    const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION apply_contract_url_migration()
        RETURNS text
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            -- Add column if not exists
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'orders' AND column_name = 'contract_url'
            ) THEN
                ALTER TABLE orders ADD COLUMN contract_url TEXT;
                RAISE NOTICE 'Column contract_url added';
            ELSE
                RAISE NOTICE 'Column contract_url already exists';
            END IF;

            -- Create index if not exists
            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE tablename = 'orders' AND indexname = 'idx_orders_contract_url'
            ) THEN
                CREATE INDEX idx_orders_contract_url ON orders(contract_url) WHERE contract_url IS NOT NULL;
                RAISE NOTICE 'Index idx_orders_contract_url created';
            ELSE
                RAISE NOTICE 'Index idx_orders_contract_url already exists';
            END IF;

            RETURN 'Migration applied successfully';
        END;
        $$;
    `

    try {
        // Try to call an existing function first to see if it works
        const { data, error } = await supabase.rpc('apply_contract_url_migration')

        if (error && error.code === '42883') {
            // Function doesn't exist, we need to create it
            console.log('⚠️  Function does not exist. Cannot create functions via Supabase client.')
            console.log('📝 Please run this SQL in Supabase SQL Editor:')
            console.log('   https://supabase.com/dashboard/project/gzuuyzikjvykjpeixzqk/sql')
            console.log('')
            console.log(createFunctionSQL)
            console.log('')
            console.log('Then run this script again.')
            return false
        } else if (error) {
            console.error('❌ Error calling function:', error)
            return false
        } else {
            console.log('✅ Migration function executed:', data)
            return true
        }
    } catch (error) {
        console.error('❌ Error:', error)
        return false
    }
}

async function addTestData() {
    console.log('🔍 Adding test contract URLs to orders...')

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
    const success = await createMigrationFunction()

    if (success) {
        await addTestData()
    }
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
