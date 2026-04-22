/**
 * Unit Tests: ensureUserProfile
 *
 * [P0] Critical auth path — ensures every authenticated user has a DB profile.
 * Covers: profile existence check, referral resolution, default referrer fallback,
 * profile creation, duplicate-safe insert (23505), invalid referral handling.
 *
 * Mock strategy: mock @/lib/supabase/server and next/headers
 */

import { ensureUserProfile } from '../ensureUserProfile'

// ── Supabase mock ────────────────────────────────────────────────────────────

const mockSingle = jest.fn()
const mockInsert = jest.fn()
const mockIlike = jest.fn()

// Each call to from() returns a fresh chainable query builder
function makeQueryBuilder() {
    const builder: any = {
        select: () => builder,
        eq: () => builder,
        ilike: (...args: any[]) => { mockIlike(...args); return builder },
        single: mockSingle,
        insert: mockInsert,
    }
    return builder
}

const mockFrom = jest.fn(() => makeQueryBuilder())

const mockServiceClient = { from: mockFrom }

jest.mock('@/lib/supabase/server', () => ({
    createServiceRoleClient: () => mockServiceClient,
}))

// ── next/headers mock ────────────────────────────────────────────────────────

const mockCookieGet = jest.fn()

jest.mock('next/headers', () => ({
    cookies: jest.fn(() =>
        Promise.resolve({
            get: mockCookieGet,
        })
    ),
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

function setupExistingProfile() {
    mockSingle.mockResolvedValueOnce({ data: { id: 'existing-user-id' }, error: null })
}

function setupNoProfile() {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
}

function setupReferrerFound(referrerId: string) {
    mockSingle.mockResolvedValueOnce({ data: { id: referrerId }, error: null })
}

function setupReferrerNotFound() {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
}

const DEFAULT_REFERRER_ID = '5296b70b-03bb-463b-853c-9ccff2697685'

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
    mockCookieGet.mockReturnValue(undefined)
})

describe('[P0] ensureUserProfile — profile existence', () => {
    test('returns early when profile already exists', async () => {
        setupExistingProfile()

        await ensureUserProfile('user-123', 'test@example.com')

        expect(mockInsert).not.toHaveBeenCalled()
    })

    test('[P0] creates profile when profile does not exist', async () => {
        setupNoProfile()

        await ensureUserProfile('user-456', 'newuser@example.com')

        expect(mockInsert).toHaveBeenCalledTimes(1)
        // source calls .insert({ id, email, ... }) — argument is a plain object, not array
        const insertArg = mockInsert.mock.calls[0][0]
        expect(insertArg.id).toBe('user-456')
        expect(insertArg.email).toBe('newuser@example.com')
    })
})

describe('[P0] ensureUserProfile — referral code handling', () => {
    test('[P0] uses default referrer when no ref cookie', async () => {
        setupNoProfile()
        mockCookieGet.mockReturnValue(undefined)

        await ensureUserProfile('user-789', 'noref@example.com')

        const insertArg = mockInsert.mock.calls[0][0]
        expect(insertArg.referred_by_user_id).toBe(DEFAULT_REFERRER_ID)
    })

    test('[P0] resolves valid referral code from cookie to referrer ID', async () => {
        setupNoProfile()
        mockCookieGet.mockReturnValue({ value: 'REF123' })
        setupReferrerFound('referrer-user-id')

        await ensureUserProfile('user-abc', 'referred@example.com')

        const insertArg = mockInsert.mock.calls[0][0]
        expect(insertArg.referred_by_user_id).toBe('referrer-user-id')
    })

    test('[P1] falls back to default referrer when referral code is invalid', async () => {
        setupNoProfile()
        mockCookieGet.mockReturnValue({ value: 'INVALID_CODE' })
        setupReferrerNotFound()

        await ensureUserProfile('user-xyz', 'badreferral@example.com')

        const insertArg = mockInsert.mock.calls[0][0]
        expect(insertArg.referred_by_user_id).toBe(DEFAULT_REFERRER_ID)
    })

    test('[P1] trims whitespace from referral code before lookup', async () => {
        setupNoProfile()
        mockCookieGet.mockReturnValue({ value: '  REF456  ' })
        setupReferrerFound('another-referrer')

        await ensureUserProfile('user-trim', 'trim@example.com')

        expect(mockIlike).toHaveBeenCalledWith('referral_code', 'REF456')
    })
})

describe('[P1] ensureUserProfile — profile data integrity', () => {
    test('[P1] sets phone when provided', async () => {
        setupNoProfile()

        await ensureUserProfile('user-phone', 'phone@example.com', '0912345678')

        const insertArg = mockInsert.mock.calls[0][0]
        expect(insertArg.phone).toBe('0912345678')
    })

    test('[P1] sets phone to null when not provided', async () => {
        setupNoProfile()

        await ensureUserProfile('user-nophone', 'nophone@example.com')

        const insertArg = mockInsert.mock.calls[0][0]
        expect(insertArg.phone).toBeNull()
    })

    test('[P1] generates non-empty referral_code for the new profile', async () => {
        setupNoProfile()

        await ensureUserProfile('user-code', 'myemail@example.com')

        const insertArg = mockInsert.mock.calls[0][0]
        expect(typeof insertArg.referral_code).toBe('string')
        expect(insertArg.referral_code.length).toBeGreaterThan(0)
    })

    test('[P2] generates referral_code from email prefix', async () => {
        setupNoProfile()

        await ensureUserProfile('user-prefix', 'myemail@example.com')

        const insertArg = mockInsert.mock.calls[0][0]
        expect(insertArg.referral_code).toMatch(/^myemail/)
    })
})

describe('[P1] ensureUserProfile — duplicate-safe insert', () => {
    test('[P1] does not throw when insert returns 23505 (unique_violation)', async () => {
        setupNoProfile()
        mockInsert.mockResolvedValueOnce({ error: { code: '23505', message: 'duplicate key' } })

        await expect(
            ensureUserProfile('user-dup', 'dup@example.com')
        ).resolves.toBeUndefined()
    })

    test('[P1] does not throw on successful insert', async () => {
        setupNoProfile()
        mockInsert.mockResolvedValueOnce({ error: null })

        await expect(
            ensureUserProfile('user-ok', 'ok@example.com')
        ).resolves.toBeUndefined()
    })
})
