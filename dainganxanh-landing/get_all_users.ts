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

async function getAllUsers() {
    // Get all users from auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Error fetching auth users:', authError);
        return;
    }

    console.log('\n=== All Users in Auth ===');
    authData.users.forEach((user, idx) => {
        console.log(`\n${idx + 1}. Email: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Created: ${user.created_at}`);
    });

    // Get users table data
    const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, role')
        .limit(10);

    if (!usersError && usersData) {
        console.log('\n=== Users Table (with roles) ===');
        usersData.forEach((user, idx) => {
            console.log(`\n${idx + 1}. Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   ID: ${user.id}`);
        });
    }
}

getAllUsers();
