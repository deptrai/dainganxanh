'use client'

import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. ' +
        'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment. ' +
        `Current values: URL=${supabaseUrl ? 'set' : 'MISSING'}, KEY=${supabaseAnonKey ? 'set' : 'MISSING'}`
    )
}

/**
 * Creates a Supabase client for browser/client components
 * Uses @supabase/ssr to ensure session is stored in cookies (middleware-compatible)
 *
 * @returns Supabase client instance
 */
export function createBrowserClient() {
    return createSSRBrowserClient(supabaseUrl, supabaseAnonKey)
}
