import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// CRITICAL: Use createBrowserClient from @supabase/ssr (NOT createClient from supabase-js)
// This ensures session is stored in cookies, which middleware can read server-side
// createClient from supabase-js stores in localStorage which server can't access
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
