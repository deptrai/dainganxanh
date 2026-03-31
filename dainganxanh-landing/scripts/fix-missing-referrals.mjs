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

/**
 * Fix missing referred_by for orders
 * This script restores referral attribution for orders that lost their referred_by value
 */
async function fixMissingReferrals() {
    console.log('🔧 Starting Fix for Missing Referrals\n');
    console.log('='.repeat(80));

    // Step 1: Get the default referrer (dainganxanh)
    console.log('\n📌 Step 1: Looking up default referrer "dainganxanh"...');
    console.log('─'.repeat(80));

    const { data: defaultReferrer, error: referrerError } = await supabase
        .from('users')
        .select('id, email, referral_code, full_name')
        .eq('referral_code', 'dainganxanh')
        .single();

    if (referrerError || !defaultReferrer) {
        console.error('❌ Error: Could not find default referrer "dainganxanh"');
        console.error(referrerError);
        process.exit(1);
    }

    console.log('✅ Found default referrer:');
    console.log(`   ID: ${defaultReferrer.id}`);
    console.log(`   Email: ${defaultReferrer.email}`);
    console.log(`   Referral Code: ${defaultReferrer.referral_code}`);
    console.log(`   Name: ${defaultReferrer.full_name || 'N/A'}`);

    // Step 2: Find orders with NULL referred_by
    console.log('\n📌 Step 2: Finding orders with missing referred_by...');
    console.log('─'.repeat(80));

    const { data: ordersWithoutReferrer, error: ordersError } = await supabase
        .from('orders')
        .select('id, code, user_email, total_amount, status, created_at')
        .is('referred_by', null)
        .order('created_at', { ascending: false });

    if (ordersError) {
        console.error('❌ Error fetching orders:', ordersError);
        process.exit(1);
    }

    if (!ordersWithoutReferrer || ordersWithoutReferrer.length === 0) {
        console.log('✅ No orders found with missing referred_by. All good!');
        process.exit(0);
    }

    console.log(`⚠️  Found ${ordersWithoutReferrer.length} orders with missing referred_by:`);
    console.log('');

    ordersWithoutReferrer.forEach((order, index) => {
        console.log(`   ${index + 1}. ${order.code}`);
        console.log(`      Email: ${order.user_email || 'N/A'}`);
        console.log(`      Amount: ${Number(order.total_amount).toLocaleString('vi-VN')} VND`);
        console.log(`      Status: ${order.status}`);
        console.log(`      Created: ${new Date(order.created_at).toLocaleString('vi-VN')}`);
        console.log('');
    });

    // Step 3: Calculate expected commission
    console.log('\n📌 Step 3: Calculating expected commission impact...');
    console.log('─'.repeat(80));

    const COMMISSION_RATE = 0.05; // 5%
    const completedOrders = ordersWithoutReferrer.filter(o => o.status === 'completed');
    const totalLostCommission = completedOrders.reduce((sum, order) => {
        return sum + Math.round(Number(order.total_amount) * COMMISSION_RATE);
    }, 0);

    console.log(`Completed orders affected: ${completedOrders.length}`);
    console.log(`Total lost commission: ${totalLostCommission.toLocaleString('vi-VN')} VND`);
    console.log(`Commission rate: ${(COMMISSION_RATE * 100)}%`);

    // Step 4: Confirm before updating
    console.log('\n📌 Step 4: Ready to update orders...');
    console.log('─'.repeat(80));
    console.log(`Will update ${ordersWithoutReferrer.length} orders with referred_by = ${defaultReferrer.id}`);
    console.log('');

    // For safety, we'll do a dry run first
    const isDryRun = process.argv.includes('--dry-run');

    if (isDryRun) {
        console.log('🔍 DRY RUN MODE - No changes will be made');
        console.log('   Remove --dry-run flag to apply changes');
        console.log('');
    } else {
        console.log('⚠️  LIVE MODE - Changes will be applied to database');
        console.log('   Add --dry-run flag to preview without changes');
        console.log('');
    }

    // Step 5: Update the orders
    console.log('\n📌 Step 5: Updating orders...');
    console.log('─'.repeat(80));

    if (!isDryRun) {
        const orderIds = ordersWithoutReferrer.map(o => o.id);

        const { data: updatedOrders, error: updateError } = await supabase
            .from('orders')
            .update({ referred_by: defaultReferrer.id })
            .in('id', orderIds)
            .select('id, code');

        if (updateError) {
            console.error('❌ Error updating orders:', updateError);
            process.exit(1);
        }

        console.log(`✅ Successfully updated ${updatedOrders?.length || 0} orders`);

        if (updatedOrders && updatedOrders.length > 0) {
            console.log('\nUpdated order codes:');
            updatedOrders.forEach((order, index) => {
                console.log(`   ${index + 1}. ${order.code}`);
            });
        }
    } else {
        console.log('✅ Dry run complete - no changes made');
        console.log(`   Would have updated ${ordersWithoutReferrer.length} orders`);
    }

    // Step 6: Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total orders processed: ${ordersWithoutReferrer.length}`);
    console.log(`Completed orders: ${completedOrders.length}`);
    console.log(`Commission recovered: ${totalLostCommission.toLocaleString('vi-VN')} VND`);
    console.log(`Default referrer: ${defaultReferrer.email} (${defaultReferrer.referral_code})`);
    console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log('='.repeat(80));

    if (isDryRun) {
        console.log('\n💡 To apply these changes, run: node scripts/fix-missing-referrals.mjs');
    } else {
        console.log('\n✅ Fix complete! Referral attributions have been restored.');
    }
}

// Run the fix
fixMissingReferrals().catch(console.error);
