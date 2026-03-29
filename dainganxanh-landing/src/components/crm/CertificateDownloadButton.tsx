'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { downloadCertificate } from '@/actions/downloadCertificate'

interface CertificateDownloadButtonProps {
    orderId: string
}

export default function CertificateDownloadButton({
    orderId,
}: CertificateDownloadButtonProps) {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const handleDownload = async () => {
        setLoading(true)
        setMessage(null)

        try {
            const result = await downloadCertificate(orderId)

            if (!result.success) {
                setMessage({
                    type: 'error',
                    text: result.error || 'Không thể tải chứng chỉ. Vui lòng thử lại sau.',
                })
                return
            }

            // Trigger browser download
            if (result.pdfUrl) {
                const a = document.createElement('a')
                a.href = result.pdfUrl
                a.download = `certificate-${orderId}.pdf`
                a.click()

                setMessage({
                    type: 'success',
                    text: 'Đã tải chứng chỉ thành công',
                })
            }
        } catch (error) {
            console.error('Download error:', error)
            setMessage({
                type: 'error',
                text: 'Không thể tải chứng chỉ. Vui lòng thử lại sau.',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-2">
            <button
                onClick={handleDownload}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
                <Download className="w-5 h-5" />
                {loading ? 'Đang tạo chứng chỉ...' : 'Tải chứng chỉ'}
            </button>

            {message && (
                <div
                    className={`px-4 py-2 rounded-lg text-sm ${
                        message.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                >
                    {message.text}
                </div>
            )}
        </div>
    )
}
