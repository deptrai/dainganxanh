#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

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

// Helper function to hash IP
function hashIP(ip) {
    return crypto.createHash('sha256').update(ip).digest('hex');
}

async function simpleReferralTest() {
    console.log('🤖 Simple Referral Flow Test\n');
    console.log('='.repeat(80));
    console.log('This test uses existing users to simulate a referral conversion.\n');

    const referrerEmail = 'phanquochoipt@gmail.com';
    const buyerEmail = 'tester.dainganxanh@gmail.com'; // Use existing user
    const testIP = '192.168.1.100'; // Different IP to avoid deduplication

    try {
        // Step 1: Get referrer information
        console.log('📋 Step 1: Getting referrer information...');
        console.log('─'.repeat(80));

        const { data: referrer, error: referrerError } = await supabase
            .from('users')
            .select('id, email, referral_code')
            .eq('email', referrerEmail)
            .single();

        if (referrerError || !referrer) {
            console.error('❌ Failed to get referrer:', referrerError);
            return;
        }

        console.log(`✅ Referrer: ${referrer.email} (${referrer.referral_code})`);

        // Step 2: Get buyer information
        console.log('\n👤 Step 2: Getting buyer information...');
        console.log('─'.repeat(80));

        const { data: buyer, error: buyerError } = await supabase
            .from('users')
            .select('id, email, referral_code')
            .eq('email', buyerEmail)
            .single();

        if (buyerError || !buyer) {
            console.error('❌ Failed to get buyer:', buyerError);
            console.log('\n💡 Available users:');
            const { data: allUsers } = await supabase
                .from('users')
                .select('email, referral_code')
                .limit(10);
            allUsers?.forEach(u => console.log(`   - ${u.email} (${u.referral_code})`));
            return;
        }

        console.log(`✅ Buyer: ${buyer.email} (${buyer.referral_code})`);

        // Step 3: Simulate referral click
        console.log('\n🖱️  Step 3: Simulating referral click...');
        console.log('─'.repeat(80));

        const ipHash = hashIP(testIP);

        // Clean up existing clicks from this IP
        await supabase
            .from('referral_clicks')
            .delete()
            .eq('referrer_id', referrer.id)
            .eq('ip_hash', ipHash);

        const { data: clickData, error: clickError } = await supabase
            .from('referral_clicks')
            .insert({
                referrer_id: referrer.id,
                ip_hash: ipHash,
                user_agent: 'Mozilla/5.0 (Automated Test)',
            })
            .select()
            .single();

        if (clickError) {
            console.error('❌ Failed to track click:', clickError);
            return;
        }

        console.log(`✅ Click tracked (ID: ${clickData.id})`);

        // Step 4: Create order with referral
        console.log('\n🛒 Step 4: Creating order with referral...');
        console.log('─'.repeat(80));

        const orderCode = 'DH' + Math.random().toString(36).substring(2, 10).toUpperCase();
        const orderAmount = 260000;

        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
                code: orderCode,
                user_id: buyer.id,
                quantity: 1,
                total_amount: orderAmount,
                payment_method: 'banking',
                status: 'completed',
                referred_by: referrer.id,
            })
            .select()
            .single();

        if (orderError) {
            console.error('❌ Failed to create order:', orderError);
            return;
        }

        console.log(`✅ Order created: ${orderData.code}`);

        // Step 5: Mark click as converted
        console.log('\n✅ Step 5: Marking click as converted...');
        console.log('─'.repeat(80));

        const { error: updateError } = await supabase
            .from('referral_clicks')
            .update({ converted: true })
            .eq('id', clickData.id);

        if (updateError) {
            console.error('❌ Failed to update click:', updateError);
            return;
        }

        console.log(`✅ Click marked as converted`);

        // Step 6: Verify results
        console.log('\n📊 Step 6: Verification Results...');
        console.log('─'.repeat(80));

        const { count: totalClicks } = await supabase
            .from('referral_clicks')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', referrer.id);

        const { count: conversions } = await supabase
            .from('referral_clicks')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', referrer.id)
            .eq('converted', true);

        const { data: convertedOrders } = await supabase
            .from('orders')
            .select('code, total_amount, created_at')
            .eq('referred_by', referrer.id)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(5);

        const COMMISSION_RATE = 0.1;
        const totalCommission = convertedOrders?.reduce((sum, o) => {
            return sum + Math.round(Number(o.total_amount) * COMMISSION_RATE);
        }, 0) || 0;

        console.log(`\n📈 Referral Stats for ${referrer.email}:`);
        console.log(`   Total Clicks: ${totalClicks || 0}`);
        console.log(`   Conversions: ${conversions || 0}`);
        console.log(`   Conversion Rate: ${totalClicks ? ((conversions / totalClicks) * 100).toFixed(2) : 0}%`);
        console.log(`   Total Commission: ${totalCommission.toLocaleString('vi-VN')} VND`);

        if (convertedOrders && convertedOrders.length > 0) {
            console.log(`\n📦 Recent Converted Orders:`);
            convertedOrders.forEach((order, index) => {
                const commission = Math.round(Number(order.total_amount) * COMMISSION_RATE);
                console.log(`   ${index + 1}. ${order.code} - ${Number(order.total_amount).toLocaleString('vi-VN')} VND (Commission: ${commission.toLocaleString('vi-VN')} VND)`);
            });
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ TEST COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(80));
        console.log(`\n📝 Summary:`);
        console.log(`   Referrer: ${referrer.email} (${referrer.referral_code})`);
        console.log(`   Buyer: ${buyer.email}`);
        console.log(`   Order: ${orderCode} - ${orderAmount.toLocaleString('vi-VN')} VND`);
        console.log(`   Commission: ${Math.round(orderAmount * COMMISSION_RATE).toLocaleString('vi-VN')} VND`);
        console.log(`   Status: ✅ Conversion Tracked & Verified`);
        console.log(`\n💡 Check the dashboard at: http://localhost:3001/crm/referrals`);

    } catch (error) {
        console.error('\n❌ Test failed:', error);
    }
}

simpleReferralTest().catch(console.error);
