/**
 * Test script to verify Supabase Auth configuration
 * Run: npx tsx test_supabase_auth.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
    process.exit(1);
}

console.log('🔍 Testing Supabase Auth Configuration\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey.substring(0, 20) + '...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
    try {
        console.log('📧 Testing Email OTP...');
        
        // Test with a sample email
        const testEmail = 'test@example.com';
        
        const { data, error } = await supabase.auth.signInWithOtp({
            email: testEmail,
            options: {
                shouldCreateUser: true,
                emailRedirectTo: 'http://localhost:3001/auth/callback'
            }
        });

        if (error) {
            console.error('❌ OTP Error:', error.message);
            console.error('Error details:', JSON.stringify(error, null, 2));
            
            // Provide specific guidance based on error
            if (error.message.includes('fetch')) {
                console.log('\n💡 Troubleshooting:');
                console.log('1. Check if Supabase project is active');
                console.log('2. Verify network connectivity');
                console.log('3. Check if URL is correct');
            } else if (error.message.includes('Email')) {
                console.log('\n💡 Troubleshooting:');
                console.log('1. Go to Supabase Dashboard → Authentication → Providers');
                console.log('2. Enable "Email" provider');
                console.log('3. Configure SMTP settings (or use Supabase default)');
                console.log('4. Make sure "Enable email confirmations" is configured');
            }
            
            return false;
        }

        console.log('✅ OTP request successful!');
        console.log('Response:', JSON.stringify(data, null, 2));
        return true;

    } catch (err) {
        console.error('❌ Unexpected error:', err);
        return false;
    }
}

async function checkAuthSettings() {
    try {
        console.log('\n🔧 Checking Auth Settings...');
        
        // Try to get auth settings (this will fail with anon key, but we can see the error)
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
            console.log('No active session (expected)');
        } else {
            console.log('Session data:', data);
        }
        
        console.log('\n📋 Next Steps:');
        console.log('1. Go to: https://supabase.com/dashboard/project/gzuuyzikjvykjpeixzqk/auth/providers');
        console.log('2. Enable "Email" provider');
        console.log('3. Configure email templates');
        console.log('4. Test OTP again');
        
    } catch (err) {
        console.error('Error checking settings:', err);
    }
}

// Run tests
(async () => {
    const success = await testAuth();
    await checkAuthSettings();
    
    if (!success) {
        console.log('\n⚠️  Auth test failed. Please check Supabase configuration.');
        process.exit(1);
    }
    
    console.log('\n✅ All tests passed!');
})();

