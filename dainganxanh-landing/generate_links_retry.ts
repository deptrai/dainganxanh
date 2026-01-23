
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

async function generateUserLink() {
    const userEmail = 'affiliate.test@dainganxanh.com.vn';

    console.log('Preparing Affiliate User:', userEmail);

    // Try to delete if exists to clean state
    const { data: searchData } = await supabase.auth.admin.listUsers();
    const existingUser = searchData?.users.find(u => u.email === userEmail);
    if (existingUser) {
        await supabase.auth.admin.deleteUser(existingUser.id);
        console.log('Deleted existing user to retry fresh.');
    }

    const { data: user, error: createError } = await supabase.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        user_metadata: { name: 'Test Affiliate' },
        role: 'user' // Explicitly set role if needed, though default is authenticated
    });

    if (createError) {
        console.log(`Error creating user: ${createError.message}`);
        // If creation fails, we might still try to generate link if user exists
    } else {
        console.log(`User created.`);

        // Ensure entry in public.users (if trigger failed)
        // We can manually insert to be sure
        const { error: dbError } = await supabase.from('users').upsert({
            id: user.user.id,
            email: userEmail,
            role: 'user',
            name: 'Test Affiliate'
        });
        if (dbError) console.log('Error inserting to public.users:', dbError.message);
    }

    const { data: userLink, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userEmail,
    });

    if (linkError) console.error('Error generating link:', linkError);
    else console.log(`✅ Affiliate Magic Link: ${userLink.properties.action_link}`);
}

generateUserLink();
