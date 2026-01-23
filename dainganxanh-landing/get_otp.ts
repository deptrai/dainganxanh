import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function getLatestOTP() {
    const { data, error } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('email', 'dainganxanh_test@gmail.com')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log('Latest OTP for dainganxanh_test@gmail.com:', data[0].code);
        console.log('Expires at:', data[0].expires_at);
    } else {
        console.log('No OTP found for dainganxanh_test@gmail.com');
    }
}

getLatestOTP();
