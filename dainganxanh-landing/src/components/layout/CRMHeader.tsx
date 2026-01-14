'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, TreePine, Gift, Share2, Bell } from 'lucide-react'
import { UserHeader } from './UserHeader'

const navItems = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Vườn của tôi', href: '/crm/my-garden', icon: TreePine },
    { name: 'Giới thiệu', href: '/crm/referrals', icon: Share2 },
]

export function CRMHeader() {
    const pathname = usePathname()

    return (
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            {/* User Info Header */}
            <UserHeader />

            {/* Navigation Menu */}
            <nav className="border-t border-gray-100">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-center gap-4 overflow-x-auto">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap
                                        ${isActive
                                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                                            : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                                        }
                                    `}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.name}</span>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </nav>
        </div>
    )
}
