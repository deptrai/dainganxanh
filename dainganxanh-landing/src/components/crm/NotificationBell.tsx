'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { createBrowserClient } from '@/lib/supabase/client'
import {
    subscribeToNotifications,
    fetchNotifications,
    markAsRead,
    getUnreadCount,
    type Notification as NotificationType,
} from '@/lib/supabase/realtime'

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<NotificationType[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // Get current user and setup subscription
    useEffect(() => {
        const supabase = createBrowserClient()
        let subscription: ReturnType<typeof subscribeToNotifications> | null = null

        const initializeNotifications = async () => {
            setIsLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    // Fetch initial notifications
                    const [notifs, count] = await Promise.all([
                        fetchNotifications(user.id),
                        getUnreadCount(user.id)
                    ])
                    setNotifications(notifs)
                    setUnreadCount(count)

                    // Subscribe to real-time updates
                    subscription = subscribeToNotifications(user.id, (newNotification) => {
                        setNotifications((prev) => [newNotification, ...prev])
                        setUnreadCount((prev) => prev + 1)

                        // Show browser notification if permitted
                        // Using 'window.Notification' to avoid shadowing with our NotificationType
                        if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
                            new window.Notification(newNotification.title, {
                                body: newNotification.body || undefined,
                                icon: '/icon-192x192.png',
                            })
                        }
                    })
                }
            } catch (error) {
                console.error('Error initializing notifications:', error)
            } finally {
                setIsLoading(false)
            }
        }

        initializeNotifications()

        // Proper cleanup - this is called when component unmounts
        return () => {
            if (subscription) {
                subscription.unsubscribe()
            }
        }
    }, [])

    const handleNotificationClick = useCallback(async (notification: NotificationType) => {
        // Mark as read
        await markAsRead(notification.id)
        setUnreadCount((prev) => Math.max(0, prev - 1))
        setNotifications((prev) =>
            prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        )

        // Navigate to package detail if orderId exists
        if (notification.data?.orderIds && notification.data.orderIds.length > 0) {
            const orderId = notification.data.orderIds[0]
            // Navigate with hash anchor to scroll to photos section
            router.push(`/crm/my-garden/${orderId}#photos`)
            setIsOpen(false)
        }
    }, [router])

    const formatTimeAgo = (timestamp: string) => {
        return formatDistanceToNow(new Date(timestamp), {
            addSuffix: true,
            locale: vi
        })
    }

    return (
        <div className="relative">
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors"
                aria-label="Notifications"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Panel */}
                    <div className="absolute right-0 z-20 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Thông báo
                            </h3>
                        </div>

                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <svg
                                    className="w-12 h-12 mx-auto mb-3 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                    />
                                </svg>
                                <p>Chưa có thông báo mới</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-green-50' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <span className="text-xl">
                                                    {notification.type === 'tree_update' ? '🌳' : '📦'}
                                                </span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {notification.title}
                                                </p>
                                                {notification.body && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {notification.body}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formatTimeAgo(notification.created_at)}
                                                </p>
                                            </div>

                                            {/* Unread Indicator */}
                                            {!notification.read && (
                                                <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
