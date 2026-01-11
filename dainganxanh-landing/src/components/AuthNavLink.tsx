'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'

export function AuthNavLink() {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const supabase = createBrowserClient()

        const checkAuth = async () => {
            // Use getUser() for proper token validation
            const {
                data: { user },
            } = await supabase.auth.getUser()
            setIsAuthenticated(!!user)
            setIsLoading(false)
        }

        checkAuth()

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session?.user)
        })

        return () => subscription.unsubscribe()
    }, [])

    if (isLoading) {
        return (
            <a
                href="#dashboard"
                className="text-brand-600 hover:text-brand-500 font-medium transition-colors hover:scale-105 transform duration-200"
            >
                Vườn Của Tôi
            </a>
        )
    }

    if (isAuthenticated) {
        return (
            <Link
                href="/crm/my-garden"
                className="text-brand-600 hover:text-brand-500 font-medium transition-colors hover:scale-105 transform duration-200"
            >
                Vườn Của Tôi
            </Link>
        )
    }

    // Not authenticated - scroll to dashboard section on landing page
    return (
        <a
            href="#dashboard"
            className="text-brand-600 hover:text-brand-500 font-medium transition-colors hover:scale-105 transform duration-200"
        >
            Vườn Của Tôi
        </a>
    )
}
