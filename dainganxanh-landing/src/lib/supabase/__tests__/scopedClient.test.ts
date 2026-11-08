import { getScopedCrmClient, assertOwnsUserId } from '../scopedClient'
import { getImpersonationContext } from '@/lib/getImpersonationContext'
import { createServiceRoleClient } from '@/lib/supabase/server'

jest.mock('@/lib/getImpersonationContext', () => ({
    getImpersonationContext: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
    createServiceRoleClient: jest.fn(),
}))

describe('scopedClient', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getScopedCrmClient', () => {
        it('trả về { client, effectiveUserId } khi người dùng đã đăng nhập', async () => {
            const mockClient = { from: jest.fn() }
            ;(getImpersonationContext as jest.Mock).mockResolvedValue({
                effectiveUserId: 'user-abc',
                isImpersonating: false,
            })
            ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockClient)

            const result = await getScopedCrmClient()
            expect(result).toEqual({
                client: mockClient,
                effectiveUserId: 'user-abc',
            })
            expect(createServiceRoleClient).toHaveBeenCalledTimes(1)
        })

        it('trả về effectiveUserId của user đang được admin impersonate', async () => {
            const mockClient = { from: jest.fn() }
            ;(getImpersonationContext as jest.Mock).mockResolvedValue({
                effectiveUserId: 'impersonated-user-123',
                isImpersonating: true,
                impersonatedUserName: 'Test User',
                adminRole: 'super_admin',
            })
            ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockClient)

            const result = await getScopedCrmClient()
            expect(result).toEqual({
                client: mockClient,
                effectiveUserId: 'impersonated-user-123',
            })
        })

        it('trả về null khi getImpersonationContext trả về null (chưa đăng nhập)', async () => {
            ;(getImpersonationContext as jest.Mock).mockResolvedValue(null)

            const result = await getScopedCrmClient()
            expect(result).toBeNull()
            expect(createServiceRoleClient).not.toHaveBeenCalled()
        })

        it('trả về null khi effectiveUserId rỗng', async () => {
            ;(getImpersonationContext as jest.Mock).mockResolvedValue({
                effectiveUserId: '',
                isImpersonating: false,
            })

            const result = await getScopedCrmClient()
            expect(result).toBeNull()
            expect(createServiceRoleClient).not.toHaveBeenCalled()
        })
    })

    describe('assertOwnsUserId', () => {
        it('không throw khi effectiveUserId khớp targetUserId', () => {
            expect(() => {
                assertOwnsUserId('user-1', 'user-1')
            }).not.toThrow()
        })

        it('throw error khi effectiveUserId khác targetUserId', () => {
            expect(() => {
                assertOwnsUserId('user-1', 'user-2')
            }).toThrow('Forbidden: User ID mismatch')
        })

        it('throw error khi một trong hai id bị null hoặc undefined', () => {
            expect(() => {
                assertOwnsUserId(null, 'user-1')
            }).toThrow('Forbidden: User ID mismatch')

            expect(() => {
                assertOwnsUserId('user-1', undefined)
            }).toThrow('Forbidden: User ID mismatch')

            expect(() => {
                assertOwnsUserId('', '')
            }).toThrow('Forbidden: User ID mismatch')
        })
    })
})
