'use client'

import { useState, useEffect } from 'react'
import { getNotificationPreferences, updateNotificationPreferences, type NotificationPreferences } from '@/actions/admin-settings'

export default function NotificationToggles() {
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        orders: true,
        withdrawals: true,
        alerts: true
    })
    const [inAppSound, setInAppSound] = useState(true)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        loadPreferences()
    }, [])

    const loadPreferences = async () => {
        setLoading(true)
        const result = await getNotificationPreferences()
        if (result.success && result.preferences) {
            setPreferences(result.preferences.email_notifications)
            setInAppSound(result.preferences.in_app_sound)
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to load preferences' })
        }
        setLoading(false)
    }

    const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
        const newPreferences = { ...preferences, [key]: value }
        setPreferences(newPreferences)
        await savePreferences(newPreferences, inAppSound)
    }

    const handleSoundToggle = async (value: boolean) => {
        setInAppSound(value)
        await savePreferences(preferences, value)
    }

    const savePreferences = async (emailPrefs: NotificationPreferences, soundPref: boolean) => {
        setSaving(true)
        setMessage(null)

        const result = await updateNotificationPreferences(emailPrefs, soundPref)
        if (result.success) {
            setMessage({ type: 'success', text: 'Preferences saved automatically' })
            // Clear success message after 3 seconds
            setTimeout(() => setMessage(null), 3000)
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to save preferences' })
        }

        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
                {saving && (
                    <span className="text-sm text-gray-500">Saving...</span>
                )}
            </div>

            {/* Success/Error Message */}
            {message && (
                <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                        {message.text}
                    </p>
                </div>
            )}

            <div className="space-y-4">
                {/* Email Notifications Section */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Email Notifications</h4>
                    <div className="space-y-3">
                        {/* Orders */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label htmlFor="notify-orders" className="text-sm font-medium text-gray-900">
                                    New Orders
                                </label>
                                <p className="text-xs text-gray-500">Receive email when new orders are placed</p>
                            </div>
                            <button
                                id="notify-orders"
                                type="button"
                                onClick={() => handleToggle('orders', !preferences.orders)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.orders ? 'bg-emerald-600' : 'bg-gray-200'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.orders ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>

                        {/* Withdrawals */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label htmlFor="notify-withdrawals" className="text-sm font-medium text-gray-900">
                                    Withdrawal Requests
                                </label>
                                <p className="text-xs text-gray-500">Receive email for new withdrawal requests</p>
                            </div>
                            <button
                                id="notify-withdrawals"
                                type="button"
                                onClick={() => handleToggle('withdrawals', !preferences.withdrawals)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.withdrawals ? 'bg-emerald-600' : 'bg-gray-200'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.withdrawals ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>

                        {/* Alerts */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label htmlFor="notify-alerts" className="text-sm font-medium text-gray-900">
                                    System Alerts
                                </label>
                                <p className="text-xs text-gray-500">Receive email for system alerts and errors</p>
                            </div>
                            <button
                                id="notify-alerts"
                                type="button"
                                onClick={() => handleToggle('alerts', !preferences.alerts)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.alerts ? 'bg-emerald-600' : 'bg-gray-200'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.alerts ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* In-App Notifications Section */}
                <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">In-App Notifications</h4>
                    <div className="flex items-center justify-between">
                        <div>
                            <label htmlFor="notify-sound" className="text-sm font-medium text-gray-900">
                                Notification Sound
                            </label>
                            <p className="text-xs text-gray-500">Play sound for in-app notifications</p>
                        </div>
                        <button
                            id="notify-sound"
                            type="button"
                            onClick={() => handleSoundToggle(!inAppSound)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${inAppSound ? 'bg-emerald-600' : 'bg-gray-200'}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${inAppSound ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
