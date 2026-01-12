"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    ClipboardDocumentListIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    HomeIcon
} from '@heroicons/react/24/outline'

const navigation = [
    { name: 'Dashboard', href: '/crm/admin', icon: HomeIcon },
    { name: 'Orders', href: '/crm/admin/orders', icon: ClipboardDocumentListIcon },
    { name: 'Reports', href: '/crm/admin/reports', icon: ChartBarIcon },
    { name: 'Settings', href: '/crm/admin/settings', icon: Cog6ToothIcon },
]

export default function AdminSidebar() {
    const pathname = usePathname()

    return (
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
            {/* Logo/Header */}
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-green-600">Đại Ngàn Xanh</h1>
                <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${isActive
                                    ? 'bg-green-50 text-green-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }
              `}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* User Info */}
            <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-white">
                <Link
                    href="/crm/dashboard"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                    <HomeIcon className="w-5 h-5" />
                    <span>Back to User Dashboard</span>
                </Link>
            </div>
        </div>
    )
}
