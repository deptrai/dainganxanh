import { describe, it, expect, jest } from '@jest/globals'

const mockResend = {
    emails: {
        send: jest.fn()
    }
}

jest.mock('resend', () => ({
    Resend: jest.fn(() => mockResend)
}))

import { sendEmail } from '../index'

describe('Email Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should send email successfully', async () => {
        mockResend.emails.send.mockResolvedValue({ id: 'email-123' })

        const result = await sendEmail({
            to: 'test@example.com',
            subject: 'Test Subject',
            html: '<p>Test Body</p>'
        })

        expect(result.success).toBe(true)
        expect(mockResend.emails.send).toHaveBeenCalledWith({
            from: 'Đại Ngàn Xanh <noreply@dainganxanh.com>',
            to: 'test@example.com',
            subject: 'Test Subject',
            html: '<p>Test Body</p>'
        })
    })

    it('should handle email send error', async () => {
        const error = new Error('Email send failed')
        mockResend.emails.send.mockRejectedValue(error)

        const result = await sendEmail({
            to: 'test@example.com',
            subject: 'Test Subject',
            html: '<p>Test Body</p>'
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe(error)
    })
})
