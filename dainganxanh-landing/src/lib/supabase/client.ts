'use client'

import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Creates a Supabase client for browser/client components
 * Uses @supabase/ssr to ensure session is stored in cookies (middleware-compatible)
 * 
 * @returns Supabase client instance
 */
export function createBrowserClient() {
    return createSSRBrowserClient(supabaseUrl, supabaseAnonKey)
}
