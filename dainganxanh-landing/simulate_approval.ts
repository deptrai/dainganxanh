
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
    const withdrawalId = 'e88da3b6-9eed-4849-b73e-1209cd9b7e7b'; // The passed ID
    const proofImageUrl = 'https://placehold.co/600x400.png';
    const adminId = 'dfdf03f7-aec8-4080-bcd2-169e8c1d95ed'; // phanquochoipt@gmail.com

    console.log(`Simulating approval for withdrawal: ${withdrawalId}`);

    // 1. Update DB to Approved
    const { data: updatedWithdrawal, error: updateError } = await supabase
        .from('withdrawals')
        .update({
            status: 'approved',
            proof_image_url: proofImageUrl,
            approved_by: adminId,
            approved_at: new Date().toISOString()
        })
        .eq('id', withdrawalId)
        .select()
        .single();

    if (updateError) {
        console.error('❌ DB Update Failed:', updateError);
        return;
    }
    console.log('✅ DB Updated to Approved.');

    // 2. Fetch User Email (needed for Edge Function payload)
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(updatedWithdrawal.user_id);

    if (userError || !userData.user) {
        console.error('❌ Fetch User Failed:', userError);
        return;
    }
    const userEmail = userData.user.email;
    console.log('   User Email:', userEmail);

    // 3. Call Edge Function
    console.log('\nInvoking Edge Function send-withdrawal-email...');

    const payload = {
        to: userEmail, // IMPORTANT: New field name
        dynamic_template_data: {
            action_url: `${process.env.NEXT_PUBLIC_BASE_URL}/crm/referrals`,
            amount: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(updatedWithdrawal.amount),
            status: 'Đã duyệt',
            bank_name: updatedWithdrawal.bank_name,
            bank_account_number: updatedWithdrawal.bank_account_number,
            bank_account_name: updatedWithdrawal.bank_account_name,
            proof_image_url: proofImageUrl
        }
    };

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
