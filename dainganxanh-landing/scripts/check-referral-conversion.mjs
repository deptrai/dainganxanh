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

async function checkReferralConversion() {
    console.log('🔍 Checking Referral Conversion for Order: DHQI7AUJ\n');

    // 1. Check the order details
    console.log('📦 Order Details:');
    console.log('─'.repeat(80));
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, code, user_id, quantity, total_amount, referred_by, status, created_at')
        .eq('code', 'DHQI7AUJ')
        .single();

    if (orderError) {
        console.error('❌ Error fetching order:', orderError);
        return;
    } else if (!order) {
        console.log('⚠️  Order not found');
        return;
    }

    // Fetch user data separately
    let userData = null;
    if (order.user_id) {
        const { data: user } = await supabase.auth.admin.getUserById(order.user_id);
        userData = user?.user;
    }

    console.log(`Order ID: ${order.id}`);
    console.log(`Order Code: ${order.code}`);
    console.log(`User Email: ${userData?.email || 'N/A'}`);
    console.log(`User ID: ${order.user_id || 'N/A'}`);
    console.log(`Quantity: ${order.quantity}`);
    console.log(`Total Amount: ${order.total_amount.toLocaleString('vi-VN')} VND`);
    console.log(`Referred By: ${order.referred_by || 'None'}`);
    console.log(`Status: ${order.status}`);
    console.log(`Created: ${new Date(order.created_at).toLocaleString('vi-VN')}`);

    console.log('\n');

    // 2. If there's a referrer, check referrer details
    if (order?.referred_by) {
        console.log('👤 Referrer Details:');
        console.log('─'.repeat(80));
        const { data: referrer, error: referrerError } = await supabase
            .from('users')
            .select('id, email, referral_code, full_name')
            .eq('id', order.referred_by)
            .single();

        if (referrerError) {
            console.error('❌ Error fetching referrer:', referrerError);
        } else if (!referrer) {
            console.log('⚠️  Referrer not found');
        } else {
            console.log(`Referrer ID: ${referrer.id}`);
            console.log(`Referrer Email: ${referrer.email}`);
            console.log(`Referrer Name: ${referrer.full_name || 'N/A'}`);
            console.log(`Referral Code: ${referrer.referral_code}`);
        }

        console.log('\n');

        // 3. Check referral clicks for this referrer
        console.log('🖱️  Referral Clicks:');
        console.log('─'.repeat(80));
        const { data: clicks, error: clicksError } = await supabase
            .from('referral_clicks')
            .select('id, referrer_id, converted, created_at, ip_hash')
            .eq('referrer_id', order.referred_by)
            .order('created_at', { ascending: false })
            .limit(10);

        if (clicksError) {
            console.error('❌ Error fetching clicks:', clicksError);
        } else if (!clicks || clicks.length === 0) {
            console.log('⚠️  No clicks found for this referrer');
        } else {
            console.log(`Total clicks found: ${clicks.length}`);
            clicks.forEach((click, index) => {
                console.log(`\nClick #${index + 1}:`);
                console.log(`  ID: ${click.id}`);
                console.log(`  Converted: ${click.converted ? '✅ YES' : '❌ NO'}`);
                console.log(`  IP Hash: ${click.ip_hash.substring(0, 16)}...`);
                console.log(`  Created: ${new Date(click.created_at).toLocaleString('vi-VN')}`);
            });
        }

        console.log('\n');

        // 4. Calculate commission
        const COMMISSION_RATE = 0.1; // 10%
        const commission = Math.round(Number(order.total_amount) * COMMISSION_RATE);

        console.log('💰 Commission Calculation:');
        console.log('─'.repeat(80));
        console.log(`Order Amount: ${order.total_amount.toLocaleString('vi-VN')} VND`);
        console.log(`Commission Rate: ${(COMMISSION_RATE * 100)}%`);
        console.log(`Commission: ${commission.toLocaleString('vi-VN')} VND`);

        console.log('\n');

        // 5. Check overall referral stats
        console.log('📊 Overall Referral Stats for this Referrer:');
        console.log('─'.repeat(80));

        const { count: totalClicks } = await supabase
            .from('referral_clicks')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', order.referred_by);

        const { count: conversions } = await supabase
            .from('referral_clicks')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', order.referred_by)
            .eq('converted', true);

        const { data: convertedOrders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('referred_by', order.referred_by)
            .eq('status', 'completed');

        const totalCommission = convertedOrders?.reduce((sum, o) => {
            return sum + Math.round(Number(o.total_amount) * COMMISSION_RATE);
        }, 0) || 0;

        console.log(`Total Clicks: ${totalClicks || 0}`);
        console.log(`Conversions: ${conversions || 0}`);
        console.log(`Conversion Rate: ${totalClicks ? ((conversions / totalClicks) * 100).toFixed(2) : 0}%`);
        console.log(`Total Commission: ${totalCommission.toLocaleString('vi-VN')} VND`);
    } else {
        console.log('ℹ️  This order has no referrer (organic order)');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Referral Conversion Check Complete');
}

checkReferralConversion().catch(console.error);
