'use client'

import { useState, useEffect } from 'react'
import { getAdminProfile, updateAdminProfile, type AdminProfile } from '@/actions/admin-settings'

export default function ProfileSettings() {
    const [profile, setProfile] = useState<AdminProfile | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        setLoading(true)
        const result = await getAdminProfile()
        if (result.success && result.profile) {
            setProfile(result.profile)
            setFullName(result.profile.full_name)
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to load profile' })
        }
        setLoading(false)
    }

    const handleSave = async () => {
        if (!fullName.trim()) {
            setMessage({ type: 'error', text: 'Full name is required' })
            return
        }

        setSaving(true)
        setMessage(null)

        const result = await updateAdminProfile(fullName)
        if (result.success) {
            setMessage({ type: 'success', text: 'Profile updated successfully' })
            setIsEditing(false)
            await loadProfile() // Reload to get updated data
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to update profile' })
        }

        setSaving(false)
    }

    const handleCancel = () => {
        setFullName(profile?.full_name || '')
        setIsEditing(false)
        setMessage(null)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Failed to load profile</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Success/Error Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                        {message.text}
                    </p>
                </div>
            )}

            {/* Profile Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>

                <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Enter your full name"
                            />
                        ) : (
                            <p className="text-gray-900">{profile.full_name}</p>
                        )}
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <p className="text-gray-900">{profile.email}</p>
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    {/* Role (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                        </label>
                        <p className="text-gray-900 capitalize">{profile.role.replace('_', ' ')}</p>
                    </div>

                    {/* Last Login (Read-only) */}
                    {profile.last_login && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Login
                            </label>
                            <p className="text-gray-900">
                                {new Date(profile.last_login).toLocaleString('vi-VN')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={saving}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
