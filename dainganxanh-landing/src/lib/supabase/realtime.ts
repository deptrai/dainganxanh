'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Notification {
    id: string
    user_id: string
    type: string
    title: string
    body: string | null
    data: {
        orderIds?: string[]
        lotId?: string
        lotName?: string
        photoUrl?: string
        // Harvest notification fields
        treeId?: string
        orderId?: string
        treeCode?: string
        ageMonths?: number
        co2Absorbed?: number
    } | null
    read: boolean
    created_at: string
}

/**
 * Subscribe to real-time notifications for a specific user
 * @param userId - The user ID to filter notifications
 * @param callback - Function to call when a new notification is received
 * @returns RealtimeChannel subscription (call .unsubscribe() to cleanup)
 */
export function subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
): RealtimeChannel {
    const supabase = createBrowserClient()

    return supabase
        .channel('notifications')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`,
            },
            (payload) => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('New notification received:', payload)
                }
                callback(payload.new as Notification)
            }
        )
        .subscribe((status) => {
            if (process.env.NODE_ENV === 'development') {
                console.log('Notifications subscription status:', status)
            }
        })
}

/**
 * Fetch notifications for a user
 * @param userId - The user ID
 * @param limit - Maximum number of notifications to fetch (default: 10)
 * @returns Promise with notifications array
 */
export async function fetchNotifications(
    userId: string,
    limit = 10
): Promise<Notification[]> {
    const supabase = createBrowserClient()

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching notifications:', error)
        return []
    }

    return data as Notification[]
}

/**
 * Mark a notification as read
 * @param notificationId - The notification ID
 */
export async function markAsRead(notificationId: string): Promise<void> {
    const supabase = createBrowserClient()

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

    if (error) {
        console.error('Error marking notification as read:', error)
    }
}

/**
 * Get unread notification count
 * @param userId - The user ID
 * @returns Promise with unread count
 */
export async function getUnreadCount(userId: string): Promise<number> {
    const supabase = createBrowserClient()

    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

    if (error) {
        console.error('Error getting unread count:', error)
        return 0
    }

    return count || 0
}

/**
 * Mark all notifications as read for a user
 * @param userId - The user ID
 */
export async function markAllAsRead(userId: string): Promise<void> {
    const supabase = createBrowserClient()

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

    if (error) {
        console.error('Error marking all notifications as read:', error)
    }
}
