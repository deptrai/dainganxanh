
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateMagicLinks() {
    const userEmail = 'tester@dainganxanh.com.vn';
    const adminEmail = 'phanquochoipt@gmail.com';

    console.log('1. Preparing Affiliate User:', userEmail);
    // Ensure user exists
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        user_metadata: { name: 'Test Affiliate' }
    });

    if (createError) {
        console.log(`   User might already exist or error: ${createError.message}`);
    } else {
        console.log(`   User created/verified.`);
    }

    // Generate Magic Link for User
    const { data: userLink, error: linkError1 } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userEmail,
    });

    if (linkError1) console.error('Error generic user link:', linkError1);
    else console.log(`✅ Affiliate Magic Link: ${userLink.properties.action_link}`);

    // Generate Magic Link for Admin
    console.log('\n2. Preparing Admin User:', adminEmail);
    const { data: adminLink, error: linkError2 } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: adminEmail,
    });

    if (linkError2) console.error('Error creating admin link:', linkError2);
    else console.log(`✅ Admin Magic Link: ${adminLink.properties.action_link}`);
}

generateMagicLinks();
