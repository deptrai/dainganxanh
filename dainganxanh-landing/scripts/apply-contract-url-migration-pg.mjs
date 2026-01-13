import pg from 'pg'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Client } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const connectionString = process.env.POSTGRESURI

if (!connectionString) {
    console.error('❌ Missing POSTGRESURI in .env.local')
    process.exit(1)
}

async function main() {
    const client = new Client({ connectionString })

    try {
        await client.connect()
        console.log('✅ Connected to PostgreSQL')

        // Add contract_url column
        console.log('📝 Adding contract_url column...')
        await client.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS contract_url TEXT;')
        console.log('✅ Column added')

        // Add index
        console.log('📝 Creating index...')
        await client.query('CREATE INDEX IF NOT EXISTS idx_orders_contract_url ON orders(contract_url) WHERE contract_url IS NOT NULL;')
        console.log('✅ Index created')

        // Add test data
        console.log('🔍 Finding orders without contract_url...')
        const result = await client.query(`
            SELECT id, order_code, status
            FROM orders
            WHERE contract_url IS NULL
            AND status IN ('verified', 'assigned', 'completed')
            LIMIT 10
        `)

        if (result.rows.length === 0) {
            console.log('✅ All eligible orders already have contract_url')
        } else {
            console.log(`📝 Found ${result.rows.length} orders without contract_url`)

            for (const order of result.rows) {
                const contractUrl = `https://storage.supabase.co/contracts/test-${order.id}.pdf`
                const orderCode = order.order_code || `ORD-${order.id.substring(0, 8)}`

                await client.query(
                    'UPDATE orders SET contract_url = $1, order_code = $2 WHERE id = $3',
                    [contractUrl, orderCode, order.id]
                )

                console.log(`✅ Updated order ${orderCode} with contract URL`)
            }

            console.log('🎉 Done! Contract URLs added to test orders')
        }

    } catch (error) {
        console.error('❌ Error:', error)
        process.exit(1)
    } finally {
        await client.end()
        console.log('✅ Database connection closed')
    }
}

main()
    .then(() => {
        console.log('✅ Migration complete!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Script failed:', error)
        process.exit(1)
    })
