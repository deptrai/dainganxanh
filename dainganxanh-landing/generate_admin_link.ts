
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function generateAdminLink() {
    const adminEmail = 'phanquochoipt@gmail.com';
    console.log('Generating Admin Link for:', adminEmail);

    const { data: adminLink, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: adminEmail,
    });

    if (error) console.error('Error:', error);
    else console.log(`✅ Admin Magic Link: ${adminLink.properties.action_link}`);
}

generateAdminLink();
