import {
  notifyWithdrawalRequest,
  notifyWithdrawalApproved,
  notifyWithdrawalRejected,
} from '../telegram'

// ---------------------------------------------------------------------------
// Mock global fetch
// ---------------------------------------------------------------------------

const originalFetch = global.fetch

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve('ok'),
  })
  process.env.TELEGRAM_BOT_TOKEN = 'test-token'
  process.env.TELEGRAM_CHAT_ID = '123456'
})

afterAll(() => {
  global.fetch = originalFetch
  delete process.env.TELEGRAM_BOT_TOKEN
  delete process.env.TELEGRAM_CHAT_ID
})

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function getLastFetchBody(): string {
  const calls = (global.fetch as jest.Mock).mock.calls
  const lastCall = calls[calls.length - 1]
  return lastCall?.[1]?.body ?? ''
}

function getLastFetchUrl(): string {
  const calls = (global.fetch as jest.Mock).mock.calls
  const lastCall = calls[calls.length - 1]
  return lastCall?.[0] ?? ''
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Telegram withdrawal notifications', () => {
  // =========================================================================
  // notifyWithdrawalRequest
  // =========================================================================
  describe('notifyWithdrawalRequest', () => {
    const params = {
      userName: 'Nguyen Van A',
      userEmail: 'user@example.com',
      amount: 500000,
      bankName: 'Vietcombank',
      bankAccountNumber: '0123456789',
    }

    it('sends message to Telegram API with correct URL', async () => {
      await notifyWithdrawalRequest(params)

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(getLastFetchUrl()).toBe(
        'https://api.telegram.org/bottest-token/sendMessage',
      )
    })

    it('sends HTML-formatted message with withdrawal details', async () => {
      await notifyWithdrawalRequest(params)

      const body = JSON.parse(getLastFetchBody())
      expect(body.chat_id).toBe(123456)
      expect(body.parse_mode).toBe('HTML')
      expect(body.text).toContain('Nguyen Van A')
      expect(body.text).toContain('user@example.com')
      expect(body.text).toContain('500.000') // VND formatted
      expect(body.text).toContain('Vietcombank')
      expect(body.text).toContain('0123456789')
    })

    it('skips notification when TELEGRAM_BOT_TOKEN is not set', async () => {
      delete process.env.TELEGRAM_BOT_TOKEN

      await notifyWithdrawalRequest(params)

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('skips notification when TELEGRAM_CHAT_ID is not set', async () => {
      delete process.env.TELEGRAM_CHAT_ID

      await notifyWithdrawalRequest(params)

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('does not throw when fetch returns non-ok response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('Bad Request'),
      })

      // Should not throw
      await expect(notifyWithdrawalRequest(params)).resolves.toBeUndefined()
    })

    it('does not throw when fetch rejects', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      await expect(notifyWithdrawalRequest(params)).resolves.toBeUndefined()
    })
  })

  // =========================================================================
  // notifyWithdrawalApproved
  // =========================================================================
  describe('notifyWithdrawalApproved', () => {
    const params = {
      userName: 'Nguyen Van A',
      userEmail: 'user@example.com',
      amount: 300000,
      bankName: 'Techcombank',
      bankAccountNumber: '9876543210',
      adminEmail: 'admin@example.com',
    }

    it('sends approval message with all details', async () => {
      await notifyWithdrawalApproved(params)

      expect(global.fetch).toHaveBeenCalledTimes(1)

      const body = JSON.parse(getLastFetchBody())
      expect(body.text).toContain('Nguyen Van A')
      expect(body.text).toContain('user@example.com')
      expect(body.text).toContain('300.000') // VND formatted
      expect(body.text).toContain('Techcombank')
      expect(body.text).toContain('9876543210')
      expect(body.text).toContain('admin@example.com')
    })

    it('includes approval-specific keywords in message', async () => {
      await notifyWithdrawalApproved(params)

      const body = JSON.parse(getLastFetchBody())
      // The message should indicate success/approval
      expect(body.text).toMatch(/[Dd]uyệt/)
    })

    it('formats amount with VND separator', async () => {
      await notifyWithdrawalApproved({ ...params, amount: 1500000 })

      const body = JSON.parse(getLastFetchBody())
      expect(body.text).toContain('1.500.000')
    })
  })

  // =========================================================================
  // notifyWithdrawalRejected
  // =========================================================================
  describe('notifyWithdrawalRejected', () => {
    const params = {
      userName: 'Tran Thi B',
      userEmail: 'tranthib@example.com',
      amount: 200000,
      reason: 'Thông tin tài khoản sai',
      adminEmail: 'admin@example.com',
    }

    it('sends rejection message with reason', async () => {
      await notifyWithdrawalRejected(params)

      expect(global.fetch).toHaveBeenCalledTimes(1)

      const body = JSON.parse(getLastFetchBody())
      expect(body.text).toContain('Tran Thi B')
      expect(body.text).toContain('tranthib@example.com')
      expect(body.text).toContain('200.000')
      expect(body.text).toContain('Thông tin tài khoản sai')
      expect(body.text).toContain('admin@example.com')
    })

    it('includes rejection-specific keywords in message', async () => {
      await notifyWithdrawalRejected(params)

      const body = JSON.parse(getLastFetchBody())
      expect(body.text).toMatch(/[Tt]ừ chối/)
    })

    it('sends POST request with correct content type', async () => {
      await notifyWithdrawalRejected(params)

      const calls = (global.fetch as jest.Mock).mock.calls
      const [, options] = calls[0]
      expect(options.method).toBe('POST')
      expect(options.headers['Content-Type']).toBe('application/json')
    })
  })
})
