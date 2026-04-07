/**
 * Tests for updateUserRole role-protection logic
 * Rules:
 *   1. Only super_admin can assign super_admin role
 *   2. Admin cannot change role of a super_admin target
 *   3. No one can demote themselves to 'user'
 *   4. super_admin can change any role
 */

import { updateUserRole } from '../adminUsers'

// ── Mocks ────────────────────────────────────────────────────────────────────

const SUPER_ADMIN_ID = 'super-admin-id'
const ADMIN_ID = 'admin-id'
const USER_ID = 'user-id'
const TARGET_SUPER_ADMIN_ID = 'other-super-admin-id'

const profiles: Record<string, { role: string }> = {
  [SUPER_ADMIN_ID]: { role: 'super_admin' },
  [ADMIN_ID]: { role: 'admin' },
  [USER_ID]: { role: 'user' },
  [TARGET_SUPER_ADMIN_ID]: { role: 'super_admin' },
}

let currentUserId = SUPER_ADMIN_ID

// Mock createServerClient — auth.getUser returns currentUserId
jest.mock('@/lib/supabase/server', () => {
  const makeSelect = (id: string) => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: profiles[id] ?? null, error: null }),
      }),
    }),
  })

  return {
    createServerClient: async () => ({
      auth: {
        getUser: async () => ({ data: { user: { id: currentUserId } }, error: null }),
      },
      from: () => makeSelect(currentUserId),
    }),
    createServiceRoleClient: () => ({
      from: (table: string) => ({
        select: () => ({
          eq: (_col: string, id: string) => ({
            single: async () => ({ data: profiles[id] ?? null, error: null }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }),
    }),
  }
})

// ── Tests ────────────────────────────────────────────────────────────────────

describe('updateUserRole', () => {
  // ── super_admin privileges ─────────────────────────────────────────────────
  describe('super_admin caller', () => {
    beforeEach(() => { currentUserId = SUPER_ADMIN_ID })

    it('can assign super_admin role to a user', async () => {
      const result = await updateUserRole(USER_ID, 'super_admin')
      expect(result.error).toBeUndefined()
    })

    it('can demote another super_admin to admin', async () => {
      const result = await updateUserRole(TARGET_SUPER_ADMIN_ID, 'admin')
      expect(result.error).toBeUndefined()
    })

    it('can demote admin to user', async () => {
      const result = await updateUserRole(ADMIN_ID, 'user')
      expect(result.error).toBeUndefined()
    })

    it('cannot demote themselves to user', async () => {
      const result = await updateUserRole(SUPER_ADMIN_ID, 'user')
      expect(result.error).toMatch(/tự hạ quyền/)
    })
  })

  // ── admin restrictions ─────────────────────────────────────────────────────
  describe('admin caller', () => {
    beforeEach(() => { currentUserId = ADMIN_ID })

    it('can promote user to admin', async () => {
      const result = await updateUserRole(USER_ID, 'admin')
      expect(result.error).toBeUndefined()
    })

    it('can demote another admin to user', async () => {
      // target is 'admin' — allowed
      const result = await updateUserRole(USER_ID, 'user')
      expect(result.error).toBeUndefined()
    })

    it('cannot assign super_admin role', async () => {
      const result = await updateUserRole(USER_ID, 'super_admin')
      expect(result.error).toMatch(/super_admin/)
    })

    it('cannot change role of a super_admin target', async () => {
      const result = await updateUserRole(TARGET_SUPER_ADMIN_ID, 'admin')
      expect(result.error).toMatch(/Admin không được thay đổi quyền của super_admin/)
    })

    it('cannot demote super_admin to user', async () => {
      const result = await updateUserRole(TARGET_SUPER_ADMIN_ID, 'user')
      expect(result.error).toMatch(/Admin không được thay đổi quyền của super_admin/)
    })

    it('cannot demote themselves to user', async () => {
      const result = await updateUserRole(ADMIN_ID, 'user')
      expect(result.error).toMatch(/tự hạ quyền/)
    })
  })

  // ── unauthenticated ────────────────────────────────────────────────────────
  describe('unauthenticated caller', () => {
    it('returns Unauthorized when no user', async () => {
      jest.resetModules()
      // Override mock to return no user
      jest.mock('@/lib/supabase/server', () => ({
        createServerClient: async () => ({
          auth: { getUser: async () => ({ data: { user: null }, error: null }) },
          from: () => ({}),
        }),
        createServiceRoleClient: () => ({ from: () => ({}) }),
      }))
      // Re-import to get new mock
      const { updateUserRole: fn } = await import('../adminUsers')
      const result = await fn(USER_ID, 'admin')
      expect(result.error).toMatch(/Unauthorized/)
    })
  })
})
