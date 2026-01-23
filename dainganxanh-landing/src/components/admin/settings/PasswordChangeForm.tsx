'use client'

import { useState } from 'react'
import { changePassword } from '@/actions/admin-settings'

export default function PasswordChangeForm() {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [showPasswords, setShowPasswords] = useState(false)

    // Password validation
    const validatePassword = (password: string): string | null => {
        if (password.length < 8) {
            return 'Password must be at least 8 characters'
        }
        if (!/[A-Z]/.test(password)) {
            return 'Password must contain at least one uppercase letter'
        }
        if (!/[0-9]/.test(password)) {
            return 'Password must contain at least one number'
        }
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            setMessage({ type: 'error', text: 'All fields are required' })
            return
        }

        const passwordError = validatePassword(newPassword)
        if (passwordError) {
            setMessage({ type: 'error', text: passwordError })
            return
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' })
            return
        }

        if (currentPassword === newPassword) {
            setMessage({ type: 'error', text: 'New password must be different from current password' })
            return
        }

        setLoading(true)

        const result = await changePassword(currentPassword, newPassword)
        if (result.success) {
            setMessage({ type: 'success', text: 'Password changed successfully. You will receive a confirmation email.' })
            // Clear form
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to change password' })
        }

        setLoading(false)
    }

    const getPasswordStrength = (password: string): { strength: string, color: string } => {
        if (!password) return { strength: '', color: '' }

        let score = 0
        if (password.length >= 8) score++
        if (password.length >= 12) score++
        if (/[A-Z]/.test(password)) score++
        if (/[a-z]/.test(password)) score++
        if (/[0-9]/.test(password)) score++
        if (/[^A-Za-z0-9]/.test(password)) score++

        if (score <= 2) return { strength: 'Weak', color: 'text-red-600' }
        if (score <= 4) return { strength: 'Medium', color: 'text-yellow-600' }
        return { strength: 'Strong', color: 'text-green-600' }
    }

    const passwordStrength = getPasswordStrength(newPassword)

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>

            {/* Success/Error Message */}
            {message && (
                <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                        {message.text}
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Current Password */}
                <div>
                    <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                    </label>
                    <input
                        id="current-password"
                        type={showPasswords ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Enter current password"
                        required
                    />
                </div>

                {/* New Password */}
                <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                    </label>
                    <input
                        id="new-password"
                        type={showPasswords ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Enter new password"
                        required
                    />
                    {newPassword && (
                        <p className={`text-sm mt-1 ${passwordStrength.color}`}>
                            Password strength: {passwordStrength.strength}
                        </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        Minimum 8 characters, 1 uppercase letter, 1 number
                    </p>
                </div>

                {/* Confirm Password */}
                <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                    </label>
                    <input
                        id="confirm-password"
                        type={showPasswords ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Confirm new password"
                        required
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
                    )}
                </div>

                {/* Show Passwords Toggle */}
                <div className="flex items-center">
                    <input
                        id="show-passwords"
                        type="checkbox"
                        checked={showPasswords}
                        onChange={(e) => setShowPasswords(e.target.checked)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <label htmlFor="show-passwords" className="ml-2 text-sm text-gray-700">
                        Show passwords
                    </label>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Updating Password...' : 'Update Password'}
                </button>
            </form>
        </div>
    )
}
