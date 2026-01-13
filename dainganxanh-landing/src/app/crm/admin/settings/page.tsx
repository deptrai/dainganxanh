'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Settings</h2>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-blue-800">
                                            🚧 <strong>Coming Soon</strong> - Profile management features will be available in the next release.
                                        </p>
                                        <ul className="mt-2 ml-4 text-sm text-blue-700 list-disc">
                                            <li>Update admin profile information</li>
                                            <li>Change password</li>
                                            <li>Manage notification preferences</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={() => router.push('/crm/admin')}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                    >
                                        Back to Dashboard
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'system' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h2>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-blue-800">
                                            🚧 <strong>Coming Soon</strong> - System configuration features will be available in the next release.
                                        </p>
                                        <ul className="mt-2 ml-4 text-sm text-blue-700 list-disc">
                                            <li>Configure email templates</li>
                                            <li>Manage payment gateway settings</li>
                                            <li>Set up automated workflows</li>
                                            <li>Configure tree planting schedules</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={() => router.push('/crm/admin/analytics')}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        View Analytics Instead
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-blue-800">
                                            🚧 <strong>Coming Soon</strong> - Notification preferences will be available in the next release.
                                        </p>
                                        <ul className="mt-2 ml-4 text-sm text-blue-700 list-disc">
                                            <li>Email notifications for new orders</li>
                                            <li>SMS alerts for critical events</li>
                                            <li>Slack/Discord integration</li>
                                            <li>Daily/weekly digest emails</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={() => router.push('/crm/admin/orders')}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Manage Orders Instead
                                    </button>
                                </div>
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
