// Mock modules BEFORE importing the function under test
jest.mock('@/lib/supabase/server', () => ({
    createServiceRoleClient: jest.fn(),
}))

jest.mock('next/headers', () => ({
    cookies: jest.fn(),
}))

import { ensureUserProfile } from '../ensureUserProfile'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const DEFAULT_REFERRER_ID = '5296b70b-03bb-463b-853c-9ccff2697685'

describe('ensureUserProfile', () => {
    let mockSupabase: any
    let mockCookieStore: any
    let consoleLogSpy: jest.SpyInstance
    let consoleWarnSpy: jest.SpyInstance
    let consoleErrorSpy: jest.SpyInstance

    beforeEach(() => {
        jest.clearAllMocks()

        // Spy on console methods
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

        // Default Supabase mock
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockReturnThis(),
            single: jest.fn(),
            insert: jest.fn(),
        }
        ;(createServiceRoleClient as jest.MockedFunction<typeof createServiceRoleClient>).mockReturnValue(mockSupabase)

        // Default cookie mock
        mockCookieStore = {
            get: jest.fn(),
        }
        ;(cookies as jest.MockedFunction<typeof cookies>).mockResolvedValue(mockCookieStore)
    })

    afterEach(() => {
        consoleLogSpy.mockRestore()
        consoleWarnSpy.mockRestore()
        consoleErrorSpy.mockRestore()
    })

    describe('when user profile already exists', () => {
        it('should not create a new profile', async () => {
            // Arrange
            const userId = 'existing-user-id'
            const email = 'existing@example.com'

            mockSupabase.single.mockResolvedValueOnce({
                data: { id: userId },
                error: null,
            })

            // Act
            await ensureUserProfile(userId, email)

            // Assert
            expect(mockSupabase.from).toHaveBeenCalledWith('users')
            expect(mockSupabase.select).toHaveBeenCalledWith('id')
            expect(mockSupabase.eq).toHaveBeenCalledWith('id', userId)
            expect(mockSupabase.insert).not.toHaveBeenCalled()
        })
    })

    describe('when user profile does not exist', () => {
        beforeEach(() => {
            // Mock user not found
            mockSupabase.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116' }, // Not found
            })
        })

        it('should create profile with valid referral code from cookie', async () => {
            // Arrange
            const userId = 'new-user-id'
            const email = 'newuser@example.com'
            const phone = '0123456789'
            const referralCode = 'ABC123'
            const referrerId = 'referrer-user-id'

            mockCookieStore.get.mockReturnValue({ value: referralCode })

            // Need to setup separate mock chains for each query
            // First query: Check if user exists
            const userCheckChain = {
                from: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }

            // Second query: Look up referrer
            const referrerCheckChain = {
                from: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                ilike: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: referrerId }, error: null }),
            }

            // Mock from() to return different chains
            mockSupabase.from
                .mockReturnValueOnce(userCheckChain)
                .mockReturnValueOnce(referrerCheckChain)
                .mockReturnValueOnce(mockSupabase) // For insert

            mockSupabase.insert.mockResolvedValue({ data: null, error: null })

            // Act
            await ensureUserProfile(userId, email, phone)

            // Assert
            expect(mockCookieStore.get).toHaveBeenCalledWith('ref')
            expect(referrerCheckChain.ilike).toHaveBeenCalledWith('referral_code', referralCode)
            expect(mockSupabase.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: userId,
                    email,
                    phone,
                    referred_by_user_id: referrerId,
                    referral_code: expect.stringMatching(/^newuser\d{5}$/),
                })
            )
            expect(consoleLogSpy).toHaveBeenCalledWith(
                '[ensureUserProfile] Valid referrer found:',
                expect.objectContaining({
                    referralCode,
                    referrerId,
                })
            )
        })

        it('should fallback to DEFAULT_REFERRER_ID when referral code is invalid', async () => {
            // Arrange
            const userId = 'new-user-id'
            const email = 'newuser@example.com'
            const invalidCode = 'INVALID_CODE'

            mockCookieStore.get.mockReturnValue({ value: invalidCode })

            // Mock referrer lookup - returns null (not found)
            mockSupabase.single
                .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // User not exists
                .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // Referrer not found

            mockSupabase.insert.mockResolvedValue({ data: null, error: null })

            // Act
            await ensureUserProfile(userId, email)

            // Assert
            expect(mockSupabase.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    referred_by_user_id: DEFAULT_REFERRER_ID,
                })
            )
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '[ensureUserProfile] Invalid referral code, using default:',
                expect.objectContaining({
                    inputCode: invalidCode,
                    defaultReferrerId: DEFAULT_REFERRER_ID,
                })
            )
        })

        it('should fallback to DEFAULT_REFERRER_ID when no referral cookie exists', async () => {
            // Arrange
            const userId = 'new-user-id'
            const email = 'newuser@example.com'

            mockCookieStore.get.mockReturnValue(undefined)
            mockSupabase.insert.mockResolvedValue({ data: null, error: null })

            // Act
            await ensureUserProfile(userId, email)

            // Assert
            expect(mockSupabase.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    referred_by_user_id: DEFAULT_REFERRER_ID,
                })
            )
            expect(consoleLogSpy).toHaveBeenCalledWith(
                '[ensureUserProfile] No referral code in cookie, using default:',
                expect.objectContaining({
                    defaultReferrerId: DEFAULT_REFERRER_ID,
                })
            )
        })

        it('should fallback to DEFAULT_REFERRER_ID when referral code is empty string', async () => {
            // Arrange
            const userId = 'new-user-id'
            const email = 'newuser@example.com'

            mockCookieStore.get.mockReturnValue({ value: '  ' }) // Whitespace only
            mockSupabase.insert.mockResolvedValue({ data: null, error: null })

            // Act
            await ensureUserProfile(userId, email)

            // Assert
            expect(mockSupabase.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    referred_by_user_id: DEFAULT_REFERRER_ID,
                })
            )
            expect(consoleLogSpy).toHaveBeenCalledWith(
                '[ensureUserProfile] No referral code in cookie, using default:',
                expect.any(Object)
            )
        })

        it('should generate referral code from email prefix', async () => {
            // Arrange
            const userId = 'new-user-id'
            const email = 'john.doe@example.com'

            mockCookieStore.get.mockReturnValue(undefined)
            mockSupabase.insert.mockResolvedValue({ data: null, error: null })

            // Act
            await ensureUserProfile(userId, email)

            // Assert
            expect(mockSupabase.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    referral_code: expect.stringMatching(/^johndoe\d{5}$/),
                })
            )
        })

        it('should handle phone = null correctly', async () => {
            // Arrange
            const userId = 'new-user-id'
            const email = 'test@example.com'

            mockCookieStore.get.mockReturnValue(undefined)
            mockSupabase.insert.mockResolvedValue({ data: null, error: null })

            // Act
            await ensureUserProfile(userId, email, null)

            // Assert
            expect(mockSupabase.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    phone: null,
                })
            )
        })

        it('should handle insert error gracefully (except unique_violation)', async () => {
            // Arrange
            const userId = 'new-user-id'
            const email = 'test@example.com'
            const insertError = { code: 'SOME_ERROR', message: 'Insert failed' }

            mockCookieStore.get.mockReturnValue(undefined)
            mockSupabase.insert.mockResolvedValue({ data: null, error: insertError })

            // Act
            await ensureUserProfile(userId, email)

            // Assert
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                '[ensureUserProfile] Failed to create profile:',
                insertError
            )
        })

        it('should ignore unique_violation error (23505)', async () => {
            // Arrange
            const userId = 'new-user-id'
            const email = 'test@example.com'
            const uniqueViolationError = { code: '23505', message: 'Duplicate key' }

            mockCookieStore.get.mockReturnValue(undefined)
            mockSupabase.insert.mockResolvedValue({ data: null, error: uniqueViolationError })

            // Act
            await ensureUserProfile(userId, email)

            // Assert
            expect(consoleErrorSpy).not.toHaveBeenCalled()
        })

        it('should log auto-creation when successful', async () => {
            // Arrange
            const userId = 'new-user-id'
            const email = 'test@example.com'

            mockCookieStore.get.mockReturnValue(undefined)
            mockSupabase.insert.mockResolvedValue({ data: null, error: null })

            // Act
            await ensureUserProfile(userId, email)

            // Assert
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                '[ensureUserProfile] Auto-created missing profile for',
                email,
                expect.objectContaining({
                    referredBy: DEFAULT_REFERRER_ID,
                })
            )
        })
    })
})
