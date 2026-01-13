// Script to create contracts storage bucket via Supabase API
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function createContractsBucket() {
    console.log('🪣 Creating contracts storage bucket...')

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
        console.error('❌ Error listing buckets:', listError)
        return
    }

    const bucketExists = buckets?.some(b => b.id === 'contracts')

    if (bucketExists) {
        console.log('✅ Bucket "contracts" already exists')
        return
    }

    // Create bucket
    const { data, error } = await supabase.storage.createBucket('contracts', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf']
    })

    if (error) {
        console.error('❌ Error creating bucket:', error)
        return
    }

    console.log('✅ Bucket "contracts" created successfully:', data)
}

createContractsBucket()
