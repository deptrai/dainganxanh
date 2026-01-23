
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

async function generateExistingUserLink() {
    const userEmail = 'dainganxanh_test@gmail.com';

    console.log('Generating link for existing user:', userEmail);

    const { data: userLink, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userEmail,
    });

    if (linkError) console.error('Error generating link:', linkError);
    else console.log(`✅ Affiliate Magic Link: ${userLink.properties.action_link}`);
}

generateExistingUserLink();
