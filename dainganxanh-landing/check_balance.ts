
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function checkBalance() {
    const userId = '054d9251-3b61-403d-a792-485624141d97'; // dainganxanh_test@gmail.com

    console.log(`Checking balance for user ${userId}...`);

    // Get total commissions from clicks/orders
    // Note: This logic mimics getAvailableBalance in actions/withdrawals.ts

    // 1. Get referral clicks with orders
    const { data: clicks } = await supabase
        .from('referral_clicks')
        .select('*, orders(*)')
        .eq('user_id', userId)
        .not('order_id', 'is', null);

    let totalCommission = 0;
    if (clicks) {
        clicks.forEach(click => {
            if (click.orders && click.orders.total_amount) {
                // Simplified: Assuming 10% commission or whatever the logic is
                // Actually the logic is in the code. Let's just check raw clicks.
                // If orders exist, we need to know the commission rate from 'referral_settings' or default.
                // Assuming 10% for now to estimate.
                totalCommission += Number(click.orders.total_amount) * 0.1;
            }
        });
    }

    console.log(`Estimated Total Commission: ${totalCommission}`);

    // 2. Get withdrawn amount
    const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount')
        .eq('user_id', userId)
        .in('status', ['pending', 'approved']);

    const withdrawn = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
    console.log(`Withdrawn/Pending: ${withdrawn}`);

    const available = totalCommission - withdrawn;
    console.log(`Available Balance: ${available}`);

    if (available < 200000) {
        console.log('❌ Balance too low. Injecting fake order...');
        // Inject fake order and click to boost balance
        const fakeOrderId = `ORDER_${Date.now()}`;

        // 1. Create Order
        await supabase.from('orders').insert({
            id: fakeOrderId,
            total_amount: 5000000, // 5M VND -> 500k commission
            status: 'completed',
            customer_name: 'Fake Customer',
            customer_email: 'fake@customer.com',
            customer_phone: '0909090909',
            address: 'Fake Address'
        });

        // 2. Create Click linked to Order
        await supabase.from('referral_clicks').insert({
            user_id: userId,
            order_id: fakeOrderId,
            ip_address: '127.0.0.1',
            device_info: 'Test Script'
        });
        console.log('✅ Injected fake order (5,000,000 VND). Balance should be sufficient now.');
    } else {
        console.log('✅ Balance sufficient for testing.');
    }
}

checkBalance();
