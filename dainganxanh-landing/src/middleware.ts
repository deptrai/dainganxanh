import createMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'

const intlMiddleware = createMiddleware(routing)

// Non-localized routes and assets that should not be intercepted by next-intl
function isExcludedFromIntl(pathname: string): boolean {
    return (
        pathname.startsWith('/api') ||
        pathname.startsWith('/auth/callback') ||
        pathname === '/sitemap.xml' ||
        pathname === '/robots.txt' ||
        pathname === '/favicon.ico' ||
        pathname.startsWith('/opengraph-image') ||
        pathname.startsWith('/icon') ||
        pathname.startsWith('/apple-icon')
    )
}

function applySecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    let supabaseHost = ''
    try {
        if (supabaseUrl) supabaseHost = new URL(supabaseUrl).host
    } catch {
        // ignore malformed URL in test environments
    }

    const csp = [
        `default-src 'self'`,
        `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
        `style-src 'self' 'unsafe-inline'`,
        `img-src 'self' data: blob: https://images.unsplash.com https://www.transparenttextures.com https://*.supabase.co ${supabaseUrl} https://img.vietqr.io`,
        `font-src 'self' data:`,
        `connect-src 'self' ${supabaseUrl} ${supabaseHost ? `wss://${supabaseHost} ws://${supabaseHost}` : ''} https://api.vietqr.io`,
        `worker-src blob:`,
        `frame-ancestors 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`,
    ].join('; ')

    response.headers.set('Content-Security-Policy', csp)

    if (request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production') {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        )
    }

    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    )

    return response
}

export async function middleware(request: NextRequest) {
    const { pathname, search } = request.nextUrl

    // 1. Excluded routes (API, auth callback, static sitemap/robots/assets) bypass intl & auth
    if (isExcludedFromIntl(pathname)) {
        return applySecurityHeaders(NextResponse.next(), request)
    }

    // 2. Initialize base response from next-intl (localized)
    let response: NextResponse = intlMiddleware(request)
    // If next-intl triggered a redirect, return early with security headers
    if (response.headers.has('Location')) {
        return applySecurityHeaders(response, request)
    }

    // 3. Supabase session refresh + CRM route guard
    let user: any = null
    let supabase: any = null
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value
                    },
                    set(name: string, value: string, options: any) {
                        request.cookies.set({ name, value, ...options })
                        response.cookies.set({ name, value, ...options })
                    },
                    remove(name: string, options: any) {
                        request.cookies.set({ name, value: '', ...options })
                        response.cookies.set({ name, value: '', ...options })
                    },
                },
            }
        )

        try {
            const { data, error } = await supabase.auth.getUser()
            user = data?.user ?? null
            if (process.env.NODE_ENV === 'development') {
                console.log(`[Middleware] Path: ${pathname}, User: ${user?.email || 'none'}, Error: ${error?.message || 'none'}`)
            }
        } catch (err) {
            console.error('[Middleware] Supabase getUser error:', err)
        }
    }

    // 4. users.locale DB override:
    // Rationale: Switcher keeps cookie+DB in sync, so DB is only consulted when cookie is absent (new device) — avoids a per-request DB query.
    const hasLocaleCookie = Boolean(request.cookies.get('NEXT_LOCALE')?.value)
    const isEnPrefixed = pathname.startsWith('/en/') || pathname === '/en'

    if (user && supabase && !hasLocaleCookie && !isEnPrefixed) {
        try {
            const { data: profile } = await supabase
                .from('users')
                .select('locale')
                .eq('id', user.id)
                .single()

            if (profile?.locale === 'en') {
                const enPath = `/en${pathname === '/' ? '' : pathname}${search}`
                const redirectUrl = new URL(enPath, request.url)
                const redirectResponse = NextResponse.redirect(redirectUrl)
                for (const cookie of response.cookies.getAll()) {
                    redirectResponse.cookies.set(cookie)
                }
                const isSecure = request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production'
                redirectResponse.cookies.set({
                    name: 'NEXT_LOCALE',
                    value: 'en',
                    path: '/',
                    maxAge: 31536000,
                    sameSite: 'lax',
                    secure: isSecure,
                })
                return applySecurityHeaders(redirectResponse, request)
            }
        } catch (err) {
            console.error('[Middleware] Error querying users.locale:', err)
        }
    }

    // 5. Protect CRM routes: regex ^/(?:[a-z]{2}/)?crm matches /crm, /en/crm, /crm/..., /en/crm/...
    const isCrmRoute = /^\/(?:[a-z]{2}\/)?crm(?:\/.*)?$/.test(pathname)
    if (isCrmRoute && !user) {
        // Detect locale prefix if present in the CRM URL; validate against supported locales
        const localeMatch = pathname.match(/^\/([a-z]{2})(?:\/|$)/)
        const matchedLocale = localeMatch ? localeMatch[1] : null
        const isValidLocale = matchedLocale && (routing.locales as readonly string[]).includes(matchedLocale)
        const localePrefix = isValidLocale ? `/${matchedLocale}` : ''
        const loginPath = `${localePrefix}/login`
        const redirectUrl = new URL(loginPath, request.url)
        redirectUrl.searchParams.set('redirect', pathname + search)

        const redirectResponse = NextResponse.redirect(redirectUrl)
        for (const cookie of response.cookies.getAll()) {
            redirectResponse.cookies.set(cookie)
        }
        return applySecurityHeaders(redirectResponse, request)
    }

    // 6. Security headers
    return applySecurityHeaders(response, request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - static image extensions (svg, png, jpg, jpeg, gif, webp)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
