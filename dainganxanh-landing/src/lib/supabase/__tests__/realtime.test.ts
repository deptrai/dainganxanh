import {
    subscribeToNotifications,
    fetchNotifications,
    markAsRead,
    getUnreadCount,
    type Notification,
} from '../realtime'
import { createBrowserClient } from '@/lib/supabase/client'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
    createBrowserClient: jest.fn(),
}))

describe('Realtime Notification Helpers', () => {
    let mockSupabase: any

    beforeEach(() => {
        jest.clearAllMocks()

        // Create mock Supabase client
        mockSupabase = {
            channel: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
        }

            ; (createBrowserClient as jest.Mock).mockReturnValue(mockSupabase)
    })

    describe('subscribeToNotifications', () => {
        it('creates a channel subscription with correct parameters', () => {
            const userId = 'user-123'
            const callback = jest.fn()

            subscribeToNotifications(userId, callback)

            expect(mockSupabase.channel).toHaveBeenCalledWith('notifications')
            expect(mockSupabase.on).toHaveBeenCalledWith(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                expect.any(Function)
            )
            expect(mockSupabase.subscribe).toHaveBeenCalled()
        })

        it('calls callback when new notification is received', () => {
            const userId = 'user-123'
            const callback = jest.fn()
            const mockNotification: Notification = {
                id: 'notif-1',
                user_id: userId,
                type: 'tree_update',
                title: 'Test',
                body: 'Test body',
                data: null,
                read: false,
                created_at: new Date().toISOString(),
            }

            let onCallback: any
            mockSupabase.on.mockImplementation((event: string, config: any, cb: any) => {
                onCallback = cb
                return mockSupabase
            })

            subscribeToNotifications(userId, callback)

            // Simulate notification received
            onCallback({ new: mockNotification })

            expect(callback).toHaveBeenCalledWith(mockNotification)
        })
    })

    describe('fetchNotifications', () => {
        it('fetches notifications for a user', async () => {
            const userId = 'user-123'
            const mockNotifications: Notification[] = [
                {
                    id: 'notif-1',
                    user_id: userId,
                    type: 'tree_update',
                    title: 'Test 1',
                    body: null,
                    data: null,
                    read: false,
                    created_at: new Date().toISOString(),
                },
            ]

            mockSupabase.select.mockResolvedValue({
                data: mockNotifications,
                error: null,
            })

            const result = await fetchNotifications(userId)

            expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
            expect(mockSupabase.select).toHaveBeenCalledWith('*')
            expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId)
            expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
            expect(mockSupabase.limit).toHaveBeenCalledWith(10)
            expect(result).toEqual(mockNotifications)
        })

        it('returns empty array on error', async () => {
            mockSupabase.select.mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
            })

            const result = await fetchNotifications('user-123')

            expect(result).toEqual([])
        })

        it('respects custom limit parameter', async () => {
            mockSupabase.select.mockResolvedValue({
                data: [],
                error: null,
            })

            await fetchNotifications('user-123', 20)

            expect(mockSupabase.limit).toHaveBeenCalledWith(20)
        })
    })

    describe('markAsRead', () => {
        it('updates notification read status', async () => {
            const notificationId = 'notif-1'

            mockSupabase.update.mockResolvedValue({
                error: null,
            })

            await markAsRead(notificationId)

            expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
            expect(mockSupabase.update).toHaveBeenCalledWith({ read: true })
            expect(mockSupabase.eq).toHaveBeenCalledWith('id', notificationId)
        })

        it('handles errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

            mockSupabase.update.mockResolvedValue({
                error: { message: 'Update failed' },
            })

            await markAsRead('notif-1')

            expect(consoleSpy).toHaveBeenCalled()
            consoleSpy.mockRestore()
        })
    })

    describe('getUnreadCount', () => {
        it('returns unread notification count', async () => {
            const userId = 'user-123'

            mockSupabase.select.mockResolvedValue({
                count: 5,
                error: null,
            })

            const count = await getUnreadCount(userId)

            expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
            expect(mockSupabase.select).toHaveBeenCalledWith('*', { count: 'exact', head: true })
            expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId)
            expect(mockSupabase.eq).toHaveBeenCalledWith('read', false)
            expect(count).toBe(5)
        })

        it('returns 0 on error', async () => {
            mockSupabase.select.mockResolvedValue({
                count: null,
                error: { message: 'Count failed' },
            })

            const count = await getUnreadCount('user-123')

            expect(count).toBe(0)
        })

        it('returns 0 when count is null', async () => {
            mockSupabase.select.mockResolvedValue({
                count: null,
                error: null,
            })

            const count = await getUnreadCount('user-123')

            expect(count).toBe(0)
        })
    })
})
