
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simulateApproval() {
    const withdrawalId = 'e88da3b6-9eed-4849-b73e-1209cd9b7e7b';
    const proofImageUrl = 'https://placehold.co/600x400.png';

    console.log(`Simulating approval for withdrawal: ${withdrawalId}`);

    // 1. Fetch withdrawal info (NO JOIN)
    const { data: withdrawal, error: fetchError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();

    if (fetchError) {
        console.error('Fetch error:', fetchError);
        return;
    }
    console.log('✅ Fetched Withdrawal:', withdrawal.id);

    // 2. Fetch full user info for name
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(withdrawal.user_id);

    if (userError || !userData.user) {
        console.error('Fetch User Error:', userError);
        return;
    }

    const user = userData.user;
    const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Quý khách';

    // 3. Call Edge Function with CORRECT Payload
    console.log('\nInvoking Edge Function send-withdrawal-email...');

    const payload = {
        type: 'request_approved',
        to: user.email,
        fullName: userName,
        amount: withdrawal.amount,
        bankName: withdrawal.bank_name,
        bankAccountNumber: withdrawal.bank_account_number,
        withdrawalId: withdrawal.id,
        proofImageUrl: proofImageUrl
    };

    console.log('Payload:', payload);

    const response = await fetch(`${supabaseUrl}/functions/v1/send-withdrawal-email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
        console.log('✅ Edge Function Success:', result);
    } else {
        console.error('❌ Edge Function Failed:', result);
    }
}

simulateApproval();
