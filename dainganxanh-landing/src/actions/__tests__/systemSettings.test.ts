/**
 * Unit Tests: system-settings.ts
 *
 * Covers: getSystemConfig (admin check, transform, defaults),
 *         updateSystemConfig (validation, per-key update loop),
 *         getEmailTemplates, getEmailTemplatePreview (variable substitution).
 */

import {
  getSystemConfig,
  updateSystemConfig,
  getEmailTemplates,
  getEmailTemplatePreview,
} from '../system-settings'

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

function setupAdmin(role = 'admin') {
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'admin-id' } },
    error: null,
  })
  mockFrom.mockReturnValueOnce({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { role }, error: null }),
  })
}

function setupUnauthorized() {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })
}

// ── getSystemConfig ───────────────────────────────────────────────────────────

describe('getSystemConfig', () => {
  beforeEach(() => jest.clearAllMocks())

  it('[P1] returns config transformed from key-value rows', async () => {
    setupAdmin()
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        data: [
          { key: 'site_name', value: 'Đại Ngàn Xanh Test' },
          { key: 'support_email', value: 'test@dainganxanh.com' },
          { key: 'currency', value: 'VND' },
        ],
        error: null,
      }),
    })

    const result = await getSystemConfig()
    expect(result.success).toBe(true)
    expect(result.config?.site_name).toBe('Đại Ngàn Xanh Test')
  })

  it('[P1] returns default config values when DB returns empty', async () => {
    setupAdmin()
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    })

    const result = await getSystemConfig()
    expect(result.success).toBe(true)
    expect(result.config?.site_name).toBe('Đại Ngàn Xanh')
    expect(result.config?.currency).toBe('VND')
  })

  it('[P0] returns unauthorized when not authenticated', async () => {
    setupUnauthorized()
    const result = await getSystemConfig()
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
  })

  it('[P0] returns unauthorized for non-admin role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { role: 'customer' }, error: null }),
    })

    const result = await getSystemConfig()
    expect(result.success).toBe(false)
  })
})

// ── updateSystemConfig ────────────────────────────────────────────────────────

describe('updateSystemConfig', () => {
  beforeEach(() => jest.clearAllMocks())

  const validConfig = {
    site_name: 'Đại Ngàn Xanh',
    support_email: 'support@dainganxanh.com',
    currency: 'VND' as const,
    timezone: 'Asia/Ho_Chi_Minh',
    date_format: 'DD/MM/YYYY' as const,
  }

  it('[P1] updates all config keys successfully', async () => {
    setupAdmin()
    // 5 keys → 5 update calls
    mockFrom.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    })

    const result = await updateSystemConfig(validConfig)
    expect(result.success).toBe(true)
  })

  it('[P1] rejects invalid email format', async () => {
    setupAdmin()

    const result = await updateSystemConfig({
      ...validConfig,
      support_email: 'not-an-email',
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe('Validation failed')
  })

  it('[P1] rejects invalid currency enum', async () => {
    setupAdmin()

    const result = await updateSystemConfig({
      ...validConfig,
      currency: 'EUR' as any,
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe('Validation failed')
  })

  it('[P0] returns unauthorized when unauthenticated', async () => {
    setupUnauthorized()
    const result = await updateSystemConfig(validConfig)
    expect(result.success).toBe(false)
  })

  it('[P1] returns error when a single key update fails', async () => {
    setupAdmin()
    mockFrom.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: { message: 'Key update failed' } }),
    })

    const result = await updateSystemConfig(validConfig)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to update')
  })
})

// ── getEmailTemplates ─────────────────────────────────────────────────────────

describe('getEmailTemplates', () => {
  beforeEach(() => jest.clearAllMocks())

  it('[P1] returns templates list on success', async () => {
    setupAdmin()
    const templates = [
      { id: 't1', template_key: 'withdrawal_approved', subject: 'Approved', html_body: '<p>Hi</p>', variables: ['fullName'], updated_at: '2025-01-01' },
    ]
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: templates, error: null }),
    })

    const result = await getEmailTemplates()
    expect(result.success).toBe(true)
    expect(result.templates).toHaveLength(1)
    expect(result.templates?.[0].template_key).toBe('withdrawal_approved')
  })

  it('[P0] returns unauthorized when unauthenticated', async () => {
    setupUnauthorized()
    const result = await getEmailTemplates()
    expect(result.success).toBe(false)
  })
})

// ── getEmailTemplatePreview ───────────────────────────────────────────────────

describe('getEmailTemplatePreview', () => {
  beforeEach(() => jest.clearAllMocks())

  it('[P1] replaces template variables with sample data', async () => {
    setupAdmin()
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          subject: 'Withdrawal for {{fullName}}',
          html_body: '<p>Hi {{fullName}}, your amount is {{amount}}</p>',
          variables: ['fullName', 'amount'],
        },
        error: null,
      }),
    })

    const result = await getEmailTemplatePreview('withdrawal_approved')
    expect(result.success).toBe(true)
    expect(result.preview?.html).not.toContain('{{fullName}}')
    expect(result.preview?.html).toContain('Nguyễn Văn A')
    expect(result.preview?.html).toContain('5,000,000 ₫')
  })

  it('[P1] returns error when template not found', async () => {
    setupAdmin()
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
    })

    const result = await getEmailTemplatePreview('nonexistent')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Template not found')
  })

  it('[P0] returns unauthorized when unauthenticated', async () => {
    setupUnauthorized()
    const result = await getEmailTemplatePreview('any')
    expect(result.success).toBe(false)
  })
})
