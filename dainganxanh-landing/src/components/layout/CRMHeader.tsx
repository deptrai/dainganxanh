'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, TreePine, Share2, Package, UserCircle } from 'lucide-react'
import { UserHeader } from './UserHeader'

const navItems = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Mua cây', href: '/pricing', icon: Package },
    { name: 'Vườn của tôi', href: '/crm/my-garden', icon: TreePine },
    { name: 'Giới thiệu', href: '/crm/referrals', icon: Share2 },
    { name: 'Hồ sơ', href: '/crm/profile', icon: UserCircle },
]

export function CRMHeader() {
    const pathname = usePathname()

    // Helper to determine active state (copied from MarketingHeader logic)
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
                <div className="flex justify-center w-full">
                    <div className="flex w-full max-w-md">
                        {navItems.map((item) => {
                            const active = isActive(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs font-medium transition-colors border-b-2
                                        ${active
                                            ? 'border-emerald-500 text-emerald-600 stroke-[2.5px]'
                                            : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <item.icon className={`w-5 h-5 mb-1 ${active ? 'stroke-[2.5px]' : ''}`} />
                                    <span className="truncate max-w-[80px]">{item.name}</span>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </nav>
        </div>
    )
}
