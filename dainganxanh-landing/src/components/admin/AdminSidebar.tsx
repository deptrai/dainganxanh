"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
    ClipboardDocumentListIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    HomeIcon,
    BanknotesIcon,
    RectangleGroupIcon,
    ArrowPathIcon,
    DocumentTextIcon,
    UsersIcon,
    GiftIcon,
    Bars3Icon,
    XMarkIcon,
} from '@heroicons/react/24/outline'

const navigation = [
    { name: 'Orders', href: '/crm/admin/orders', icon: ClipboardDocumentListIcon },
    { name: 'Người dùng', href: '/crm/admin/users', icon: UsersIcon },
    { name: 'Lô cây', href: '/crm/admin/lots', icon: RectangleGroupIcon },
    { name: 'Hoa hồng', href: '/crm/admin/referrals', icon: GiftIcon },
    { name: 'Withdrawals', href: '/crm/admin/withdrawals', icon: BanknotesIcon },
    { name: 'Casso Logs', href: '/crm/admin/casso', icon: ArrowPathIcon },
    { name: 'Blog', href: '/crm/admin/blog', icon: DocumentTextIcon },
    { name: 'Analytics', href: '/crm/admin/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/crm/admin/settings', icon: Cog6ToothIcon },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname()

    return (
        <div className="flex flex-col h-full">
            {/* Logo/Header */}
            <div className="p-6 border-b border-gray-200 shrink-0">
                <h1 className="text-xl font-bold text-green-600">Đại Ngàn Xanh</h1>
                <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onNavigate}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                isActive
                                    ? 'bg-green-50 text-green-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            <span>{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom link */}
            <div className="p-4 border-t border-gray-200 shrink-0">
                <Link
                    href="/crm/my-garden"
                    onClick={onNavigate}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                    <HomeIcon className="w-5 h-5 shrink-0" />
                    <span>Back to User Dashboard</span>
                </Link>
            </div>
        </div>
    )
}

export default function AdminSidebar() {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    // Close sidebar when route changes on mobile
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                onClick={() => setOpen(true)}
                className="lg:hidden fixed top-[110px] left-3 z-40 p-2 bg-white border border-gray-200 rounded-lg shadow-sm"
                aria-label="Mở menu"
            >
                <Bars3Icon className="w-5 h-5 text-gray-700" />
            </button>

            {/* Mobile overlay */}
            {open && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/40"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Mobile drawer */}
            <div className={`lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ${
                open ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <button
                    onClick={() => setOpen(false)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100"
                    aria-label="Đóng menu"
                >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
                <SidebarContent onNavigate={() => setOpen(false)} />
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen shrink-0">
                <SidebarContent />
            </div>
        </>
    )
}
