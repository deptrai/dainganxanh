
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function checkSpecificLog() {
    console.log('Searching for withdrawal_notification...');
    const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('email_type', 'withdrawal_notification')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching logs:', error);
    } else {
        console.log(`Found ${data.length} records.`);
        console.log('Records:', JSON.stringify(data, null, 2));
    }
}

checkSpecificLog();
