import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function getTestAccounts() {
    console.log('Fetching test accounts from Supabase...\n');

    // Get admin user
    const { data: adminUsers, error: adminError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('role', 'admin')
        .limit(1);

    if (adminError) {
        console.error('Error fetching admin:', adminError);
    } else if (adminUsers && adminUsers.length > 0) {
        console.log('✅ Admin Account:');
        console.log(`   Email: ${adminUsers[0].email}`);
        console.log(`   ID: ${adminUsers[0].id}\n`);
    }

    // Get regular user (affiliate)
    const { data: regularUsers, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('role', 'user')
        .limit(1);

    if (userError) {
        console.error('Error fetching user:', userError);
    } else if (regularUsers && regularUsers.length > 0) {
        console.log('✅ Affiliate User Account:');
        console.log(`   Email: ${regularUsers[0].email}`);
        console.log(`   ID: ${regularUsers[0].id}\n`);
    }

    // Check if affiliate has commission balance
    if (regularUsers && regularUsers.length > 0) {
        const { data: clicks, error: clicksError } = await supabase
            .from('referral_clicks')
            .select('order_id')
            .eq('user_id', regularUsers[0].id)
            .not('order_id', 'is', null);

        if (!clicksError && clicks) {
            console.log(`   Referral Clicks with Orders: ${clicks.length}`);
        }
    }
}

getTestAccounts();
