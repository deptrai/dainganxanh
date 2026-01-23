'use client'

import { useState, useEffect } from 'react'
import { getSystemConfig, updateSystemConfig, type SystemConfig } from '@/actions/system-settings'

const TIMEZONES = [
    { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho Chi Minh (GMT+7)' },
    { value: 'Asia/Bangkok', label: 'Asia/Bangkok (GMT+7)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
    { value: 'America/New_York', label: 'America/New York (GMT-5)' },
    { value: 'Europe/London', label: 'Europe/London (GMT+0)' },
]

const CURRENCIES = [
    { value: 'VND', label: 'VND (₫)' },
    { value: 'USD', label: 'USD ($)' },
]

const DATE_FORMATS = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (14/01/2026)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (01/14/2026)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-01-14)' },
]

export default function SystemConfigForm() {
    const [config, setConfig] = useState<SystemConfig>({
        site_name: '',
        support_email: '',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
        date_format: 'DD/MM/YYYY'
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

    // Load system config on mount
    useEffect(() => {
        loadConfig()
    }, [])

    async function loadConfig() {
        setLoading(true)
        setError(null)

        const result = await getSystemConfig()
        if (result.success && result.config) {
            setConfig(result.config)
        } else {
            setError(result.error || 'Failed to load system configuration')
        }

        setLoading(false)
    }

    function validateForm(): boolean {
        const errors: Record<string, string> = {}

        if (!config.site_name.trim()) {
            errors.site_name = 'Site name is required'
        }

        if (!config.support_email.trim()) {
            errors.support_email = 'Support email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.support_email)) {
            errors.support_email = 'Invalid email format'
        }

        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }

    async function handleSave() {
        setSuccess(null)
        setError(null)

        if (!validateForm()) {
            return
        }

        setSaving(true)

        const result = await updateSystemConfig(config)
        if (result.success) {
            setSuccess('System configuration updated successfully')
            setTimeout(() => setSuccess(null), 3000)
        } else {
            setError(result.error || 'Failed to update system configuration')
        }

        setSaving(false)
    }

    function handleChange(field: keyof SystemConfig, value: string) {
        setConfig(prev => ({ ...prev, [field]: value }))
        // Clear validation error for this field
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-4">
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (error && !config.site_name) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">❌ {error}</p>
                    <button
                        onClick={loadConfig}
                        className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        )
    }

    const isFormValid = !validationErrors.site_name && !validationErrors.support_email

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">System Configuration</h2>
                <p className="text-sm text-gray-600 mt-1">Manage system-wide settings and preferences</p>
            </div>

            <div className="p-6 space-y-6">
                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-800">✅ {success}</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">❌ {error}</p>
                    </div>
                )}

                {/* Site Name */}
                <div>
                    <label htmlFor="site_name" className="block text-sm font-medium text-gray-700 mb-1">
                        Site Name
                    </label>
                    <input
                        type="text"
                        id="site_name"
                        value={config.site_name}
                        onChange={(e) => handleChange('site_name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.site_name ? 'border-red-500' : 'border-gray-300'
                            }`}
                        placeholder="Đại Ngàn Xanh"
                    />
                    {validationErrors.site_name && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.site_name}</p>
                    )}
                </div>

                {/* Support Email */}
                <div>
                    <label htmlFor="support_email" className="block text-sm font-medium text-gray-700 mb-1">
                        Support Email
                    </label>
                    <input
                        type="email"
                        id="support_email"
                        value={config.support_email}
                        onChange={(e) => handleChange('support_email', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${validationErrors.support_email ? 'border-red-500' : 'border-gray-300'
                            }`}
                        placeholder="support@dainganxanh.com"
                    />
                    {validationErrors.support_email && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.support_email}</p>
                    )}
                </div>

                {/* Currency */}
                <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                    </label>
                    <select
                        id="currency"
                        value={config.currency}
                        onChange={(e) => handleChange('currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                        {CURRENCIES.map(curr => (
                            <option key={curr.value} value={curr.value}>{curr.label}</option>
                        ))}
                    </select>
                </div>

                {/* Timezone */}
                <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                        Timezone
                    </label>
                    <select
                        id="timezone"
                        value={config.timezone}
                        onChange={(e) => handleChange('timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                        {TIMEZONES.map(tz => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                    </select>
                </div>

                {/* Date Format */}
                <div>
                    <label htmlFor="date_format" className="block text-sm font-medium text-gray-700 mb-1">
                        Date Format
                    </label>
                    <select
                        id="date_format"
                        value={config.date_format}
                        onChange={(e) => handleChange('date_format', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                        {DATE_FORMATS.map(fmt => (
                            <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
                        ))}
                    </select>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving || !isFormValid}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${saving || !isFormValid
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    )
}
