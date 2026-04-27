'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { SocialProofOrder } from '@/actions/socialProof'

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60_000)
    if (minutes < 1) return 'vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} giờ trước`
    const days = Math.floor(hours / 24)
    return `${days} ngày trước`
}

interface Props {
    orders: SocialProofOrder[]
    activeCount: number
}

export function SocialProofWidget({ orders, activeCount }: Props) {
    const [index, setIndex] = useState(0)
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        if (orders.length <= 1) return
        const timer = setInterval(() => {
            setIndex((i) => (i + 1) % orders.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [orders.length])

    if (dismissed || orders.length === 0) return null

    const order = orders[index]

    return (
        <div className="fixed bottom-4 left-4 z-40 max-w-xs">
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="relative bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 pr-8"
                >
                    <button
                        onClick={() => setDismissed(true)}
                        className="absolute top-1.5 right-2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                    <p className="text-sm text-gray-800">
                        <span className="font-semibold text-green-700">{order.maskedName}</span>
                        {' '}vừa mua{' '}
                        <span className="font-semibold">{order.quantity} cây</span>
                        {' — '}
                        <span className="text-gray-500">{timeAgo(order.createdAt)}</span>
                    </p>
                    {activeCount > 0 && (
                        <p className="text-xs text-orange-600 mt-1 font-medium">
                            🔥 {activeCount} người đang đặt mua
                        </p>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
