import {
  getAvailableBalance,
  getSavedBankInfo,
  requestWithdrawal,
  approveWithdrawal,
  rejectWithdrawal,
} from '../withdrawals'
import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server'
import { getEffectiveUser } from '@/lib/getEffectiveUser'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(),
  createServerClient: jest.fn(),
}))

jest.mock('@/lib/getEffectiveUser', () => ({
  getEffectiveUser: jest.fn(),
}))

jest.mock('@/lib/utils/telegram', () => ({
  notifyWithdrawalRequest: jest.fn().mockResolvedValue(undefined),
  notifyWithdrawalApproved: jest.fn().mockResolvedValue(undefined),
  notifyWithdrawalRejected: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/constants', () => ({
  MIN_WITHDRAWAL: 200_000,
}))

// ---------------------------------------------------------------------------
// Helpers to build chainable Supabase mocks
// ---------------------------------------------------------------------------

/** Creates a chainable mock whose terminal call (.eq/.single/etc.) resolves to `result`. */
function chainMock(result: any) {
  const chain: any = {}
  const self = () => chain
  chain.from = jest.fn().mockReturnValue(chain)
  chain.select = jest.fn().mockReturnValue(chain)
  chain.insert = jest.fn().mockReturnValue(chain)
  chain.update = jest.fn().mockReturnValue(chain)
  chain.eq = jest.fn().mockReturnValue(chain)
  chain.in = jest.fn().mockReturnValue(chain)
  chain.order = jest.fn().mockReturnValue(chain)
  chain.limit = jest.fn().mockReturnValue(chain)
  chain.single = jest.fn().mockResolvedValue(result)
  // Allow awaiting the chain directly (for queries without .single())
  chain.then = (resolve: any) => Promise.resolve(result).then(resolve)
  return chain
}

/** A more flexible service client that dispatches `.from(table)` to per-table handlers. */
function buildServiceClient(handlers: Record<string, any>) {
  const client: any = {
    from: jest.fn((table: string) => {
      if (handlers[table]) return handlers[table]
      // Fallback generic chain
      return chainMock({ data: null, error: null })
    }),
    auth: {
      admin: {
        listUsers: jest.fn().mockResolvedValue({
          data: { users: [] },
          error: null,
        }),
        getUserById: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    },
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/proof.png' },
        }),
      }),
    },
  }
  return client
}

// ---------------------------------------------------------------------------
// Global fetch mock
// ---------------------------------------------------------------------------

const originalFetch = global.fetch

beforeAll(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true }),
    text: () => Promise.resolve('ok'),
  })
})

afterAll(() => {
  global.fetch = originalFetch
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Withdrawal Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // =========================================================================
  // getAvailableBalance
  // =========================================================================
  describe('getAvailableBalance', () => {
    it('calculates balance as totalCommission - totalWithdrawn', async () => {
      // Orders: two completed orders -> commission = round(500000*0.1) + round(300000*0.1) = 50000 + 30000 = 80000
      const ordersChain = chainMock({
        data: [{ total_amount: 500000 }, { total_amount: 300000 }],
      })
      // Approved withdrawals: 20000 withdrawn
      const withdrawalsChain = chainMock({ data: [{ amount: 20000 }] })

      const mockService = buildServiceClient({
        orders: ordersChain,
        withdrawals: withdrawalsChain,
      })
      ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockService)

      const balance = await getAvailableBalance('user-1')

      expect(balance).toBe(80000 - 20000) // 60000
      // Verify correct table queries
      expect(mockService.from).toHaveBeenCalledWith('orders')
      expect(mockService.from).toHaveBeenCalledWith('withdrawals')
    })

    it('returns 0 when there are no orders and no withdrawals', async () => {
      const ordersChain = chainMock({ data: [] })
      const withdrawalsChain = chainMock({ data: [] })

      const mockService = buildServiceClient({
        orders: ordersChain,
        withdrawals: withdrawalsChain,
      })
      ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockService)

      const balance = await getAvailableBalance('user-1')
      expect(balance).toBe(0)
    })

    it('returns full commission when no withdrawals exist', async () => {
      const ordersChain = chainMock({
        data: [{ total_amount: 1000000 }],
      })
      const withdrawalsChain = chainMock({ data: null })

      const mockService = buildServiceClient({
        orders: ordersChain,
        withdrawals: withdrawalsChain,
      })
      ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockService)

      const balance = await getAvailableBalance('user-1')
      expect(balance).toBe(100000) // 10% of 1,000,000
    })

    it('rounds commission per order (Math.round)', async () => {
      // 333333 * 0.1 = 33333.3 -> round = 33333
      const ordersChain = chainMock({ data: [{ total_amount: 333333 }] })
      const withdrawalsChain = chainMock({ data: [] })

      const mockService = buildServiceClient({
        orders: ordersChain,
        withdrawals: withdrawalsChain,
      })
      ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockService)

      const balance = await getAvailableBalance('user-1')
      expect(balance).toBe(33333)
    })
  })

  // =========================================================================
  // getSavedBankInfo
  // =========================================================================
  describe('getSavedBankInfo', () => {
    it('returns saved bank info when a previous withdrawal exists', async () => {
      const withdrawalsChain = chainMock({
        data: {
          bank_name: 'Vietcombank',
          bank_account_number: '0123456789',
          bank_account_name: 'NGUYEN VAN A',
        },
      })

      const mockService = buildServiceClient({ withdrawals: withdrawalsChain })
      ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockService)

      const result = await getSavedBankInfo('user-1')

      expect(result).toEqual({
        bankName: 'Vietcombank',
        bankAccountNumber: '0123456789',
        bankAccountName: 'NGUYEN VAN A',
      })
    })

    it('returns null when no previous withdrawal exists', async () => {
      const withdrawalsChain = chainMock({ data: null })

      const mockService = buildServiceClient({ withdrawals: withdrawalsChain })
      ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockService)

      const result = await getSavedBankInfo('user-1')
      expect(result).toBeNull()
    })
  })

  // =========================================================================
  // requestWithdrawal
  // =========================================================================
  describe('requestWithdrawal', () => {
    const validRequest = {
      amount: 200000,
      bankName: 'Vietcombank',
      bankAccountNumber: '0123456789',
      bankAccountName: 'NGUYEN VAN A',
    }

    function setupRequestMocks(overrides: {
      effectiveUser?: any
      profile?: any
      balance?: number
      insertError?: any
    } = {}) {
      const {
        effectiveUser = { userId: 'user-1', email: 'user@example.com', name: 'Nguyen Van A', isImpersonating: false },
        profile = { full_name: 'NGUYEN VAN A', email: 'user@example.com' },
        balance = 500000,
        insertError = null,
      } = overrides

      ;(getEffectiveUser as jest.Mock).mockResolvedValue(effectiveUser)

      // We need the service client to handle multiple .from() calls:
      // 1. users (profile lookup)
      // 2. orders (getAvailableBalance)
      // 3. withdrawals (getAvailableBalance + insert)
      // 4. users again (admin list)

      const insertChain: any = {
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: insertError ? null : { id: 'w-new' },
            error: insertError,
          }),
        }),
      }

      // Track call count for withdrawals to differentiate balance query vs insert
      let withdrawalCallCount = 0

      const mockService = buildServiceClient({})
      mockService.from = jest.fn((table: string) => {
        if (table === 'users') {
          // Profile lookup first, admin list second
          const usersChain: any = {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: profile }),
              }),
              in: jest.fn().mockResolvedValue({ data: [{ id: 'admin-1' }] }),
            }),
          }
          return usersChain
        }
        if (table === 'orders') {
          // Commission = balance amount (simplified: one order with total = balance / 0.1)
          return chainMock({ data: [{ total_amount: balance / 0.1 }] })
        }
        if (table === 'withdrawals') {
          withdrawalCallCount++
          if (withdrawalCallCount === 1) {
            // Balance check: approved withdrawals
            return chainMock({ data: [] })
          }
          // Insert
          return {
            insert: jest.fn().mockReturnValue(insertChain),
          }
        }
        return chainMock({ data: null })
      })

      mockService.auth.admin.listUsers.mockResolvedValue({
        data: { users: [{ id: 'admin-1', email: 'admin@example.com' }] },
        error: null,
      })

      ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockService)

      return mockService
    }

    it('returns Unauthorized when no effective user', async () => {
      ;(getEffectiveUser as jest.Mock).mockResolvedValue(null)

      const result = await requestWithdrawal(validRequest)
      expect(result).toEqual({ success: false, error: 'Unauthorized' })
    })

    it('returns error when profile not found', async () => {
      const mockService = setupRequestMocks({ profile: null })

      // Override from() so users query returns null data
      mockService.from = jest.fn((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null }),
              }),
            }),
          }
        }
        return chainMock({ data: null })
      })

      const result = await requestWithdrawal(validRequest)
      expect(result).toEqual({ success: false, error: 'Profile not found' })
    })

    it('returns error when bank account name does not match user name', async () => {
      setupRequestMocks({
        profile: { full_name: 'TRAN VAN B', email: 'user@example.com' },
      })

      const result = await requestWithdrawal(validRequest)
      expect(result).toEqual({
        success: false,
        error: 'Tên chủ tài khoản không khớp với tên của bạn trong hệ thống',
      })
    })

    it('returns error when balance is insufficient', async () => {
      setupRequestMocks({ balance: 100000 }) // less than 200000

      const result = await requestWithdrawal(validRequest)
      expect(result).toEqual({ success: false, error: 'Số dư không đủ' })
    })

    it('returns error when amount is below minimum', async () => {
      setupRequestMocks({ balance: 500000 })

      const result = await requestWithdrawal({
        ...validRequest,
        amount: 100000, // below MIN_WITHDRAWAL = 200000
      })
      expect(result).toEqual({
        success: false,
        error: 'Số tiền rút tối thiểu là 200,000 VNĐ',
      })
    })

    it('returns error when insert fails', async () => {
      setupRequestMocks({ insertError: { message: 'DB error' } })

      const result = await requestWithdrawal(validRequest)
      expect(result).toEqual({
        success: false,
        error: 'Không thể tạo yêu cầu rút tiền',
      })
    })

    it('creates withdrawal and sends email on success', async () => {
      setupRequestMocks()

      const result = await requestWithdrawal(validRequest)
      expect(result).toEqual({ success: true })

      // Verify email was sent via fetch to edge function
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('send-withdrawal-email'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('request_created'),
        }),
      )
    })

    it('matches names with Vietnamese diacritics normalized', async () => {
      // "Nguyễn Văn A" should match "NGUYEN VAN A" after normalization
      setupRequestMocks({
        profile: { full_name: 'Nguyễn Văn A', email: 'user@example.com' },
      })

      const result = await requestWithdrawal({
        ...validRequest,
        bankAccountName: 'NGUYEN VAN A',
      })
      expect(result).toEqual({ success: true })
    })
  })

  // =========================================================================
  // approveWithdrawal
  // =========================================================================
  describe('approveWithdrawal', () => {
    function makeProofFile(): File {
      const content = new Uint8Array([137, 80, 78, 71]) // PNG header bytes
      const file = new File([content], 'proof.png', { type: 'image/png' })
      // Ensure arrayBuffer() works in Jest/Node environment
      if (!file.arrayBuffer) {
        file.arrayBuffer = async () => content.buffer
      }
      return file
    }

    function makeFormData(overrides: { withdrawalId?: string; proofImage?: File | null } = {}) {
      const fd = new FormData()
      if (overrides.withdrawalId !== undefined) {
        fd.append('withdrawalId', overrides.withdrawalId)
      } else {
        fd.append('withdrawalId', 'w-123')
      }
      if (overrides.proofImage !== null) {
        const file = overrides.proofImage ?? makeProofFile()
        fd.append('proofImage', file)
      }
      return fd
    }

    function setupApproveMocks(overrides: {
      authUser?: any
      authError?: any
      profileRole?: string
      uploadError?: any
      updateError?: any
      withdrawalUser?: any
    } = {}) {
      const {
        authUser = { id: 'admin-1', email: 'admin@example.com' },
        authError = null,
        profileRole = 'admin',
        uploadError = null,
        updateError = null,
        withdrawalUser = {
          email: 'user@example.com',
          user_metadata: { full_name: 'Nguyen Van A' },
        },
      } = overrides

      // Server client (auth)
      const mockServer: any = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: authUser },
            error: authError,
          }),
        },
      }
      ;(createServerClient as jest.Mock).mockResolvedValue(mockServer)

      // Service client
      const updateSingleMock = jest.fn().mockResolvedValue({
        data: updateError
          ? null
          : {
              user_id: 'user-1',
              amount: 200000,
              bank_name: 'VCB',
              bank_account_number: '123',
              bank_account_name: 'NGUYEN VAN A',
            },
        error: updateError,
      })

      const mockService = buildServiceClient({})
      mockService.from = jest.fn((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { role: profileRole } }),
              }),
            }),
          }
        }
        if (table === 'withdrawals') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: updateSingleMock,
                }),
              }),
            }),
          }
        }
        if (table === 'notifications') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          }
        }
        return chainMock({ data: null })
      })

      mockService.storage.from = jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: uploadError }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/proof.png' },
        }),
      })

      mockService.auth.admin.getUserById.mockResolvedValue({
        data: { user: withdrawalUser },
        error: null,
      })

      ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockService)

      return { mockServer, mockService }
    }

    it('returns error when withdrawalId or proofImage is missing', async () => {
      const fd = new FormData()
      // No fields appended
      const result = await approveWithdrawal(fd)
      expect(result).toEqual({ success: false, error: 'Thiếu thông tin' })
    })

    it('returns Unauthorized when auth fails', async () => {
      setupApproveMocks({ authError: { message: 'no session' }, authUser: null })

      const result = await approveWithdrawal(makeFormData())
      expect(result).toEqual({ success: false, error: 'Unauthorized' })
    })

    it('returns Unauthorized when user is not admin', async () => {
      setupApproveMocks({ profileRole: 'user' })

      const result = await approveWithdrawal(makeFormData())
      expect(result).toEqual({ success: false, error: 'Unauthorized' })
    })

    it('returns error when image upload fails', async () => {
      setupApproveMocks({ uploadError: { message: 'upload failed' } })

      const result = await approveWithdrawal(makeFormData())
      expect(result).toEqual({ success: false, error: 'Không thể upload ảnh chuyển khoản' })
    })

    it('returns error when withdrawal update fails', async () => {
      setupApproveMocks({ updateError: { message: 'update failed' } })

      const result = await approveWithdrawal(makeFormData())
      expect(result).toEqual({ success: false, error: 'Không thể duyệt yêu cầu' })
    })

    it('approves withdrawal, sends email and creates notification on success', async () => {
      const { mockService } = setupApproveMocks()

      const result = await approveWithdrawal(makeFormData())
      expect(result).toEqual({ success: true })

      // Email sent
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('send-withdrawal-email'),
        expect.objectContaining({
          body: expect.stringContaining('request_approved'),
        }),
      )

      // Notification inserted
      expect(mockService.from).toHaveBeenCalledWith('notifications')
    })

    it('allows super_admin to approve', async () => {
      setupApproveMocks({ profileRole: 'super_admin' })

      const result = await approveWithdrawal(makeFormData())
      expect(result).toEqual({ success: true })
    })

    it('uploads proof image to correct storage path', async () => {
      const { mockService } = setupApproveMocks()

      await approveWithdrawal(makeFormData())

      const storageBucket = mockService.storage.from
      expect(storageBucket).toHaveBeenCalledWith('withdrawals')
    })
  })

  // =========================================================================
  // rejectWithdrawal
  // =========================================================================
  describe('rejectWithdrawal', () => {
    function setupRejectMocks(overrides: {
      authUser?: any
      authError?: any
      profileRole?: string
      updateError?: any
      withdrawalUser?: any
    } = {}) {
      const {
        authUser = { id: 'admin-1', email: 'admin@example.com' },
        authError = null,
        profileRole = 'admin',
        updateError = null,
        withdrawalUser = {
          email: 'user@example.com',
          user_metadata: { full_name: 'Nguyen Van A' },
        },
      } = overrides

      const mockServer: any = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: authUser },
            error: authError,
          }),
        },
      }
      ;(createServerClient as jest.Mock).mockResolvedValue(mockServer)

      const updateSingleMock = jest.fn().mockResolvedValue({
        data: updateError
          ? null
          : {
              user_id: 'user-1',
              amount: 200000,
              bank_name: 'VCB',
              bank_account_number: '123',
              bank_account_name: 'NGUYEN VAN A',
            },
        error: updateError,
      })

      const mockService = buildServiceClient({})
      mockService.from = jest.fn((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { role: profileRole } }),
              }),
            }),
          }
        }
        if (table === 'withdrawals') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: updateSingleMock,
                }),
              }),
            }),
          }
        }
        if (table === 'notifications') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          }
        }
        return chainMock({ data: null })
      })

      mockService.auth.admin.getUserById.mockResolvedValue({
        data: { user: withdrawalUser },
        error: null,
      })

      ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockService)

      return { mockServer, mockService }
    }

    it('returns Unauthorized when auth fails', async () => {
      setupRejectMocks({ authError: { message: 'no session' }, authUser: null })

      const result = await rejectWithdrawal('w-123', 'Invalid info')
      expect(result).toEqual({ success: false, error: 'Unauthorized' })
    })

    it('returns Unauthorized when user is not admin', async () => {
      setupRejectMocks({ profileRole: 'user' })

      const result = await rejectWithdrawal('w-123', 'Invalid info')
      expect(result).toEqual({ success: false, error: 'Unauthorized' })
    })

    it('returns error when withdrawal update fails', async () => {
      setupRejectMocks({ updateError: { message: 'update failed' } })

      const result = await rejectWithdrawal('w-123', 'Invalid info')
      expect(result).toEqual({ success: false, error: 'Không thể từ chối yêu cầu' })
    })

    it('rejects withdrawal, sends email and creates notification on success', async () => {
      const { mockService } = setupRejectMocks()

      const result = await rejectWithdrawal('w-123', 'Thông tin sai')
      expect(result).toEqual({ success: true })

      // Email sent
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('send-withdrawal-email'),
        expect.objectContaining({
          body: expect.stringContaining('request_rejected'),
        }),
      )

      // Notification inserted
      expect(mockService.from).toHaveBeenCalledWith('notifications')
    })

    it('allows super_admin to reject', async () => {
      setupRejectMocks({ profileRole: 'super_admin' })

      const result = await rejectWithdrawal('w-123', 'Reason')
      expect(result).toEqual({ success: true })
    })

    it('includes rejection reason in the email payload', async () => {
      setupRejectMocks()

      await rejectWithdrawal('w-123', 'Bank account mismatch')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('send-withdrawal-email'),
        expect.objectContaining({
          body: expect.stringContaining('Bank account mismatch'),
        }),
      )
    })
  })
})
