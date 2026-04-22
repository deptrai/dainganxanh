/**
 * Unit Tests: admin-settings.ts
 *
 * Covers: getAdminProfile (auth + role check), updateAdminProfile,
 *         getNotificationPreferences (defaults when none exist),
 *         updateNotificationPreferences (upsert).
 * changePassword skipped — depends on Supabase auth.signInWithPassword re-auth,
 * which is hard to unit test and low P value.
 */

import {
  getAdminProfile,
  updateAdminProfile,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../admin-settings'

// ── Mock state ───────────────────────────────────────────────────────────────

const mockGetUser = jest.fn()
const mockFrom = jest.fn()

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
}

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupAdminUser(role = 'admin') {
  mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-id', email: 'admin@test.com', last_sign_in_at: '2025-01-01' } }, error: null })
  return role
}

function setupUnauthenticated() {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } })
}

// ── getAdminProfile ───────────────────────────────────────────────────────────

describe('getAdminProfile', () => {
  beforeEach(() => jest.clearAllMocks())

  it('[P0] returns profile for admin user', async () => {
    setupAdminUser()
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'admin-id', full_name: 'Admin', email: 'admin@test.com', role: 'admin' },
        error: null,
      }),
    })

    const result = await getAdminProfile()
    expect(result.success).toBe(true)
    expect(result.profile?.role).toBe('admin')
  })

  it('[P0] returns unauthorized when not authenticated', async () => {
    setupUnauthenticated()

    const result = await getAdminProfile()
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
  })

  it('[P0] returns unauthorized when user is not admin role', async () => {
    setupAdminUser()
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'admin-id', full_name: 'User', email: 'u@test.com', role: 'customer' },
        error: null,
      }),
    })

    const result = await getAdminProfile()
    expect(result.success).toBe(false)
    expect(result.error).toContain('Unauthorized')
  })

  it('[P1] returns error when profile DB fetch fails', async () => {
    setupAdminUser()
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    })

    const result = await getAdminProfile()
    expect(result.success).toBe(false)
  })
})

// ── updateAdminProfile ────────────────────────────────────────────────────────

describe('updateAdminProfile', () => {
  beforeEach(() => jest.clearAllMocks())

  it('[P1] updates full_name successfully', async () => {
    setupAdminUser()
    // Call 1: verify role
    // Call 2: update
    mockFrom
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
      })
      .mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      })

    const result = await updateAdminProfile('New Name')
    expect(result.success).toBe(true)
  })

  it('[P0] returns unauthorized when unauthenticated', async () => {
    setupUnauthenticated()
    const result = await updateAdminProfile('Name')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
  })

  it('[P1] returns error when update DB fails', async () => {
    setupAdminUser()
    mockFrom
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
      })
      .mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
      })

    const result = await updateAdminProfile('Bad Name')
    expect(result.success).toBe(false)
  })
})

// ── getNotificationPreferences ────────────────────────────────────────────────

describe('getNotificationPreferences', () => {
  beforeEach(() => jest.clearAllMocks())

  it('[P1] returns existing preferences', async () => {
    setupAdminUser()
    const prefs = {
      user_id: 'admin-id',
      email_notifications: { orders: true, withdrawals: false, alerts: true },
      in_app_sound: false,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    }
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: prefs, error: null }),
    })

    const result = await getNotificationPreferences()
    expect(result.success).toBe(true)
    expect(result.preferences?.in_app_sound).toBe(false)
  })

  it('[P1] returns default preferences when no record exists (PGRST116)', async () => {
    setupAdminUser()
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    })

    const result = await getNotificationPreferences()
    expect(result.success).toBe(true)
    expect(result.preferences?.email_notifications.orders).toBe(true)
    expect(result.preferences?.in_app_sound).toBe(true)
  })

  it('[P0] returns unauthorized when unauthenticated', async () => {
    setupUnauthenticated()
    const result = await getNotificationPreferences()
    expect(result.success).toBe(false)
  })
})

// ── updateNotificationPreferences ────────────────────────────────────────────

describe('updateNotificationPreferences', () => {
  beforeEach(() => jest.clearAllMocks())

  it('[P1] upserts preferences successfully', async () => {
    setupAdminUser()
    mockFrom
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { role: 'super_admin' }, error: null }),
      })
      .mockReturnValueOnce({
        upsert: jest.fn().mockResolvedValue({ error: null }),
      })

    const result = await updateNotificationPreferences(
      { orders: true, withdrawals: true, alerts: false },
      false
    )
    expect(result.success).toBe(true)
  })

  it('[P0] returns unauthorized when not admin', async () => {
    setupAdminUser()
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { role: 'customer' }, error: null }),
    })

    const result = await updateNotificationPreferences(
      { orders: true, withdrawals: true, alerts: true },
      true
    )
    expect(result.success).toBe(false)
  })
})
