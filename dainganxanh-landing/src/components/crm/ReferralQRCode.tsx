'use client'

import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface ReferralQRCodeProps {
    url: string
}

export function ReferralQRCode({ url }: ReferralQRCodeProps) {
    const qrRef = useRef<HTMLDivElement>(null)

    const handleDownload = () => {
        if (!qrRef.current) return

        const svg = qrRef.current.querySelector('svg')
        if (!svg) return

        // Convert SVG to PNG
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const svgData = new XMLSerializer().serializeToString(svg)
        const img = new Image()

        img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            ctx.drawImage(img, 0, 0)

            // Download
            canvas.toBlob((blob) => {
                if (!blob) return
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = 'referral-qr-code.png'
                link.click()
                URL.revokeObjectURL(url)
            })
        }

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-brand-100">
            <h3 className="text-lg font-semibold text-brand-600 mb-4">QR Code</h3>

            {/* QR Code Display */}
            <div className="flex flex-col items-center">
                <div
                    ref={qrRef}
                    className="bg-white p-4 rounded-lg border-2 border-brand-100 mb-4"
                >
                    <QRCodeSVG
                        value={url}
                        size={256}
                        level="H"
                        includeMargin={true}
                        fgColor="#2D5016"
                        bgColor="#FFFFFF"
                    />
                </div>

                {/* Download Button */}
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    Tải QR Code
                </button>

                <p className="text-sm text-gray-500 mt-4 text-center">
                    Scan QR code để truy cập link giới thiệu
                </p>
            </div>
        </div>
    )
}
