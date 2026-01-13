#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugReferralFlow() {
    console.log('🔍 Debugging Referral Flow\n');

    // 1. Check if there are any referral clicks in the last hour
    console.log('📊 Recent Referral Clicks (Last 2 hours):');
    console.log('─'.repeat(80));

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: recentClicks, error: clicksError } = await supabase
        .from('referral_clicks')
        .select(`
      id,
      referrer_id,
      converted,
      created_at,
      ip_hash,
      users!referral_clicks_referrer_id_fkey(email, referral_code)
    `)
        .gte('created_at', twoHoursAgo)
        .order('created_at', { ascending: false });

    if (clicksError) {
        console.error('❌ Error fetching clicks:', clicksError);
    } else if (!recentClicks || recentClicks.length === 0) {
        console.log('⚠️  No referral clicks found in the last 2 hours');
    } else {
        console.log(`Found ${recentClicks.length} click(s):\n`);
        recentClicks.forEach((click, index) => {
            console.log(`Click #${index + 1}:`);
            console.log(`  ID: ${click.id}`);
            console.log(`  Referrer Email: ${click.users?.email || 'N/A'}`);
            console.log(`  Referral Code: ${click.users?.referral_code || 'N/A'}`);
            console.log(`  Converted: ${click.converted ? '✅ YES' : '❌ NO'}`);
            console.log(`  IP Hash: ${click.ip_hash.substring(0, 16)}...`);
            console.log(`  Created: ${new Date(click.created_at).toLocaleString('vi-VN')}`);
            console.log('');
        });
    }

    console.log('\n');

    // 2. Check recent orders
    console.log('📦 Recent Orders (Last 2 hours):');
    console.log('─'.repeat(80));

    const { data: recentOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id, code, user_id, total_amount, referred_by, status, created_at')
        .gte('created_at', twoHoursAgo)
        .order('created_at', { ascending: false });

    if (ordersError) {
        console.error('❌ Error fetching orders:', ordersError);
    } else if (!recentOrders || recentOrders.length === 0) {
        console.log('⚠️  No orders found in the last 2 hours');
    } else {
        console.log(`Found ${recentOrders.length} order(s):\n`);
        for (const order of recentOrders) {
            const { data: user } = await supabase.auth.admin.getUserById(order.user_id);
            console.log(`Order Code: ${order.code}`);
            console.log(`  User Email: ${user?.user?.email || 'N/A'}`);
            console.log(`  Total Amount: ${order.total_amount.toLocaleString('vi-VN')} VND`);
            console.log(`  Referred By: ${order.referred_by || 'None'}`);
            console.log(`  Status: ${order.status}`);
            console.log(`  Created: ${new Date(order.created_at).toLocaleString('vi-VN')}`);
            console.log('');
        }
    }

    console.log('\n');

    // 3. Check all users with referral codes
    console.log('👥 Users with Referral Codes:');
    console.log('─'.repeat(80));

    const { data: usersWithCodes, error: usersError } = await supabase
        .from('users')
        .select('id, email, referral_code, full_name')
        .not('referral_code', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

    if (usersError) {
        console.error('❌ Error fetching users:', usersError);
    } else if (!usersWithCodes || usersWithCodes.length === 0) {
        console.log('⚠️  No users with referral codes found');
    } else {
        console.log(`Found ${usersWithCodes.length} user(s) with referral codes:\n`);
        usersWithCodes.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`);
            console.log(`   Code: ${user.referral_code}`);
            console.log(`   Name: ${user.full_name || 'N/A'}`);
            console.log('');
        });
    }

    console.log('='.repeat(80));
    console.log('✅ Debug Complete');
}

debugReferralFlow().catch(console.error);
