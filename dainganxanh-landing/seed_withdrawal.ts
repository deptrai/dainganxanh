
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function seedWithdrawal() {
    const userId = '054d9251-3b61-403d-a792-485624141d97'; // dainganxanh_test@gmail.com

    console.log('Seeding pending withdrawal request...');

    const { data, error } = await supabase
        .from('withdrawals')
        .insert({
            user_id: userId,
            amount: 250000,
            bank_name: 'Vietcombank',
            bank_account_number: '999988887777',
            bank_account_name: 'NGUYEN VAN TEST',
            status: 'pending'
        })
        .select()
        .single();

    if (error) {
        console.error('Error seeding withdrawal:', error);
    } else {
        console.log('✅ Withdrawal Request Created:', data.id);
    }
}

seedWithdrawal();
