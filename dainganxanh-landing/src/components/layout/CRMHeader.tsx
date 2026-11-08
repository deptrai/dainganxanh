'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Home, TreePine, Share2, Package, UserCircle, ShieldCheck, Calendar, ShoppingBag, PackageCheck, Compass } from 'lucide-react'
import { UserHeader } from './UserHeader'
import { createBrowserClient } from '@/lib/supabase/client'

const baseNavItems = [
    { key: 'home', href: '/', icon: Home },
    { key: 'buyTrees', href: '/pricing', icon: Package },
    { key: 'store', href: '/store', icon: ShoppingBag },
    { key: 'ecoTourism', href: '/eco-tourism', icon: Compass },
    { key: 'myGarden', href: '/crm/my-garden', icon: TreePine },
    { key: 'bookings', href: '/crm/my-bookings', icon: Calendar },
    { key: 'orders', href: '/crm/my-store-orders', icon: PackageCheck },
    { key: 'referrals', href: '/crm/referrals', icon: Share2 },
    { key: 'profile', href: '/crm/profile', icon: UserCircle },
] as const

export function CRMHeader() {
    const t = useTranslations('crm.nav')
    const pathname = usePathname()
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const supabase = createBrowserClient()
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) return
            const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
            if (data && ['admin', 'super_admin'].includes(data.role)) setIsAdmin(true)
        })
    }, [])

    const navItems = isAdmin
        ? [...baseNavItems, { key: 'admin' as const, href: '/crm/admin', icon: ShieldCheck }]
        : baseNavItems

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            {/* User Info Header */}
            <UserHeader />

            {/* Navigation Menu */}
            <nav className="border-t border-gray-100 bg-white overflow-x-auto">
                <div className="flex justify-center w-full min-w-max md:min-w-0 px-2">
                    <div className="flex w-full max-w-3xl justify-between">
                        {navItems.map((item) => {
                            const active = isActive(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs font-medium transition-colors border-b-2 whitespace-nowrap
                                        ${active
                                            ? 'border-emerald-500 text-emerald-600 stroke-[2.5px]'
                                            : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <item.icon className={`w-5 h-5 mb-1 ${active ? 'stroke-[2.5px]' : ''}`} />
                                    <span>{t(item.key)}</span>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </nav>
        </div>
    )
}
