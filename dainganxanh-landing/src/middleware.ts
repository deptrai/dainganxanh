import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    // Set cookie on both request and response
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: any) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // IMPORTANT: Use getUser() instead of getSession() for security
    // getUser() validates the token with Supabase servers and refreshes if needed
    // getSession() only reads from cookies without validation (can be spoofed)
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    // Log session status for debugging
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Middleware] Path: ${request.nextUrl.pathname}, User: ${user?.email || 'none'}, Error: ${error?.message || 'none'}`)
    }

    // Protect /crm routes - require authentication
    if (request.nextUrl.pathname.startsWith('/crm')) {
        if (!user) {
            // Redirect to login with return URL
            const redirectUrl = new URL('/login', request.url)
            redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
            return NextResponse.redirect(redirectUrl)
        }
    }

    // ── Security headers ───────────────────────────────────────────────────
    // Skip for Next.js internals and static assets (already excluded by matcher,
    // but guard here for belt-and-suspenders).
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

    // Content-Security-Policy
    // - default-src 'self': block all external by default
    // - script-src: allow self + inline scripts Next.js uses, plus Supabase CDN
    // - style-src: allow self + inline (Tailwind inlines critical CSS)
    // - img-src: allow self + data URIs + remote images declared in next.config
    // - connect-src: allow Supabase API/realtime and local dev server
    // - frame-ancestors 'none': equivalent to X-Frame-Options DENY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : ''
    const csp = [
        `default-src 'self'`,
        `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
        `style-src 'self' 'unsafe-inline'`,
        `img-src 'self' data: blob: https://www.transparenttextures.com https://*.supabase.co https://img.vietqr.io`,
        `font-src 'self' data:`,
        `connect-src 'self' ${supabaseUrl} ${supabaseHost ? `wss://${supabaseHost} ws://${supabaseHost}` : ''} https://api.vietqr.io`,
        `worker-src blob:`,
        `frame-ancestors 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`,
    ].join('; ')

    response.headers.set('Content-Security-Policy', csp)

    // HSTS: 1 year, include subdomains, allow preload
    // Only set on HTTPS — browsers ignore HSTS over HTTP anyway, but be explicit
    if (request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production') {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        )
    }

    // Clickjacking protection (redundant with CSP frame-ancestors but some older
    // proxies/scanners only check this header)
    response.headers.set('X-Frame-Options', 'DENY')

    // Prevent MIME sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff')

    // Referrer policy — send origin only to same-origin, nothing to cross-origin
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Permissions Policy — disable unused browser APIs
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    )

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
