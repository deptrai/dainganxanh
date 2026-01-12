import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import NotificationBell from '../NotificationBell'
import {
    subscribeToNotifications,
    fetchNotifications,
    getUnreadCount,
    markAsRead
} from '@/lib/supabase/realtime'
import { createBrowserClient } from '@/lib/supabase/client'

// Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}))

jest.mock('@/lib/supabase/client', () => ({
    createBrowserClient: jest.fn(),
}))

jest.mock('@/lib/supabase/realtime', () => ({
    subscribeToNotifications: jest.fn(),
    fetchNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
}))

describe('NotificationBell', () => {
    const mockPush = jest.fn()
    const mockUnsubscribe = jest.fn()

    const mockUser = { id: 'user-123' }
    const mockNotifications = [
        {
            id: 'notif-1',
            user_id: 'user-123',
            type: 'tree_update',
            title: '🌳 Cây của bạn có ảnh mới!',
            body: 'Lô A vừa được cập nhật',
            data: { orderIds: ['order-1'], lotId: 'lot-1' },
            read: false,
            created_at: new Date().toISOString(),
        },
        {
            id: 'notif-2',
            user_id: 'user-123',
            type: 'tree_update',
            title: '🌳 Cập nhật mới',
            body: 'Lô B vừa được cập nhật',
            data: { orderIds: ['order-2'], lotId: 'lot-2' },
            read: true,
            created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        },
    ]

    beforeEach(() => {
        jest.clearAllMocks()

            // Mock useRouter
            ; (useRouter as jest.Mock).mockReturnValue({
                push: mockPush,
            })

        // Mock Supabase client
        const mockSupabase = {
            auth: {
                getUser: jest.fn().mockResolvedValue({
                    data: { user: mockUser },
                    error: null,
                }),
            },
        }
            ; (createBrowserClient as jest.Mock).mockReturnValue(mockSupabase)

            // Mock realtime functions
            ; (fetchNotifications as jest.Mock).mockResolvedValue(mockNotifications)
            ; (getUnreadCount as jest.Mock).mockResolvedValue(1)
            ; (subscribeToNotifications as jest.Mock).mockReturnValue({
                unsubscribe: mockUnsubscribe,
            })
            ; (markAsRead as jest.Mock).mockResolvedValue(undefined)
    })

    it('renders notification bell icon', async () => {
        render(<NotificationBell />)

        await waitFor(() => {
            expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
        })
    })

    it('displays unread count badge', async () => {
        render(<NotificationBell />)

        await waitFor(() => {
            expect(screen.getByText('1')).toBeInTheDocument()
        })
    })

    it('fetches notifications on mount', async () => {
        render(<NotificationBell />)

        await waitFor(() => {
            expect(fetchNotifications).toHaveBeenCalledWith('user-123')
            expect(getUnreadCount).toHaveBeenCalledWith('user-123')
        })
    })

    it('subscribes to realtime notifications', async () => {
        render(<NotificationBell />)

        await waitFor(() => {
            expect(subscribeToNotifications).toHaveBeenCalledWith(
                'user-123',
                expect.any(Function)
            )
        })
    })

    it('opens dropdown when bell is clicked', async () => {
        render(<NotificationBell />)

        await waitFor(() => {
            expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
        })

        const bellButton = screen.getByLabelText('Notifications')
        fireEvent.click(bellButton)

        await waitFor(() => {
            expect(screen.getByText('Thông báo')).toBeInTheDocument()
        })
    })

    it('displays notifications in dropdown', async () => {
        render(<NotificationBell />)

        await waitFor(() => {
            expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
        })

        const bellButton = screen.getByLabelText('Notifications')
        fireEvent.click(bellButton)

        await waitFor(() => {
            expect(screen.getByText('🌳 Cây của bạn có ảnh mới!')).toBeInTheDocument()
            expect(screen.getByText('Lô A vừa được cập nhật')).toBeInTheDocument()
        })
    })

    it('marks notification as read and navigates on click', async () => {
        render(<NotificationBell />)

        await waitFor(() => {
            expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
        })

        const bellButton = screen.getByLabelText('Notifications')
        fireEvent.click(bellButton)

        await waitFor(() => {
            expect(screen.getByText('🌳 Cây của bạn có ảnh mới!')).toBeInTheDocument()
        })

        const notificationButton = screen.getByText('🌳 Cây của bạn có ảnh mới!').closest('button')
        fireEvent.click(notificationButton!)

        await waitFor(() => {
            expect(markAsRead).toHaveBeenCalledWith('notif-1')
            expect(mockPush).toHaveBeenCalledWith('/crm/my-garden/order-1#photos')
        })
    })

    it('formats time ago correctly', async () => {
        render(<NotificationBell />)

        await waitFor(() => {
            expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
        })

        const bellButton = screen.getByLabelText('Notifications')
        fireEvent.click(bellButton)

        await waitFor(() => {
            // date-fns with vi locale should show Vietnamese time format
            const timeElements = screen.getAllByText(/trước/)
            expect(timeElements.length).toBeGreaterThan(0)
        })
    })

    it('unsubscribes on unmount', async () => {
        const { unmount } = render(<NotificationBell />)

        await waitFor(() => {
            expect(subscribeToNotifications).toHaveBeenCalled()
        })

        unmount()

        expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('shows empty state when no notifications', async () => {
        ; (fetchNotifications as jest.Mock).mockResolvedValue([])
            ; (getUnreadCount as jest.Mock).mockResolvedValue(0)

        render(<NotificationBell />)

        await waitFor(() => {
            expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
        })

        const bellButton = screen.getByLabelText('Notifications')
        fireEvent.click(bellButton)

        await waitFor(() => {
            expect(screen.getByText('Chưa có thông báo mới')).toBeInTheDocument()
        })
    })
})
