import { updateStoreOrderStatus, verifyAdmin } from '../adminStoreOrders'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { captureError } from '@/lib/monitoring'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/supabase/server', () => ({
    createServerClient: jest.fn(),
    createServiceRoleClient: jest.fn(),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

jest.mock('@/lib/monitoring', () => ({
    captureError: jest.fn(),
}))

describe('adminStoreOrders actions', () => {
    let mockServerSupabase: any
    let mockServiceSupabase: any

    const mockAdminUser = { id: 'admin-uuid-1', email: 'admin@example.com' }

    beforeEach(() => {
        jest.clearAllMocks()

        mockServerSupabase = {
            auth: {
                getUser: jest.fn().mockResolvedValue({
                    data: { user: mockAdminUser },
                    error: null,
                }),
            },
        }
        ;(createServerClient as jest.Mock).mockResolvedValue(mockServerSupabase)

        mockServiceSupabase = {
            from: jest.fn(),
            rpc: jest.fn(),
        }
        ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockServiceSupabase)
    })

    describe('verifyAdmin', () => {
        it('throws Unauthorized when user is not authenticated', async () => {
            mockServerSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error('No session'),
            })

            await expect(verifyAdmin()).rejects.toThrow('Unauthorized')
        })

        it('throws Forbidden when user role is member', async () => {
            mockServiceSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { role: 'member' },
                            error: null,
                        }),
                    }),
                }),
            })

            await expect(verifyAdmin()).rejects.toThrow('Forbidden')
        })

        it('succeeds when user role is admin', async () => {
            mockServiceSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { role: 'admin' },
                            error: null,
                        }),
                    }),
                }),
            })

            const result = await verifyAdmin()
            expect(result.user).toEqual(mockAdminUser)
            expect(result.profile.role).toBe('admin')
        })

        it('succeeds when user role is super_admin', async () => {
            mockServiceSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { role: 'super_admin' },
                            error: null,
                        }),
                    }),
                }),
            })

            const result = await verifyAdmin()
            expect(result.profile.role).toBe('super_admin')
        })
    })

    describe('updateStoreOrderStatus', () => {
        const setupMockAuth = (role = 'admin') => {
            mockServiceSupabase.from.mockImplementation((table: string) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({
                                    data: { role },
                                    error: null,
                                }),
                            }),
                        }),
                    }
                }
                return {}
            })
        }

        it('AUTH_DENY: returns Vietnamese error when not authenticated', async () => {
            mockServerSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: null,
            })

            const res = await updateStoreOrderStatus('order-1', 'confirmed')
            expect(res).toEqual({ success: false, error: 'Bạn không có quyền thực hiện thao tác này' })
        })

        it('AUTH_DENY: returns error when role is not admin/super_admin', async () => {
            setupMockAuth('member')

            const res = await updateStoreOrderStatus('order-1', 'confirmed')
            expect(res).toEqual({ success: false, error: 'Bạn không có quyền thực hiện thao tác này' })
        })

        it('returns error when order not found', async () => {
            mockServiceSupabase.from.mockImplementation((table: string) => {
                if (table === 'users') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                single: jest.fn().mockResolvedValue({
                                    data: { role: 'admin' },
                                    error: null,
                                }),
                            }),
                        }),
                    }
                }
                if (table === 'store_orders') {
                    return {
                        select: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                maybeSingle: jest.fn().mockResolvedValue({
                                    data: null,
                                    error: null,
                                }),
                            }),
                        }),
                    }
                }
                return {}
            })

            const res = await updateStoreOrderStatus('order-nonexistent', 'confirmed')
            expect(res).toEqual({ success: false, error: 'Không tìm thấy đơn hàng' })
        })

        describe('FWD_OK: valid forward transitions', () => {
            it('pending -> confirmed updates status and triggers confirm_product_stock', async () => {
                const mockItems = [
                    { product_id: 'prod-1', quantity: 2 },
                    { product_id: 'prod-2', quantity: 1 },
                ]
                const updateMock = jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockResolvedValue({
                                data: [{ id: 'order-1' }],
                                error: null,
                            }),
                        }),
                    }),
                })

                mockServiceSupabase.rpc.mockResolvedValue({ error: null })

                mockServiceSupabase.from.mockImplementation((table: string) => {
                    if (table === 'users') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
                                }),
                            }),
                        }
                    }
                    if (table === 'store_orders') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    maybeSingle: jest.fn().mockResolvedValue({
                                        data: { id: 'order-1', status: 'pending' },
                                        error: null,
                                    }),
                                }),
                            }),
                            update: updateMock,
                        }
                    }
                    if (table === 'store_order_items') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockResolvedValue({
                                    data: mockItems,
                                    error: null,
                                }),
                            }),
                        }
                    }
                    return {}
                })

                const res = await updateStoreOrderStatus('order-1', 'confirmed')
                expect(res).toEqual({ success: true })

                expect(updateMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        status: 'confirmed',
                    })
                )
                expect(mockServiceSupabase.rpc).toHaveBeenCalledTimes(2)
                expect(mockServiceSupabase.rpc).toHaveBeenCalledWith('confirm_product_stock', {
                    p_product_id: 'prod-1',
                    p_qty: 2,
                })
                expect(mockServiceSupabase.rpc).toHaveBeenCalledWith('confirm_product_stock', {
                    p_product_id: 'prod-2',
                    p_qty: 1,
                })
                expect(revalidatePath).toHaveBeenCalledWith('/crm/admin/store-orders')
                expect(revalidatePath).toHaveBeenCalledWith('/crm/my-store-orders')
            })

            it('confirmed -> processing updates status', async () => {
                const updateMock = jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockResolvedValue({
                                data: [{ id: 'order-1' }],
                                error: null,
                            }),
                        }),
                    }),
                })

                mockServiceSupabase.from.mockImplementation((table: string) => {
                    if (table === 'users') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
                                }),
                            }),
                        }
                    }
                    if (table === 'store_orders') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    maybeSingle: jest.fn().mockResolvedValue({
                                        data: { id: 'order-1', status: 'confirmed' },
                                        error: null,
                                    }),
                                }),
                            }),
                            update: updateMock,
                        }
                    }
                    return {}
                })

                const res = await updateStoreOrderStatus('order-1', 'processing')
                expect(res).toEqual({ success: true })
                expect(updateMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        status: 'processing',
                    })
                )
            })

            it('processing -> shipped with tracking number updates status and saves tracking_number', async () => {
                const updateMock = jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockResolvedValue({
                                data: [{ id: 'order-1' }],
                                error: null,
                            }),
                        }),
                    }),
                })

                mockServiceSupabase.from.mockImplementation((table: string) => {
                    if (table === 'users') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
                                }),
                            }),
                        }
                    }
                    if (table === 'store_orders') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    maybeSingle: jest.fn().mockResolvedValue({
                                        data: { id: 'order-1', status: 'processing' },
                                        error: null,
                                    }),
                                }),
                            }),
                            update: updateMock,
                        }
                    }
                    return {}
                })

                const res = await updateStoreOrderStatus('order-1', 'shipped', {
                    trackingNumber: 'VN123456789',
                })
                expect(res).toEqual({ success: true })
                expect(updateMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        status: 'shipped',
                        tracking_number: 'VN123456789',
                    })
                )
            })

            it('shipped -> delivered updates status', async () => {
                const updateMock = jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockResolvedValue({
                                data: [{ id: 'order-1' }],
                                error: null,
                            }),
                        }),
                    }),
                })

                mockServiceSupabase.from.mockImplementation((table: string) => {
                    if (table === 'users') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
                                }),
                            }),
                        }
                    }
                    if (table === 'store_orders') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    maybeSingle: jest.fn().mockResolvedValue({
                                        data: { id: 'order-1', status: 'shipped' },
                                        error: null,
                                    }),
                                }),
                            }),
                            update: updateMock,
                        }
                    }
                    return {}
                })

                const res = await updateStoreOrderStatus('order-1', 'delivered')
                expect(res).toEqual({ success: true })
                expect(updateMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        status: 'delivered',
                    })
                )
            })
        })

        describe('CONFIRM_STOCK: handling stock RPC errors without failing order status update', () => {
            it('logs captureError when confirm_product_stock fails but still returns success', async () => {
                const mockItems = [{ product_id: 'prod-1', quantity: 2 }]
                const updateMock = jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockResolvedValue({
                                data: [{ id: 'order-1' }],
                                error: null,
                            }),
                        }),
                    }),
                })

                mockServiceSupabase.rpc.mockResolvedValue({
                    error: new Error('Insufficient reserved stock'),
                })

                mockServiceSupabase.from.mockImplementation((table: string) => {
                    if (table === 'users') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
                                }),
                            }),
                        }
                    }
                    if (table === 'store_orders') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    maybeSingle: jest.fn().mockResolvedValue({
                                        data: { id: 'order-1', status: 'pending' },
                                        error: null,
                                    }),
                                }),
                            }),
                            update: updateMock,
                        }
                    }
                    if (table === 'store_order_items') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockResolvedValue({
                                    data: mockItems,
                                    error: null,
                                }),
                            }),
                        }
                    }
                    return {}
                })

                const res = await updateStoreOrderStatus('order-1', 'confirmed')
                expect(res).toEqual({ success: true })
                expect(captureError).toHaveBeenCalledWith(
                    expect.any(Error),
                    expect.objectContaining({
                        action: 'confirm_product_stock',
                        orderId: 'order-1',
                        productId: 'prod-1',
                    })
                )
            })
        })

        describe('ERR: error branches', () => {
            const setupAuthOnly = () => {
                mockServiceSupabase.from.mockImplementation((table: string) => {
                    if (table === 'users') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
                                }),
                            }),
                        }
                    }
                    return {}
                })
            }

            it('returns error when store_order_items prefetch fails and does not update', async () => {
                const updateMock = jest.fn()

                mockServiceSupabase.from.mockImplementation((table: string) => {
                    if (table === 'users') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
                                }),
                            }),
                        }
                    }
                    if (table === 'store_orders') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    maybeSingle: jest.fn().mockResolvedValue({
                                        data: { id: 'order-1', status: 'pending' },
                                        error: null,
                                    }),
                                }),
                            }),
                            update: updateMock,
                        }
                    }
                    if (table === 'store_order_items') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockResolvedValue({
                                    data: null,
                                    error: new Error('DB read failed'),
                                }),
                            }),
                        }
                    }
                    return {}
                })

                const res = await updateStoreOrderStatus('order-1', 'confirmed')
                expect(res).toEqual({ success: false, error: 'Không thể đọc chi tiết đơn hàng' })
                expect(updateMock).not.toHaveBeenCalled()
            })

            it('returns error when store_orders update fails', async () => {
                const updateMock = jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockResolvedValue({
                                data: null,
                                error: { message: 'update failed' },
                            }),
                        }),
                    }),
                })

                setupAuthOnly()
                const baseImpl = mockServiceSupabase.from.getMockImplementation()
                mockServiceSupabase.from.mockImplementation((table: string) => {
                    if (table === 'store_orders') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    maybeSingle: jest.fn().mockResolvedValue({
                                        data: { id: 'order-1', status: 'confirmed' },
                                        error: null,
                                    }),
                                }),
                            }),
                            update: updateMock,
                        }
                    }
                    return baseImpl!(table)
                })

                const res = await updateStoreOrderStatus('order-1', 'processing')
                expect(res).toEqual({ success: false, error: 'update failed' })
            })

            it('logs captureError when release_product_stock fails on cancel but still returns success', async () => {
                const mockItems = [{ product_id: 'prod-1', quantity: 2 }]
                const updateMock = jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockResolvedValue({
                                data: [{ id: 'order-1' }],
                                error: null,
                            }),
                        }),
                    }),
                })

                mockServiceSupabase.rpc.mockResolvedValue({
                    error: new Error('RPC release failed'),
                })

                mockServiceSupabase.from.mockImplementation((table: string) => {
                    if (table === 'users') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
                                }),
                            }),
                        }
                    }
                    if (table === 'store_orders') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    maybeSingle: jest.fn().mockResolvedValue({
                                        data: { id: 'order-1', status: 'pending' },
                                        error: null,
                                    }),
                                }),
                            }),
                            update: updateMock,
                        }
                    }
                    if (table === 'store_order_items') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockResolvedValue({
                                    data: mockItems,
                                    error: null,
                                }),
                            }),
                        }
                    }
                    return {}
                })

                const res = await updateStoreOrderStatus('order-1', 'cancelled')
                expect(res).toEqual({ success: true })
                expect(captureError).toHaveBeenCalledWith(
                    expect.any(Error),
                    expect.objectContaining({
                        action: 'release_product_stock',
                        orderId: 'order-1',
                        productId: 'prod-1',
                    })
                )
            })
        })

        describe('TRACK_REQ: tracking number validation', () => {
            it('returns error when shipping without tracking number', async () => {
                const updateMock = jest.fn()

                mockServiceSupabase.from.mockImplementation((table: string) => {
                    if (table === 'users') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
                                }),
                            }),
                        }
                    }
                    if (table === 'store_orders') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    maybeSingle: jest.fn().mockResolvedValue({
                                        data: { id: 'order-1', status: 'processing' },
                                        error: null,
                                    }),
                                }),
                            }),
                            update: updateMock,
                        }
                    }
                    return {}
                })

                const res1 = await updateStoreOrderStatus('order-1', 'shipped')
                expect(res1).toEqual({ success: false, error: 'Vui lòng nhập mã vận đơn' })

                const res2 = await updateStoreOrderStatus('order-1', 'shipped', { trackingNumber: '   ' })
                expect(res2).toEqual({ success: false, error: 'Vui lòng nhập mã vận đơn' })

                expect(updateMock).not.toHaveBeenCalled()
            })
        })

        describe('SKIP_DENY: invalid status transitions', () => {
            const testInvalidTransition = async (current: any, target: any) => {
                mockServiceSupabase.from.mockImplementation((table: string) => {
                    if (table === 'users') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
                                }),
                            }),
                        }
                    }
                    if (table === 'store_orders') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    maybeSingle: jest.fn().mockResolvedValue({
                                        data: { id: 'order-1', status: current },
                                        error: null,
                                    }),
                                }),
                            }),
                        }
                    }
                    return {}
                })

                const res = await updateStoreOrderStatus('order-1', target)
                expect(res).toEqual({ success: false, error: 'Chuyển trạng thái không hợp lệ' })
            }

            it('denies pending -> processing (skip confirmed)', async () => {
                await testInvalidTransition('pending', 'processing')
            })

            it('denies shipped -> confirmed (backward transition)', async () => {
                await testInvalidTransition('shipped', 'confirmed')
            })

            it('denies delivered -> any transition (terminal)', async () => {
                await testInvalidTransition('delivered', 'cancelled')
                await testInvalidTransition('delivered', 'shipped')
            })

            it('denies cancelled -> any transition (terminal)', async () => {
                await testInvalidTransition('cancelled', 'pending')
                await testInvalidTransition('cancelled', 'confirmed')
            })
        })

        describe('RACE: race condition handling', () => {
            it('returns error when conditional update affects 0 rows', async () => {
                const updateMock = jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockResolvedValue({
                                data: [],
                                error: null,
                            }),
                        }),
                    }),
                })

                mockServiceSupabase.from.mockImplementation((table: string) => {
                    if (table === 'users') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
                                }),
                            }),
                        }
                    }
                    if (table === 'store_orders') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    maybeSingle: jest.fn().mockResolvedValue({
                                        data: { id: 'order-1', status: 'confirmed' },
                                        error: null,
                                    }),
                                }),
                            }),
                            update: updateMock,
                        }
                    }
                    return {}
                })

                const res = await updateStoreOrderStatus('order-1', 'processing')
                expect(res).toEqual({ success: false, error: 'Trạng thái đơn hàng đã thay đổi' })
            })
        })

        describe('CANCEL_OK: valid cancellation transitions', () => {
            it('pending -> cancelled releases stock and saves cancellation reason', async () => {
                const mockItems = [{ product_id: 'prod-1', quantity: 3 }]
                const updateMock = jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockResolvedValue({
                                data: [{ id: 'order-1' }],
                                error: null,
                            }),
                        }),
                    }),
                })

                mockServiceSupabase.rpc.mockResolvedValue({ error: null })

                mockServiceSupabase.from.mockImplementation((table: string) => {
                    if (table === 'users') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
                                }),
                            }),
                        }
                    }
                    if (table === 'store_orders') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    maybeSingle: jest.fn().mockResolvedValue({
                                        data: { id: 'order-1', status: 'pending' },
                                        error: null,
                                    }),
                                }),
                            }),
                            update: updateMock,
                        }
                    }
                    if (table === 'store_order_items') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockResolvedValue({
                                    data: mockItems,
                                    error: null,
                                }),
                            }),
                        }
                    }
                    return {}
                })

                const res = await updateStoreOrderStatus('order-1', 'cancelled', {
                    cancellationReason: 'Khách yêu cầu hủy qua điện thoại',
                })
                expect(res).toEqual({ success: true })
                expect(updateMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        status: 'cancelled',
                        cancellation_reason: 'Khách yêu cầu hủy qua điện thoại',
                    })
                )
                expect(mockServiceSupabase.rpc).toHaveBeenCalledWith('release_product_stock', {
                    p_product_id: 'prod-1',
                    p_qty: 3,
                })
            })

            it('confirmed -> cancelled without reason uses default reason and releases stock', async () => {
                const mockItems = [{ product_id: 'prod-2', quantity: 1 }]
                const updateMock = jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            select: jest.fn().mockResolvedValue({
                                data: [{ id: 'order-1' }],
                                error: null,
                            }),
                        }),
                    }),
                })

                mockServiceSupabase.rpc.mockResolvedValue({ error: null })

                mockServiceSupabase.from.mockImplementation((table: string) => {
                    if (table === 'users') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
                                }),
                            }),
                        }
                    }
                    if (table === 'store_orders') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    maybeSingle: jest.fn().mockResolvedValue({
                                        data: { id: 'order-1', status: 'confirmed' },
                                        error: null,
                                    }),
                                }),
                            }),
                            update: updateMock,
                        }
                    }
                    if (table === 'store_order_items') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockResolvedValue({
                                    data: mockItems,
                                    error: null,
                                }),
                            }),
                        }
                    }
                    return {}
                })

                const res = await updateStoreOrderStatus('order-1', 'cancelled')
                expect(res).toEqual({ success: true })
                expect(updateMock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        status: 'cancelled',
                        cancellation_reason: 'Admin hủy đơn',
                    })
                )
                expect(mockServiceSupabase.rpc).toHaveBeenCalledWith('release_product_stock', {
                    p_product_id: 'prod-2',
                    p_qty: 1,
                })
            })
        })

        describe('CANCEL_DENY: cancellation not allowed after confirmed', () => {
            const testDisallowedCancel = async (currentStatus: string) => {
                mockServiceSupabase.from.mockImplementation((table: string) => {
                    if (table === 'users') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
                                }),
                            }),
                        }
                    }
                    if (table === 'store_orders') {
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    maybeSingle: jest.fn().mockResolvedValue({
                                        data: { id: 'order-1', status: currentStatus },
                                        error: null,
                                    }),
                                }),
                            }),
                        }
                    }
                    return {}
                })

                const res = await updateStoreOrderStatus('order-1', 'cancelled')
                expect(res).toEqual({ success: false, error: 'Chuyển trạng thái không hợp lệ' })
            }

            it('denies processing -> cancelled', async () => {
                await testDisallowedCancel('processing')
            })

            it('denies shipped -> cancelled', async () => {
                await testDisallowedCancel('shipped')
            })
        })
    })
})
