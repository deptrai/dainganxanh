'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProfileSettings from '@/components/admin/settings/ProfileSettings'
import PasswordChangeForm from '@/components/admin/settings/PasswordChangeForm'
import NotificationToggles from '@/components/admin/settings/NotificationToggles'
import SystemConfigForm from '@/components/admin/settings/SystemConfigForm'
import EmailTemplatesList from '@/components/admin/settings/EmailTemplatesList'

export default function SettingsPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'profile' | 'system' | 'notifications'>('profile')

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Settings</h1>
                    <p className="text-gray-600">Manage your admin preferences and system configuration</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile'
                                    ? 'border-emerald-500 text-emerald-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Profile
                            </button>
                            <button
                                onClick={() => setActiveTab('system')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'system'
                                    ? 'border-emerald-500 text-emerald-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                System
                            </button>
                            <button
                                onClick={() => setActiveTab('notifications')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'notifications'
                                    ? 'border-emerald-500 text-emerald-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Notifications
                            </button>
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <ProfileSettings />
                                <PasswordChangeForm />
                            </div>
                        )}

                        {activeTab === 'system' && (
                            <div className="space-y-6">
                                <SystemConfigForm />
                                <EmailTemplatesList />
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <NotificationToggles />
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Links */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => router.push('/crm/admin/analytics')}
                        className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
                    >
                        <div className="text-2xl mb-2">📊</div>
                        <h3 className="font-semibold text-gray-900">Analytics</h3>
                        <p className="text-sm text-gray-600 mt-1">View reports and metrics</p>
                    </button>

                    <button
                        onClick={() => router.push('/crm/admin/orders')}
                        className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
                    >
                        <div className="text-2xl mb-2">📦</div>
                        <h3 className="font-semibold text-gray-900">Orders</h3>
                        <p className="text-sm text-gray-600 mt-1">Manage customer orders</p>
                    </button>

                    <button
                        onClick={() => router.push('/crm/admin/trees')}
                        className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
                    >
                        <div className="text-2xl mb-2">🌳</div>
                        <h3 className="font-semibold text-gray-900">Trees</h3>
                        <p className="text-sm text-gray-600 mt-1">Monitor tree health</p>
                    </button>
                </div>
            </div>
        </div>
    )
}
