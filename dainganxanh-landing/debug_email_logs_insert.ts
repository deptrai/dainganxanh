
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function debugInsert() {
    console.log('Attempting debug insert into email_logs WITH withdrawal_id as order_id...');

    const payload = {
        email_type: 'withdrawal_notification',
        recipient: 'test_debug_uuid_hack@gmail.com',
        status: 'sent',
        resend_id: 'test_id_uuid_hack',
        sent_at: new Date().toISOString(),
        order_id: 'e88da3b6-9eed-4849-b73e-1209cd9b7e7b' // Using Withdrawal ID here
    };

    const { data, error } = await supabase
        .from('email_logs')
        .insert(payload)
        .select();

    if (error) {
        console.error('❌ Insert Error:', error);
    } else {
        console.log('✅ Insert Success:', data);
    }
}

debugInsert();
