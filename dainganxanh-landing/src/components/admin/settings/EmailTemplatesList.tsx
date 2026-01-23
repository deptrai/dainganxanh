'use client'

import { useState, useEffect } from 'react'
import { getEmailTemplates, getEmailTemplatePreview, type EmailTemplate } from '@/actions/system-settings'

export default function EmailTemplatesList() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [previewTemplate, setPreviewTemplate] = useState<{
        subject: string
        html: string
        variables: string[]
    } | null>(null)
    const [previewLoading, setPreviewLoading] = useState(false)

    useEffect(() => {
        loadTemplates()
    }, [])

    async function loadTemplates() {
        setLoading(true)
        setError(null)

        const result = await getEmailTemplates()
        if (result.success && result.templates) {
            setTemplates(result.templates)
        } else {
            setError(result.error || 'Failed to load email templates')
        }

        setLoading(false)
    }

    async function handlePreview(templateKey: string) {
        setPreviewLoading(true)
        const result = await getEmailTemplatePreview(templateKey)

        if (result.success && result.preview) {
            setPreviewTemplate(result.preview)
        } else {
            setError(result.error || 'Failed to load preview')
        }

        setPreviewLoading(false)
    }

    function closePreview() {
        setPreviewTemplate(null)
    }

    function getTemplateName(key: string): string {
        const names: Record<string, string> = {
            'withdrawal_request_created': 'Withdrawal Request Created (Admin)',
            'withdrawal_request_approved': 'Withdrawal Approved (User)',
            'withdrawal_request_rejected': 'Withdrawal Rejected (User)'
        }
        return names[key] || key
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (error && templates.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">❌ {error}</p>
                    <button
                        onClick={loadTemplates}
                        className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Email Templates</h2>
                    <p className="text-sm text-gray-600 mt-1">View and preview email templates (read-only)</p>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-red-800">❌ {error}</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">
                                            {getTemplateName(template.template_key)}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            <strong>Subject:</strong> {template.subject}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Last updated: {new Date(template.updated_at).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handlePreview(template.template_key)}
                                        disabled={previewLoading}
                                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                                    >
                                        {previewLoading ? 'Loading...' : 'Preview'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {templates.length === 0 && !loading && (
                        <div className="text-center py-8 text-gray-500">
                            No email templates found
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {previewTemplate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    <strong>Subject:</strong> {previewTemplate.subject}
                                </p>
                            </div>
                            <button
                                onClick={closePreview}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Variables Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-blue-800">
                                    <strong>Sample Variables:</strong> {previewTemplate.variables.join(', ')}
                                </p>
                            </div>

                            {/* Email Preview */}
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div
                                    dangerouslySetInnerHTML={{ __html: previewTemplate.html }}
                                    className="email-preview"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={closePreview}
                                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
